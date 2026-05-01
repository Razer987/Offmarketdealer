import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createInquirySchema } from '@/lib/validation/schemas';
import { getUserFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';
import { sendEmail, newInquiryTemplate } from '@/lib/email/send';

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUserFromRequest(req);

    const inquiries = await prisma.inquiry.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        type: true,
        status: true,
        message: true,
        createdAt: true,
        listing: {
          select: { category: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const data = createInquirySchema.parse(body);

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: user.id,
        type: data.type,
        listingId: data.listingId,
        objectTitle: data.objectTitle,
        objectDetails: data.objectDetails,
        message: data.message,
        contactPhone: data.contactPhone,
        preferredContact: data.preferredContact,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? '';
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Neue ${data.type === 'ASSESSMENT_REQUEST' ? 'Gutachten-Anfrage' : 'Anfrage'}`,
        html: newInquiryTemplate({
          username: user.username,
          type: data.type,
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
