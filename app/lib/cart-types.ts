/** Wire format shared by the cart route handlers and the client components. */

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  colour: string;
  size: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Units left in stock for this variant, before this bag is accounted for. */
  stock: number;
  /** False when the bag holds more of this variant than the shop can ship. */
  available: boolean;
};

export type CartPayload = {
  items: CartLine[];
  count: number;
  subtotal: number;
  /** True when at least one line exceeds available stock. */
  hasStockIssue: boolean;
};

export const EMPTY_CART: CartPayload = {
  items: [],
  count: 0,
  subtotal: 0,
  hasStockIssue: false,
};

export type DiscountPayload = {
  code: string;
  amount: number;
  label: string;
};

export type OrderConfirmation = {
  reference: string;
  total: number;
};
