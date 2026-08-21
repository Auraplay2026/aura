import { NextResponse } from 'next/server';
import { findUserByEmailOrUsername, updateUser, sanitizeUserProfile } from '@/lib/userDb';
import { verifyUserSession } from '@/lib/userAuth';
import { signJWT } from '@/lib/jwt';
import { recordUserActivity } from '@/lib/streakEngineServer';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || body.emailOrUsername || body.username;
    
    let user = null;
    if (email) {
      user = await findUserByEmailOrUsername(email);
    }
    
    if (!user) {
      try {
        const verifiedIdentifier = await verifyUserSession();
        if (verifiedIdentifier) {
          user = await findUserByEmailOrUsername(verifiedIdentifier);
        }
      } catch (e) {}
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found or session expired.' }, { status: 404 });
    }
    
    if (!user.affiliateCode) {
      const generatedCode = user.username.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const updatedUser = await updateUser(user.email || user.username, { affiliateCode: generatedCode });
      if (updatedUser) {
        user = updatedUser;
      }
    }
    
    // Auto record user daily activity in streak engine
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    let streakStatus = null;
    try {
      if (user.id) {
        streakStatus = await recordUserActivity(user.id, clientIp);
      }
    } catch (streakErr) {
      console.error("Streak record failed on /api/auth/me:", streakErr);
    }

    const sanitizedUser = sanitizeUserProfile(user);
    const response = NextResponse.json({ success: true, user: sanitizedUser, streak: streakStatus }, { status: 200 });

    const isDedicatedAdmin = 
      user.role === 'admin' || 
      user.username.toLowerCase() === 'admin' || 
      (user.email && user.email.toLowerCase() === 'twintubrovquattro@gmail.com');

    if (isDedicatedAdmin) {
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        sub: (user.email || user.username).toLowerCase(),
        role: 'admin',
        iat: now,
        exp: now + 7 * 86400 // 7 days admin session
      };
      const adminToken = await signJWT(jwtPayload);
      const isProd = process.env.NODE_ENV === 'production';

      response.cookies.set('admin_auth_token', adminToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 86400,
        path: '/'
      });
      response.cookies.set('user_email', (user.email || user.username).toLowerCase(), {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 86400,
        path: '/'
      });
      response.cookies.set('user_auth_token', adminToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 86400,
        path: '/'
      });
    }

    return response;
  } catch (err) {
    console.error("Failed to fetch/update user state:", err);
    return NextResponse.json({ error: 'Failed to fetch user state.' }, { status: 500 });
  }
}
