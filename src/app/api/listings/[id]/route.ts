import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getUserFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromRequest(req);

    const listing = await prisma.listing.findFirst({
      where: { id: params.id, status: { in: ['ACTIVE', 'RESERVED'] } },
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        engineDisplacement: true,
        enginePower: true,
        acceleration: true,
        topSpeed: true,
        mileageRange: true,
        conditionRating: true,
        priceRangeMin: true,
        priceRangeMax: true,
        priceCurrency: true,
        generalDescription: true,
        highlights: true,
        status: true,
        publishedAt: true,
        teaserTitle: true,
        teaserDescription: true,
        // NEVER expose: internalNotes, internalSellerInfo, images
      },
    });

    if (!listing) throw new NotFoundError('Inserat nicht gefunden');

    // Increment view count async (non-blocking)
    prisma.listing.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => null);

    return NextResponse.json({ listing });
  } catch (error) {
    return handleApiError(error);
  }
}
