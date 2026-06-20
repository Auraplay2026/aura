import { NextResponse } from 'next/server';
import { logAdminAction } from '@/app/(admin)/admin/actions';
import { 
  getTelemetryHistory, 
  getRiskAlertsHistory, 
  calculatePlatformHoldPercentage, 
  isMarketSuspended, 
  resetCircuitBreaker 
} from '@/lib/settlementEngine';
import { getSystemConfig } from '@/lib/systemConfig';
import { verifyAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await verifyAdminSession();

    const telemetry = getTelemetryHistory();
    const riskAlerts = getRiskAlertsHistory();
    const holdStats = calculatePlatformHoldPercentage();
    const isSuspended = isMarketSuspended();
    const systemConfig = getSystemConfig();

    return NextResponse.json({
      success: true,
      telemetry,
      riskAlerts,
      holdStats,
      isSuspended,
      maintenanceMode: !!systemConfig.maintenanceMode
    }, { status: 200 });
  } catch (err: any) {
    console.error("Failed to load admin telemetry data:", err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve telemetry.' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    const verifiedAdminEmail = session.email;

    const { action } = await request.json();

    if (action === 'reset_breaker') {
      resetCircuitBreaker();
      await logAdminAction(verifiedAdminEmail, "RESET_CIRCUIT_BREAKER", "SYSTEM", "Reset circuit breaker and resumed market settlements.");
      return NextResponse.json({ success: true, message: "Circuit breaker reset successfully." }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    console.error("Admin telemetry action error:", err);
    return NextResponse.json({ error: err.message || 'Failed to execute telemetry action.' }, { status: 500 });
  }
}
