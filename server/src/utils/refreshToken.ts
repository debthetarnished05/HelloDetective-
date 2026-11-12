import { createHash, timingSafeEqual } from 'node:crypto';

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function matchesRefreshToken(token: string, storedHash?: string | null): boolean {
  if (!storedHash || !/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  const suppliedHash = Buffer.from(hashRefreshToken(token), 'hex');
  const expectedHash = Buffer.from(storedHash, 'hex');
  return suppliedHash.length === expectedHash.length && timingSafeEqual(suppliedHash, expectedHash);
}
