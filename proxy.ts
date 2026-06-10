import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extremely lightweight in-memory rate limiting for Next.js Middleware
// Note: In a multi-server production environment with Edge, you'd use Redis (e.g. Upstash).
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;

  // 1. Rate Limiting for Auth APIs (Prevent Brute Force)
  if (path.startsWith('/api/auth')) {
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 15; // 15 requests per minute

    const currentRecord = rateLimitMap.get(ip);
    const now = Date.now();

    if (currentRecord) {
      if (now - currentRecord.timestamp > windowMs) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      } else {
        if (currentRecord.count >= maxRequests) {
          return new NextResponse(
            JSON.stringify({ error: "Too many authentication requests. Please try again later." }),
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

  // 2. Prevent direct access to hidden system directories if they exist
  if (path.startsWith('/data') || path.startsWith('/scripts')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/data/:path*',
    '/scripts/:path*'
  ],
};
