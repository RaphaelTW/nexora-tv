import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export function sha256Chunks(chunks: Uint8Array[]) {
  const hash = sha256.create();
  chunks.forEach((chunk) => hash.update(chunk));
  return bytesToHex(hash.digest());
}

export function createSha256() { return sha256.create(); }
export { bytesToHex };
