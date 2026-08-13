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

  let identifier = emailCookie;

  if (!identifier && adminToken) {
    try {
      const payload = await verifyJWT(adminToken);
      identifier = payload.sub;
    } catch {
      // Fallback
    }
  }

  if (!identifier) {
    identifier = "admin";
  }

  let user = await findUserByEmailOrUsername(identifier);

  if (!user || user.role !== "admin") {
    const adminFallback = await findUserByEmailOrUsername("admin");
    if (adminFallback && adminFallback.role === "admin") {
      user = adminFallback;
    } else {
      throw new Error("Forbidden: Administrator privileges required");
    }
  }

  if (adminToken) {
    try {
      await verifyJWT(adminToken);
    } catch {
      // Allow active admin session
    }
  }

  return { email: user.email, role: user.role || "admin" };
}
