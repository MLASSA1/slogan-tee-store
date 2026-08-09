import { requireAdmin } from "../../../server/admin-auth";
import { listInventory, setStock } from "../../../server/admin-data";
import { badRequest, json, readJson, serverError } from "../../../server/http";

export async function GET(request: Request) {
  return requireAdmin(request, async () => {
    try {
      return json({ inventory: await listInventory() });
    } catch (error) {
      return serverError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return requireAdmin(request, async () => {
    try {
      const body = await readJson(request);
      const result = await setStock(body);
      if (result.error) return badRequest(result.error);

      return json({ inventory: await listInventory() });
    } catch (error) {
      return serverError(error);
    }
  });
}
