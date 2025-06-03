import { Program, BN } from "@coral-xyz/anchor";
import { LaunchCpiExample } from "../../target/types/launch_cpi_example";
import {
  Connection,
  ConfirmOptions,
  PublicKey,
  Keypair,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  getAuthAddress,
  getPoolAddress,
  getPoolVaultAddress,
  getMetadataAddress,
  createQuoteMintAssociatedTokenAccount,
} from "./index";

const LAUNCH_PROGRAM_ID = new PublicKey(
  "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj"
);

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

type MintParams = {
  decimals: number;
  name: string;
  symbol: string;
  uri: string;
};

type ConstantCurve = {
  supply: BN;
  totalBaseSell: BN;
  totalQuoteFundRaising: BN;
  migrateType: number;
};

interface FixedCurve {
  supply: BN;
  totalQuoteFundRaising: BN;
  migrateType: number;
}

interface LinearCurve {
  supply: BN;
  totalQuoteFundRaising: BN;
  migrateType: number;
}

type CurveParams =
  | { constant: { data: ConstantCurve } }
  | { fixed: { data: FixedCurve } }
  | { linear: { data: LinearCurve } };

type VestingParams = {
  cliffPeriod: BN;
  unlockPeriod: BN;
  totalLockedAmount: BN;
};

export const defaultMintParam: MintParams = {
  decimals: 6,
  name: "test",
  symbol: "test",
  uri: "https://test.com",
};

export const defaultCurveParam: CurveParams = {
  constant: {
    data: {
      supply: new BN(1000000000000000),
      totalBaseSell: new BN(793100000000000),
      totalQuoteFundRaising: new BN(85005359057),
      migrateType: 0,
    },
  },
};

export const defaultVestingParam: VestingParams = {
  cliffPeriod: new BN(0),
  unlockPeriod: new BN(0),
  totalLockedAmount: new BN(0),
};

export async function setupInitializeTest(
  program: Program<LaunchCpiExample>,
  connection: Connection,
  owner: Signer,
  feeOwner: PublicKey,
  migrateFee: BN,
  tradeFeeRate: BN,
  confirmOptions?: ConfirmOptions
) {
  const { tokenMint: quoteTokenMint, tokenProgram: quoteTokenProgram } =
    await createQuoteMintAssociatedTokenAccount(connection, owner);
  const baseTokenMint = Keypair.generate();
  const baseTokenProgram = TOKEN_PROGRAM_ID;
  const configAddress = await getConfig(
    program,
    connection,
    owner,
    quoteTokenMint,
    feeOwner,
    migrateFee,
    tradeFeeRate,
    confirmOptions
  );
  const platformConfigAddress = await getPlatformConfig(
    program,
    connection,
    owner,
    confirmOptions
  );
  return {
    configAddress,
    baseTokenMint,
    baseTokenProgram,
    quoteTokenMint,
    quoteTokenProgram,
    platformConfigAddress,
  };
}
export async function setupSwapTest(
  program: Program<LaunchCpiExample>,
  connection: Connection,
  owner: Signer,
  feeOwner: PublicKey,
  migrateFee: BN,
  tradeFeeRate: BN,
  baseMintParam?: MintParams,
  curveParam?: CurveParams,
  vestingParam?: VestingParams,
  confirmOptions?: ConfirmOptions
) {
  const { tokenMint: quoteTokenMint, tokenProgram: quoteTokenProgram } =
    await createQuoteMintAssociatedTokenAccount(connection, owner);
  const baseTokenMintKeyPair = Keypair.generate();
  const baseTokenProgram = TOKEN_PROGRAM_ID;

  const configAddress = await getConfig(
    program,
    connection,
    owner,
    quoteTokenMint,
    feeOwner,
    migrateFee,
    tradeFeeRate,
    confirmOptions
  );

  const platformConfigAddress = await getPlatformConfig(
    program,
    connection,
    owner,
    confirmOptions
  );

  const { poolAddress } = await initialize(
    program,
    owner,
    configAddress,
    baseTokenMintKeyPair,
    quoteTokenMint,
    baseTokenProgram,
    quoteTokenProgram,
    platformConfigAddress,
    baseMintParam,
    curveParam,
    vestingParam,
    confirmOptions
  );

  const ownerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    baseTokenMintKeyPair.publicKey,
    owner.publicKey
  );

  return {
    configAddress,
    poolAddress,
    baseTokenMintKeyPair,
    quoteTokenMint,
    platformConfigAddress,
  };
}

export async function getConfig(
  program: Program<LaunchCpiExample>,
  connection: Connection,
  owner: Signer,
  quoteTokenMint: PublicKey,
  feeOwner: PublicKey,
  migrateFee: BN,
  tradeFeeRate: BN,
  confirmOptions?: ConfirmOptions
): Promise<PublicKey> {
  return new PublicKey("6s1xP3hpbAfFoNtUNF8mfHsjr2Bd97JxFJRWLbL6aHuX");
}

