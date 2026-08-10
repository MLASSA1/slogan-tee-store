/** Small helpers shared by the route handlers. No framework magic involved. */

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    path?: string;
    sameSite?: "Strict" | "Lax" | "None";
    secure?: boolean;
  } = {},
) {
  const {
    maxAge,
    httpOnly = true,
    path = "/",
    sameSite = "Lax",
    secure = true,
  } = options;

  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`];
  if (typeof maxAge === "number") parts.push(`Max-Age=${maxAge}`);
  if (httpOnly) parts.push("HttpOnly");
  parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

/**
 * `Secure` cookies are dropped by browsers on plain-http origins, which is how
 * the site is served during local development.
 */
export function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === "https:";
}

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers ?? {}),
    },
  });
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail =
    error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : "";

  if (`${message}\n${detail}`.includes("no such table")) {
    return json(
      {
        error:
          "The store database is not migrated yet. Run `npm run db:migrate:local` for local development, or deploy so the platform applies drizzle/ to the real D1 database.",
      },
      { status: 500 },
    );
  }

  return json({ error: message }, { status: 500 });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
