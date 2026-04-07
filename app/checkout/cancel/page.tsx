import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CancelPage() {
  return (
    <Card className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="text-2xl font-bold">Payment Cancelled</h1>
      <p className="text-slate-600">No charge was made. You can return to checkout any time.</p>
      <Link href="/cart">
        <Button>Back to Cart</Button>
      </Link>
    </Card>
  );
}
