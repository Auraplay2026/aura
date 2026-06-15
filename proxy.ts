import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extremely lightweight in-memory rate limiting for Next.js Middleware
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;

  // 1. Hardware-level IP Whitelisting lockdown for Administrative & Audit endpoints
  if (path.startsWith('/admin') || path.startsWith('/audit') || path.startsWith('/api/admin')) {
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
        console.warn(`[Blocked Admin Handshake] Unauthorized IP "${clientIp}" tried to hit administrative route: ${path}`);
        // Return 404 Not Found to completely mask dashboard existence
        return new NextResponse(null, { status: 404, statusText: 'Not Found' });
      }
    }
  }

  // 2. Rate Limiting for Auth and Betting APIs (Prevent Brute Force & Spam)
  if (path.startsWith('/api/auth') || path.startsWith('/api/casino') || path.startsWith('/api/deposit')) {
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

  // 3. Prevent direct access to hidden system directories if they exist
  if (path.startsWith('/data') || path.startsWith('/scripts')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 4. Protect Admin UI and Admin APIs with Basic Auth (if configured)
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    const secretKey = process.env.ADMIN_SECRET_KEY || "AuraAdmin2026!";

    if (secretKey) {
      const basicAuth = request.headers.get('authorization');
      
      if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const decoded = atob(authValue);
        const [user, pwd] = decoded.split(':');

        if (pwd === secretKey || user === secretKey) {
          return NextResponse.next();
        }
      }

      return new NextResponse('Unauthorized Admin Access', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Admin Area"',
        },
      });
    }
  }

  return NextResponse.next();
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
