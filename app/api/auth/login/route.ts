import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { setAuthCookie, signAuthToken, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: body.email } });
    if (!user) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

    const ok = await verifyPassword(body.password, user.password);
    if (!ok) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

    await db.activityLog.create({
      data: { userId: user.id, action: "LOGIN", metadata: { email: user.email } }
    });

    const token = signAuthToken({ userId: user.id, email: user.email });
    await setAuthCookie(token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
