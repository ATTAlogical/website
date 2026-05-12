import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, AUTH_COOKIE, AUTH_MAX_AGE } from "@/lib/auth";

// Rate limit — per-instance, in-memory. Good enough for serverless cold containers.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW = 5 * 60_000;

function allow(ip: string): boolean {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now > e.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (e.count >= MAX_ATTEMPTS) return false;
  e.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  let password: string;
  try {
    const body = await req.json();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!password || password.length > 200) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // DEBUG — remove once login works
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  console.log("[auth/login] env hash present:", !!envHash);
  console.log("[auth/login] env hash prefix :", envHash ? envHash.slice(0, 24) : "(missing)");
  console.log("[auth/login] env hash length :", envHash?.length ?? 0);
  console.log("[auth/login] password length :", password.length);

  if (!envHash) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(password, envHash);
  } catch (e) {
    console.error("[auth/login] bcrypt threw:", e);
  }
  console.log("[auth/login] bcrypt result   :", ok);

  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await signSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}
