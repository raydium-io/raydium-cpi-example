import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  NATIVE_MINT,
  syncNative,
  getAccount,
} from "@solana/spl-token";
import { sendTransaction } from "./index";

export async function createQuoteMintAssociatedTokenAccount(
  connection: Connection,
  payer: Signer
) {
  let tokenMint = NATIVE_MINT;
  const tokenProgram = TOKEN_PROGRAM_ID;

  const ownerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    payer.publicKey,
    false,
    "processed",
    { skipPreflight: true },
    tokenProgram
  );

  let ixs: TransactionInstruction[] = [];
  ixs.push(
    web3.SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: ownerTokenAccount.address,
      lamports: 1000 * web3.LAMPORTS_PER_SOL,
    })
  );
  await sendTransaction(connection, ixs, [payer]);
  await syncNative(connection, payer, ownerTokenAccount.address);
  // const tokenAccount = await getAccount(connection, ownerTokenAccount.address);
  // console.log("tokenAccount: ", tokenAccount.amount);
  return { tokenMint, tokenProgram };
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
