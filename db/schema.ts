import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Money is stored as whole MAD. Every price in the catalogue is a round dirham
 * amount, so there is nothing to gain from minor units here.
 *
 * The product catalogue itself stays in `app/store-data.ts` — it is brand
 * content, not data the shop mutates. The database owns the things that change
 * at runtime: stock, bags, discount codes and orders.
 */

/** One row per sellable variant: a product in a colour and a size. */
export const inventory = sqliteTable(
  "inventory",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: text("product_id").notNull(),
    colour: text("colour").notNull(),
    size: text("size").notNull(),
    stock: integer("stock").notNull().default(0),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("inventory_variant_idx").on(
      table.productId,
      table.colour,
      table.size,
    ),
  ],
);

/** A shopping bag, keyed by an opaque id held in an httpOnly cookie. */
export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    colour: text("colour").notNull(),
    size: text("size").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("cart_items_variant_idx").on(
      table.cartId,
      table.productId,
      table.colour,
      table.size,
    ),
  ],
);

/**
 * `kind` is "percent" (value = 0–100) or "fixed" (value = MAD off the
 * subtotal). A discount never reduces the total below zero and never applies
 * to the delivery fee.
 */
export const discountCodes = sqliteTable("discount_codes", {
  code: text("code").primaryKey(),
  kind: text("kind").notNull().default("percent"),
  value: integer("value").notNull(),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: integer("active").notNull().default(1),
  expiresAt: text("expires_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Orders are written before the WhatsApp handoff, so an abandoned confirmation
 * still leaves a record the shop can chase. `status` starts at "new".
 */
export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reference: text("reference").notNull().unique(),
    fullName: text("full_name").notNull(),
    telephone: text("telephone").notNull(),
    city: text("city").notNull(),
    address: text("address").notNull(),
    deliveryMethod: text("delivery_method").notNull().default("courier"),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    discountCode: text("discount_code"),
    discountAmount: integer("discount_amount").notNull().default(0),
    total: integer("total").notNull(),
    paymentMethod: text("payment_method").notNull().default("cod"),
    status: text("status").notNull().default("new"),
    note: text("note").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ],
);

/**
 * Line items copy the name and unit price at the time of sale. A later price
 * change in the catalogue must not rewrite the history of an order.
 */
export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    productName: text("product_name").notNull(),
    colour: text("colour").notNull(),
    size: text("size").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export type InventoryRow = typeof inventory.$inferSelect;
export type CartItemRow = typeof cartItems.$inferSelect;
export type DiscountCodeRow = typeof discountCodes.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
