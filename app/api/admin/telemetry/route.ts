import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/userDb';
import { logAdminAction } from '@/app/(admin)/admin/actions';
import { 
  getTelemetryHistory, 
  getRiskAlertsHistory, 
  calculatePlatformHoldPercentage, 
  isMarketSuspended, 
  resetCircuitBreaker 
} from '@/lib/settlementEngine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('email');
    
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized. Admin email is required.' }, { status: 401 });
    }
    
    const adminUser = await findUserByEmail(adminEmail);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Administrator privileges required.' }, { status: 403 });
    }

    const telemetry = getTelemetryHistory();
    const riskAlerts = getRiskAlertsHistory();
    const holdStats = calculatePlatformHoldPercentage();
    const isSuspended = isMarketSuspended();

    return NextResponse.json({
      success: true,
      telemetry,
      riskAlerts,
      holdStats,
      isSuspended
    }, { status: 200 });
  } catch (err) {
    console.error("Failed to load admin telemetry data:", err);
    return NextResponse.json({ error: 'Failed to retrieve telemetry.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { adminEmail, action } = await request.json();

    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized. Administrator credentials required.' }, { status: 401 });
    }

    const adminUser = await findUserByEmail(adminEmail);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Administrator privileges required.' }, { status: 403 });
    }

    if (action === 'reset_breaker') {
      resetCircuitBreaker();
      await logAdminAction(adminEmail, "RESET_CIRCUIT_BREAKER", "SYSTEM", "Reset circuit breaker and resumed market settlements.");
      return NextResponse.json({ success: true, message: "Circuit breaker reset successfully." }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error("Admin telemetry action error:", err);
    return NextResponse.json({ error: 'Failed to execute telemetry action.' }, { status: 500 });
  }
}
