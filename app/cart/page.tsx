import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CartItemsClient } from "@/components/cart-items-client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/profile");

  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true }
  });

  const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <p className="mt-2 text-sm text-slate-500">{items.length} item(s)</p>
        <div className="mt-5">
          <CartItemsClient items={items} />
        </div>
      </Card>

      <Card className="h-fit space-y-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Shipping</span>
          <span>Free</span>
        </div>
        <div className="h-px bg-slate-200" />
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <Link href="/checkout">
          <Button className="w-full">Proceed to Checkout</Button>
        </Link>
      </Card>
    </div>
  );
}
