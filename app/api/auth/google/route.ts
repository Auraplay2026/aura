import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Google sign-in is disabled. Please log in using your admin-created username and password.' }, { status: 403 });
}
