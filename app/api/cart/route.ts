import {
  addToCart,
  cartCookieHeader,
  changeCartVariant,
  clearCart,
  ensureCart,
  loadCart,
  mergeIntoCart,
  readCartId,
  setCartQuantity,
} from "../../server/cart";
import { badRequest, json, readJson, serverError } from "../../server/http";
import { EMPTY_CART } from "../../lib/cart-types";

/**
 * The bag lives on the server. The browser only ever names a variant
 * (product, colour, size) and a quantity — prices and stock are decided here.
 */

export async function GET(request: Request) {
  try {
    // Reading a bag must not mint a cart row for every crawler that passes by.
    const cartId = readCartId(request);
    if (!cartId) return json(EMPTY_CART);
    return json(await loadCart(cartId));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const action = typeof body.action === "string" ? body.action : "add";

    const { cartId, created } = await ensureCart(request);

    let result: { error: string | null } = { error: null };
    switch (action) {
      case "add":
        result = await addToCart(cartId, {
          productId: body.productId as string,
          colour: body.colour as string,
          size: body.size as string,
          quantity: body.quantity,
        });
        break;

      case "setQuantity":
        result = await setCartQuantity(cartId, {
          productId: body.productId as string,
          colour: body.colour as string,
          size: body.size as string,
          quantity: body.quantity,
        });
        break;

      case "changeVariant":
        result = await changeCartVariant(
          cartId,
          {
            productId: body.productId as string,
            colour: body.colour as string,
            size: body.size as string,
          },
          {
            productId: body.productId as string,
            colour: (body.toColour ?? body.colour) as string,
            size: (body.toSize ?? body.size) as string,
          },
        );
        break;

      case "merge":
        await mergeIntoCart(cartId, body.items);
        break;

      case "clear":
        await clearCart(cartId);
        break;

      default:
        return badRequest(`Unknown cart action "${action}".`);
    }

    if (result.error) return badRequest(result.error);

    const cart = await loadCart(cartId);
    const headers: Record<string, string> = {};
    if (created) headers["set-cookie"] = cartCookieHeader(request, cartId);

    return json(cart, { headers });
  } catch (error) {
    return serverError(error);
  }
}
