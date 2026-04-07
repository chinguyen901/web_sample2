import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/profile");

  return (
    <Card className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-sm text-slate-600">
        Complete secure payment via Stripe test mode.
      </p>
      <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
        Use test card: 4242 4242 4242 4242, any future date, any CVC, any ZIP.
      </p>
      <form action="/api/checkout" method="POST">
        <Button type="submit" className="w-full">
          Pay with Stripe
        </Button>
      </form>
    </Card>
  );
}
