import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { validateName, validateEmail, validateMessage } from "@/lib/validation";

const resend = new Resend(process.env.RESEND_API_KEY);

const rl = new Map<string, { count: number; resetAt: number }>();
function allow(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now > e.resetAt) { rl.set(ip, { count: 3, resetAt: now + 60_000 }); return true; }
  if (e.count <= 0) return false;
  e.count--;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allow(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let name: string, email: string, message: string;
  try {
    const body = await req.json();
    name = String(body.name ?? "").trim().slice(0, 100);
    email = String(body.email ?? "").trim().slice(0, 254);
    message = String(body.message ?? "").trim().slice(0, 2000);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const nameCheck = validateName(name);
  if (!nameCheck.ok) return NextResponse.json({ error: nameCheck.error }, { status: 400 });
  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.error }, { status: 400 });
  const msgCheck = validateMessage(message);
  if (!msgCheck.ok) return NextResponse.json({ error: msgCheck.error }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Email service not configured" }, { status: 503 });

  const { error } = await resend.emails.send({
    from: "ATTA Logical <noreply@attalogical.com>",
    to: "Boelie@attalogical.com",
    replyTo: email,
    subject: `Enquiry via ATTAlogical — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
