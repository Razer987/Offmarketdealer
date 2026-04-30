import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { updateInquiryStatusSchema } from '@/lib/validation/schemas';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { admin } = await getAdminFromRequest(req);
    const body = await req.json();
    const { status, adminNotes } = updateInquiryStatusSchema.parse(body);

    const inquiry = await prisma.inquiry.findUnique({ where: { id: params.id } });
    if (!inquiry) throw new NotFoundError();

    const updated = await prisma.inquiry.update({
      where: { id: params.id },
      data: {
        status,
        adminNotes,
        respondedAt: status === 'RESPONDED' ? new Date() : inquiry.respondedAt,
        closedAt: ['CLOSED', 'ARCHIVED'].includes(status) ? new Date() : inquiry.closedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'INQUIRY_STATUS_CHANGED',
        entityType: 'Inquiry',
        entityId: params.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
        details: { from: inquiry.status, to: status },
      },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
