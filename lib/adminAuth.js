import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "memory_jar_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 8;

function adminSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    "memory-jar-dev-secret-change-me"
  );
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ""));
  const right = Buffer.from(String(b ?? ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export function verifyAdminCredentials(email, password) {
  if (!adminConfigured()) return false;
  const expectedEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const givenEmail = String(email || "")
    .trim()
    .toLowerCase();
  return (
    safeEqual(givenEmail, expectedEmail) &&
    safeEqual(password || "", process.env.ADMIN_PASSWORD)
  );
}

export function createAdminToken() {
  const exp = Date.now() + ADMIN_MAX_AGE * 1000;
  const payload = `admin:${exp}`;
  const sig = crypto
    .createHmac("sha256", adminSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", adminSecret())
    .update(payload)
    .digest("hex");
  if (!safeEqual(sig, expected)) return false;
  const [, exp] = payload.split(":");
  if (!exp || Date.now() > Number(exp)) return false;
  return true;
}

export async function isAdminRequest() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token);
}

export function adminUnauthorized() {
  return { error: "Unauthorized" };
}
