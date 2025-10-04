import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";

export async function isAdminAuthenticated() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = process.env.ADMIN_SESSION_SECRET || "change-me";
  const expected = crypto
    .createHmac("sha256", secret)
    .update("admin")
    .digest("hex");
  return token === expected;
}

export async function setAdminSession() {
  const store = await cookies();
  const secret = process.env.ADMIN_SESSION_SECRET || "change-me";
  const token = crypto
    .createHmac("sha256", secret)
    .update("admin")
    .digest("hex");
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
