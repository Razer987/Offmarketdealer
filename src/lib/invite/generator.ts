import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { INVITE_CODE_CHARSET, INVITE_CODE_LENGTH, BCRYPT_ROUNDS } from '@/lib/utils/constants';

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARSET[randomInt(0, INVITE_CODE_CHARSET.length)];
  }
  return code;
}

export async function hashInviteCode(code: string): Promise<string> {
  return bcrypt.hash(code.toUpperCase(), BCRYPT_ROUNDS);
}

export async function verifyInviteCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code.toUpperCase(), hash);
}

export function getCodePrefix(code: string): string {
  return code.toUpperCase().slice(0, 2);
}
