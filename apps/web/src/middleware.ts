import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Platform routes protection
  if (pathname.startsWith('/platform-secret')) {
    const authCookie = request.cookies.get('auth-token');

    if (!authCookie) {
      // Not authenticated - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Note: We can't decode JWT here without the secret, so we rely on
    // the layout component to do the SUPER_ADMIN check client-side.
    // For production, consider using middleware-safe JWT verification
    // or a separate auth service.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/platform-secret/:path*'],
};
