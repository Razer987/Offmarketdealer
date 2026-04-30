import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createInviteSchema } from '@/lib/validation/schemas';
import { getAdminFromRequest } from '@/lib/auth/session';
import { generateInviteCode, hashInviteCode, getCodePrefix } from '@/lib/invite/generator';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
  try {
    await getAdminFromRequest(req);

    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const limit = 20;

    const [codes, total] = await prisma.$transaction([
      prisma.inviteCode.findMany({
        include: { user: { select: { username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inviteCode.count(),
    ]);

    return NextResponse.json({ codes, pagination: { page, limit, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { admin } = await getAdminFromRequest(req);
    const body = await req.json();
    const data = createInviteSchema.parse(body);

    const rawCode = generateInviteCode();
    const codeHash = await hashInviteCode(rawCode);
    const prefix = getCodePrefix(rawCode);

    const invite = await prisma.inviteCode.create({
      data: {
        codeHash,
        codePrefix: prefix,
        label: data.label,
        notes: data.notes,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdByAdminId: admin.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'INVITE_CREATED',
        entityType: 'InviteCode',
        entityId: invite.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? '',
        details: { label: data.label },
      },
    });

    // Return raw code ONCE — never stored in plain text again
    return NextResponse.json({ invite, rawCode }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
