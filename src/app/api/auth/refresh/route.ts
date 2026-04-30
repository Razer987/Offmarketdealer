import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt';
import { hashToken } from '@/lib/auth/session';
import { handleApiError, UnauthorizedError } from '@/lib/utils/errors';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '@/lib/utils/constants';
import { getClientIp } from '@/lib/auth/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(COOKIE_REFRESH_TOKEN)?.value;
    if (!refreshToken) throw new UnauthorizedError();

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh-Token abgelaufen');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError();

    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') ?? '';
    const sessionId = randomBytes(16).toString('hex');
    const newAccessToken = await signAccessToken({ sub: user.id, role: 'user', sessionId });

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newAccessToken),
        ipAddress: ip,
        userAgent: ua,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_ACCESS_TOKEN, newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
