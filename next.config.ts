import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  }
];

// Headers for the game proxy route — no frame restrictions, wide CORS
const gameProxyHeaders = [
  {
    key: 'Access-Control-Allow-Origin',
    value: '*',
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, OPTIONS',
  },
  // Deliberately NO X-Frame-Options so the proxied content embeds freely
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Game proxy: open CORS, no frame restrictions
      {
        source: '/api/game-proxy/:path*',
        headers: gameProxyHeaders,
      },
      // All other routes: full security headers
      {
        source: '/((?!api/game-proxy).*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.akamai.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'play-lh.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.gamedistribution.com',
      },
    ],
  },
};

export default nextConfig;
