import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  try {
    await getAdminFromRequest(req);

    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const limit = 50;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        include: { admin: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({ logs, pagination: { page, limit, total } });
  } catch (error) {
    return handleApiError(error);
  }
}
