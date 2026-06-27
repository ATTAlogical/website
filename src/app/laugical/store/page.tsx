"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useLaugicalCart } from "@/context/LaugicalCart";
import {
  STORE_PRODUCTS,
  PRODUCT_LINEAGES,
  type StoreProduct,
  type ProductLineage,
  type ProductType,
  type AvailabilityState,
} from "@/data/store";

// ─── Placeholder chip ─────────────────────────────────────────────────────────

function PlaceholderChip() {
  return (
    <span style={{
      display: "inline-block",
      fontSize: "0.44rem",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "rgba(0,0,0,0.35)",
      border: "0.5px solid rgba(0,0,0,0.18)",
      borderRadius: "20px",
      padding: "0.18rem 0.52rem",
      marginBottom: "0.6rem",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      userSelect: "none",
    }}>
      placeholder
    </span>
  );
}

// ─── Availability label ────────────────────────────────────────────────────────

function AvailLabel({ state }: { state: AvailabilityState }) {
  if (state.kind === "in-stock") return null;
  if (state.kind === "made-to-order") {
    const map = { ready: "ready", days: "a few days", week: "~a week" } as const;
    const cls = { ready: "store-avail--ready", days: "store-avail--days", week: "store-avail--week" } as const;
    return <span className={`store-avail ${cls[state.fulfillment]}`}>{map[state.fulfillment]}</span>;
  }
  if (state.kind === "sold") return <span className="store-avail store-avail--sold">found its home</span>;
  if (state.kind === "coming-soon") return <span className="store-avail store-avail--soon">coming soon</span>;
  return null;
}

function isBuyable(state: AvailabilityState): boolean {
  return state.kind === "in-stock" || state.kind === "made-to-order";
}

// ─── One of one ───────────────────────────────────────────────────────────────

type OpoRole = "history" | "current" | "future";

type OpoGroup = {
  lineage: ProductLineage | null;
  history: StoreProduct[];
  current: StoreProduct[];
  future:  StoreProduct[];
};

function buildOpoGroups(products: StoreProduct[]): OpoGroup[] {
  const map = new Map<string, StoreProduct[]>();
  for (const p of products) {
    const key = p.lineageId ?? "__none__";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    lineage: key !== "__none__" ? (PRODUCT_LINEAGES.find(l => l.id === key) ?? null) : null,
    history: items.filter(p => p.availability.kind === "sold"),
    current: items.filter(p => p.availability.kind === "in-stock"),
    future:  items.filter(p => p.availability.kind === "coming-soon"),
  }));
}

const WHEEL_ITEM_H = 106;
const WHEEL_H = 280;
const WHEEL_SPACER = (WHEEL_H - WHEEL_ITEM_H) / 2; // 87 — lets first/last item snap to center

