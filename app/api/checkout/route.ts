import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

function getBaseUrl(req: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const baseUrl = getBaseUrl(req);

  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true }
  });

  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    payment_method_types: ["card"],
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.product.price * 100),
        product_data: {
          name: item.product.name,
          description: item.product.description
        }
      }
    })),
    success_url: `${baseUrl}/checkout/success`,
    cancel_url: `${baseUrl}/checkout/cancel`,
    metadata: { userId: user.id }
  });

  await db.order.create({
    data: {
      userId: user.id,
      stripeSessionId: session.id,
      status: "PENDING",
      total: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price
        }))
      }
    }
  });

  await db.cartItem.deleteMany({ where: { userId: user.id } });

  return NextResponse.redirect(
    session.url || `${baseUrl}/checkout/cancel`,
    { status: 303 }
  );
}
