import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function createGuestSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashGuestSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function matchesGuestSessionToken(token: string, storedHash?: string | null): boolean {
  if (!storedHash || !/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  const suppliedHash = Buffer.from(hashGuestSessionToken(token), 'hex');
  const expectedHash = Buffer.from(storedHash, 'hex');
  return suppliedHash.length === expectedHash.length && timingSafeEqual(suppliedHash, expectedHash);
}
