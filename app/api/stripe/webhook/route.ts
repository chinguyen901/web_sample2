import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const rawBody = await req.text();
  const signature = (await headers()).get("stripe-signature");
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !endpointSecret) {
    return NextResponse.json({ error: "Webhook setup incomplete" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await db.order.updateMany({
      where: { stripeSessionId: session.id },
      data: { status: "PAID" }
    });
  }

  return NextResponse.json({ received: true });
}
