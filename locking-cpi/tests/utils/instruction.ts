import { Program, BN } from "@coral-xyz/anchor";
import { LockingCpiExample } from "../../target/types/locking_cpi_example";
import {
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
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  CREATE_CPMM_POOL_PROGRAM,
  getPdaMetadataKey,
  METADATA_PROGRAM_ID,
  MEMO_PROGRAM_ID,
  CLMM_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import {
  getCpAuthAddress,
  getLockCpAuthAddress,
  getCpLockedLiquidityAddress,
  getLockCLLMAuthAddress,
} from "./pda";

export const LOCKING_PROGRAM = new PublicKey(
  "LockrWmn6K5twhz3y9w1dQERbmgSaRkfnTeTKbpofwE"
);
export async function lockCpLiquidity(
  program: Program<LockingCpiExample>,
  payer: Signer,
  feeNftMint: Keypair,
  payerLpToken: PublicKey,
  lockedLiquidity: PublicKey,
  cpPoolInfo: {
    pool: PublicKey;
    lpMint: PublicKey;
    vault0: PublicKey;
    vault1: PublicKey;
    mint0: PublicKey;
    mint1: PublicKey;
  },
  lockAmount: BN,
  confirmOptions?: ConfirmOptions
) {
  const { publicKey: metadataAccount } = getPdaMetadataKey(
    feeNftMint.publicKey
  );

  const auth = await getLockCpAuthAddress(LOCKING_PROGRAM);
  const feeNftAccount = getAssociatedTokenAddressSync(
    feeNftMint.publicKey,
    payer.publicKey,
    true,
    TOKEN_PROGRAM_ID
  );

  const lockedLpVault = getAssociatedTokenAddressSync(
    cpPoolInfo.lpMint,
    auth,
    true,
    TOKEN_PROGRAM_ID
  );

  const builder = program.methods
    .lockCpLiquidity(lockAmount, true)
    .accounts({
      lockingProgram: LOCKING_PROGRAM,
      authority: auth,
      payer: payer.publicKey,
      liquidityOwner: payer.publicKey,
      feeNftOwner: payer.publicKey,
      feeNftMint: feeNftMint.publicKey,
      feeNftAccount,
      poolState: cpPoolInfo.pool,
      lockedLiquidity: lockedLiquidity,
      lpMint: cpPoolInfo.lpMint,
      liquidityOwnerLp: payerLpToken,
      lockedLpVault,
      token0Vault: cpPoolInfo.vault0,
      token1Vault: cpPoolInfo.vault1,
      metadataAccount,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_ID,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
    ]);
  //   console.log(await builder.pubkeys());
  const tx = await builder.signers([feeNftMint]).rpc(confirmOptions);
  return tx;
}

export async function collectCpFees(
  program: Program<LockingCpiExample>,
  owner: Signer,
  feeNftMint: PublicKey,
  cpPoolInfo: {
    pool: PublicKey;
    lpMint: PublicKey;
    vault0: PublicKey;
    vault1: PublicKey;
    mint0: PublicKey;
    mint1: PublicKey;
  },
  confirmOptions?: ConfirmOptions
) {
  const auth = await getLockCpAuthAddress(LOCKING_PROGRAM);
  const lockedLiquidity = await getCpLockedLiquidityAddress(
    LOCKING_PROGRAM,
    feeNftMint
  );

  const feeNftAccount = getAssociatedTokenAddressSync(
    feeNftMint,
    owner.publicKey,
    true,
    TOKEN_PROGRAM_ID
  );

  const lockedLpVault = getAssociatedTokenAddressSync(
    cpPoolInfo.lpMint,
    auth,
    true,
    TOKEN_PROGRAM_ID
  );

  const ownerToken0Account = getAssociatedTokenAddressSync(
    cpPoolInfo.mint0,
    owner.publicKey,
    true,
    TOKEN_PROGRAM_ID
  );

  const ownerToken1Account = getAssociatedTokenAddressSync(
    cpPoolInfo.mint1,
    owner.publicKey,
    true,
    TOKEN_PROGRAM_ID
  );

  const builder = program.methods
    .collectCpFees()
    .accounts({
      lockingProgram: LOCKING_PROGRAM,
      authority: auth,
      feeNftOwner: owner.publicKey,
      feeNftAccount,
      lockedLiquidity: lockedLiquidity,
      cpmmProgram: CREATE_CPMM_POOL_PROGRAM,
      cpAuthority: await getCpAuthAddress(CREATE_CPMM_POOL_PROGRAM),
      poolState: cpPoolInfo.pool,
      lpMint: cpPoolInfo.lpMint,
      recipientToken0Account: ownerToken0Account,
      recipientToken1Account: ownerToken1Account,
      token0Vault: cpPoolInfo.vault0,
      token1Vault: cpPoolInfo.vault1,
      vault0Mint: cpPoolInfo.mint0,
      vault1Mint: cpPoolInfo.mint1,
      lockedLpVault,
      tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      memoProgram: MEMO_PROGRAM_ID,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
    ]);
  //   console.log(await builder.pubkeys());
  return await builder.rpc(confirmOptions);
}

export async function lockClmmPosition(
  program: Program<LockingCpiExample>,
  payer: Signer,
  feeNftMint: Keypair,
  position: PublicKey,
  positionNftAccount: PublicKey,
  positionNftMint: PublicKey,
  lockedPosition: PublicKey,
  lockedNftAccount: PublicKey,
  positionNftTokenProgram: PublicKey,
  confirmOptions?: ConfirmOptions
) {
  const { publicKey: metadataAccount } = getPdaMetadataKey(
    feeNftMint.publicKey
  );

  const auth = await getLockCLLMAuthAddress(LOCKING_PROGRAM);

  const feeNftAccount = getAssociatedTokenAddressSync(
    feeNftMint.publicKey,
    payer.publicKey,
    true,
    TOKEN_PROGRAM_ID
  );

  const tx = await program.methods
    .lockClmmPosition(true)
    .accounts({
      lockingProgram: LOCKING_PROGRAM,
      authority: auth,
      payer: payer.publicKey,
      positionNftOwner: payer.publicKey,
      feeNftOwner: payer.publicKey,
      positionNftAccount,
      positionNftMint,
      personalPosition: position,
      lockedPosition,
      feeNftMint: feeNftMint.publicKey,
      feeNftAccount,
      lockedNftAccount,
      metadataAccount,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      feeNftTokenProgram: TOKEN_PROGRAM_ID,
      lockedNftTokenProgram: positionNftTokenProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_ID,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
    ])
    .signers([feeNftMint])
    .rpc(confirmOptions);
  return tx;
}

export async function collectClmmFeesAndRewards(
  program: Program<LockingCpiExample>,
  owner: Signer,
  feeNftMint: PublicKey,
  lockedPosition: PublicKey,
  lockedNftTokenProgram: PublicKey,
  clPoolInfo: {
    pool: PublicKey;
    vault0: PublicKey;
    vault1: PublicKey;
    mint0: PublicKey;
    mint1: PublicKey;
  },
  positionInfo: {
    positionNftMint: PublicKey;
    personalPosition: PublicKey;
    protocolPosition: PublicKey;
    tickArrayLower: PublicKey;
    tickArrayUpper: PublicKey;
  },
  confirmOptions?: ConfirmOptions
) {
  const auth = await getLockCLLMAuthAddress(LOCKING_PROGRAM);

  const feeNftAccount = getAssociatedTokenAddressSync(
    feeNftMint,
    owner.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const lockedNftAccount = getAssociatedTokenAddressSync(
    positionInfo.positionNftMint,
    auth,
    true,
    lockedNftTokenProgram
  );

  const tx = await program.methods
    .collectClmmFeesAndRewards()
    .accounts({
      lockingProgram: LOCKING_PROGRAM,
      authority: auth,
      feeNftOwner: owner.publicKey,
      feeNftAccount,
      lockedPosition: lockedPosition,
      clmmProgram: CLMM_PROGRAM_ID,
      lockedNftAccount,
      personalPosition: positionInfo.personalPosition,
      poolState: clPoolInfo.pool,
      protocolPosition: positionInfo.protocolPosition,
      tickArrayLower: positionInfo.tickArrayLower,
      tickArrayUpper: positionInfo.tickArrayUpper,
      recipientToken0Account: getAssociatedTokenAddressSync(
        clPoolInfo.mint0,
        owner.publicKey,
        false,
        TOKEN_PROGRAM_ID
      ),
      recipientToken1Account: getAssociatedTokenAddressSync(
        clPoolInfo.mint1,
        owner.publicKey,
        false,
        TOKEN_PROGRAM_ID
      ),
      token0Vault: clPoolInfo.vault0,
      token1Vault: clPoolInfo.vault1,
      vault0Mint: clPoolInfo.mint0,
      vault1Mint: clPoolInfo.mint1,
      tokenProgram2022: TOKEN_2022_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      memoProgram: MEMO_PROGRAM_ID,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
    ])
    .rpc(confirmOptions);
  return tx;
}
