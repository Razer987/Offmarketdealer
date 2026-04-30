import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { adminLoginSchema } from '@/lib/validation/schemas';
import { verifyPassword } from '@/lib/auth/password';
import { signAdminToken } from '@/lib/auth/jwt';
import { hashToken } from '@/lib/auth/session';
import { verifyTotpToken } from '@/lib/auth/totp';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { handleApiError, UnauthorizedError } from '@/lib/utils/errors';
import { COOKIE_ADMIN_TOKEN, ADMIN_MAX_FAILED_ATTEMPTS } from '@/lib/utils/constants';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(ip, 'LOGIN');

    const body = await req.json();
    const { email, password, totpToken } = adminLoginSchema.parse(body);

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      await verifyPassword(password, '$2a$12$invalidhashinvalidhashinvalidhas');
      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account gesperrt. Bitte später versuchen.');
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      const newAttempts = admin.failedAttempts + 1;
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          failedAttempts: newAttempts,
          lockedUntil:
            newAttempts >= ADMIN_MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + 30 * 60 * 1000)
              : null,
        },
      });
      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }

    // TOTP check
    if (admin.totpEnabled && admin.totpSecret) {
      if (!totpToken) {
        return NextResponse.json({ requireTotp: true }, { status: 200 });
      }
      if (!verifyTotpToken(admin.totpSecret, totpToken)) {
        throw new UnauthorizedError('Ungültiger 2FA-Code');
      }
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
    });
    await resetRateLimit(ip, 'LOGIN');

    const ua = req.headers.get('user-agent') ?? '';
    const sessionId = randomBytes(16).toString('hex');
    const adminToken = await signAdminToken({ sub: admin.id, role: 'admin', sessionId });

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash: hashToken(adminToken),
        ipAddress: ip,
        userAgent: ua,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_ADMIN_TOKEN, adminToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
