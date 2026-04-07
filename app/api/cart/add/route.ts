import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1)
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const existing = await db.cartItem.findFirst({
      where: { userId: user.id, productId: body.productId }
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + body.quantity }
      });
    } else {
      await db.cartItem.create({
        data: { userId: user.id, productId: body.productId, quantity: body.quantity }
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