function OpoWheelItem({ product, role, active }: { product: StoreProduct; role: OpoRole; active: boolean }) {
  const versionLabel = product.lineageVersion ? `No. ${product.lineageVersion}` : null;
  const roleLabel = role === "future" ? "in progress" : role;
  return (
    <div className="store-opo-wheel-item" data-active={active ? "true" : "false"}>
      <div className="store-opo-wheel-info">
        <span className="store-opo-wheel-role">{roleLabel}{versionLabel ? ` · ${versionLabel}` : ""}</span>
        <h3 className="store-opo-wheel-name">{product.name}</h3>
        {product.description && <p className="store-opo-wheel-desc">{product.description}</p>}
        {role === "current" && (
          <span className="store-price" style={{ fontSize: "13px", marginTop: "2px" }}>
            <span className="store-price-currency">€</span>
            {product.price.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

function OpoLineageBlock({ group }: { group: OpoGroup }) {
  const { lineage, history, current, future } = group;
  const wheelRef = useRef<HTMLDivElement>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const items: { product: StoreProduct; role: OpoRole }[] = [
    ...history.map(p => ({ product: p, role: "history" as const })),
    ...current.map(p => ({ product: p, role: "current" as const })),
    ...future.map(p => ({ product: p, role: "future" as const })),
  ];

  const initialFocus = (() => {
    const ci = items.findIndex(i => i.role === "current");
    if (ci >= 0) return ci;
    const hi = items.map((x, i) => x.role === "history" ? i : -1).filter(i => i >= 0);
    return hi.length > 0 ? hi[hi.length - 1] : 0;
  })();

  const [activeIdx, setActiveIdx] = useState(initialFocus);

  useEffect(() => {
    if (wheelRef.current) wheelRef.current.scrollTop = initialFocus * WHEEL_ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollTop / WHEEL_ITEM_H);
      setActiveIdx(Math.min(Math.max(idx, 0), items.length - 1));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToIdx = (i: number) =>
    wheelRef.current?.scrollTo({ top: i * WHEEL_ITEM_H, behavior: "smooth" });

  const activeItem = items[activeIdx] ?? items[0];

  return (
    <div className="store-opo-lineage">
      <div className="store-opo-lineage-intro">
        {lineage && <h2 className="store-opo-lineage-name">{lineage.name}</h2>}
        {lineage?.description && <p className="store-opo-lineage-desc">{lineage.description}</p>}
        <p className="store-opo-lineage-note">
          Every piece is individually composed — no two are alike. Each can also be recreated on request.
        </p>
      </div>

      <div className="store-opo-wheel-layout">
        {/* Crossfading image panel — left of the scroll container */}
        <div className="store-opo-wheel-img-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.product.slug}
              className="store-opo-wheel-main-img"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {activeItem.product.images[0] ? (
                <img src={activeItem.product.images[0]} alt={activeItem.product.name} loading="lazy" decoding="async" />
              ) : (
                <div className="store-opo-img-placeholder" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text-only scroll wheel */}
        <div className="store-opo-wheel" ref={wheelRef}>
          <div style={{ height: WHEEL_SPACER, flexShrink: 0 }} />
          {items.map(({ product, role }, i) => (
            <OpoWheelItem key={product.slug} product={product} role={role} active={i === activeIdx} />
          ))}
          <div style={{ height: WHEEL_SPACER, flexShrink: 0 }} />
        </div>

        {/* Arrow button + dot indicator */}
        <div className="store-opo-wheel-controls">
          <motion.button
            className="store-opo-wheel-arrow"
            onClick={() => setDetailOpen(v => !v)}
            animate={{ rotate: detailOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            aria-label={detailOpen ? "Close details" : "View details"}
          >
            →
          </motion.button>
          <div className="store-opo-wheel-dots" role="tablist" aria-label="Scroll position">
            {items.map((_, i) => (
              <button
                key={i}
                className={`store-opo-wheel-dot${i === activeIdx ? " store-opo-wheel-dot--active" : ""}`}
                onClick={() => scrollToIdx(i)}
                aria-label={`Item ${i + 1} of ${items.length}`}
                role="tab"
                aria-selected={i === activeIdx}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {detailOpen && (
          <motion.div
            className="store-opo-detail-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="store-opo-detail-inner">
              {activeItem.product.placeholder && <PlaceholderChip />}
              {activeItem.product.lineageVersion && (
                <span className="store-opo-version" style={{ display: "block", marginBottom: "4px" }}>
                  No. {activeItem.product.lineageVersion}
                </span>
              )}
              <h3 className="store-opo-detail-name">{activeItem.product.name}</h3>
              {activeItem.product.description && (
                <p className="store-opo-detail-desc">{activeItem.product.description}</p>
              )}
              <div className="store-opo-detail-footer">
                {activeItem.role === "current" && (
                  <span className="store-price">
                    <span className="store-price-currency">€</span>
                    {activeItem.product.price.toFixed(2)}
                  </span>
                )}
                {activeItem.role === "history" && (
                  <span className="store-avail store-avail--sold">found its home</span>
                )}
                {activeItem.role === "future" && (
                  <span className="store-avail store-avail--soon">in progress</span>
                )}
                <p className="store-opo-detail-note">
                  Interested in something similar? Reach out — each piece can be recreated on request.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OneOfOneSection({ products }: { products: StoreProduct[] }) {
  const groups = buildOpoGroups(products);
  return <>{groups.map((g, i) => <OpoLineageBlock key={i} group={g} />)}</>;
}

// ─── Made to order ────────────────────────────────────────────────────────────

function MadeToOrderEntry({ product, imageAlign }: { product: StoreProduct; imageAlign: "left" | "right" }) {
  const { addItem } = useLaugicalCart();
  const buyable = isBuyable(product.availability);

  return (
    <article className={`store-mto store-mto--${imageAlign}`}>
      {product.placeholder && <PlaceholderChip />}
      {product.images[0] ? (
        <div className="store-mto-img-wrap glass-image-frame">
          <img src={product.images[0]} alt={product.name} loading="lazy" decoding="async" />
        </div>
      ) : (
        <div
          className="store-mto-img-wrap"
          style={{ aspectRatio: "4/3", background: "oklch(97% 0.002 255)", border: "0.5px solid rgba(0,0,0,0.06)" }}
        />
      )}

      <div className="store-mto-details-row">
        <h2 className="store-mto-name">{product.name}</h2>
        {product.description && <p className="store-mto-desc">{product.description}</p>}
        {product.material && <p className="store-mto-material">{product.material}</p>}
        <span className="store-price">
          <span className="store-price-currency">€</span>
          {product.price.toFixed(2)}
        </span>
        <AvailLabel state={product.availability} />
        {buyable && (
          <motion.button
            className="store-cta"
            whileTap={{ scale: 0.96 }}
            onClick={() => addItem(product)}
            aria-label={`Add ${product.name} to bag`}
          >
            add to bag
          </motion.button>
        )}
      </div>
    </article>
  );
}

// ─── Dropship / stickers ──────────────────────────────────────────────────────

function DropshipEntry({ product }: { product: StoreProduct }) {
  const { addItem } = useLaugicalCart();
  const buyable = isBuyable(product.availability);

  return (
    <article className={`store-dsp${product.featured ? " store-dsp--featured" : ""}`}>
      {product.placeholder && <PlaceholderChip />}
      {product.images[0] ? (
        <div className="store-dsp-img-wrap glass-image-frame">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div
          className="store-dsp-img-wrap"
          style={{
            aspectRatio: "1",
            background: "oklch(97% 0.002 255)",
            border: "0.5px solid rgba(0,0,0,0.06)",
          }}
        />
      )}

      <h3 className="store-dsp-name">{product.name}</h3>
      {product.description && (
        <p
          style={{
            fontFamily: "var(--font-geist-sans), -apple-system, sans-serif",
            fontSize: "12px",
            color: "rgba(0,0,0,0.45)",
            margin: "0 0 0",
            lineHeight: 1.5,
          }}
        >
          {product.description}
        </p>
      )}

      <div className="store-dsp-footer">
        <span className="store-price" style={{ fontSize: "15px" }}>
          <span className="store-price-currency">€</span>
          {product.price.toFixed(2)}
        </span>
        {buyable ? (
          <motion.button
            className="store-cta"
            style={{ padding: "7px 14px", fontSize: "8px" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => addItem(product)}
            aria-label={`Add ${product.name} to bag`}
          >
            add
          </motion.button>
        ) : (
          <AvailLabel state={product.availability} />
        )}
      </div>
    </article>
  );
}


// ─── Section definitions ───────────────────────────────────────────────────────

const SECTIONS: { key: ProductType; label: string }[] = [
  { key: "dropship",      label: "Stickers & prints" },
  { key: "made-to-order", label: "Made to order"     },
  { key: "one-of-one",    label: "One of one"        },
];

// ─── Empty store ──────────────────────────────────────────────────────────────

function EmptyStore() {
  return (
    <div className="store-empty-sections" aria-label="Store is being stocked">
      {SECTIONS.map((s) => (
        <section key={s.key} className="store-section" aria-label={s.label}>
          <div className="store-section-head">
            <span className="store-section-label">{s.label}</span>
          </div>
          <div className="store-empty-section-space" />
        </section>
      ))}

      <div className="store-empty-foot">
        <div className="store-empty-dot" aria-hidden="true" />
        <p className="store-empty-note">The shelf is being stocked.</p>
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function StoreNav() {
  const { itemCount, setOpen } = useLaugicalCart();

  return (
    <nav className="store-nav" aria-label="Store navigation">
      <Link href="/" className="store-nav-back" aria-label="Back to ATTA logical">
        ← ATTA logical
      </Link>

      <span className="store-nav-title" aria-hidden="true">Laugical store</span>

      <button
        className="store-nav-cart"
        onClick={() => setOpen(true)}
        aria-label={`Open bag — ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      >
        bag
        <AnimatePresence mode="popLayout">
          <motion.span
            key={itemCount}
            className="store-nav-cart-count"
            data-zero={itemCount === 0 ? "true" : "false"}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            aria-live="polite"
          >
            {itemCount}
          </motion.span>
        </AnimatePresence>
      </button>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function StoreHero() {
  return (
    <header className="store-hero store-wrap">
      <h1 className="store-hero-title">Laugical</h1>
      <span className="store-hero-sub">store</span>
      <hr className="store-hero-rule" />
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorePage() {
  // Unlock scroll — globals.css sets overflow:hidden + height:100% on html/body
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    };
  }, []);

  // Show cancel banner if user came back from a cancelled checkout
  const [showCancelled, setShowCancelled] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancelled") {
      setShowCancelled(true);
      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
      const t = setTimeout(() => setShowCancelled(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  const isEmpty = STORE_PRODUCTS.length === 0;

  // Group products by type, preserving source order within each group
  const byType = (type: ProductType) =>
    STORE_PRODUCTS.filter((p) => p.type === type);

  return (
    <main className="store-page">
      <StoreNav />
      <StoreHero />

      <AnimatePresence>
        {showCancelled && (
          <motion.div
            key="checkout-cancel-banner"
            className="store-cancel-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            checkout cancelled — your bag is still here
          </motion.div>
        )}
      </AnimatePresence>

      <div className="store-wrap">
        {isEmpty ? (
          <EmptyStore />
        ) : (
          <>
            {SECTIONS.map((s) => {
              const products = byType(s.key);
              if (products.length === 0) return null;

              return (
                <section key={s.key} className="store-section" aria-label={s.label}>
                  <div className="store-section-head">
                    <span className="store-section-label">{s.label}</span>
                    <span className="store-section-count">{products.length}</span>
                  </div>

                  {s.key === "dropship" ? (
                    <div className="store-dropship-grid">
                      {products.map((p) => (
                        <DropshipEntry key={p.slug} product={p} />
                      ))}
                    </div>
                  ) : s.key === "made-to-order" ? (
                    products.map((p, i) => (
                      <MadeToOrderEntry key={p.slug} product={p} imageAlign={i % 2 === 0 ? "left" : "right"} />
                    ))
                  ) : (
                    <OneOfOneSection products={products} />
                  )}
                </section>
              );
            })}

            {/* Bottom breathing room */}
            <div style={{ height: "120px" }} />
          </>
        )}
      </div>
    </main>
  );
}
