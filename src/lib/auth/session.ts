import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAccessToken, verifyAdminToken, TokenPayload } from '@/lib/auth/jwt';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_ADMIN_TOKEN,
  COOKIE_REFRESH_TOKEN,
} from '@/lib/utils/constants';
import { createHash } from 'crypto';
import { UnauthorizedError } from '@/lib/utils/errors';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getTokenFromRequest(req: NextRequest, cookieName: string): string | null {
  return req.cookies.get(cookieName)?.value ?? null;
}

export async function getUserFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req, COOKIE_ACCESS_TOKEN);
  if (!token) throw new UnauthorizedError();

  let payload: TokenPayload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError('Session abgelaufen');
  }

  const tokenHash = hashToken(token);
  const session = await prisma.userSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) throw new UnauthorizedError();
  if (session.user.status !== 'ACTIVE') throw new UnauthorizedError('Account gesperrt');

  return { user: session.user, payload };
}

export async function getAdminFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req, COOKIE_ADMIN_TOKEN);
  if (!token) throw new UnauthorizedError();

  let payload: TokenPayload;
  try {
    payload = await verifyAdminToken(token);
  } catch {
    throw new UnauthorizedError('Admin-Session abgelaufen');
  }

  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!session || session.expiresAt < new Date()) throw new UnauthorizedError();

  return { admin: session.admin, payload };
}

export function setUserCookies(
  accessToken: string,
  refreshToken: string,
  response: { cookies: ReturnType<typeof cookies> }
) {
  const cookieStore = response.cookies;
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(COOKIE_ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set(COOKIE_REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearUserCookies(response: { cookies: ReturnType<typeof cookies> }) {
  const cookieStore = response.cookies;
  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
}

export function setAdminCookie(
  adminToken: string,
  response: { cookies: ReturnType<typeof cookies> }
) {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(COOKIE_ADMIN_TOKEN, adminToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 60, // 30 minutes
  });
}

export function clearAdminCookie(response: { cookies: ReturnType<typeof cookies> }) {
  response.cookies.delete(COOKIE_ADMIN_TOKEN);
}
