import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashToken } from '@/lib/auth/session';
import { handleApiError } from '@/lib/utils/errors';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '@/lib/utils/constants';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
    if (token) {
      await prisma.userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_ACCESS_TOKEN);
    response.cookies.delete(COOKIE_REFRESH_TOKEN);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
