import { cookies } from "next/headers";
import { verifyJWT, signJWT } from "./jwt";
import { NextResponse } from "next/server";
import { findUserByEmailOrUsername } from "./userDb";

export async function verifyUserSession(requestEmail?: string): Promise<string> {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get("user_email")?.value;
  const userToken = cookieStore.get("user_auth_token")?.value || cookieStore.get("admin_auth_token")?.value;

  let tokenPayload: any = null;
  let tokenSub: string | null = null;
  let isAdmin = false;

  if (userToken) {
    try {
      tokenPayload = await verifyJWT(userToken);
      if (tokenPayload) {
        tokenSub = (tokenPayload.sub || "").toLowerCase().trim();
        if (tokenPayload.role === "admin") {
          isAdmin = true;
        }
      }
    } catch (jwtErr) {
      console.warn("[verifyUserSession] Stale or invalid JWT token:", jwtErr);
    }
  }

  // Resolve target identifier from available vectors
  const candidateIdentifier = (
    requestEmail ||
    emailCookie ||
    tokenSub ||
    ""
  ).toLowerCase().trim();

  if (!candidateIdentifier) {
    throw new Error("UNAUTHORIZED_SESSION_MISSING");
  }

  // Query canonical user from database by email or username
  const user = await findUserByEmailOrUsername(candidateIdentifier);
  if (!user) {
    throw new Error("UNAUTHORIZED_USER_NOT_FOUND");
  }

  const userEmail = (user.email || "").toLowerCase().trim();
  const userName = (user.username || "").toLowerCase().trim();

  // If a valid token was parsed, verify that it belongs to this user (or is admin) to prevent identity mismatch
  if (tokenSub && !isAdmin) {
    const isTokenMatch =
      tokenSub === userEmail ||
      tokenSub === userName ||
      tokenSub === (emailCookie || "").toLowerCase().trim();

    if (!isTokenMatch) {
      throw new Error("UNAUTHORIZED_IDENTITY_MISMATCH");
    }
  }

  // If requestEmail was passed, ensure the user cannot perform actions on other accounts (BOLA/IDOR protection)
  if (requestEmail) {
    const target = requestEmail.toLowerCase().trim();
    const isTargetValid =
      target === userEmail ||
      target === userName ||
      isAdmin;

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
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  response.cookies.set('user_email', email, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
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
