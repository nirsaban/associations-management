import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth Architecture Notes:
 *
 * The auth store (Zustand + persist) stores tokens in localStorage under key "auth-store".
 * localStorage is not accessible in Edge middleware.
 *
 * To enable server-side routing decisions, the login flow sets a cookie "auth_token"
 * with the JWT access token immediately after successful OTP verification.
 * This cookie is read-only by the middleware for routing (not for cryptographic verification).
 *
 * The JWT payload contains: sub, phone, organizationId, platformRole, systemRole.
 * Note: setupCompleted is NOT in the JWT — that check is done client-side in the
 * dashboard layout by calling GET /organization/me.
 *
 * Security note: Middleware only does routing redirects.
 * All actual authorization is enforced by the backend on every API call.
 */

// Routes that never require authentication
const PUBLIC_ROUTES = ['/login'];

// Routes that require authentication but are not role-restricted
const ACTIVATION_ROUTE = '/activation';

// Route prefixes only accessible to SUPER_ADMIN
const PLATFORM_ROUTE_PREFIX = '/platform-secret';
const PLATFORM_NEW_PREFIX = '/platform';

// Route prefixes for the org setup wizard (ADMIN only)
const SETUP_ROUTE_PREFIX = '/setup';

// Paths that bypass middleware entirely
const BYPASS_PREFIXES = [
  '/_next',
  '/api',
  '/icons',
  '/sw.js',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
];

function shouldBypass(pathname: string): boolean {
  return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Decode a JWT payload (base64url) without verifying the signature.
 * Used only for routing decisions — never for authorization.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js internals, static assets, and API proxy pass through
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  // Landing pages are always public — no auth required
  if (pathname.startsWith('/l/')) {
    return NextResponse.next();
  }

  const rawToken = request.cookies.get('auth_token')?.value ?? null;
  const payload = rawToken ? decodeJwtPayload(rawToken) : null;
  // Check token is not expired (exp is in seconds)
  const isExpired = payload?.exp ? (payload.exp as number) * 1000 < Date.now() : false;
  const isAuthenticated = payload !== null && !isExpired;
  const isSuperAdmin = payload?.platformRole === 'SUPER_ADMIN';

  // ── Public routes ──────────────────────────────────────────────────────────
  if (isPublicRoute(pathname)) {
    // Redirect already-authenticated users away from /login
    if (isAuthenticated) {
      const dest = isSuperAdmin ? '/platform' : '/';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Clear stale/expired cookie to prevent redirect loops
    if (rawToken) {
      response.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
    }
    return response;
  }

  // ── Activation flow — all roles allowed ──────────────────────────────────
  if (pathname.startsWith(ACTIVATION_ROUTE)) {
    return NextResponse.next();
  }

  // ── SUPER_ADMIN routing ────────────────────────────────────────────────────
  // SUPER_ADMIN can access /platform-secret and /platform; everywhere else redirects them back.
  if (isSuperAdmin) {
    if (!pathname.startsWith(PLATFORM_ROUTE_PREFIX) && !pathname.startsWith(PLATFORM_NEW_PREFIX)) {
      return NextResponse.redirect(new URL('/platform', request.url));
    }
    return NextResponse.next();
  }

  // ── Regular users / admins ─────────────────────────────────────────────────
  // They must NOT reach /platform-secret or /platform
  if (pathname.startsWith(PLATFORM_ROUTE_PREFIX) || pathname.startsWith(PLATFORM_NEW_PREFIX)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Setup wizard access: only ADMIN users need it.
  // The fine-grained redirect to /setup/organization when setupCompleted=false
  // is handled by the dashboard layout (which fetches /organization/me from the API).
  // Middleware cannot know setupCompleted without an extra API call, so we leave
  // that decision to the client layout.

  // Prevent non-ADMIN from accessing the setup wizard
  if (pathname.startsWith(SETUP_ROUTE_PREFIX) && payload?.systemRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * This regex excludes paths starting with _next/static, _next/image,
     * and files with extensions (images, fonts, etc.).
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)',
  ],
};
