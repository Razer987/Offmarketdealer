import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  try {
    await getAdminFromRequest(req);

    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const limit = 20;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          _count: { select: { inquiries: true, watchlistItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({ users, pagination: { page, limit, total } });
  } catch (error) {
    return handleApiError(error);
  }
}
