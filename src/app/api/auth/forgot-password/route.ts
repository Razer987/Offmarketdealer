import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { handleApiError } from '@/lib/utils/errors';
import { sendEmail, passwordResetTemplate } from '@/lib/email/send';
import { APP_URL } from '@/lib/utils/constants';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(ip, 'PASSWORD_RESET');

    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond success to prevent email enumeration
    if (user && user.status === 'ACTIVE') {
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetExpires: expires },
      });

      const resetUrl = `${APP_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: 'Passwort zurücksetzen',
        html: passwordResetTemplate(resetUrl),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
