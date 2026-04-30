import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminFromRequest } from '@/lib/auth/session';
import { validateImageFile, validateImageCount } from '@/lib/files/validate';
import { saveImage } from '@/lib/files/upload';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getAdminFromRequest(req);

    const listing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!listing) throw new NotFoundError();

    const currentCount = await prisma.listingImage.count({ where: { listingId: params.id } });
    validateImageCount(currentCount);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Keine Datei übergeben' }, { status: 400 });
    }

    await validateImageFile(file);
    const processed = await saveImage(file, params.id);

    const image = await prisma.listingImage.create({
      data: {
        listingId: params.id,
        filename: processed.filename,
        originalName: file.name,
        mimeType: processed.mimeType,
        sizeBytes: processed.sizeBytes,
        width: processed.width,
        height: processed.height,
        sortOrder: currentCount,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
