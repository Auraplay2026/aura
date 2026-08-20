import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'UNKNOWN';
  let dbLatencyMs = -1;

  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'HEALTHY';
  } catch (err: any) {
    dbStatus = 'DEGRADED';
    dbError = err?.message || String(err);
    console.error('[Health Probe] Database ping failed:', err?.message);
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const totalLatencyMs = Date.now() - startTime;

  const isHealthy = dbStatus === 'HEALTHY';

  return NextResponse.json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    totalLatencyMs,
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'PostgreSQL / Prisma PgAdapter',
        ...(dbError && { error: dbError })
      },
      sseStream: {
        status: 'READY',
        endpoint: '/api/sports/stream'
      },
      auditReconciliation: {
        status: 'ONLINE',
        endpoint: '/api/admin/audit/reconcile'
      }
    },
    system: {
      uptimeSeconds,
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'production'
    }
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${totalLatencyMs}ms`
    }
  });
}
