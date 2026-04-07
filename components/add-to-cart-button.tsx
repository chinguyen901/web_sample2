"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { push } = useToast();

  const onAdd = async () => {
    setLoading(true);
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      push("Could not add to cart", data.error || "Please sign in first.");
      return;
    }

    push("Added to cart", "Item was added to your cart.");
    router.refresh();
  };

  return (
    <Button onClick={onAdd} disabled={loading} className="w-full">
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
