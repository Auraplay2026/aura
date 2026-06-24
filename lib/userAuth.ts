import { cookies } from "next/headers";
import { verifyJWT, signJWT } from "./jwt";
import { NextResponse } from "next/server";

export interface UserSession {
  email: string;
}

/**
 * Verify that the user has a valid active session.
 * Optionally verifies that the session email matches the requested resource email (BOLA defense).
 */
export async function verifyUserSession(requestEmail?: string): Promise<string> {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get("user_email")?.value;
  const userToken = cookieStore.get("user_auth_token")?.value;

  if (!emailCookie || !userToken) {
    throw new Error("UNAUTHORIZED_SESSION_MISSING");
  }

  // BOLA Check: Ensure the cookie email matches the targeted payload email
  if (requestEmail && requestEmail.toLowerCase().trim() !== emailCookie.toLowerCase().trim()) {
    throw new Error("UNAUTHORIZED_BOLA_DETECTION");
  }

  // Verify the JWT signature & expiration
  const payload = await verifyJWT(userToken);
  if (payload.sub.toLowerCase() !== emailCookie.toLowerCase()) {
    throw new Error("UNAUTHORIZED_IDENTITY_MISMATCH");
  }

  return emailCookie;
}

/**
 * Set httpOnly secure user auth cookies on the response object.
 */
export async function setUserAuthCookie(response: NextResponse, email: string): Promise<NextResponse> {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days session
  const payload = {
    sub: email,
    role: "user",
    exp,
    iat: Math.floor(Date.now() / 1000)
  };
  const token = await signJWT(payload);
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('user_auth_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  response.cookies.set('user_email', email, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  });

  return response;
}

/**
 * Clear the user auth cookies on logout.
 */
export function clearUserAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set('user_auth_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('user_email', '', { maxAge: 0, path: '/' });
  return response;
}
