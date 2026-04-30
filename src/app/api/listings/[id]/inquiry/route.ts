import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createInquirySchema } from '@/lib/validation/schemas';
import { getUserFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';
import { sendEmail, newInquiryTemplate } from '@/lib/email/send';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getUserFromRequest(req);

    const listing = await prisma.listing.findFirst({
      where: { id: params.id, status: { in: ['ACTIVE', 'RESERVED'] } },
    });
    if (!listing) throw new NotFoundError();

    const body = await req.json();
    const data = createInquirySchema.parse({ ...body, type: 'LISTING_INQUIRY', listingId: params.id });

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: user.id,
        type: 'LISTING_INQUIRY',
        listingId: params.id,
        message: data.message,
        contactPhone: data.contactPhone,
        preferredContact: data.preferredContact,
      },
    });

    await prisma.listing.update({
      where: { id: params.id },
      data: { inquiryCount: { increment: 1 } },
    });

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? '';
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Neue Anfrage: ${listing.brand} ${listing.model} ${listing.year}`,
        html: newInquiryTemplate({
          username: user.username,
          type: `Listing-Anfrage: ${listing.brand} ${listing.model}`,
          message: data.message,
          contactPhone: data.contactPhone,
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ inquiry: { id: inquiry.id } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
