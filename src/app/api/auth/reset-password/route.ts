import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resetPasswordSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { handleApiError, AppError } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user) throw new AppError('Ungültiger oder bereits verwendeter Token', 400);
    if (user.resetExpires && user.resetExpires < new Date()) {
      throw new AppError('Token abgelaufen. Bitte neu anfordern.', 410);
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Invalidate all sessions
    await prisma.userSession.deleteMany({ where: { userId: user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
