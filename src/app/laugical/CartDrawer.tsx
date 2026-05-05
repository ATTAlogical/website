"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLaugicalCart } from "@/context/LaugicalCart";

// ─── Qty stepper ──────────────────────────────────────────────────────────────

function QtyStepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="cart-qty">
      <button
        className="cart-qty-btn"
        onClick={onDecrement}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="cart-qty-val" aria-live="polite">
        {value}
      </span>
      <button
        className="cart-qty-btn"
        onClick={onIncrement}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

// ─── Line item ────────────────────────────────────────────────────────────────

function CartLineItem({
  slug,
  name,
  price,
  quantity,
  image,
}: {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}) {
  const { removeItem, updateQty } = useLaugicalCart();

  return (
    <motion.li
      layout
      className="cart-item"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {image ? (
        <div className="cart-item-img">
          <img src={image} alt={name} loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className="cart-item-img cart-item-img--placeholder" aria-hidden />
      )}

      <div className="cart-item-info">
        <p className="cart-item-name">{name}</p>
        <p className="cart-item-price">
          <span className="cart-item-currency">€</span>
          {(price * quantity).toFixed(2)}
        </p>

        <div className="cart-item-actions">
          <QtyStepper
            value={quantity}
            onDecrement={() =>
              quantity <= 1 ? removeItem(slug) : updateQty(slug, quantity - 1)
            }
            onIncrement={() => updateQty(slug, quantity + 1)}
          />
          <button
            className="cart-item-remove"
            onClick={() => removeItem(slug)}
            aria-label={`Remove ${name}`}
          >
            remove
          </button>
        </div>
      </div>
    </motion.li>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyBag() {
  return (
    <div className="cart-empty">
      <span className="cart-empty-icon" aria-hidden>○</span>
      <p className="cart-empty-label">your bag is empty</p>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export default function CartDrawer() {
  const { items, itemCount, subtotal, isOpen, setOpen, setMusicState } =
    useLaugicalCart();

  const panelRef = useRef<HTMLDivElement>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus trap — move focus into panel when it opens
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    if (checkoutLoading || items.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    setMusicState("checkout");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            slug: i.product.slug,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }
      window.location.href = data.url;
    } catch (err) {
      setCheckoutLoading(false);
      setMusicState("accumulating");
      setCheckoutError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            className="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            key="cart-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Bag — ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            className="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="cart-header">
              <span className="cart-header-title">bag</span>
              <button
                className="cart-close"
                onClick={() => setOpen(false)}
                aria-label="Close bag"
              >
                ×
              </button>
            </div>

            {/* Items */}
            <div className="cart-body">
              {items.length === 0 ? (
                <EmptyBag />
              ) : (
                <motion.ul layout className="cart-list">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartLineItem
                        key={item.product.slug}
                        slug={item.product.slug}
                        name={item.product.name}
                        price={item.product.price}
                        quantity={item.quantity}
                        image={item.product.images[0]}
                      />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>

            {/* Footer — only when items present */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  key="cart-footer"
                  className="cart-footer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="cart-subtotal">
                    <span className="cart-subtotal-label">subtotal</span>
                    <span className="cart-subtotal-value">
                      <span className="cart-item-currency">€</span>
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="cart-subtotal-note">
                    Shipping calculated at checkout
                  </p>
                  <motion.button
                    className="cart-checkout-btn"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    aria-busy={checkoutLoading}
                  >
                    {checkoutLoading ? "redirecting…" : "checkout"}
                  </motion.button>
                  {checkoutError && (
                    <p className="cart-checkout-error" role="alert">
                      {checkoutError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
