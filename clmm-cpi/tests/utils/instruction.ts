import { Program, BN } from "@coral-xyz/anchor";
import { ClmmCpi } from "../../target/types/clmm_cpi";
import {
  Connection,
  ConfirmOptions,
  PublicKey,
  Keypair,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { ClmmProgram, configAddress } from "../config";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { ClmmKeys, TickUtils, SqrtPriceMath } from "@raydium-io/raydium-sdk-v2";
import { createTokenMintAndAssociatedTokenAccount } from "./util";
import {
  getNftMetadataAddress,
  getOrcleAccountAddress,
  getPersonalPositionAddress,
  getPoolAddress,
  getPoolVaultAddress,
  getProtocolPositionAddress,
  getTickArrayAddress,
  getTickArrayBitmapAddress,
} from "./pda";

export async function setupInitializeTest(
  connection: Connection,
  owner: Signer,
  transferFeeConfig: { transferFeeBasisPoints: number; MaxFee: number } = {
    transferFeeBasisPoints: 0,
    MaxFee: 0,
  },
  confirmOptions?: ConfirmOptions
) {
  const [{ token0, token0Program }, { token1, token1Program }] =
    await createTokenMintAndAssociatedTokenAccount(
      connection,
      owner,
      new Keypair(),
      transferFeeConfig
    );
  return {
    token0,
    token0Program,
    token1,
    token1Program,
  };
}

export async function initialize(
  program: Program<ClmmCpi>,
  creator: Signer,
  token0: PublicKey,
  token0Program: PublicKey,
  token1: PublicKey,
  token1Program: PublicKey,
  initTick: number,
  confirmOptions?: ConfirmOptions
) {
  // const [ammConfigAddress, _bump] = await getAmmConfigAddress(0, ClmmProgram);
  // console.log("ammConfigAddress:", ammConfigAddress.toString());
  const [poolAddress, _bump1] = await getPoolAddress(
    configAddress,
    token0,
    token1,
    ClmmProgram
  );
  const [vault0, _bump2] = await getPoolVaultAddress(
    poolAddress,
    token0,
    ClmmProgram
  );
  const [vault1, _bump3] = await getPoolVaultAddress(
    poolAddress,
    token1,
    ClmmProgram
  );

  const [tick_array_bitmap, _bump4] = await getTickArrayBitmapAddress(
    poolAddress,
    ClmmProgram
  );

  const [observation, _bump5] = await getOrcleAccountAddress(
    poolAddress,
    ClmmProgram
  );

  const [bitmapExtension, _bump111] = await getTickArrayBitmapAddress(
    poolAddress,
    ClmmProgram
  );

  const tx = await program.methods
    .proxyInitialize(SqrtPriceMath.getSqrtPriceX64FromTick(initTick), new BN(0))
    .accounts({
      clmmProgram: ClmmProgram,
      poolCreator: creator.publicKey,
      ammConfig: configAddress,
      poolState: poolAddress,
      tokenMint0: token0,
      tokenMint1: token1,
      tokenVault0: vault0,
      tokenVault1: vault1,
      observationState: observation,
      tickArrayBitmap: tick_array_bitmap,
      tokenProgram0: token0Program,
      tokenProgram1: token1Program,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts([
      { pubkey: bitmapExtension, isSigner: false, isWritable: true },
    ])
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ])
    .rpc(confirmOptions);

  return { poolAddress, tx };
}

export async function openPosition(
  program: Program<ClmmCpi>,
  owner: Signer,
  poolKeys: ClmmKeys,
  tickLowerIndex: number,
  tickUpperIndex: number,
  liquidity: BN,
  amount0Max: BN,
  amount1Max: BN,
  confirmOptions?: ConfirmOptions
) {
  // prepare tickArray
  const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndexByTick(
    tickLowerIndex,
    poolKeys.config.tickSpacing
  );
  const [tickArrayLower] = await getTickArrayAddress(
    new PublicKey(poolKeys.id),
    ClmmProgram,
    tickArrayLowerStartIndex
  );
  const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndexByTick(
    tickUpperIndex,
    poolKeys.config.tickSpacing
  );
  const [tickArrayUpper] = await getTickArrayAddress(
    new PublicKey(poolKeys.id),
    ClmmProgram,
    tickArrayUpperStartIndex
  );
  const positionNftMint = Keypair.generate();
  const positionANftAccount = getAssociatedTokenAddressSync(
    positionNftMint.publicKey,
    owner.publicKey
  );

  const metadataAccount = (
    await getNftMetadataAddress(positionNftMint.publicKey)
  )[0];

  const [personalPosition] = await getPersonalPositionAddress(
    positionNftMint.publicKey,
    ClmmProgram
  );

  const [protocolPosition] = await getProtocolPositionAddress(
    new PublicKey(poolKeys.id),
    ClmmProgram,
    tickLowerIndex,
    tickUpperIndex
  );

  const token0Account = getAssociatedTokenAddressSync(
    new PublicKey(poolKeys.mintA.address),
    owner.publicKey,
    false,
    new PublicKey(poolKeys.mintA.programId)
  );

  const token1Account = getAssociatedTokenAddressSync(
    new PublicKey(poolKeys.mintB.address),
    owner.publicKey,
    false,
    new PublicKey(poolKeys.mintB.programId)
  );

  const [bitmapExtension, _bump111] = await getTickArrayBitmapAddress(
    new PublicKey(poolKeys.id),
    ClmmProgram
  );

  const tx = await program.methods
    .proxyOpenPosition(
      tickLowerIndex,
      tickUpperIndex,
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
      new BN(liquidity),
      amount0Max,
      amount1Max,
      true
    )
    .accounts({
      clmmProgram: ClmmProgram,
      payer: owner.publicKey,
      positionNftOwner: owner.publicKey,
      positionNftMint: positionNftMint.publicKey,
      positionNftAccount: positionANftAccount,
      metadataAccount,
      poolState: new PublicKey(poolKeys.id),
      protocolPosition,
      tickArrayLower,
      tickArrayUpper,
      tokenAccount0: token0Account,
      tokenAccount1: token1Account,
      tokenVault0: new PublicKey(poolKeys.vault.A),
      tokenVault1: new PublicKey(poolKeys.vault.B),
      vault0Mint: new PublicKey(poolKeys.mintA.address),
      vault1Mint: new PublicKey(poolKeys.mintB.address),
      personalPosition,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      metadataProgram: new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      ),
    })
    .remainingAccounts([
      { pubkey: bitmapExtension, isSigner: false, isWritable: true },
    ])
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ])
    .signers([positionNftMint])
    .rpc(confirmOptions);

  return { positionNftMint, personalPosition, protocolPosition, tx };
}
