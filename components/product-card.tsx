import Link from "next/link";
import { Product } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="group flex h-full flex-col gap-4">
      <Link href={`/product/${product.id}`} className="space-y-2">
        <div className="h-40 rounded-xl bg-gradient-to-br from-rose-100 to-rose-50" />
        <p className="text-xs uppercase tracking-wide text-brand">{product.category}</p>
        <h3 className="line-clamp-1 text-base font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
      </Link>
      <div className="mt-auto space-y-3">
        <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
        <AddToCartButton productId={product.id} />
      </div>
    </Card>
  );
}
