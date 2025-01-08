import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { LockingCpiExample } from "../target/types/locking_cpi_example";
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import {
  Raydium,
  CLMM_PROGRAM_ID,
  ClmmKeys,
  OpenPositionFromBaseExtInfo,
  ApiV3PoolInfoConcentratedItem,
} from "@raydium-io/raydium-sdk-v2";
import {
  createTokenMintAndAssociatedTokenAccount,
  sendSol,
  lockClmmPosition,
  sleep,
  getClmmLockedPositionAddress,
  collectClmmFeesAndRewards,
  getLockCLLMAuthAddress,
  LOCKING_PROGRAM,
} from "./utils";
import Decimal from "decimal.js";

import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

describe("clmm_position_locking", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  const connection = anchor.getProvider().connection;
  const program = anchor.workspace
    .LockingCpiExample as Program<LockingCpiExample>;
  it("lock clmm position with metadata nft account test", async () => {
    const balance = await connection.getBalance(owner.publicKey);
    if (balance >= 500000000 * LAMPORTS_PER_SOL) {
      // anchor test starts solana-test-validator automatically airdropping 500000000 sols,
      // which exceeds the processing limit of Raydium SDK, so part of it is transferred here
      await sendSol(connection, owner, 500000000 - 500);
    }
    await lockClmmPositionTest(program, connection, owner, false);
  });

  it("lock clmm position with token2022 nft account test", async () => {
    await lockClmmPositionTest(program, connection, owner, true);
  });

  it("collect fee and reward with metadata nft account test", async () => {
    await collectClmmFeesAndRewardsTest(program, connection, owner, false);
  });

  it("collect fee and reward with token2022 nft account test", async () => {
    await collectClmmFeesAndRewardsTest(program, connection, owner, true);
  });
});

async function lockClmmPositionTest(
  program: Program<LockingCpiExample>,
  connection: Connection,
  owner: Keypair,
  positionNft2022: boolean
) {
  let lockedNftTokenProgram = TOKEN_PROGRAM_ID;
  if (positionNft2022) {
    lockedNftTokenProgram = TOKEN_2022_PROGRAM_ID;
  }
  const { poolInfo, positionInfo } = await setupCLMMLockTest(
    connection,
    owner,
    positionNft2022
  );
  const feeNftMint = Keypair.generate();

  const lockedPositionAddr = await getClmmLockedPositionAddress(
    LOCKING_PROGRAM,
    feeNftMint.publicKey
  );
  const lockedNftAccount = getAssociatedTokenAddressSync(
    positionInfo.nftMint,
    await getLockCLLMAuthAddress(LOCKING_PROGRAM),
    true,
    lockedNftTokenProgram
  );

  await lockClmmPosition(
    program,
    owner,
    feeNftMint,
    positionInfo.personalPosition,
    positionInfo.positionNftAccount,
    positionInfo.nftMint,
    lockedPositionAddr,
    lockedNftAccount,
    lockedNftTokenProgram
  );
}

async function collectClmmFeesAndRewardsTest(
  program: Program<LockingCpiExample>,
  connection: Connection,
  owner: Keypair,
  positionNft2022: boolean
) {
  let lockedNftTokenProgram = TOKEN_PROGRAM_ID;
  if (positionNft2022) {
    lockedNftTokenProgram = TOKEN_2022_PROGRAM_ID;
  }

  const { poolKeys, positionInfo } = await setupCLMMLockTest(
    connection,
    owner,
    positionNft2022
  );

  const feeNftMint = Keypair.generate();
  const lockedPositionAddr = await getClmmLockedPositionAddress(
    LOCKING_PROGRAM,
    feeNftMint.publicKey
  );
  const lockedNftAccount = getAssociatedTokenAddressSync(
    positionInfo.nftMint,
    await getLockCLLMAuthAddress(LOCKING_PROGRAM),
    true,
    lockedNftTokenProgram
  );
  let tx = await lockClmmPosition(
    program,
    owner,
    feeNftMint,
    positionInfo.personalPosition,
    positionInfo.positionNftAccount,
    positionInfo.nftMint,
    lockedPositionAddr,
    lockedNftAccount,
    lockedNftTokenProgram
  );

  tx = await collectClmmFeesAndRewards(
    program,
    owner,
    feeNftMint.publicKey,
    lockedPositionAddr,
    lockedNftTokenProgram,
    {
      pool: new PublicKey(poolKeys.id),
      vault0: new PublicKey(poolKeys.vault.A),
      vault1: new PublicKey(poolKeys.vault.B),
      mint0: new PublicKey(poolKeys.mintA.address),
      mint1: new PublicKey(poolKeys.mintB.address),
    },
    {
      positionNftMint: positionInfo.nftMint,
      personalPosition: positionInfo.personalPosition,
      protocolPosition: positionInfo.protocolPosition,
      tickArrayLower: positionInfo.tickArrayLower,
      tickArrayUpper: positionInfo.tickArrayUpper,
    }
  );
}

async function setupCLMMLockTest(
  connection: Connection,
  owner: Keypair,
  positionNft2022: boolean
): Promise<{
  poolKeys: ClmmKeys;
  poolInfo: ApiV3PoolInfoConcentratedItem;
  positionInfo: OpenPositionFromBaseExtInfo;
  raydium: Raydium;
}> {
  const [{ token0, token0Program }, { token1, token1Program }] =
    await createTokenMintAndAssociatedTokenAccount(
      connection,
      owner,
      new Keypair()
    );

  const raydium = await Raydium.load({
    owner,
    connection,
    cluster: "mainnet",
    disableFeatureCheck: true,
    disableLoadToken: false,
    blockhashCommitment: "finalized",
  });

  const clmmConfigs = await raydium.api.getClmmConfigs();
  const mint1 = await raydium.token.getTokenInfo(token0);
  const mint2 = await raydium.token.getTokenInfo(token1);

  const { execute: createPoolExecute, extInfo: createPoolInfo } =
    await raydium.clmm.createPool({
      programId: CLMM_PROGRAM_ID,
      owner: owner.publicKey,
      mint1,
      mint2,
      ammConfig: {
        ...clmmConfigs[0],
        id: new PublicKey(clmmConfigs[0].id),
        fundOwner: "",
        description: "",
      },
      initialPrice: new Decimal(1),
      startTime: new BN(0),
    });
  await createPoolExecute({ sendAndConfirm: true });
  /// query pool info mybe failed, here wait some times(ms)
  await sleep(1000);

  const data = await raydium.clmm.getPoolInfoFromRpc(
    createPoolInfo.address.id.toString()
  );
  const poolInfo = data.poolInfo;
  const poolKeys = data.poolKeys;
  const { execute, extInfo } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    poolKeys,
    tickUpper: 10,
    tickLower: -10,
    base: "MintA",
    ownerInfo: {
      useSOLBalance: true,
    },
    baseAmount: new BN(
      new Decimal("1000").mul(10 ** poolInfo.mintA.decimals).toFixed(0)
    ),
    otherAmountMax: new BN(1500000000000),
    // optional: set up priority fee here
    computeBudgetConfig: {
      units: 600000,
      microLamports: 100000,
    },
    nft2022: positionNft2022,
  });

  await execute({ sendAndConfirm: true });

  return {
    poolKeys: createPoolInfo.address,
    poolInfo,
    positionInfo: extInfo,
    raydium,
  };
}
