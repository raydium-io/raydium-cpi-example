import { web3 } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { sendTransaction } from "./index";

// create a token mint and a token2022 mint with transferFeeConfig
export async function createTokenMintAndAssociatedTokenAccount(
  connection: Connection,
  payer: Signer,
  mintAuthority: Signer
) {
  let ixs: TransactionInstruction[] = [];
  ixs.push(
    web3.SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: mintAuthority.publicKey,
      lamports: web3.LAMPORTS_PER_SOL,
    })
  );
  await sendTransaction(connection, ixs, [payer]);

  interface Token {
    address: PublicKey;
    program: PublicKey;
  }

  let tokenArray: Token[] = [];
  let token0 = await createMint(
    connection,
    mintAuthority,
    mintAuthority.publicKey,
    null,
    9
  );
  tokenArray.push({ address: token0, program: TOKEN_PROGRAM_ID });

  let token1 = await createMint(
    connection,
    mintAuthority,
    mintAuthority.publicKey,
    null,
    9
  );

  tokenArray.push({ address: token1, program: TOKEN_PROGRAM_ID });

  tokenArray.sort(function (x, y) {
    if (x.address < y.address) {
      return -1;
    }
    if (x.address > y.address) {
      return 1;
    }
    return 0;
  });

  token0 = tokenArray[0].address;
  token1 = tokenArray[1].address;

  const token0Program = tokenArray[0].program;
  const token1Program = tokenArray[1].program;

  const ownerToken0Account = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    token0,
    payer.publicKey,
    false,
    "processed",
    { skipPreflight: true },
    token0Program
  );

  await mintTo(
    connection,
    payer,
    token0,
    ownerToken0Account.address,
    mintAuthority,
    1_000_000_000_000_000,
    [],
    { skipPreflight: true },
    token0Program
  );

  const ownerToken1Account = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    token1,
    payer.publicKey,
    false,
    "processed",
    { skipPreflight: true },
    token1Program
  );
  // console.log(
  //   "ownerToken0Account key: ",
  //   ownerToken0Account.address.toString(),
  //   "mint0:",
  //   token0.toString(),
  //   "\nownerToken1Account key: ",
  //   ownerToken1Account.address.toString(),
  //   "mint1:",
  //   token1.toString()
  // );
  await mintTo(
    connection,
    payer,
    token1,
    ownerToken1Account.address,
    mintAuthority,
    1_000_000_000_000_000,
    [],
    { skipPreflight: true },
    token1Program
  );

  return [
    { token0, token0Program },
    { token1, token1Program },
  ];
}

export function isEqual(amount1: bigint, amount2: bigint) {
  if (
    BigInt(amount1) === BigInt(amount2) ||
    BigInt(amount1) - BigInt(amount2) === BigInt(1) ||
    BigInt(amount1) - BigInt(amount2) === BigInt(-1)
  ) {
    return true;
  }
  return false;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendSol(
  connection: Connection,
  owner: Signer,
  amount: number
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: owner.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  await sendAndConfirmTransaction(connection, transaction, [owner]);
}

export async function getAssociatedTokenAccountAndAmount(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
) {
  const address = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID
  );
  const tokenAmount = (await connection.getTokenAccountBalance(address)).value;
  return { address, tokenAmount };
}
