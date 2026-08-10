import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../db";
import {
  discountCodes,
  inventory,
  orderItems,
  orders,
} from "../../db/schema";
import { getProduct } from "../store-data";
import { isOrderStatus, resolveVariant, type OrderStatus } from "../lib/pricing";

export type AdminOrder = ReturnType<typeof shapeOrder>;

function shapeOrder(
  order: typeof orders.$inferSelect,
  items: (typeof orderItems.$inferSelect)[],
) {
  return { ...order, items };
}

export async function listOrders({
  status,
  limit = 100,
}: { status?: string; limit?: number } = {}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(isOrderStatus(status) ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(Math.min(200, Math.max(1, limit)));

  if (!rows.length) return [];

  const items = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((row) => row.id),
      ),
    );

  const byOrder = new Map<number, (typeof orderItems.$inferSelect)[]>();
  for (const item of items) {
    const bucket = byOrder.get(item.orderId);
    if (bucket) bucket.push(item);
    else byOrder.set(item.orderId, [item]);
  }

  return rows.map((row) => shapeOrder(row, byOrder.get(row.id) ?? []));
}

export async function orderCounts() {
  const rows = await (await getDb())
    .select({ status: orders.status, count: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.status);

  return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}

export async function revenueTotal() {
  const [row] = await (await getDb())
    .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(inArray(orders.status, ["confirmed", "shipped", "delivered"]));

  return Number(row?.total ?? 0);
}

/**
 * Cancelling an order returns its units to stock. Every other transition is a
 * status change only. Re-cancelling is rejected so stock is never credited
 * twice for the same order.
 */
export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  note?: string,
) {
  const db = await getDb();
  const [current] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!current) return { error: "Order not found." };
  if (current.status === status && note === undefined) {
    return { error: null };
  }

  if (status === "cancelled" && current.status !== "cancelled") {
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      await db
        .update(inventory)
        .set({
          stock: sql`${inventory.stock} + ${item.quantity}`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(
          and(
            eq(inventory.productId, item.productId),
            eq(inventory.colour, item.colour),
            eq(inventory.size, item.size),
          ),
        );
    }
  }

  await db
    .update(orders)
    .set({
      status,
      ...(note === undefined ? {} : { note: note.slice(0, 500) }),
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(orders.id, orderId));

  return { error: null };
}

export async function listInventory() {
  const rows = await (await getDb())
    .select()
    .from(inventory)
    .orderBy(inventory.productId, inventory.colour, inventory.size);

  return rows.map((row) => ({
    ...row,
    productName: getProduct(row.productId)?.name ?? row.productId,
  }));
}

export async function setStock(input: {
  productId?: unknown;
  colour?: unknown;
  size?: unknown;
  stock?: unknown;
}) {
  const resolved = resolveVariant({
    productId: input.productId as string,
    colour: input.colour as string,
    size: input.size as string,
  });
  if (!resolved) return { error: "Unknown variant." };

  const stock = Number(input.stock);
  if (!Number.isFinite(stock) || stock < 0 || stock > 100000) {
    return { error: "Stock must be a number between 0 and 100000." };
  }

  await (await getDb())
    .insert(inventory)
    .values({
      productId: resolved.product.id,
      colour: resolved.colour,
      size: resolved.size,
      stock: Math.floor(stock),
    })
    .onConflictDoUpdate({
      target: [inventory.productId, inventory.colour, inventory.size],
      set: { stock: Math.floor(stock), updatedAt: sql`CURRENT_TIMESTAMP` },
    });

  return { error: null };
}

export async function listDiscounts() {
  return (await getDb()).select().from(discountCodes).orderBy(discountCodes.code);
}

export async function upsertDiscount(input: Record<string, unknown>) {
  const code =
    typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9-]{3,24}$/.test(code)) {
    return { error: "Code must be 3–24 characters: A–Z, 0–9 or hyphen." };
  }

  const kind = input.kind === "fixed" ? "fixed" : "percent";
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { error: "Value must be greater than zero." };
  }
  if (kind === "percent" && value > 100) {
    return { error: "A percentage discount cannot exceed 100." };
  }

  const minSubtotal = Math.max(0, Number(input.minSubtotal) || 0);
  const maxUsesRaw = Number(input.maxUses);
  const maxUses =
    Number.isFinite(maxUsesRaw) && maxUsesRaw > 0 ? Math.floor(maxUsesRaw) : null;
  const active = input.active === false ? 0 : 1;

  const values = {
    code,
    kind,
    value: Math.floor(value),
    minSubtotal: Math.floor(minSubtotal),
    maxUses,
    active,
  };

  await (await getDb())
    .insert(discountCodes)
    .values(values)
    .onConflictDoUpdate({
      target: discountCodes.code,
      set: {
        kind: values.kind,
        value: values.value,
        minSubtotal: values.minSubtotal,
        maxUses: values.maxUses,
        active: values.active,
      },
    });

  return { error: null };
}

export async function deleteDiscount(code: unknown) {
  const normalized =
    typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!normalized) return { error: "Unknown code." };

  await (await getDb()).delete(discountCodes).where(eq(discountCodes.code, normalized));
  return { error: null };
}
