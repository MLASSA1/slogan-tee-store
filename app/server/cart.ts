import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { cartItems, carts, inventory } from "../../db/schema";
import { getProductImage } from "../store-data";
import {
  clampQuantity,
  resolveVariant,
  variantKey,
  type VariantRef,
} from "../lib/pricing";
import { EMPTY_CART, type CartLine, type CartPayload } from "../lib/cart-types";
import { readCookie, serializeCookie, isSecureRequest } from "./http";

export const CART_COOKIE = "st_bag";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function readCartId(request: Request) {
  return readCookie(request, CART_COOKIE);
}

export function cartCookieHeader(request: Request, cartId: string) {
  return serializeCookie(CART_COOKIE, cartId, {
    maxAge: CART_COOKIE_MAX_AGE,
    secure: isSecureRequest(request),
  });
}

/**
 * Returns the caller's cart id, creating the row on demand. The caller is
 * responsible for setting the cookie when `created` is true.
 */
export async function ensureCart(request: Request) {
  const existing = readCartId(request);
  const db = await getDb();

  if (existing) {
    const [row] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.id, existing))
      .limit(1);
    if (row) return { cartId: row.id, created: false };
  }

  // Either no cookie, or a cookie pointing at a cart that has since been
  // deleted (checked out, or pruned). Start a fresh one.
  const cartId = crypto.randomUUID();
  await db.insert(carts).values({ id: cartId });
  return { cartId, created: true };
}

async function touchCart(cartId: string) {
  await (await getDb())
    .update(carts)
    .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(carts.id, cartId));
}

/**
 * Builds the customer-facing bag. Prices and names come from the catalogue,
 * never from the browser; stock comes from the database. Rows referring to
 * products that no longer exist are dropped silently.
 */
export async function loadCart(cartId: string | null): Promise<CartPayload> {
  if (!cartId) return EMPTY_CART;

  const db = await getDb();
  const rows = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId))
    .orderBy(cartItems.createdAt, cartItems.id);

  if (!rows.length) return EMPTY_CART;

  const productIds = [...new Set(rows.map((row) => row.productId))];
  const stockRows = await db
    .select()
    .from(inventory)
    .where(inArray(inventory.productId, productIds));

  const stockByKey = new Map(
    stockRows.map((row) => [
      variantKey({
        productId: row.productId,
        colour: row.colour,
        size: row.size,
      }),
      row.stock,
    ]),
  );

  const items: CartLine[] = [];
  for (const row of rows) {
    const resolved = resolveVariant(row);
    if (!resolved) continue;

    const { product, colour, size } = resolved;
    const key = variantKey({ productId: product.id, colour, size });
    const stock = stockByKey.get(key) ?? 0;

    items.push({
      key,
      productId: product.id,
      name: product.name,
      colour,
      size,
      image: getProductImage(product, colour),
      unitPrice: product.price,
      quantity: row.quantity,
      lineTotal: product.price * row.quantity,
      stock,
      available: stock >= row.quantity,
    });
  }

  return {
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
    hasStockIssue: items.some((item) => !item.available),
  };
}

export async function addToCart(
  cartId: string,
  input: Partial<VariantRef> & { quantity?: unknown },
) {
  const resolved = resolveVariant(input);
  if (!resolved) return { error: "That product, colour or size is not available." };

  const quantity = clampQuantity(input.quantity ?? 1);
  if (!quantity) return { error: "Choose a quantity of at least one." };

  const { product, colour, size } = resolved;

  await (await getDb())
    .insert(cartItems)
    .values({ cartId, productId: product.id, colour, size, quantity })
    .onConflictDoUpdate({
      target: [
        cartItems.cartId,
        cartItems.productId,
        cartItems.colour,
        cartItems.size,
      ],
      set: { quantity: sql`min(20, ${cartItems.quantity} + ${quantity})` },
    });

  await touchCart(cartId);
  return { error: null };
}

/**
 * Sets an absolute quantity for one line. A quantity of zero removes it.
 * Used by the +/- controls, which must not depend on how many requests are
 * still in flight.
 */
export async function setCartQuantity(
  cartId: string,
  input: Partial<VariantRef> & { quantity?: unknown },
) {
  const resolved = resolveVariant(input);
  if (!resolved) return { error: "That product, colour or size is not available." };

  const { product, colour, size } = resolved;
  const quantity = clampQuantity(input.quantity);
  const db = await getDb();
  const match = and(
    eq(cartItems.cartId, cartId),
    eq(cartItems.productId, product.id),
    eq(cartItems.colour, colour),
    eq(cartItems.size, size),
  );

  if (quantity === 0) {
    await db.delete(cartItems).where(match);
  } else {
    await db.update(cartItems).set({ quantity }).where(match);
  }

  await touchCart(cartId);
  return { error: null };
}

/**
 * Moves a line to a different size or colour. If the target variant is already
 * in the bag the two lines are merged, which is what the unique index on
 * (cart, product, colour, size) would otherwise reject.
 */
export async function changeCartVariant(
  cartId: string,
  from: Partial<VariantRef>,
  to: Partial<VariantRef>,
) {
  const source = resolveVariant(from);
  const target = resolveVariant(to);
  if (!source || !target) {
    return { error: "That product, colour or size is not available." };
  }

  const db = await getDb();
  const sourceMatch = and(
    eq(cartItems.cartId, cartId),
    eq(cartItems.productId, source.product.id),
    eq(cartItems.colour, source.colour),
    eq(cartItems.size, source.size),
  );

  const [current] = await db.select().from(cartItems).where(sourceMatch).limit(1);
  if (!current) return { error: "That item is no longer in your bag." };

  if (
    source.product.id === target.product.id &&
    source.colour === target.colour &&
    source.size === target.size
  ) {
    return { error: null };
  }

  await db.delete(cartItems).where(sourceMatch);
  await db
    .insert(cartItems)
    .values({
      cartId,
      productId: target.product.id,
      colour: target.colour,
      size: target.size,
      quantity: current.quantity,
    })
    .onConflictDoUpdate({
      target: [
        cartItems.cartId,
        cartItems.productId,
        cartItems.colour,
        cartItems.size,
      ],
      set: {
        quantity: sql`min(20, ${cartItems.quantity} + ${current.quantity})`,
      },
    });

  await touchCart(cartId);
  return { error: null };
}

export async function clearCart(cartId: string) {
  await (await getDb()).delete(cartItems).where(eq(cartItems.cartId, cartId));
  await touchCart(cartId);
}

/**
 * One-time import of a bag that was built in localStorage before the server
 * cart existed. Quantities are added to whatever is already on the server.
 */
export async function mergeIntoCart(cartId: string, incoming: unknown) {
  if (!Array.isArray(incoming)) return { merged: 0 };

  let merged = 0;
  for (const entry of incoming.slice(0, 50)) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const result = await addToCart(cartId, {
      productId: item.productId as string,
      colour: item.colour as string,
      size: item.size as string,
      quantity: item.quantity,
    });
    if (!result.error) merged += 1;
  }

  return { merged };
}
