"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useLaugicalCart } from "@/context/LaugicalCart";
import {
  STORE_PRODUCTS,
  type StoreProduct,
  type ProductType,
  type AvailabilityState,
} from "@/data/store";

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

function OneOfOneEntry({ product }: { product: StoreProduct }) {
  const { addItem } = useLaugicalCart();
  const buyable = isBuyable(product.availability);
  const versionLabel = product.lineageVersion ? `No. ${product.lineageVersion}` : null;

  return (
    <article className="store-opo">
      <div className="store-opo-meta">
        {versionLabel && <span className="store-opo-version">{versionLabel}</span>}
        <AvailLabel state={product.availability} />
      </div>

      {product.images[0] && (
        <div className="store-opo-img-wrap glass-image-frame">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="eager"
            decoding="async"
            style={{ width: "100%", display: "block" }}
          />
        </div>
      )}

      <h2 className="store-opo-name">{product.name}</h2>
      {product.description && <p className="store-opo-desc">{product.description}</p>}
      {product.material && <p className="store-opo-material">{product.material}</p>}

      <div className="store-opo-footer">
        <div className="store-opo-footer-l">
          <span className="store-price">
            <span className="store-price-currency">€</span>
            {product.price.toFixed(2)}
          </span>
        </div>
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

// ─── Made to order ────────────────────────────────────────────────────────────

function MadeToOrderEntry({ product }: { product: StoreProduct }) {
  const { addItem } = useLaugicalCart();
  const buyable = isBuyable(product.availability);

  return (
    <article className="store-mto">
      {product.images[0] ? (
        <div className="store-mto-img-wrap glass-image-frame">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        // Placeholder surface when no image — the desk waiting for the object
        <div
          className="store-mto-img-wrap"
          style={{
            aspectRatio: "1",
            background: "oklch(97% 0.002 255)",
            border: "0.5px solid rgba(0,0,0,0.06)",
          }}
        />
      )}

      <div className="store-mto-info">
        <h2 className="store-mto-name">{product.name}</h2>
        {product.description && <p className="store-mto-desc">{product.description}</p>}
        {product.material && <p className="store-mto-material">{product.material}</p>}

        <div className="store-mto-footer">
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
      </div>
    </article>
  );
}

// ─── Dropship / stickers ──────────────────────────────────────────────────────

function DropshipEntry({ product }: { product: StoreProduct }) {
  const { addItem } = useLaugicalCart();
  const buyable = isBuyable(product.availability);

  return (
    <article className="store-dsp">
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

// ─── Product router ────────────────────────────────────────────────────────────

function ProductEntry({ product }: { product: StoreProduct }) {
  if (product.type === "one-of-one") return <OneOfOneEntry product={product} />;
  if (product.type === "made-to-order") return <MadeToOrderEntry product={product} />;
  return <DropshipEntry product={product} />;
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
      <Link href="/" className="store-nav-back" aria-label="Back to atta logical">
        ← atta logical
      </Link>

      <span className="store-nav-title" aria-hidden="true">laugical store</span>

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
      <h1 className="store-hero-title">LAUGICAL</h1>
      <span className="store-hero-sub">store</span>
      <hr className="store-hero-rule" />
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorePage() {
  // Unlock scroll — globals.css sets overflow:hidden on html/body
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
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
                  ) : (
                    products.map((p) => <ProductEntry key={p.slug} product={p} />)
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
