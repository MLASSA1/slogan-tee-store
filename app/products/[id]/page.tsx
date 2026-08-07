import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "../../components/ProductDetailClient";
import { StoreShell } from "../../components/StoreShell";
import { getProduct, products } from "../../store-data";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "Product — SLOGAN TEE" };
  return {
    title: `${product.name} — SLOGAN TEE`,
    description: `${product.quote}. Premium heavyweight statement T-shirt, made in Morocco.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <StoreShell>
      <ProductDetailClient product={product} />
    </StoreShell>
  );
}
