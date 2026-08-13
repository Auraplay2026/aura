import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, updateUser, sanitizeUserProfile } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 });
    }

    try {
      await verifyUserSession(email);
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or mismatched.' }, { status: 401 });
    }
    
    let user = await findUserByEmailOrUsername(email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    
    if (!user.affiliateCode) {
      const generatedCode = user.username.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const updatedUser = await updateUser(email, { affiliateCode: generatedCode });
      if (updatedUser) {
        user = updatedUser;
      }
    }
    
    const sanitizedUser = sanitizeUserProfile(user);
    
    return NextResponse.json({ success: true, user: sanitizedUser }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch/update user state:", err);
    return NextResponse.json({ error: 'Failed to fetch user state.' }, { status: 500 });
  }
}
