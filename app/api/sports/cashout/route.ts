import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    error: 'IMMUTABLE_BET_POLICY: Accepted sports wagers are permanently locked and cannot be cashed out, edited, or modified prior to official event settlement.',
    code: 'BET_ISOLATED_AND_LOCKED',
    policy: 'ZERO_POST_ACCEPTANCE_MODIFICATION'
  }, { status: 403 });
}
