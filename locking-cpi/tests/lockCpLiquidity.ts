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
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  Raydium,
  getCpmmPdaPoolId,
  Percent,
  CreateCpmmPoolAddress,
  CurveCalculator,
} from "@raydium-io/raydium-sdk-v2";
import {
  createTokenMintAndAssociatedTokenAccount,
  getAssociatedTokenAccountAndAmount,
  lockCpLiquidity,
  collectCpFees,
  sleep,
  sendSol,
  getCpLockedLiquidityAddress,
  LOCKING_PROGRAM,
} from "./utils";
import Decimal from "decimal.js";

describe("cp_liquidity_locking", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const owner = anchor.Wallet.local().payer;
  const connection = anchor.getProvider().connection;

  const program = anchor.workspace
    .LockingCpiExample as Program<LockingCpiExample>;

  it("lock cp liquidity test", async () => {
    const balance = await connection.getBalance(owner.publicKey);
    if (balance >= 500000000 * LAMPORTS_PER_SOL) {
      // anchor test starts solana-test-validator automatically airdropping 500000000 sols,
      // which exceeds the processing limit of Raydium SDK, so part of it is transferred here
      await sendSol(connection, owner, 500000000 - 500);
    }
    const { poolInfo, raydium } = await setupCpLockTest(connection, owner);
    const feeNftMint = Keypair.generate();
    const lockedLiquidityAddr = await getCpLockedLiquidityAddress(
      LOCKING_PROGRAM,
      feeNftMint.publicKey
    );
    const { address: ownerLpTokenAddress, tokenAmount } =
      await getAssociatedTokenAccountAndAmount(
        connection,
        owner.publicKey,
        poolInfo.lpMint
      );

    const lockedLpAmount = new BN(tokenAmount.amount).divn(2);
    await lockCpLiquidity(
      program,
      owner,
      feeNftMint,
      ownerLpTokenAddress,
      lockedLiquidityAddr,
      {
        pool: poolInfo.poolId,
        lpMint: poolInfo.lpMint,
        vault0: poolInfo.vaultA,
        vault1: poolInfo.vaultB,
        mint0: new PublicKey(poolInfo.mintA.address),
        mint1: new PublicKey(poolInfo.mintB.address),
      },
      lockedLpAmount
    );
  });

  it("collect test", async () => {
    const { poolInfo, raydium } = await setupCpLockTest(connection, owner);
    const mint0 = new PublicKey(poolInfo.mintA.address);
    const mint1 = new PublicKey(poolInfo.mintB.address);
    const feeNftMint = Keypair.generate();
    const lockedLiquidityAddr = await getCpLockedLiquidityAddress(
      LOCKING_PROGRAM,
      feeNftMint.publicKey
    );
    const { address: ownerLpTokenAddress, tokenAmount } =
      await getAssociatedTokenAccountAndAmount(
        connection,
        owner.publicKey,
        poolInfo.lpMint
      );

    const lockedLpAmount = new BN(tokenAmount.amount).divn(2);
    let tx = await lockCpLiquidity(
      program,
      owner,
      feeNftMint,
      ownerLpTokenAddress,
      lockedLiquidityAddr,
      {
        pool: poolInfo.poolId,
        lpMint: poolInfo.lpMint,
        vault0: poolInfo.vaultA,
        vault1: poolInfo.vaultB,
        mint0,
        mint1,
      },
      lockedLpAmount
    );

    // Fees are collected before swap, and no fees are generated at this time
    tx = await collectCpFees(program, owner, feeNftMint.publicKey, {
      pool: poolInfo.poolId,
      lpMint: poolInfo.lpMint,
      vault0: poolInfo.vaultA,
      vault1: poolInfo.vaultB,
      mint0,
      mint1,
    });

    // zero for one
    await cpSwap(raydium, poolInfo.poolId, mint0, new BN(10000000));
    // one for zero
    await cpSwap(raydium, poolInfo.poolId, mint0, new BN(10000000));
  });
});

async function setupCpLockTest(
  connection: Connection,
  owner: Keypair,
  initAmount?: {
    amout0: BN;
    amout1: BN;
  }
): Promise<{ poolInfo: CreateCpmmPoolAddress; raydium: Raydium }> {
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

  const feeConfigs = await raydium.api.getCpmmConfigs();
  const { publicKey: poolId } = getCpmmPdaPoolId(
    CREATE_CPMM_POOL_PROGRAM,
    new PublicKey(feeConfigs[0].id),
    token0,
    token1
  );
  const mintA = await raydium.token.getTokenInfo(token0);
  const mintB = await raydium.token.getTokenInfo(token1);
  let mintAAmount = new BN(1000000);
  let mintBAmount = new BN(3000000);
  if (initAmount != undefined) {
    mintAAmount = initAmount.amout0;
    mintBAmount = initAmount.amout1;
  }
  const { execute: createPoolExecute, extInfo: createPoolInfo } =
    await raydium.cpmm.createPool({
      poolId: poolId,
      programId: CREATE_CPMM_POOL_PROGRAM,
      poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
      mintA,
      mintB,
      mintAAmount,
      mintBAmount,
      startTime: new BN(0),
      feeConfig: feeConfigs[0],
      associatedOnly: true,
      ownerInfo: {
        useSOLBalance: true,
      },
    });
  await createPoolExecute({ sendAndConfirm: true });
  /// query pool info mybe failed, here wait some times(ms)
  await sleep(1000);

  await cpDepositBaseIn(raydium, createPoolInfo.address.poolId, 10);

  return { poolInfo: createPoolInfo.address, raydium };
}

async function cpDepositBaseIn(
  raydium: Raydium,
  poolId: PublicKey,
  inputAmount: number
) {
  const data = await raydium.cpmm.getPoolInfoFromRpc(poolId.toString());
  const poolInfo = data.poolInfo;
  const poolKeys = data.poolKeys;

  const { execute, extInfo } = await raydium.cpmm.addLiquidity({
    poolInfo,
    poolKeys,
    inputAmount: new BN(
      new Decimal(inputAmount).mul(10 ** poolInfo.mintA.decimals).toFixed(0)
    ),
    slippage: new Percent(1, 100),
    baseIn: true,
  });
  return await execute({ sendAndConfirm: true });
}

async function cpSwap(
  raydium: Raydium,
  poolId: PublicKey,
  inputMint: PublicKey,
  inputAmount: BN
) {
  const data = await raydium.cpmm.getPoolInfoFromRpc(poolId.toString());
  const rpcData = data.rpcData;

  const baseIn = inputMint === new PublicKey(data.poolInfo.mintA.address);
  const swapResult = CurveCalculator.swap(
    inputAmount,
    baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
    baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
    rpcData.configInfo!.tradeFeeRate
  );
  const { execute } = await raydium.cpmm.swap({
    poolInfo: data.poolInfo,
    poolKeys: data.poolKeys,
    inputAmount,
    swapResult,
    slippage: 0.001, // range: 1 ~ 0.0001, means 100% ~ 0.01%
    baseIn,
  });

  return await execute({ sendAndConfirm: true });
}
