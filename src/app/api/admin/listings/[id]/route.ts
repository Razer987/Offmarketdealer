import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { updateListingSchema } from '@/lib/validation/schemas';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';
import { Prisma } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getAdminFromRequest(req);

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!listing) throw new NotFoundError();

    return NextResponse.json({ listing });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { admin } = await getAdminFromRequest(req);
    const body = await req.json();
    const data = updateListingSchema.parse(body);

    const existing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError();

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        ...data,
        priceRangeMin: data.priceRangeMin != null ? new Prisma.Decimal(data.priceRangeMin) : undefined,
        priceRangeMax: data.priceRangeMax != null ? new Prisma.Decimal(data.priceRangeMax) : undefined,
        publishedAt:
          data.status === 'ACTIVE' && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'LISTING_UPDATED',
        entityType: 'Listing',
        entityId: params.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
      },
    });

    return NextResponse.json({ listing: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { admin } = await getAdminFromRequest(req);

    const existing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError();

    await prisma.listing.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'LISTING_DELETED',
        entityType: 'Listing',
        entityId: params.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
        details: { brand: existing.brand, model: existing.model },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
