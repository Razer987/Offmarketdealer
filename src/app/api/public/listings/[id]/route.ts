import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: params.id, status: 'ACTIVE' },
      select: {
        id: true,
        teaserTitle: true,
        teaserDescription: true,
        teaserImageUrl: true,
        publishedAt: true,
      },
    });

    if (!listing) throw new NotFoundError();

    return NextResponse.json({ listing });
  } catch (error) {
    return handleApiError(error);
  }
}
