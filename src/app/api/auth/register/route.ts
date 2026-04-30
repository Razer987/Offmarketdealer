import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { verifyInviteCode, getCodePrefix } from '@/lib/invite/generator';
import { generateUniqueUsername } from '@/lib/username/generator';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { hashToken } from '@/lib/auth/session';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { handleApiError, ConflictError, AppError } from '@/lib/utils/errors';
import { sendEmail, emailVerificationTemplate } from '@/lib/email/send';
import { APP_URL, COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '@/lib/utils/constants';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(ip, 'REGISTER');

    const body = await req.json();
    const { email, password, inviteCode } = registerSchema.parse(body);

    // Validate invite code
    const prefix = getCodePrefix(inviteCode);
    const candidates = await prisma.inviteCode.findMany({
      where: { codePrefix: prefix, used: false },
    });

    let matchedCode: (typeof candidates)[0] | null = null;
    for (const candidate of candidates) {
      if (await verifyInviteCode(inviteCode, candidate.codeHash)) {
        if (candidate.expiresAt && candidate.expiresAt < new Date()) {
          throw new AppError('Einladungscode ist abgelaufen', 410);
        }
        matchedCode = candidate;
        break;
      }
    }

    if (!matchedCode) throw new AppError('Ungültiger Einladungscode', 400, 'INVALID_CODE');

    // Check email not already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('E-Mail-Adresse bereits registriert');

    const passwordHash = await hashPassword(password);
    const username = await generateUniqueUsername();
    const verifyToken = randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          username,
          inviteCodeId: matchedCode!.id,
          verifyToken,
          verifyExpires,
        },
      });

      await tx.inviteCode.update({
        where: { id: matchedCode!.id },
        data: { used: true, usedAt: new Date(), usedByUserId: newUser.id },
      });

      return newUser;
    });

    // Send verification email
    try {
      const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${verifyToken}`;
      await sendEmail({
        to: email,
        subject: 'E-Mail-Adresse bestätigen',
        html: emailVerificationTemplate(verifyUrl),
      });
    } catch {
      // Non-fatal — user can request resend
    }

    // Create session tokens
    const ua = req.headers.get('user-agent') ?? '';
    const accessToken = await signAccessToken({ sub: user.id, role: 'user', sessionId: randomBytes(16).toString('hex') });
    const refreshToken = await signRefreshToken({ sub: user.id, role: 'user', sessionId: randomBytes(16).toString('hex') });

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
    const response = NextResponse.json(
      { user: { id: user.id, username: user.username, email: user.email } },
      { status: 201 }
    );

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
