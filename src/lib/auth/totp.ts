import * as OTPAuth from 'otpauth';
import { randomBytes } from 'crypto';
import { APP_NAME } from '@/lib/utils/constants';

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  // Base32 encode manually using the otpauth library's Secret class
  return new OTPAuth.Secret({ buffer: bytes.buffer as ArrayBuffer }).base32;
}

export function createTotpUri(secret: string, email: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export function verifyTotpToken(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
