import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { discountCodes } from "../../db/schema";
import { discountAmountFor } from "../lib/pricing";
import type { DiscountPayload } from "../lib/cart-types";

export type DiscountCheck =
  | { ok: true; discount: DiscountPayload }
  | { ok: false; message: string };

export function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

/**
 * Validates a code against a subtotal. Every failure returns the same shape so
 * the checkout screen can show one message, and the checkout endpoint runs this
 * again at order time — a code that expires between typing and confirming is
 * rejected.
 */
export async function checkDiscount(
  rawCode: unknown,
  subtotal: number,
): Promise<DiscountCheck> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, message: "Enter a code first." };

  const [row] = await (await getDb())
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, code))
    .limit(1);

  if (!row || !row.active) {
    return { ok: false, message: "That code is not recognised." };
  }
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
    return { ok: false, message: "That code has expired." };
  }
  if (row.maxUses !== null && row.usedCount >= row.maxUses) {
    return { ok: false, message: "That code has reached its usage limit." };
  }
  if (subtotal < row.minSubtotal) {
    return {
      ok: false,
      message: `This code applies from ${row.minSubtotal} MAD.`,
    };
  }

  const amount = discountAmountFor({
    kind: row.kind,
    value: row.value,
    subtotal,
  });
  if (amount <= 0) {
    return { ok: false, message: "That code does not apply to this bag." };
  }

  return {
    ok: true,
    discount: {
      code: row.code,
      amount,
      label:
        row.kind === "percent" ? `${row.value}% off` : `${row.value} MAD off`,
    },
  };
}

export async function recordDiscountUse(code: string) {
  const db = await getDb();
  const [row] = await db
    .select({ usedCount: discountCodes.usedCount })
    .from(discountCodes)
    .where(eq(discountCodes.code, code))
    .limit(1);
  if (!row) return;

  await db
    .update(discountCodes)
    .set({ usedCount: row.usedCount + 1 })
    .where(eq(discountCodes.code, code));
}
