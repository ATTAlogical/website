import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit map. Works per-instance (serverless: effective per warm container).
const rl = new Map<string, { count: number; resetAt: number }>();
const RL_MAX = 20;
const RL_WINDOW = 60_000;

function allow(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now > e.resetAt) { rl.set(ip, { count: 1, resetAt: now + RL_WINDOW }); return true; }
  if (e.count >= RL_MAX) return false;
  e.count++;
  return true;
}

setInterval(() => { const now = Date.now(); rl.forEach((e, k) => { if (now > e.resetAt) rl.delete(k); }); }, 300_000);

const VALID_ROUTES = [
  "section:work",
  "section:contact",
  "href:/subscriptions#plans",
  "href:/catalogue",
] as const;

const SYSTEM = `You are a chip resolver for a creative portfolio website called ATTA Logical (owner: Boelie van Camp — software developer, musician, visual artist).
Given a search query, pick the best destination and invent a short label for the chip.

Available routes:
- "section:work"         — work experience, CV, resume, career, jobs, skills, internship, what have you done, history
- "section:contact"      — contact, email, hire, collaborate, reach out, message, DM, socials, commission, let's talk, booking
- "href:/subscriptions#plans"  — pricing, plans, tiers, packages, services, subscribe, rates, costs, membership, fees
- "href:/catalogue"      — projects, portfolio, previous work, examples, case studies, showcase, what have you built, demos, all work, browse, gallery

Rules:
- Invent a short label (1–3 words, title case). Style: distilled, technical, editorial — like a system tag or a concept node, not a menu item or call-to-action phrase. Prefer terse nouns and noun compounds over verb phrases. Good examples: "Signal", "Build Index", "Rate Card", "Work Log", "Construct", "Open Channel", "Field Record", "Stack", "Output", "Dispatch". Bad examples: "Get In Touch", "Other Websites", "See My Work", "Work History", "Full Catalogue".
- Never use "ATTA" or "ATTA Logical" in the label. If the query is about the brand itself, use "Logical".
- Pick the ONE best route. If truly nothing fits, return null for both fields.
- Be lenient with typos and partial matches.
- Respond ONLY with valid JSON: {"label":"...","route":"..."} or {"label":null,"route":null}
- No explanation, no markdown, only the JSON object`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allow(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let query: string;
  try {
    const body = await req.json();
    query = String(body.query ?? "").trim().slice(0, 200);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!query) return NextResponse.json({ label: null });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ label: null });

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 48,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return NextResponse.json({ label: null });

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");

    const rawLabel =
      typeof raw.label === "string" && raw.label.length > 0 && raw.label.length <= 60
        ? raw.label.trim()
        : null;
    const label = rawLabel ?? null;
    const route = (VALID_ROUTES as readonly string[]).includes(raw.route) ? raw.route as string : null;

    if (!label || !route) return NextResponse.json({ label: null });

    const href = route.startsWith("href:") ? route.slice(5) : undefined;
    const section = route.startsWith("section:") ? route.slice(8) : undefined;

    return NextResponse.json({ label, ...(href ? { href } : {}), ...(section ? { section } : {}) });
  } catch {
    return NextResponse.json({ label: null });
  }
}
