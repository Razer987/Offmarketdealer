import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  try {
    await getAdminFromRequest(req);

    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const status = req.nextUrl.searchParams.get('status');
    const limit = 20;

    const where = status ? { status: status as 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED' | 'ARCHIVED' } : {};

    const [inquiries, total] = await prisma.$transaction([
      prisma.inquiry.findMany({
        where,
        include: {
          user: { select: { username: true, email: true } },
          listing: { select: { category: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({ inquiries, pagination: { page, limit, total } });
  } catch (error) {
    return handleApiError(error);
  }
}
