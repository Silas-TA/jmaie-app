import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { createSession, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/auth";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password) return NextResponse.json({ error: "Enter your password" }, { status: 400 });

  const hash = process.env.APP_PASSWORD_HASH;
  const plain = process.env.APP_PASSWORD;
  let ok = false;
  if (hash) ok = await bcrypt.compare(password, hash);
  else if (plain) ok = safeEqual(password, plain);

  if (!ok) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
  return res;
}
