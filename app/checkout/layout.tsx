import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — SLOGAN TEE",
  description:
    "Complete a SLOGAN TEE cash-on-delivery order for delivery in Morocco.",
};

export default function CheckoutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
