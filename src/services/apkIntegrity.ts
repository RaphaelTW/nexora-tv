import { File, FileMode } from 'expo-file-system';
import { bytesToHex, createSha256 } from './sha256';

const CHUNK_SIZE = 1024 * 1024;

export async function sha256File(uri: string, onProgress?: (progress: number) => void) {
  const file = new File(uri);
  const handle = file.open(FileMode.ReadOnly);
  const hash = createSha256();
  const size = handle.size || file.size || 0;
  let read = 0;
  let chunks = 0;
  try {
    while (read < size) {
      const chunk = handle.readBytes(Math.min(CHUNK_SIZE, size - read));
      if (!chunk.length) break;
      hash.update(chunk);
      read += chunk.length;
      chunks += 1;
      onProgress?.(size ? read / size : 0);
      if (chunks % 4 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    handle.close();
  }
  if (read !== size) throw new Error('Não foi possível ler o APK completo para validação.');
  return bytesToHex(hash.digest());
}
