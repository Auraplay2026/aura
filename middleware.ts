import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT, signJWT } from './lib/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public admin auth endpoints
  if (
    pathname === '/api/admin/auth/challenge' ||
    pathname === '/api/admin/auth/verify' ||
    pathname === '/api/admin/auth/logout'
  ) {
    return NextResponse.next();
  }

  // 2. Only gate admin paths
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (!isAdminPath) {
    return NextResponse.next();
  }

  // 3. CSRF Protection for state-changing admin APIs
  if (pathname.startsWith('/api/admin')) {
    const method = request.method;
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: 'CSRF validation failed: cross-origin admin request blocked.' }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: 'CSRF validation failed: invalid origin.' }, { status: 403 });
        }
      }
    }
  }

  // 4. Retrieve session cookies
  const emailCookie = request.cookies.get('user_email')?.value;
  const adminToken = request.cookies.get('admin_auth_token')?.value;

  if (!emailCookie || !adminToken) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/?error=admin-auth-required', request.url));
  }

  try {
    // 5. Verify the signed JWT
    const payload = await verifyJWT(adminToken);

    // BOLA defense: Verify cookie email matches JWT subject
    if (payload.sub !== emailCookie || payload.sub.toLowerCase() !== 'twintubrovquattro@gmail.com') {
      throw new Error('Identity mismatch / Unauthorized');
    }

    // 6. Sliding window / Session renewal
    const response = NextResponse.next();
    const newExp = Math.floor(Date.now() / 1000) + 900; // 15 mins sliding duration
    const newPayload = {
      sub: payload.sub,
      role: payload.role,
      exp: newExp,
      iat: Math.floor(Date.now() / 1000)
    };
    const newToken = await signJWT(newPayload);

    response.cookies.set('admin_auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900,
      path: '/'
    });

    response.cookies.set('user_email', emailCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900,
      path: '/'
    });

    return response;
  } catch (err: any) {
    console.error('Middleware administrative auth rejection:', err.message);
    
    // Clear cookies on failure
    const response = pathname.startsWith('/api/admin')
      ? NextResponse.json({ error: 'Unauthorized: ' + err.message }, { status: 401 })
      : NextResponse.redirect(new URL('/?error=admin-auth-required', request.url));

    response.cookies.set('user_email', '', { maxAge: 0, path: '/' });
    response.cookies.set('admin_auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
