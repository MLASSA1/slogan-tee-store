import { requireAdmin } from "../../../server/admin-auth";
import { json, readJson, serverError } from "../../../server/http";
import {
  applyMigrations,
  seedDiscountCodes,
  seedInventory,
} from "../../../server/setup";

/**
 * Creates the tables and seeds baseline rows. Idempotent, so it is safe to run
 * again after adding a migration or a new product.
 */
export async function POST(request: Request) {
  return requireAdmin(request, async () => {
    try {
      const body = await readJson(request);
      const defaultStock = Number(body.defaultStock);

      const migrations = await applyMigrations();
      const stock = await seedInventory(
        Number.isFinite(defaultStock) && defaultStock >= 0
          ? Math.floor(defaultStock)
          : undefined,
      );
      const discounts = await seedDiscountCodes();

      return json({ migrations, stock, discounts });
    } catch (error) {
      return serverError(error);
    }
  });
}
