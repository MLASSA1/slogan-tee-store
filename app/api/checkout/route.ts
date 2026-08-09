import { readCartId } from "../../server/cart";
import { badRequest, json, readJson, serverError } from "../../server/http";
import { parseCustomerDetails, placeOrder } from "../../server/orders";

/**
 * Places a cash-on-delivery order. The order row is written before the customer
 * is handed to WhatsApp, so an unsent confirmation still leaves something the
 * shop can follow up on.
 */
export async function POST(request: Request) {
  try {
    const cartId = readCartId(request);
    if (!cartId) return badRequest("Your bag is empty.");

    const body = await readJson(request);
    const parsed = parseCustomerDetails(body);
    if (!parsed.ok) return badRequest(parsed.message);

    const result = await placeOrder(cartId, parsed.details);
    if (!result.ok) return badRequest(result.message);

    return json(result.order, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
