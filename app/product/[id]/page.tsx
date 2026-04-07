import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="h-80 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50" />
      <div className="space-y-5">
        <p className="text-xs uppercase tracking-wider text-brand">{product.category}</p>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-slate-600">{product.description}</p>
        <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
        <AddToCartButton productId={product.id} />
      </div>
    </div>
  );
}
