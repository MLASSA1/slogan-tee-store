import { products, type CartItem } from "./store-data";

const CART_KEY = "slogan-tee-bag";

export function normalizeCart(items: CartItem[]) {
  return items.reduce<CartItem[]>((normalized, item) => {
    const quantity = Number.isFinite(item.quantity)
      ? Math.max(0, Math.floor(item.quantity))
      : 0;
    if (!quantity) return normalized;

    const key = `${item.product.id}-${item.size}-${item.colour}`;
    const existing = normalized.find((entry) => entry.key === key);
    if (existing) {
      existing.quantity += quantity;
      return normalized;
    }

    normalized.push({ ...item, key, quantity });
    return normalized;
  }, []);
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(CART_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as CartItem[];
    return normalizeCart(parsed.map((item) => {
      const product =
        products.find((candidate) => candidate.id === item.product.id) ||
        item.product;
      const colour =
        item.colour ||
        product.colourOptions?.[0] ||
        product.colour ||
        "Bone";

      return {
        ...item,
        product,
        colour,
        key: `${product.id}-${item.size}-${colour}`,
      };
    }));
  } catch {
    return [];
  }
}

export function writeCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(normalizeCart(cart)));
  window.dispatchEvent(new Event("slogan-cart-updated"));
}

export function addCartItem(item: CartItem) {
  const current = readCart();
  const existing = current.find((entry) => entry.key === item.key);
  const next = existing
    ? current.map((entry) =>
        entry.key === item.key
          ? { ...entry, quantity: entry.quantity + item.quantity }
          : entry,
      )
    : [...current, item];
  writeCart(next);
  return next;
}
