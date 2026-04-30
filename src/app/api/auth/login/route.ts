import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validation/schemas';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { hashToken } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { handleApiError, UnauthorizedError } from '@/lib/utils/errors';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN, USER_MAX_FAILED_ATTEMPTS } from '@/lib/utils/constants';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(ip, 'LOGIN');

    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Timing-safe: still hash to avoid timing attacks
      await verifyPassword(password, '$2a$12$invalidhashinvalidhashinvalidhas');
      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account vorübergehend gesperrt. Bitte später erneut versuchen.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account nicht aktiv');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const newAttempts = user.failedAttempts + 1;
      const lockedUntil =
        newAttempts >= USER_MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: newAttempts, lockedUntil },
      });

      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await resetRateLimit(ip, 'LOGIN');

    const ua = req.headers.get('user-agent') ?? '';
    const sessionId = randomBytes(16).toString('hex');
    const accessToken = await signAccessToken({ sub: user.id, role: 'user', sessionId });
    const refreshToken = await signRefreshToken({ sub: user.id, role: 'user', sessionId });

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(accessToken),
        ipAddress: ip,
        userAgent: ua,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      user: { id: user.id, username: user.username, emailVerified: user.emailVerified },
    });

    response.cookies.set(COOKIE_ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });
    response.cookies.set(COOKIE_REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
