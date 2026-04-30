import { prisma } from '@/lib/db/prisma';
import { RateLimitError } from '@/lib/utils/errors';
import {
  RATE_LIMIT_LOGIN_MAX,
  RATE_LIMIT_LOGIN_WINDOW_MIN,
  RATE_LIMIT_INVITE_MAX,
  RATE_LIMIT_INVITE_WINDOW_HOURS,
} from '@/lib/utils/constants';

type RateLimitAction = 'LOGIN' | 'INVITE_VALIDATE' | 'PASSWORD_RESET' | 'REGISTER';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const configs: Record<RateLimitAction, RateLimitConfig> = {
  LOGIN: {
    maxRequests: RATE_LIMIT_LOGIN_MAX,
    windowMs: RATE_LIMIT_LOGIN_WINDOW_MIN * 60 * 1000,
  },
  INVITE_VALIDATE: {
    maxRequests: RATE_LIMIT_INVITE_MAX,
    windowMs: RATE_LIMIT_INVITE_WINDOW_HOURS * 60 * 60 * 1000,
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  REGISTER: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

export async function checkRateLimit(identifier: string, action: RateLimitAction): Promise<void> {
  const config = configs[action];
  const windowStart = new Date(Date.now() - config.windowMs);

  const record = await prisma.rateLimit.findUnique({
    where: { identifier_action: { identifier, action } },
  });

  if (!record || record.windowStart < windowStart) {
    // Outside window — reset
    await prisma.rateLimit.upsert({
      where: { identifier_action: { identifier, action } },
      update: { count: 1, windowStart: new Date() },
      create: { identifier, action, count: 1, windowStart: new Date() },
    });
    return;
  }

  if (record.count >= config.maxRequests) {
    throw new RateLimitError();
  }

  await prisma.rateLimit.update({
    where: { identifier_action: { identifier, action } },
    data: { count: { increment: 1 } },
  });
}

export async function resetRateLimit(identifier: string, action: RateLimitAction): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { identifier, action } });
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
