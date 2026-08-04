import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Public registration is disabled. Accounts must be created by an administrator.' }, { status: 403 });
}
