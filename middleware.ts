import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/router';
import { verifyJWT } from './lib/jwt';

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;

  // 1. Gating Admin UI Routes
  const isAdminUIRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  // 2. Gating Admin API Routes (exclude public auth verification)
  const isAdminApiRoute = pathname.startsWith('/api/admin') && 
    !pathname.startsWith('/api/admin/auth/verify') && 
    !pathname.startsWith('/api/admin/auth/logout') && 
    !pathname.startsWith('/api/admin/auth/challenge');

  if (isAdminUIRoute || isAdminApiRoute) {
    const adminToken = 
      req.cookies.get('admin_auth_token')?.value || 
      req.cookies.get('user_auth_token')?.value ||
      req.cookies.get('admin_token')?.value;

    let isAuthorized = false;

    if (adminToken) {
      try {
        const payload = await verifyJWT(adminToken);
        const sub = (payload.sub || '').toLowerCase().trim();
        const role = (payload.role || '').toLowerCase().trim();

        if (
          role === 'admin' || 
          sub === 'twintubro' || 
          sub === 'twintubrovquattro@gmail.com' || 
          sub === 'admin'
        ) {
          isAuthorized = true;
        }
      } catch (err) {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: 'FORBIDDEN: Administrative role clearance required.' },
          { status: 403 }
        );
      }
      // For Admin UI, allow the embedded AdminSignInCard to render securely
      return NextResponse.next();
    }
  }

  // Security Headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};