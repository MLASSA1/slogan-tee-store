import { loadCart, readCartId } from "../../server/cart";
import { checkDiscount } from "../../server/discounts";
import { json, readJson, serverError } from "../../server/http";

/**
 * Live feedback for the discount field. The subtotal is taken from the server
 * cart, not from the request, and the code is validated again when the order is
 * placed — this endpoint is a convenience, not an authorisation.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const cart = await loadCart(readCartId(request));
    const result = await checkDiscount(body.code, cart.subtotal);

    if (!result.ok) {
      return json({ valid: false, message: result.message }, { status: 200 });
    }

    return json({ valid: true, discount: result.discount });
  } catch (error) {
    return serverError(error);
  }
}
