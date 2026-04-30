export const ADMIN_PATH_SECRET = process.env.ADMIN_PATH_SECRET ?? 'admin-panel';

export const COOKIE_ACCESS_TOKEN = 'om_access';
export const COOKIE_REFRESH_TOKEN = 'om_refresh';
export const COOKIE_ADMIN_TOKEN = 'om_admin';
export const COOKIE_CSRF_TOKEN = 'om_csrf';

export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

export const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

export const RATE_LIMIT_LOGIN_MAX = Number(process.env.RATE_LIMIT_LOGIN_MAX ?? 5);
export const RATE_LIMIT_LOGIN_WINDOW_MIN = Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MIN ?? 15);
export const RATE_LIMIT_INVITE_MAX = 10;
export const RATE_LIMIT_INVITE_WINDOW_HOURS = 1;

export const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 10);
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_IMAGES_PER_LISTING = 20;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const INVITE_CODE_LENGTH = 6;
export const INVITE_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const ADMIN_SESSION_TIMEOUT_MINUTES = 30;
export const ADMIN_MAX_FAILED_ATTEMPTS = 5;
export const USER_MAX_FAILED_ATTEMPTS = 5;

export const PASSWORD_MIN_LENGTH = 12;

export const APP_NAME = 'Off-Market Automobiles';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const CONDITION_LABELS: Record<string, string> = {
  CONCOURS: 'Concours-Zustand',
  EXCELLENT: 'Ausgezeichnet',
  VERY_GOOD: 'Sehr gut',
  GOOD: 'Gut',
  RESTORATION: 'Restaurationsobjekt',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  ACTIVE: 'Aktiv',
  RESERVED: 'Reserviert',
  SOLD: 'Verkauft',
  WITHDRAWN: 'Zurückgezogen',
};
