import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  try {
    await getAdminFromRequest(req);

    const [
      totalListings,
      activeListings,
      totalUsers,
      newInquiries,
      totalInquiries,
      recentInquiries,
    ] = await prisma.$transaction([
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.inquiry.count({ where: { status: 'NEW' } }),
      prisma.inquiry.count(),
      prisma.inquiry.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { username: true } },
          listing: { select: { category: true, title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: { totalListings, activeListings, totalUsers, newInquiries, totalInquiries },
      recentInquiries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
