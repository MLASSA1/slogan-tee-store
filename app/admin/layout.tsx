import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Back office — SLOGAN TEE",
  description: "SLOGAN TEE order, stock and discount administration.",
  // The back office must never appear in search results.
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
