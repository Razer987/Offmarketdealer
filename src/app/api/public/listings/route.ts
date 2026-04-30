import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(_req: NextRequest) {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        teaserTitle: true,
        teaserDescription: true,
        teaserImageUrl: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ listings });
  } catch (error) {
    return handleApiError(error);
  }
}
