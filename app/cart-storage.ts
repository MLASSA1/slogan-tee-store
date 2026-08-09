"use client";

import { useEffect, useSyncExternalStore } from "react";
import { EMPTY_CART, type CartPayload } from "./lib/cart-types";

/**
 * Client-side view of the server bag.
 *
 * The bag itself lives in D1 behind an httpOnly cookie — this module only
 * mirrors it, so every component sees the same totals without prop-drilling or
 * a context provider. Prices are whatever the server says they are; nothing
 * here computes money.
 */

const LEGACY_KEY = "slogan-tee-bag";

/** `ready` is false until the first response arrives, so the checkout screen
 * can tell "empty bag" apart from "not loaded yet". */
export type CartState = CartPayload & { ready: boolean };

const INITIAL_STATE: CartState = { ...EMPTY_CART, ready: false };

let snapshot: CartState = INITIAL_STATE;
let inFlight: Promise<CartPayload> | null = null;
let hasLoaded = false;

const listeners = new Set<() => void>();

function publish(next: CartPayload) {
  snapshot = { ...next, ready: true };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

/** The server renders an empty bag; the real one arrives after hydration. */
function getServerSnapshot() {
  return INITIAL_STATE;
}

async function call(body?: Record<string, unknown>): Promise<CartPayload> {
  const response = await fetch("/api/cart", {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  const data = (await response.json().catch(() => null)) as
    | (CartPayload & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(data?.error || "Could not update your bag.");
  }

  const next: CartPayload = {
    items: data?.items ?? [],
    count: data?.count ?? 0,
    subtotal: data?.subtotal ?? 0,
    hasStockIssue: data?.hasStockIssue ?? false,
  };
  publish(next);
  return next;
}

/**
 * Hands any bag built before the server cart existed to the API, once. Failures
 * are swallowed deliberately: a lost legacy bag must never block the shop.
 */
async function importLegacyBag() {
  if (typeof window === "undefined") return;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as {
      product?: { id?: string };
      size?: string;
      colour?: string;
      quantity?: number;
    }[];

    const items = (Array.isArray(parsed) ? parsed : [])
      .map((item) => ({
        productId: item.product?.id,
        colour: item.colour,
        size: item.size,
        quantity: item.quantity,
      }))
      .filter((item) => item.productId && item.colour && item.size);

    if (items.length) await call({ action: "merge", items });
  } catch {
    // Corrupt legacy payload — drop it below and move on.
  }

  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Storage is unavailable; nothing further to clean up.
  }
}

/** Loads the bag once per page session. Repeat callers share one request. */
export function loadCart(): Promise<CartPayload> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    if (!hasLoaded) {
      hasLoaded = true;
      await importLegacyBag();
    }
    return call();
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export function refreshCart() {
  return call();
}

export function addToBag(item: {
  productId: string;
  colour: string;
  size: string;
  quantity?: number;
}) {
  return call({ action: "add", ...item });
}

export function setBagQuantity(item: {
  productId: string;
  colour: string;
  size: string;
  quantity: number;
}) {
  return call({ action: "setQuantity", ...item });
}

export function changeBagVariant(item: {
  productId: string;
  colour: string;
  size: string;
  toColour?: string;
  toSize?: string;
}) {
  return call({ action: "changeVariant", ...item });
}

export function clearBag() {
  return call({ action: "clear" });
}

/** Subscribes a component to the bag and triggers the initial load. */
export function useCart() {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    loadCart().catch(() => {
      // The bag stays empty on screen; actions surface their own errors.
    });
  }, []);

  return cart;
}
