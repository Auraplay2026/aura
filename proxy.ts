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

  // 2. Rate Limiting for Auth, Betting, Trading, and Financial APIs (Prevent Brute Force, Race Conditions & Spam)
  if (
    pathname.startsWith('/api/auth') || 
    pathname.startsWith('/api/casino') || 
    pathname.startsWith('/api/deposit') ||
    pathname.startsWith('/api/sports/bet') ||
    pathname.startsWith('/api/sports/cashout') ||
    pathname.startsWith('/api/predictions/trade') ||
    pathname.startsWith('/api/predictions/cashout') ||
    pathname.startsWith('/api/support/chat')
  ) {
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = pathname.startsWith('/api/auth/login') ? 15 : 60; // 15/min for login, 60/min for gameplay/actions

    const currentRecord = rateLimitMap.get(ip);
    const now = Date.now();

    if (currentRecord) {
      if (now - currentRecord.timestamp > windowMs) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      } else {
        if (currentRecord.count >= maxRequests) {
          return new NextResponse(
            JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before trying again." }),
            { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
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

  // 5. CSRF Protection for state-changing admin APIs (allowing Cloudflare Worker, DuckDNS, and OpenShift origins)
  if (pathname.startsWith('/api/admin')) {
    const publicAdminAuthPaths = ['/api/admin/auth/challenge', '/api/admin/auth/verify', '/api/admin/auth/logout'];
    if (!publicAdminAuthPaths.includes(pathname)) {
      const method = request.method;
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host') || '';
        const forwardedHost = request.headers.get('x-forwarded-host') || '';
        const effectiveHost = (forwardedHost || host).toLowerCase();
        
        if (origin) {
          try {
            const originHost = new URL(origin).host.toLowerCase();
            const isAllowedOrigin = 
              originHost === effectiveHost ||
              originHost === host.toLowerCase() ||
              originHost.includes('workers.dev') ||
              originHost.includes('duckdns.org') ||
              originHost.includes('openshiftapps.com') ||
              originHost.includes('localhost') ||
              originHost.includes('127.0.0.1');

            if (!isAllowedOrigin) {
              return NextResponse.json({ error: 'CSRF validation failed: cross-origin admin request blocked.' }, { status: 403 });
            }
          } catch {
            return NextResponse.json({ error: 'CSRF validation failed: invalid origin.' }, { status: 403 });
          }
        }
      }
    }
  }

  // 6. Allow all public auth and admin gate UI paths through to Next.js without middleware blocking
  const publicAdminAuthPaths = ['/api/admin/auth/challenge', '/api/admin/auth/verify', '/api/admin/auth/logout'];
  if (publicAdminAuthPaths.includes(pathname) || pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 7. For internal /api/admin data endpoints, verify session token if present
  const emailCookie = request.cookies.get('user_email')?.value;
  const adminToken = request.cookies.get('admin_auth_token')?.value || request.cookies.get('user_auth_token')?.value;

  if (!adminToken) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    return NextResponse.next();
  }

  try {
    const payload = await verifyJWT(adminToken);

    const isDedicatedAdmin = 
      payload.role === 'admin' || 
      payload.sub?.toLowerCase() === 'twintubrovquattro@gmail.com' || 
      payload.sub?.toLowerCase() === 'twintubro' ||
      payload.sub?.toLowerCase() === 'admin';

    if (!payload.sub || !isDedicatedAdmin) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err: any) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized: ' + err.message }, { status: 401 });
    }
    return NextResponse.next();
  }
}


export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/casino/:path*',
    '/api/deposit/:path*',
    '/api/sports/:path*',
    '/api/predictions/:path*',
    '/api/support/:path*',
    '/data/:path*',
    '/scripts/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/audit/:path*'
  ],
};

