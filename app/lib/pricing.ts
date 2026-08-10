import { getProduct, sizes, type Product } from "../store-data";

/**
 * Shared pricing rules. Pure functions with no database or Cloudflare imports,
 * so the checkout screen can render live totals with exactly the same maths the
 * server uses to authorise the order. The server is still the authority — it
 * recomputes every total from the catalogue before an order is written.
 */

export const FREE_DELIVERY_THRESHOLD = 499;
export const COURIER_FEE = 35;
export const DELIVERY_METHODS = ["courier", "agadir"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type VariantRef = {
  productId: string;
  colour: string;
  size: string;
};

export function variantKey({ productId, colour, size }: VariantRef) {
  return `${productId}::${colour}::${size}`;
}

export function isAgadirAddress(city: string) {
  return city.trim().toLowerCase().includes("agadir");
}

export function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return DELIVERY_METHODS.includes(value as DeliveryMethod);
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

/**
 * Agadir is delivered by hand and is always free. Everywhere else pays the
 * courier fee until the bag clears the free-delivery threshold, which is
 * measured *after* any discount so the displayed subtotal always matches the
 * rule the customer is being judged against.
 */
export function deliveryFeeFor({
  subtotalAfterDiscount,
  city,
  deliveryMethod,
}: {
  subtotalAfterDiscount: number;
  city: string;
  deliveryMethod: DeliveryMethod;
}) {
  if (deliveryMethod === "agadir" || isAgadirAddress(city)) return 0;
  return subtotalAfterDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : COURIER_FEE;
}

/**
 * Resolves a requested variant against the catalogue. Returns null when the
 * product, colour or size is not something this shop actually sells, which is
 * how every untrusted request from the browser gets filtered.
 */
export function resolveVariant(
  input: Partial<VariantRef>,
): { product: Product; colour: string; size: string } | null {
  const productId = typeof input.productId === "string" ? input.productId : "";
  const colour = typeof input.colour === "string" ? input.colour : "";
  const size = typeof input.size === "string" ? input.size.toUpperCase() : "";

  const product = getProduct(productId);
  if (!product) return null;
  if (!product.colourOptions.includes(colour)) return null;
  if (!sizes.includes(size)) return null;

  return { product, colour, size };
}

export function clampQuantity(value: unknown, max = 20) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(max, Math.max(0, Math.floor(quantity)));
}

export type DiscountResult = {
  code: string;
  amount: number;
  label: string;
};

/** Applies a validated code to a subtotal. Never returns more than the subtotal. */
export function discountAmountFor({
  kind,
  value,
  subtotal,
}: {
  kind: string;
  value: number;
  subtotal: number;
}) {
  const raw =
    kind === "percent"
      ? Math.floor((subtotal * Math.min(100, Math.max(0, value))) / 100)
      : Math.max(0, value);
  return Math.min(subtotal, raw);
}