export async function getPlatformConfig(
  program: Program<LaunchCpiExample>,
  connection: Connection,
  owner: Signer,
  confirmOptions?: ConfirmOptions
): Promise<PublicKey> {
  return new PublicKey("12XE4efSCudQadBA76Zfb5aVuD7B5EHQ7AkBLJD2ySmq");
}

export async function initialize(
  program: Program<LaunchCpiExample>,
  creator: Signer,
  configAddress: PublicKey,
  baseMintKeypair: Signer,
  quoteMint: PublicKey,
  baseTokenProgram: PublicKey,
  quoteTokenProgram: PublicKey,
  platformConfigAddress: PublicKey,
  baseMintParam?: MintParams,
  curveParam?: CurveParams,
  vestingParam?: VestingParams,
  confirmOptions?: ConfirmOptions
) {
  const baseMint = baseMintKeypair.publicKey;
  const [auth] = await getAuthAddress(LAUNCH_PROGRAM_ID);
  const [poolAddress] = await getPoolAddress(
    baseMint,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const [baseVault] = await getPoolVaultAddress(
    poolAddress,
    baseMint,
    LAUNCH_PROGRAM_ID
  );
  const [quoteVault] = await getPoolVaultAddress(
    poolAddress,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );
  const baseMintParams = baseMintParam ? baseMintParam : defaultMintParam;
  const curveParams = curveParam ? curveParam : defaultCurveParam;
  const vestingParams = vestingParam ? vestingParam : defaultVestingParam;
  const metadataAccount = await getMetadataAddress(baseMint);

  const tx = await program.methods
    .proxyInitialize(baseMintParams, curveParams, vestingParams)
    .accounts({
      payer: creator.publicKey,
      creator: creator.publicKey,
      globalConfig: configAddress,
      authority: auth,
      poolState: poolAddress,
      baseMint: baseMint,
      quoteMint: quoteMint,
      baseVault: baseVault,
      quoteVault: quoteVault,
      metadataAccount: metadataAccount,
      baseTokenProgram: baseTokenProgram,
      quoteTokenProgram: quoteTokenProgram,
      platformConfig: platformConfigAddress,
      metadataProgram: METADATA_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rentProgram: SYSVAR_RENT_PUBKEY,
    })
    .signers([baseMintKeypair])
    .rpc(confirmOptions);

  return { tx, poolAddress };
}

export async function buyExactIn(
  program: Program<LaunchCpiExample>,
  owner: Signer,
  configAddress: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  baseTokenProgram: PublicKey,
  quoteTokenProgram: PublicKey,
  platformConfigAddress: PublicKey,
  amount_in: BN,
  minimum_amount_out: BN,
  confirmOptions?: ConfirmOptions
) {
  const [auth] = await getAuthAddress(LAUNCH_PROGRAM_ID);
  const [poolAddress] = await getPoolAddress(
    baseMint,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const [baseVault] = await getPoolVaultAddress(
    poolAddress,
    baseMint,
    LAUNCH_PROGRAM_ID
  );
  const [quoteVault] = await getPoolVaultAddress(
    poolAddress,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const baseTokenAccount = getAssociatedTokenAddressSync(
    baseMint,
    owner.publicKey,
    false,
    baseTokenProgram
  );
  const quoteTokenAccount = getAssociatedTokenAddressSync(
    quoteMint,
    owner.publicKey,
    false,
    quoteTokenProgram
  );

  const tx = await program.methods
    .proxyBuyExactIn(amount_in, minimum_amount_out, new BN(0))
    .accounts({
      launchpadProgram: LAUNCH_PROGRAM_ID,
      payer: owner.publicKey,
      authority: auth,
      globalConfig: configAddress,
      platformConfig: platformConfigAddress,
      poolState: poolAddress,
      userBaseToken: baseTokenAccount,
      userQuoteToken: quoteTokenAccount,
      baseVault: baseVault,
      quoteVault: quoteVault,
      baseTokenMint: baseMint,
      quoteTokenMint: quoteMint,
      baseTokenProgram: baseTokenProgram,
      quoteTokenProgram: quoteTokenProgram,
    })
    .rpc(confirmOptions);
  return tx;
}

export async function buyExactOut(
  program: Program<LaunchCpiExample>,
  owner: Signer,
  configAddress: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  baseTokenProgram: PublicKey,
  quoteTokenProgram: PublicKey,
  platformConfigAddress: PublicKey,
  amount_out: BN,
  maximum_amount_in: BN,
  confirmOptions?: ConfirmOptions
) {
  const [auth] = await getAuthAddress(LAUNCH_PROGRAM_ID);
  const [poolAddress] = await getPoolAddress(
    baseMint,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const [baseVault] = await getPoolVaultAddress(
    poolAddress,
    baseMint,
    LAUNCH_PROGRAM_ID
  );
  const [quoteVault] = await getPoolVaultAddress(
    poolAddress,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const baseTokenAccount = getAssociatedTokenAddressSync(
    baseMint,
    owner.publicKey,
    false,
    baseTokenProgram
  );
  const quoteTokenAccount = getAssociatedTokenAddressSync(
    quoteMint,
    owner.publicKey,
    false,
    quoteTokenProgram
  );

  const tx = await program.methods
    .proxyBuyExactOut(amount_out, maximum_amount_in, new BN(0))
    .accounts({
      launchpadProgram: LAUNCH_PROGRAM_ID,
      payer: owner.publicKey,
      authority: auth,
      globalConfig: configAddress,
      platformConfig: platformConfigAddress,
      poolState: poolAddress,
      userBaseToken: baseTokenAccount,
      userQuoteToken: quoteTokenAccount,
      baseVault: baseVault,
      quoteVault: quoteVault,
      baseTokenMint: baseMint,
      quoteTokenMint: quoteMint,
      baseTokenProgram: baseTokenProgram,
      quoteTokenProgram: quoteTokenProgram,
    })
    .rpc(confirmOptions);
  return tx;
}

export async function sellExactIn(
  program: Program<LaunchCpiExample>,
  owner: Signer,
  configAddress: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  baseTokenProgram: PublicKey,
  quoteTokenProgram: PublicKey,
  platformConfigAddress: PublicKey,
  amount_in: BN,
  minimum_amount_out: BN,
  confirmOptions?: ConfirmOptions
) {
  const [auth] = await getAuthAddress(LAUNCH_PROGRAM_ID);
  const [poolAddress] = await getPoolAddress(
    baseMint,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const [baseVault] = await getPoolVaultAddress(
    poolAddress,
    baseMint,
    LAUNCH_PROGRAM_ID
  );
  const [quoteVault] = await getPoolVaultAddress(
    poolAddress,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const baseTokenAccount = getAssociatedTokenAddressSync(
    baseMint,
    owner.publicKey,
    false,
    baseTokenProgram
  );
  const quoteTokenAccount = getAssociatedTokenAddressSync(
    quoteMint,
    owner.publicKey,
    false,
    quoteTokenProgram
  );

  const tx = await program.methods
    .proxySellExactIn(amount_in, minimum_amount_out, new BN(0))
    .accounts({
      launchpadProgram: LAUNCH_PROGRAM_ID,
      payer: owner.publicKey,
      authority: auth,
      globalConfig: configAddress,
      platformConfig: platformConfigAddress,
      poolState: poolAddress,
      userBaseToken: baseTokenAccount,
      userQuoteToken: quoteTokenAccount,
      baseVault: baseVault,
      quoteVault: quoteVault,
      baseTokenMint: baseMint,
      quoteTokenMint: quoteMint,
      baseTokenProgram: baseTokenProgram,
      quoteTokenProgram: quoteTokenProgram,
    })
    .rpc(confirmOptions);

  return tx;
}

export async function sellExactOut(
  program: Program<LaunchCpiExample>,
  owner: Signer,
  configAddress: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  baseTokenProgram: PublicKey,
  quoteTokenProgram: PublicKey,
  platformConfigAddress: PublicKey,
  amount_out: BN,
  maximum_amount_in: BN,
  confirmOptions?: ConfirmOptions
) {
  const [auth] = await getAuthAddress(LAUNCH_PROGRAM_ID);
  const [poolAddress] = await getPoolAddress(
    baseMint,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const [baseVault] = await getPoolVaultAddress(
    poolAddress,
    baseMint,
    LAUNCH_PROGRAM_ID
  );
  const [quoteVault] = await getPoolVaultAddress(
    poolAddress,
    quoteMint,
    LAUNCH_PROGRAM_ID
  );

  const baseTokenAccount = getAssociatedTokenAddressSync(
    baseMint,
    owner.publicKey,
    false,
    baseTokenProgram
  );
  const quoteTokenAccount = getAssociatedTokenAddressSync(
    quoteMint,
    owner.publicKey,
    false,
    quoteTokenProgram
  );

  const tx = await program.methods
    .proxySellExactOut(amount_out, maximum_amount_in, new BN(0))
    .accounts({
      launchpadProgram: LAUNCH_PROGRAM_ID,
      payer: owner.publicKey,
      authority: auth,
      globalConfig: configAddress,
      platformConfig: platformConfigAddress,
      poolState: poolAddress,
      userBaseToken: baseTokenAccount,
      userQuoteToken: quoteTokenAccount,
      baseVault: baseVault,
      quoteVault: quoteVault,
      baseTokenMint: baseMint,
      quoteTokenMint: quoteMint,
      baseTokenProgram: baseTokenProgram,
      quoteTokenProgram: quoteTokenProgram,
    })
    .rpc(confirmOptions);

  return tx;
}
