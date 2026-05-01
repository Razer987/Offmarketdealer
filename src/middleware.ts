import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PATH_SECRET, COOKIE_ACCESS_TOKEN, COOKIE_ADMIN_TOKEN } from '@/lib/utils/constants';

const PUBLIC_PATHS = [
  '/',
  '/about',
  '/privacy',
  '/imprint',
  '/login',
  '/teaser',
];

const PUBLIC_PATH_PREFIXES = [
  '/invite/',
  '/api/auth/',
  '/api/invite/',
  '/api/public/',
  '/_next/',
  '/fonts/',
  '/teaser-images/',
  '/favicon.ico',
];

function buildCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Content-Security-Policy', buildCSP());
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  return res;
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

// ADMIN_PATH_SECRET is the full path segment, e.g. "admin-panel" → "/admin-panel/..."
// Change in .env and rename the route group folder for production deployments.
function isAdminPath(pathname: string): boolean {
  return pathname.startsWith(`/${ADMIN_PATH_SECRET}`);
}

function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/admin/');
}

function isMemberPath(pathname: string): boolean {
  const memberPrefixes = ['/dashboard', '/listings', '/inquiries', '/watchlist', '/account'];
  return memberPrefixes.some((p) => pathname.startsWith(p));
}

function isMemberApiPath(pathname: string): boolean {
  const memberApiPrefixes = ['/api/listings', '/api/inquiries', '/api/watchlist'];
  return memberApiPrefixes.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Admin paths — require admin token (login page + login API are public)
  if (isAdminPath(pathname) || isAdminApiPath(pathname)) {
    const adminLoginPath = `/${ADMIN_PATH_SECRET}/login`;
    if (pathname === adminLoginPath || pathname.startsWith(`${adminLoginPath}/`)) {
      return addSecurityHeaders(NextResponse.next());
    }
    if (pathname === '/api/admin/login') {
      return addSecurityHeaders(NextResponse.next());
    }
    const adminToken = request.cookies.get(COOKIE_ADMIN_TOKEN);
    if (!adminToken?.value) {
      if (pathname.startsWith('/api/')) {
        return addSecurityHeaders(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        );
      }
      return addSecurityHeaders(NextResponse.redirect(new URL(adminLoginPath, request.url)));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Member paths — require user token
  if (isMemberPath(pathname) || isMemberApiPath(pathname)) {
    const accessToken = request.cookies.get(COOKIE_ACCESS_TOKEN);
    if (!accessToken?.value) {
      if (pathname.startsWith('/api/')) {
        return addSecurityHeaders(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
