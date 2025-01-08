import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// LOCK CP AUTH SEED
export const LOCK_CP_AUTH_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("lock_cp_authority_seed")
);

export const LOCKED_CP_LIQUIDITY_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("locked_liquidity")
);

// CPSWAP AUTH SEED
export const CPSWAP_AUTH_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("vault_and_lp_mint_auth_seed")
);

// LOCK CLMM AUTH SEED
export const LOCK_CLMM_AUTH_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("program_authority_seed")
);

export const LOCKED_CLLM_POSITION_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("locked_position")
);

export function u16ToBytes(num: number) {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setUint16(0, num, false);
  return new Uint8Array(arr);
}

export function i16ToBytes(num: number) {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setInt16(0, num, false);
  return new Uint8Array(arr);
}

export function u32ToBytes(num: number) {
  const arr = new ArrayBuffer(4);
  const view = new DataView(arr);
  view.setUint32(0, num, false);
  return new Uint8Array(arr);
}

export function i32ToBytes(num: number) {
  const arr = new ArrayBuffer(4);
  const view = new DataView(arr);
  view.setInt32(0, num, false);
  return new Uint8Array(arr);
}

export async function getCpAuthAddress(
  programId: PublicKey
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [CPSWAP_AUTH_SEED],
    programId
  );
  return address;
}

export async function getLockCpAuthAddress(
  programId: PublicKey
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LOCK_CP_AUTH_SEED],
    programId
  );
  return address;
}

export async function getLockCLLMAuthAddress(
  programId: PublicKey
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LOCK_CLMM_AUTH_SEED],
    programId
  );
  return address;
}

export async function getCpLockedLiquidityAddress(
  programId: PublicKey,
  feeNftMint: PublicKey
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LOCKED_CP_LIQUIDITY_SEED, feeNftMint.toBuffer()],
    programId
  );
  return address;
}

export async function getClmmLockedPositionAddress(
  programId: PublicKey,
  feeNftMint: PublicKey
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [LOCKED_CLLM_POSITION_SEED, feeNftMint.toBuffer()],
    programId
  );
  return address;
}
