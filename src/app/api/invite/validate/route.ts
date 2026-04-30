import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateInviteSchema } from '@/lib/validation/schemas';
import { verifyInviteCode, getCodePrefix } from '@/lib/invite/generator';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { handleApiError } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(ip, 'INVITE_VALIDATE');

    const body = await req.json();
    const { code } = validateInviteSchema.parse(body);
    const prefix = getCodePrefix(code);

    const candidates = await prisma.inviteCode.findMany({
      where: { codePrefix: prefix, used: false },
    });

    let matched = false;
    for (const candidate of candidates) {
      if (await verifyInviteCode(code, candidate.codeHash)) {
        if (candidate.expiresAt && candidate.expiresAt < new Date()) {
          return NextResponse.json({ valid: false, reason: 'Code abgelaufen' }, { status: 410 });
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      return NextResponse.json({ valid: false, reason: 'Ungültiger Code' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    return handleApiError(error);
  }
}
