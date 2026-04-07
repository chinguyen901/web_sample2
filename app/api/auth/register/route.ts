import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, setAuthCookie, signAuthToken } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const exists = await db.user.findUnique({ where: { email: body.email } });
    if (exists) return NextResponse.json({ error: "Email already used." }, { status: 400 });

    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: await hashPassword(body.password)
      }
    });

    await db.activityLog.create({
      data: { userId: user.id, action: "REGISTER", metadata: { email: user.email } }
    });

    const token = signAuthToken({ userId: user.id, email: user.email });
    await setAuthCookie(token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
