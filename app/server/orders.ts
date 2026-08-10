import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { inventory, orderItems, orders } from "../../db/schema";
import {
  deliveryFeeFor,
  isAgadirAddress,
  isDeliveryMethod,
  type DeliveryMethod,
} from "../lib/pricing";
import type { OrderConfirmation } from "../lib/cart-types";
import { clearCart, loadCart } from "./cart";
import { checkDiscount, normalizeCode, recordDiscountUse } from "./discounts";

export type CustomerDetails = {
  fullName: string;
  telephone: string;
  city: string;
  address: string;
  deliveryMethod: DeliveryMethod;
  discountCode: string;
};

export type PlaceOrderResult =
  | { ok: true; order: OrderConfirmation }
  | { ok: false; message: string };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Moroccan mobile and landline numbers, with or without the +212 prefix. */
function isPlausiblePhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export function parseCustomerDetails(
  input: Record<string, unknown>,
): { ok: true; details: CustomerDetails } | { ok: false; message: string } {
  const fullName = text(input.fullName, 120);
  const telephone = text(input.telephone, 40);
  const city = text(input.city, 80);
  const address = text(input.address, 400);
  const deliveryMethod = input.deliveryMethod;

  if (fullName.length < 2) return { ok: false, message: "Enter your full name." };
  if (!isPlausiblePhone(telephone)) {
    return { ok: false, message: "Enter a valid telephone number." };
  }
  if (city.length < 2) return { ok: false, message: "Enter your city." };
  if (address.length < 8) {
    return { ok: false, message: "Enter a full delivery address." };
  }
  if (!isDeliveryMethod(deliveryMethod)) {
    return { ok: false, message: "Choose a delivery method." };
  }
  if (deliveryMethod === "agadir" && !isAgadirAddress(city)) {
    return {
      ok: false,
      message: "Agadir local delivery is available only for Agadir addresses.",
    };
  }

  return {
    ok: true,
    details: {
      fullName,
      telephone,
      city,
      address,
      deliveryMethod,
      discountCode: normalizeCode(input.discountCode),
    },
  };
}

/** ST-YYMMDD-XXXX. Readable on a courier label and unique enough in practice. */
function buildReference() {
  const now = new Date();
  const stamp = [
    String(now.getUTCFullYear()).slice(2),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `ST-${stamp}-${random}`;
}

/**
 * Places an order.
 *
 * The order is the record. It lands in the database and the shop works it from
 * the back office — customer details are never pushed out to a third-party
 * messaging app.
 *
 * Everything the browser sent about prices is ignored: the bag is re-read from
 * the database, priced from the catalogue, and the discount is re-validated.
 * Stock is taken with a conditional update per line, so two customers racing
 * for the last unit cannot both win — the loser's decrement matches no row and
 * the whole attempt is rolled back by hand.
 */
export async function placeOrder(
  cartId: string,
  details: CustomerDetails,
): Promise<PlaceOrderResult> {
  const db = await getDb();
  const cart = await loadCart(cartId);

  if (!cart.items.length) return { ok: false, message: "Your bag is empty." };

  const subtotal = cart.subtotal;
  let discountAmount = 0;
  let discountCode: string | null = null;

  if (details.discountCode) {
    const check = await checkDiscount(details.discountCode, subtotal);
    if (!check.ok) return { ok: false, message: check.message };
    discountAmount = check.discount.amount;
    discountCode = check.discount.code;
  }

  const subtotalAfterDiscount = subtotal - discountAmount;
  const deliveryFee = deliveryFeeFor({
    subtotalAfterDiscount,
    city: details.city,
    deliveryMethod: details.deliveryMethod,
  });
  const total = subtotalAfterDiscount + deliveryFee;

  // Take stock line by line, remembering what succeeded so a later failure can
  // be undone. D1 has no interactive transaction to lean on here.
  const taken: { productId: string; colour: string; size: string; quantity: number }[] =
    [];

  for (const item of cart.items) {
    // RETURNING tells us whether the guarded row actually matched, without
    // depending on driver-specific "rows changed" metadata.
    const updated = await db
      .update(inventory)
      .set({
        stock: sql`${inventory.stock} - ${item.quantity}`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(inventory.productId, item.productId),
          eq(inventory.colour, item.colour),
          eq(inventory.size, item.size),
          sql`${inventory.stock} >= ${item.quantity}`,
        ),
      )
      .returning({ stock: inventory.stock });

    if (!updated.length) {
      await releaseStock(taken);
      return {
        ok: false,
        message: `${item.name} in ${item.colour}, size ${item.size} is no longer available in that quantity.`,
      };
    }

    taken.push({
      productId: item.productId,
      colour: item.colour,
      size: item.size,
      quantity: item.quantity,
    });
  }

  const reference = buildReference();

  try {
    const [order] = await db
      .insert(orders)
      .values({
        reference,
        fullName: details.fullName,
        telephone: details.telephone,
        city: details.city,
        address: details.address,
        deliveryMethod: details.deliveryMethod,
        subtotal,
        deliveryFee,
        discountCode,
        discountAmount,
        total,
        paymentMethod: "cod",
        status: "new",
      })
      .returning({ id: orders.id });

    await db.insert(orderItems).values(
      cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        colour: item.colour,
        size: item.size,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    );
  } catch (error) {
    await releaseStock(taken);
    throw error;
  }

  if (discountCode) await recordDiscountUse(discountCode);
  await clearCart(cartId);

  return { ok: true, order: { reference, total } };
}

async function releaseStock(
  taken: { productId: string; colour: string; size: string; quantity: number }[],
) {
  const db = await getDb();
  for (const entry of taken) {
    await db
      .update(inventory)
      .set({ stock: sql`${inventory.stock} + ${entry.quantity}` })
      .where(
        and(
          eq(inventory.productId, entry.productId),
          eq(inventory.colour, entry.colour),
          eq(inventory.size, entry.size),
        ),
      );
  }
}

