import { requireAdmin } from "../../../server/admin-auth";
import {
  listOrders,
  orderCounts,
  revenueTotal,
  updateOrderStatus,
} from "../../../server/admin-data";
import { badRequest, json, readJson, serverError } from "../../../server/http";
import { isOrderStatus } from "../../../lib/pricing";

export async function GET(request: Request) {
  return requireAdmin(request, async () => {
    try {
      const status = new URL(request.url).searchParams.get("status") ?? "";
      const [ordersList, counts, revenue] = await Promise.all([
        listOrders({ status }),
        orderCounts(),
        revenueTotal(),
      ]);

      return json({ orders: ordersList, counts, revenue });
    } catch (error) {
      return serverError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return requireAdmin(request, async () => {
    try {
      const body = await readJson(request);
      const orderId = Number(body.orderId);
      if (!Number.isInteger(orderId)) return badRequest("Unknown order.");
      if (!isOrderStatus(body.status)) return badRequest("Unknown status.");

      const result = await updateOrderStatus(
        orderId,
        body.status,
        typeof body.note === "string" ? body.note : undefined,
      );
      if (result.error) return badRequest(result.error);

      return json({ ok: true });
    } catch (error) {
      return serverError(error);
    }
  });
}
