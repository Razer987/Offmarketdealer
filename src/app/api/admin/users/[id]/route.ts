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

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new NotFoundError();

    await prisma.$transaction([
      prisma.userSession.deleteMany({ where: { userId: params.id } }),
      prisma.user.update({
        where: { id: params.id },
        data: { status: 'DELETED', email: `deleted_${params.id}@deleted`, passwordHash: 'deleted' },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: params.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
        details: { username: user.username },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
