import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT, signJWT } from './lib/jwt';

// Extremely lightweight in-memory rate limiting for Next.js Middleware
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const pathname = request.nextUrl.pathname;

  // 1. Prevent direct access to hidden system directories if they exist
  if (pathname.startsWith('/data') || pathname.startsWith('/scripts')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. Rate Limiting for Auth and Betting APIs (Prevent Brute Force & Spam)
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/casino') || pathname.startsWith('/api/deposit')) {
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 30; // 30 requests per minute

    const currentRecord = rateLimitMap.get(ip);
    const now = Date.now();

    if (currentRecord) {
      if (now - currentRecord.timestamp > windowMs) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      } else {
        if (currentRecord.count >= maxRequests) {
          return new NextResponse(
            JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
        currentRecord.count += 1;
        rateLimitMap.set(ip, currentRecord);
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }
  }

  // 3. Only gate admin paths
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/audit');
  if (!isAdminPath) {
    return NextResponse.next();
  }

  // 4. Hardware-level IP Whitelisting lockdown for Administrative & Audit endpoints
  const whitelistStr = process.env.PROCESS_ENV_ADMIN_IP_WHITELIST || process.env.ADMIN_IP_WHITELIST || "";
  if (whitelistStr) {
    const whitelist = whitelistStr.split(',').map(item => item.trim());
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const realIp = request.headers.get('x-real-ip') || '';
    const rawIp = (request as any).ip || forwardedFor || realIp || '127.0.0.1';
    const clientIp = rawIp.split(',')[0].trim();

    const isLocal = clientIp === '127.0.0.1' || 
                    clientIp === '::1' || 
                    clientIp === 'localhost' || 
                    clientIp.startsWith('::ffff:127.0.0.1') ||
                    clientIp === '::ffff:127.0.0.1';
                    
    const isAllowed = whitelist.includes(clientIp) || isLocal;

    if (!isAllowed) {
      console.warn(`[Blocked Admin Handshake] Unauthorized IP "${clientIp}" tried to hit administrative route: ${pathname}`);
      // Return 404 Not Found to completely mask dashboard existence
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }
  }

  // 5. CSRF Protection for state-changing admin APIs
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

  // 6. Protect Admin UI and Admin APIs with Basic Auth (if configured), but allow the public auth handshake endpoints through locally
  const publicAdminAuthPaths = ['/api/admin/auth/challenge', '/api/admin/auth/verify', '/api/admin/auth/logout'];
  if (!publicAdminAuthPaths.includes(pathname)) {
    const secretKey = process.env.ADMIN_SECRET_KEY;
    if (secretKey) {
      const basicAuth = request.headers.get('authorization');
      let hasValidBasicAuth = false;

      if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const decoded = atob(authValue);
        const [user, pwd] = decoded.split(':');

        hasValidBasicAuth = user === 'admin' && pwd === secretKey;
      }

      if (!hasValidBasicAuth) {
        return new NextResponse('Unauthorized Admin Access', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Secure Admin Area"',
          },
        });
      }
    }
  }

  // 7. Exclude public admin auth endpoints from JWT session requirement
  if (
    pathname === '/api/admin/auth/challenge' ||
    pathname === '/api/admin/auth/verify' ||
    pathname === '/api/admin/auth/logout'
  ) {
    return NextResponse.next();
  }

  // 8. Retrieve session cookies and verify signed JWT
  const emailCookie = request.cookies.get('user_email')?.value;
  const adminToken = request.cookies.get('admin_auth_token')?.value;

  if (!emailCookie || !adminToken) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    if (pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  try {
    // 9. Verify the signed JWT
    const payload = await verifyJWT(adminToken);

    // BOLA defense: Verify cookie matches JWT subject
    const allowedAdmins = ['admin', 'twintubrovquattro@gmail.com'];
    if (!payload.sub || !allowedAdmins.includes(payload.sub.toLowerCase())) {
      throw new Error('Identity mismatch / Unauthorized');
    }

    // 10. Sliding window / Session renewal
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
    console.error('Proxy administrative auth rejection:', err.message);
    
    // Clear cookies on failure
    const response = pathname.startsWith('/api/admin')
      ? NextResponse.json({ error: 'Unauthorized: ' + err.message }, { status: 401 })
      : NextResponse.redirect(new URL('/admin/login', request.url));

    response.cookies.set('user_email', '', { maxAge: 0, path: '/' });
    response.cookies.set('admin_auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/casino/:path*',
    '/api/deposit/:path*',
    '/data/:path*',
    '/scripts/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/audit/:path*'
  ],
};
