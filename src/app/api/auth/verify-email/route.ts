import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, AppError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) throw new AppError('Token fehlt', 400);

    const user = await prisma.user.findUnique({ where: { verifyToken: token } });
    if (!user) throw new AppError('Ungültiger oder bereits verwendeter Token', 400);
    if (user.verifyExpires && user.verifyExpires < new Date()) {
      throw new AppError('Token abgelaufen', 410);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null, verifyExpires: null },
    });

    return NextResponse.redirect(new URL('/dashboard?verified=1', req.url));
  } catch (error) {
    return handleApiError(error);
  }
}
