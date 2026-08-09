/// <reference types="vite/client" />
import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { discountCodes, inventory } from "../../db/schema";
import { products, sizes } from "../store-data";

/**
 * Applies the generated Drizzle migrations and seeds baseline rows through the
 * D1 binding itself.
 *
 * In production the hosting platform applies `drizzle/` on deploy, so this is
 * mainly how local development gets its tables — miniflare starts with an empty
 * database and there is no wrangler config file for `wrangler d1 execute` to
 * target. Everything here is idempotent: already-applied statements are
 * skipped, and seeding never overwrites stock the shop has since edited.
 */

const migrationFiles = import.meta.glob("../../drizzle/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const DEFAULT_STOCK = 25;

function isAlreadyAppliedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : "";
  return /already exists|duplicate column/i.test(`${message} ${cause}`);
}

export async function applyMigrations() {
  const db = await getDb();
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const path of Object.keys(migrationFiles).sort()) {
    const statements = migrationFiles[path]
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    let ran = 0;
    for (const statement of statements) {
      try {
        await db.run(sql.raw(statement));
        ran += 1;
      } catch (error) {
        // A table or index from an earlier run is not a failure.
        if (!isAlreadyAppliedError(error)) throw error;
      }
    }

    (ran > 0 ? applied : skipped).push(path.split("/").pop() ?? path);
  }

  return { applied, skipped };
}

/**
 * Creates a row for every catalogue variant that has none yet. Existing rows
 * are left alone so a re-run cannot reset the shop's real stock levels.
 */
export async function seedInventory(defaultStock = DEFAULT_STOCK) {
  const db = await getDb();
  const existing = await db
    .select({
      productId: inventory.productId,
      colour: inventory.colour,
      size: inventory.size,
    })
    .from(inventory);

  const known = new Set(
    existing.map((row) => `${row.productId}::${row.colour}::${row.size}`),
  );

  const missing: (typeof inventory.$inferInsert)[] = [];
  for (const product of products) {
    for (const colour of product.colourOptions) {
      for (const size of sizes) {
        if (known.has(`${product.id}::${colour}::${size}`)) continue;
        missing.push({
          productId: product.id,
          colour,
          size,
          stock: defaultStock,
        });
      }
    }
  }

  // D1 caps bound parameters per statement, so insert in modest chunks.
  for (let index = 0; index < missing.length; index += 20) {
    await db.insert(inventory).values(missing.slice(index, index + 20));
  }

  return { created: missing.length, existing: known.size };
}

/** Two example codes so the discount field has something real to validate. */
export async function seedDiscountCodes() {
  const seeds = [
    { code: "OUTLOUD10", kind: "percent", value: 10, minSubtotal: 0 },
    { code: "AGADIR50", kind: "fixed", value: 50, minSubtotal: 400 },
  ];

  const db = await getDb();
  for (const seed of seeds) {
    await db.insert(discountCodes).values(seed).onConflictDoNothing();
  }

  return { codes: seeds.map((seed) => seed.code) };
}
