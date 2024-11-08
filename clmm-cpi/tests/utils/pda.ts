import { PublicKey } from "@solana/web3.js";

import * as anchor from "@coral-xyz/anchor";

export const AMM_CONFIG_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("amm_config")
);
export const POOL_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("pool"));
export const POOL_VAULT_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("pool_vault")
);
export const POOL_REWARD_VAULT_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("pool_reward_vault")
);
export const POSITION_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("position")
);
export const TICK_ARRAY_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("tick_array")
);

export const OPERATION_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("operation")
);

export const POOL_TICK_ARRAY_BITMAP_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("pool_tick_array_bitmap_extension")
);

export const ORACLE_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("observation")
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

export async function getAmmConfigAddress(
  index: number,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [AMM_CONFIG_SEED, u16ToBytes(index)],
    programId
  );
  return [address, bump];
}

export async function getPoolAddress(
  ammConfig: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [
      POOL_SEED,
      ammConfig.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    programId
  );
  return [address, bump];
}

export async function getPoolVaultAddress(
  pool: PublicKey,
  vaultTokenMint: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_VAULT_SEED, pool.toBuffer(), vaultTokenMint.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getPoolRewardVaultAddress(
  pool: PublicKey,
  rewardTokenMint: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_REWARD_VAULT_SEED, pool.toBuffer(), rewardTokenMint.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getTickArrayAddress(
  pool: PublicKey,
  programId: PublicKey,
  startIndex: number
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [TICK_ARRAY_SEED, pool.toBuffer(), i32ToBytes(startIndex)],
    programId
  );
  return [address, bump];
}

export async function getProtocolPositionAddress(
  pool: PublicKey,
  programId: PublicKey,
  tickLower: number,
  tickUpper: number
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [
      POSITION_SEED,
      pool.toBuffer(),
      i32ToBytes(tickLower),
      i32ToBytes(tickUpper),
    ],
    programId
  );
  return [address, bump];
}

export async function getPersonalPositionAddress(
  nftMint: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POSITION_SEED, nftMint.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getNftMetadataAddress(
  nftMint: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      nftMint.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  );
  return [address, bump];
}

export async function getOperationAddress(
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [OPERATION_SEED],
    programId
  );
  return [address, bump];
}

export async function getTickArrayBitmapAddress(
  pool: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_TICK_ARRAY_BITMAP_SEED, pool.toBuffer()],
    programId
  );
  return [address, bump];
}

export async function getOrcleAccountAddress(
  pool: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [ORACLE_SEED, pool.toBuffer()],
    programId
  );
  return [address, bump];
}
