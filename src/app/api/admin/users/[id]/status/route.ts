import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { updateUserStatusSchema } from '@/lib/validation/schemas';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { admin } = await getAdminFromRequest(req);
    const { status } = updateUserStatusSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new NotFoundError();

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { status },
    });

    if (status === 'SUSPENDED') {
      await prisma.userSession.deleteMany({ where: { userId: params.id } });
    }

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
        entityType: 'User',
        entityId: params.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
        details: { username: user.username },
      },
    });

    return NextResponse.json({ user: { id: updated.id, status: updated.status } });
  } catch (error) {
    return handleApiError(error);
  }
}
