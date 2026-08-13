import { cookies } from "next/headers";
import { findUserByEmailOrUsername } from "./userDb";
import { verifyJWT } from "./jwt";

export interface SessionUser {
  email: string;
  role: string;
}

export async function verifyAdminSession(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get("user_email")?.value || cookieStore.get("admin_email")?.value;
  const adminToken = 
    cookieStore.get("admin_auth_token")?.value || 
    cookieStore.get("user_auth_token")?.value || 
    cookieStore.get("admin_token")?.value;

  if (!adminToken) {
    throw new Error("UNAUTHORIZED_ADMIN_SESSION_MISSING: Authentication token required.");
  }

  let payload: any;
  try {
    payload = await verifyJWT(adminToken);
  } catch (err: any) {
    throw new Error("UNAUTHORIZED_INVALID_ADMIN_TOKEN: " + (err.message || "Token signature or expiration invalid."));
  }

  const tokenSub = (payload.sub || "").toLowerCase().trim();
  if (!tokenSub) {
    throw new Error("UNAUTHORIZED_INVALID_TOKEN_SUBJECT: Token subject is missing.");
  }

  // Find canonical user by email or username
  const user = await findUserByEmailOrUsername(tokenSub);

  if (!user || user.role !== "admin") {
    throw new Error("FORBIDDEN_INSUFFICIENT_PRIVILEGES: Administrator privileges required.");
  }

  // If emailCookie is present, verify identity match
  if (emailCookie) {
    const cookieVal = emailCookie.toLowerCase().trim();
    const userEmail = (user.email || "").toLowerCase().trim();
    const userName = (user.username || "").toLowerCase().trim();

    if (cookieVal !== userEmail && cookieVal !== userName && cookieVal !== tokenSub) {
      throw new Error("UNAUTHORIZED_IDENTITY_MISMATCH: Cookie identity does not match authenticated token subject.");
    }
  }

  return { email: user.email || user.username, role: user.role };
}
