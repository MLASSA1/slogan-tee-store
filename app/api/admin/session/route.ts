import {
  adminPasswordConfigured,
  clearAdminSessionCookie,
  createAdminSessionCookie,
  isAdminRequest,
  verifyAdminPassword,
} from "../../../server/admin-auth";
import { json, readJson, serverError } from "../../../server/http";

export async function GET(request: Request) {
  return json({
    configured: await adminPasswordConfigured(),
    signedIn: await isAdminRequest(request),
  });
}

export async function POST(request: Request) {
  try {
    if (!(await adminPasswordConfigured())) {
      return json(
        {
          error:
            "ADMIN_PASSWORD is not set. Add it to .dev.vars locally, or as a secret in production.",
        },
        { status: 503 },
      );
    }

    const body = await readJson(request);
    if (!(await verifyAdminPassword(body.password))) {
      return json({ error: "Incorrect password." }, { status: 401 });
    }

    return json(
      { signedIn: true },
      { headers: { "set-cookie": await createAdminSessionCookie(request) } },
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  return json(
    { signedIn: false },
    { headers: { "set-cookie": clearAdminSessionCookie(request) } },
  );
}
