import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getUserFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUserFromRequest(req);

    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          select: {
            id: true,
            category: true,
            title: true,
            priceRangeMin: true,
            priceRangeMax: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

const addSchema = z.object({ listingId: z.string().cuid() });

export async function POST(req: NextRequest) {
  try {
    const { user } = await getUserFromRequest(req);
    const { listingId } = addSchema.parse(await req.json());

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: { in: ['ACTIVE', 'RESERVED'] } },
    });
    if (!listing) throw new NotFoundError();

    await prisma.watchlistItem.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      update: {},
      create: { userId: user.id, listingId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
