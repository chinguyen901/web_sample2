import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  return (
    <Card className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="text-2xl font-bold">Payment Successful</h1>
      <p className="text-slate-600">Your order has been confirmed. Thank you for shopping with VNS Store.</p>
      <Link href="/">
        <Button>Continue Shopping</Button>
      </Link>
    </Card>
  );
}
