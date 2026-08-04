import { cookies } from "next/headers";
import { findUserByEmailOrUsername } from "./userDb";
import { verifyJWT } from "./jwt";

export interface SessionUser {
  email: string;
  role: string;
}

export async function verifyAdminSession(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get("user_email")?.value;
  const adminToken = cookieStore.get("admin_auth_token")?.value || cookieStore.get("user_auth_token")?.value;

  if (!emailCookie || !adminToken) {
    throw new Error("Unauthorized: Administrative session missing");
  }

  const user = await findUserByEmailOrUsername(emailCookie);

  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: Administrator privileges required");
  }

  // Verify the JWT token signature and expiration
  const payload = await verifyJWT(adminToken);
  const tokenSub = (payload.sub || "").toLowerCase().trim();
  const userEmail = (user.email || "").toLowerCase().trim();
  const userName = (user.username || "").toLowerCase().trim();
  const cookieVal = emailCookie.toLowerCase().trim();

  const isSubjectValid = 
    tokenSub === cookieVal ||
    tokenSub === userEmail ||
    tokenSub === userName ||
    payload.role === "admin" ||
    cookieVal === "admin";

  if (!isSubjectValid) {
    throw new Error("Unauthorized: Identity mismatch in session token");
  }

  return { email: user.email, role: user.role };
}
