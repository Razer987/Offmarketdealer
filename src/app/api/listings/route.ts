import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { listingFiltersSchema } from '@/lib/validation/schemas';
import { getUserFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    await getUserFromRequest(req);

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = listingFiltersSchema.parse(params);

    const where: Prisma.ListingWhereInput = {
      status: { in: ['ACTIVE', 'RESERVED'] },
    };

    if (filters.brand) where.brand = { contains: filters.brand, mode: 'insensitive' };
    if (filters.yearMin || filters.yearMax) {
      where.year = {};
      if (filters.yearMin) (where.year as Prisma.IntFilter).gte = filters.yearMin;
      if (filters.yearMax) (where.year as Prisma.IntFilter).lte = filters.yearMax;
    }
    if (filters.priceMax) where.priceRangeMin = { lte: new Prisma.Decimal(filters.priceMax) };
    if (filters.condition) where.conditionRating = filters.condition;
    if (filters.search) {
      where.OR = [
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
        { teaserTitle: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          conditionRating: true,
          priceRangeMin: true,
          priceRangeMax: true,
          priceCurrency: true,
          mileageRange: true,
          highlights: true,
          status: true,
          publishedAt: true,
          teaserTitle: true,
          teaserDescription: true,
        },
        orderBy: { publishedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
