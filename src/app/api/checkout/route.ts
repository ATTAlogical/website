import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { STORE_PRODUCTS } from "@/data/store";

// Rate limit (per warm container)
const rl = new Map<string, { count: number; resetAt: number }>();
const RL_MAX = 8;
const RL_WINDOW = 60_000;
function allow(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now > e.resetAt) { rl.set(ip, { count: 1, resetAt: now + RL_WINDOW }); return true; }
  if (e.count >= RL_MAX) return false;
  e.count++;
  return true;
}

type CartLine = { slug: string; quantity: number };

function isBuyable(slug: string): boolean {
  const p = STORE_PRODUCTS.find((x) => x.slug === slug);
  if (!p) return false;
  const a = p.availability;
  return a.kind === "in-stock" || a.kind === "made-to-order";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allow(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Checkout not configured" }, { status: 500 });
  }

  let lines: CartLine[];
  try {
    const body = await req.json();
    lines = Array.isArray(body.items) ? body.items : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: "Empty cart" }, { status: 400 });
  }

  // Server-side authoritative pricing — never trust the client's prices.
  const lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        metadata: Record<string, string>;
      };
      unit_amount: number;
    };
    quantity: number;
  }> = [];
  for (const line of lines) {
    const product = STORE_PRODUCTS.find((p) => p.slug === line.slug);
    if (!product) {
      return NextResponse.json({ error: `Unknown product: ${line.slug}` }, { status: 400 });
    }
    if (!isBuyable(product.slug)) {
      return NextResponse.json({ error: `Not available: ${product.name}` }, { status: 400 });
    }
    const qty = Math.max(1, Math.min(99, Math.floor(line.quantity || 1)));

    // For one-of-ones, force qty 1
    const finalQty = product.type === "one-of-one" ? 1 : qty;

    lineItems.push({
      price_data: {
        currency: product.currency.toLowerCase(),
        product_data: {
          name: product.name,
          description: product.description?.slice(0, 500) || undefined,
          metadata: { slug: product.slug, type: product.type },
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: finalQty,
    });
  }

  const stripe = new Stripe(apiKey, { apiVersion: "2026-04-22.dahlia" });

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/laugical/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/laugical/store?checkout=cancelled`,
      shipping_address_collection: {
        allowed_countries: ["NL", "BE", "DE", "FR", "GB", "US", "ES", "IT", "AT", "DK", "SE", "NO", "FI", "IE", "PT", "PL", "CZ", "LU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 595, currency: "eur" },
            display_name: "Standard — Netherlands",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 4 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1295, currency: "eur" },
            display_name: "Standard — International",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 14 },
            },
          },
        },
      ],
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
