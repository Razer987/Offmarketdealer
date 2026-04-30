import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminFromRequest } from '@/lib/auth/session';
import { deleteImage, getImageBuffer } from '@/lib/files/upload';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; imgId: string } }
) {
  try {
    await getAdminFromRequest(req);

    const image = await prisma.listingImage.findFirst({
      where: { id: params.imgId, listingId: params.id },
    });
    if (!image) throw new NotFoundError();

    const buffer = await getImageBuffer(image.filename);
    if (!buffer) throw new NotFoundError('Bilddatei nicht gefunden');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imgId: string } }
) {
  try {
    await getAdminFromRequest(req);

    const image = await prisma.listingImage.findFirst({
      where: { id: params.imgId, listingId: params.id },
    });
    if (!image) throw new NotFoundError();

    await deleteImage(image.filename);
    await prisma.listingImage.delete({ where: { id: params.imgId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
