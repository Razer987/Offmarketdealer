import { randomBytes, createHmac } from 'crypto';
import { COOKIE_CSRF_TOKEN } from '@/lib/utils/constants';

const CSRF_SECRET = process.env.CSRF_SECRET ?? 'change-me-in-production';

export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex');
  const signature = createHmac('sha256', CSRF_SECRET).update(token).digest('hex');
  return `${token}.${signature}`;
}

export function verifyCsrfToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [raw, sig] = parts;
  const expected = createHmac('sha256', CSRF_SECRET).update(raw).digest('hex');
  return sig === expected;
}

export function getCsrfTokenFromRequest(req: Request): string | null {
  return req.headers.get('x-csrf-token');
}

export function validateCsrfHeader(req: Request, cookieToken: string | undefined): boolean {
  const headerToken = getCsrfTokenFromRequest(req);
  if (!headerToken || !cookieToken) return false;
  if (headerToken !== cookieToken) return false;
  return verifyCsrfToken(headerToken);
}

export { COOKIE_CSRF_TOKEN };
