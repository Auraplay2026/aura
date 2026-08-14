import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    error: 'IMMUTABLE_BET_POLICY: Accepted sports wagers are permanently locked and cannot be cancelled, modified, or altered by users or administrators. The wager remains frozen until official match conclusion and automated settlement.',
    code: 'BET_ISOLATED_AND_LOCKED',
    policy: 'ZERO_POST_ACCEPTANCE_MODIFICATION'
  }, { status: 403 });
}
