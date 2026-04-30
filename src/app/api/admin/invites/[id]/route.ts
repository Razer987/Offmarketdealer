import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { admin } = await getAdminFromRequest(req);

    const invite = await prisma.inviteCode.findUnique({ where: { id: params.id } });
    if (!invite) throw new NotFoundError();

    // Soft-deactivate by marking as used
    await prisma.inviteCode.update({
      where: { id: params.id },
      data: { used: true, usedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'INVITE_DEACTIVATED',
        entityType: 'InviteCode',
        entityId: params.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
