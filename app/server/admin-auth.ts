import { getWorkerEnv } from "../../db";
import { isSecureRequest, readCookie, serializeCookie } from "./http";

/**
 * Admin access is a single shared password held in the `ADMIN_PASSWORD` secret.
 * There is one shop owner, so a user table would be ceremony without benefit.
 *
 * The session cookie carries an expiry and an HMAC over it, signed with
 * `ADMIN_SESSION_SECRET` (falling back to the password). Nothing in the cookie
 * is secret, and nothing in it is trusted without a matching signature.
 */

export const ADMIN_COOKIE = "st_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminEnv = { ADMIN_PASSWORD?: string; ADMIN_SESSION_SECRET?: string };

async function adminEnv(): Promise<AdminEnv> {
  return (await getWorkerEnv()) as AdminEnv;
}

export async function adminPasswordConfigured() {
  return Boolean((await adminEnv()).ADMIN_PASSWORD);
}

async function signingSecret() {
  const { ADMIN_SESSION_SECRET, ADMIN_PASSWORD } = await adminEnv();
  return ADMIN_SESSION_SECRET || ADMIN_PASSWORD || "";
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(await signingSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent, timing-safe string comparison. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function verifyAdminPassword(candidate: unknown) {
  const expected = (await adminEnv()).ADMIN_PASSWORD;
  if (!expected) return false;
  if (typeof candidate !== "string" || !candidate) return false;

  // Hash both sides first so the comparison never leaks the password length.
  const [a, b] = await Promise.all([sign(candidate), sign(expected)]);
  return safeEqual(a, b);
}

export async function createAdminSessionCookie(request: Request) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  const value = `${payload}.${await sign(payload)}`;

  return serializeCookie(ADMIN_COOKIE, value, {
    maxAge: SESSION_TTL_SECONDS,
    secure: isSecureRequest(request),
  });
}

export function clearAdminSessionCookie(request: Request) {
  return serializeCookie(ADMIN_COOKIE, "", {
    maxAge: 0,
    secure: isSecureRequest(request),
  });
}

export async function isAdminRequest(request: Request) {
  if (!(await adminPasswordConfigured())) return false;

  const cookie = readCookie(request, ADMIN_COOKIE);
  if (!cookie) return false;

  const separator = cookie.lastIndexOf(".");
  if (separator === -1) return false;

  const payload = cookie.slice(0, separator);
  const signature = cookie.slice(separator + 1);
  if (!safeEqual(signature, await sign(payload))) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt * 1000 > Date.now();
}

/** Wraps an admin route handler with the session check. */
export async function requireAdmin(
  request: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  if (!(await adminPasswordConfigured())) {
    return Response.json(
      {
        error:
          "ADMIN_PASSWORD is not set. Add it to .dev.vars for local development, or as a secret in production.",
      },
      { status: 503 },
    );
  }
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }
  return handler();
}
