import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Settings — SLOGAN TEE",
  description:
    "Review and clear the essential browser storage used by the SLOGAN TEE shopping bag.",
};

export default function CookiesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
