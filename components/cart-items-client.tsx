"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type Item = {
  id: string;
  quantity: number;
  product: { name: string; price: number };
};

export function CartItemsClient({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { push } = useToast();

  const onRemove = async () => {
    if (!selectedId) return;
    setLoading(true);
    const res = await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId: selectedId })
    });
    setLoading(false);
    setSelectedId(null);

    if (!res.ok) {
      push("Remove failed");
      return;
    }

    push("Item removed");
    router.refresh();
  };

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-slate-500">
                Qty: {item.quantity} x ${item.product.price.toFixed(2)}
              </p>
            </div>
            <Button variant="ghost" disabled={loading} onClick={() => setSelectedId(item.id)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Modal
        open={Boolean(selectedId)}
        title="Remove item"
        description="Are you sure you want to remove this item from your cart?"
        onClose={() => setSelectedId(null)}
        onConfirm={onRemove}
      />
    </>
  );
}
