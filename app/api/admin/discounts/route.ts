import { requireAdmin } from "../../../server/admin-auth";
import {
  deleteDiscount,
  listDiscounts,
  upsertDiscount,
} from "../../../server/admin-data";
import { badRequest, json, readJson, serverError } from "../../../server/http";

export async function GET(request: Request) {
  return requireAdmin(request, async () => {
    try {
      return json({ discounts: await listDiscounts() });
    } catch (error) {
      return serverError(error);
    }
  });
}

export async function POST(request: Request) {
  return requireAdmin(request, async () => {
    try {
      const result = await upsertDiscount(await readJson(request));
      if (result.error) return badRequest(result.error);

      return json({ discounts: await listDiscounts() });
    } catch (error) {
      return serverError(error);
    }
  });
}

export async function DELETE(request: Request) {
  return requireAdmin(request, async () => {
    try {
      const body = await readJson(request);
      const result = await deleteDiscount(body.code);
      if (result.error) return badRequest(result.error);

      return json({ discounts: await listDiscounts() });
    } catch (error) {
      return serverError(error);
    }
  });
}
