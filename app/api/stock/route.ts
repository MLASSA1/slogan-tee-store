import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { inventory } from "../../../db/schema";
import { getProduct } from "../../store-data";
import { badRequest, json, serverError } from "../../server/http";
import { variantKey } from "../../lib/pricing";

/**
 * Availability for one product, keyed by "productId::colour::size", so the
 * product page can grey out sizes that are sold out.
 */
export async function GET(request: Request) {
  try {
    const productId = new URL(request.url).searchParams.get("productId") ?? "";
    if (!getProduct(productId)) return badRequest("Unknown product.");

    const rows = await (await getDb())
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId));

    const stock: Record<string, number> = {};
    for (const row of rows) {
      stock[
        variantKey({
          productId: row.productId,
          colour: row.colour,
          size: row.size,
        })
      ] = row.stock;
    }

    return json({ productId, stock });
  } catch (error) {
    return serverError(error);
  }
}
