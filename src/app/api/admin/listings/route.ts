import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createListingSchema } from '@/lib/validation/schemas';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { admin } = await getAdminFromRequest(req);
    void admin;

    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const limit = 20;

    const [listings, total] = await prisma.$transaction([
      prisma.listing.findMany({
        include: { _count: { select: { inquiries: true, watchlistItems: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count(),
    ]);

    return NextResponse.json({ listings, pagination: { page, limit, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { admin } = await getAdminFromRequest(req);
    const body = await req.json();
    const data = createListingSchema.parse(body);

    const listing = await prisma.listing.create({
      data: {
        teaserTitle: data.teaserTitle,
        teaserDescription: data.teaserDescription,
        teaserImageUrl: data.teaserImageUrl,
        category: data.category,
        title: data.title,
        priceRangeMin: data.priceRangeMin ? new Prisma.Decimal(data.priceRangeMin) : null,
        priceRangeMax: data.priceRangeMax ? new Prisma.Decimal(data.priceRangeMax) : null,
        priceCurrency: data.priceCurrency,
        generalDescription: data.generalDescription,
        highlights: data.highlights,
        internalNotes: data.internalNotes,
        internalSellerInfo: data.internalSellerInfo,
        status: data.status,
        publishedAt: data.status === 'ACTIVE' ? new Date() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'LISTING_CREATED',
        entityType: 'Listing',
        entityId: listing.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
        details: { category: listing.category, title: listing.title },
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
