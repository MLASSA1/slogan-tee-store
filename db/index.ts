import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * `cloudflare:workers` only exists inside workerd. Importing it at module scope
 * makes the built Worker impossible to import from plain Node, which is exactly
 * how `scripts/validate-artifact.sh` smoke-tests the deploy artifact. Resolving
 * the module lazily keeps that check working while routes still get the real
 * binding at runtime.
 */
let envPromise: Promise<Record<string, unknown>> | null = null;

export function getWorkerEnv(): Promise<Record<string, unknown>> {
  if (!envPromise) {
    envPromise = import("cloudflare:workers").then(
      (module) => module.env as unknown as Record<string, unknown>,
    );
  }
  return envPromise;
}

export async function getDb() {
  const env = await getWorkerEnv();

  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB as Parameters<typeof drizzle>[0], { schema });
}
