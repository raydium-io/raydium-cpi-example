import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
export const GLOBAL_CONFIG_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("global_config")
);
export const POOL_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("pool"));
export const POOL_VAULT_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("pool_vault")
);
export const POOL_AUTH_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("vault_auth_seed")
);
export const PLATFORM_CONFIG_SEED = Buffer.from(
  anchor.utils.bytes.utf8.encode("platform_config")
);

export function u8ToBytes(num: number) {
  const arr = new ArrayBuffer(1);
  const view = new DataView(arr);
  view.setUint8(0, num);
  return new Uint8Array(arr);
}

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

export async function getConfigAddress(
  quoteTokenMint: PublicKey,
  programId: PublicKey,
  curveType: number,
  index: number
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [
      GLOBAL_CONFIG_SEED,
      quoteTokenMint.toBuffer(),
      u8ToBytes(curveType),
      u16ToBytes(index),
    ],
    programId
  );
  return address;
}

export async function getPlatformConfigAddress(
  admin: PublicKey,
  programId: PublicKey
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [PLATFORM_CONFIG_SEED, admin.toBuffer()],
    programId
  );
  return address;
}

export async function getAuthAddress(
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_AUTH_SEED],
    programId
  );
  return [address, bump];
}

export async function getPoolAddress(
  baseMint: PublicKey,
  quoteMint: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [POOL_SEED, baseMint.toBuffer(), quoteMint.toBuffer()],
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

export async function getMetadataAddress(
  baseMint: PublicKey
): Promise<PublicKey> {
  const [address, bump] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      baseMint.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  );
  return address;
}
