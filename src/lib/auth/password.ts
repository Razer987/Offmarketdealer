import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS, PASSWORD_MIN_LENGTH } from '@/lib/utils/constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`);
  }
  if (!/[A-Z]/.test(password)) errors.push('Mindestens ein Großbuchstabe');
  if (!/[a-z]/.test(password)) errors.push('Mindestens ein Kleinbuchstabe');
  if (!/[0-9]/.test(password)) errors.push('Mindestens eine Zahl');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Mindestens ein Sonderzeichen');

  return { valid: errors.length === 0, errors };
}
