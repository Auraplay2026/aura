import { cookies } from "next/headers";
import { verifyJWT, signJWT } from "./jwt";
import { NextResponse } from "next/server";
import { findUserByEmailOrUsername } from "./userDb";

export async function verifyUserSession(requestEmail?: string): Promise<string> {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get("user_email")?.value;
  const userToken = cookieStore.get("user_auth_token")?.value;

  if (!emailCookie || !userToken) {
    throw new Error("UNAUTHORIZED_SESSION_MISSING");
  }

  // Verify the JWT signature & expiration
  const payload = await verifyJWT(userToken);
  const tokenSub = (payload.sub || "").toLowerCase().trim();
  const cookieVal = emailCookie.toLowerCase().trim();

  // Find canonical user by email or username
  const user = await findUserByEmailOrUsername(emailCookie);
  if (!user) {
    throw new Error("UNAUTHORIZED_USER_NOT_FOUND");
  }

  const userEmail = (user.email || "").toLowerCase().trim();
  const userName = (user.username || "").toLowerCase().trim();

  const isTokenValid = 
    tokenSub === cookieVal ||
    tokenSub === userEmail ||
    tokenSub === userName ||
    payload.role === "admin";

  if (!isTokenValid) {
    throw new Error("UNAUTHORIZED_IDENTITY_MISMATCH");
  }

  if (requestEmail) {
    const target = requestEmail.toLowerCase().trim();
    const isTargetValid = 
      target === userEmail ||
      target === userName ||
      target === cookieVal ||
      target === tokenSub;

    if (!isTargetValid) {
      throw new Error("UNAUTHORIZED_BOLA_DETECTION");
    }
  }

  return user.email || user.username;
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
