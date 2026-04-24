"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";

// ─── Types ───────────────────────────────────────────────────────────────────

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

interface Plant2 {
  img: string;
  imgW: number;
  imgH: number;
  corner: Corner;
  intensity: number;
}

interface Tier {
  key: string;
  label: string;
  latin: string;
  price: string;
  img: string;
  imgW: number;
  imgH: number;
  intensity: number;
  pip: 1 | 2 | 3 | 4;
  plantCorner: Corner;
  plant2?: Plant2;
}

// ─── Tier data ────────────────────────────────────────────────────────────────

const TIERS: Tier[] = [
  {
    key: "basic", label: "Basic", latin: "Plantula", price: "€12",
    img: "/subscriptions/seedling.png", imgW: 190, imgH: 176,
    intensity: 0.95, pip: 1, plantCorner: "bottom-right",
  },
  {
    key: "blooming", label: "Blooming", latin: "Germinatio", price: "€30",
    img: "/subscriptions/sprig.png", imgW: 260, imgH: 214,
    intensity: 0.95, pip: 2, plantCorner: "top-right",
  },
  {
    key: "flourished", label: "Flourished", latin: "Frondescentia", price: "€65",
    img: "/img/flourished-palm.png", imgW: 170, imgH: 255,
    intensity: 0.95, pip: 3, plantCorner: "top-right",
  },
  {
    key: "tropical", label: "Tropical", latin: "Silva pluvialis", price: "€120",
    img: "/subscriptions/palm-tree.png", imgW: 260, imgH: 237,
    intensity: 0.95, pip: 4, plantCorner: "bottom-right",
  },
];

// Plant placement — adjust scale (multiplier) and x/y (fraction that bleeds past the corner).
// Change these values to reposition or resize any botanical illustration on a card.
const TWEAKS: Record<string, number> = {
  basic_scale: 1,        basic_x: -0.2,   basic_y: -0,
  blooming_scale: 1.1,     blooming_x: -0.02, blooming_y: 0.10,
  flourished_scale: 1.8,   flourished_x: -0, flourished_y: 0,
  tropical_scale: 1.5,     tropical_x: -0.1, tropical_y: 0.05,

};

// ─── Content (EN / NL) ───────────────────────────────────────────────────────

const CONTENT = {
  en: {
    heroKicker: "Subscriptiones — genus quadripartitum",
    heroTitle: "Subscriptions",
    heroLead: "Ongoing website maintenance and development, at a rhythm you choose. Four tiers, from keeping a site alive to treating it as a core tool.",
    scopeKicker: "§ II  ·  Scope per tier",
    scopeTitle: "What each tier includes",
    rulesKicker: "§ III  ·  Rules",
    rulesTitle: "How it works",
    footerKicker: "Get in touch",
    footerNote: "Write with a sentence about your site and we'll pick a tier together.",
    cadence: "/ month",
    scope: {
      basic:      { forWhom: "For businesses that need their site kept alive and stable.",              included: ["Uptime monitoring", "Security updates", "Bug fixes", "Minor text edits"],                                                    billed: "New features, design changes, and new pages are billed separately at the hourly rate." },
      blooming:   { forWhom: "For businesses that occasionally want to refresh or adjust things.",     included: ["Everything in Basic", "Small visual and UI tweaks", "Design adjustments"],                                                    billed: "New features, new pages, and heavier development are billed hourly." },
      flourished: { forWhom: "For actively evolving businesses.",                                     included: ["Everything in Blooming", "Small new features", "Template-based pages"],                                                      billed: "Custom-built or heavy development work is billed hourly." },
      tropical:   { forWhom: "For businesses that treat their website as a core tool.",               included: ["Everything in Flourished", "Custom builds and heavy development", "Up to 8 hours per month included"],                       billed: "Out-of-scope work is quoted separately." },
    },
    rules: [
      ["Minimum term",  "Three months on signup."],
      ["Upgrades",      "Upgrading resets the three-month minimum from the upgrade date."],
      ["Downgrades",    "Downgrading requires thirty days written notice after the minimum term."],
      ["Rollover",      "Included work does not roll over month to month."],
      ["Out of scope",  "The hourly rate applies to anything outside the tier scope."],
      ["Fair use",      "Unusually heavy months may be flagged and quoted separately."],
    ] as [string, string][],
  },
  nl: {
    heroKicker: "Subscriptiones — genus quadripartitum",
    heroTitle: "Abonnementen",
    heroLead: "Doorlopend websiteonderhoud en -ontwikkeling, op een tempo dat bij jou past. Vier niveaus, van je site stabiel houden tot hem gebruiken als kerngereedschap.",
    scopeKicker: "§ II  ·  Scope per niveau",
    scopeTitle: "Wat elk niveau inhoudt",
    rulesKicker: "§ III  ·  Voorwaarden",
    rulesTitle: "Hoe het werkt",
    footerKicker: "Neem contact op",
    footerNote: "Stuur een korte beschrijving van je site en we kiezen samen een niveau.",
    cadence: "/ maand",
    scope: {
      basic:      { forWhom: "Voor bedrijven die hun site stabiel en actief willen houden.",                   included: ["Beschikbaarheidsbewaking", "Beveiligingsupdates", "Bugfixes", "Kleine tekstwijzigingen"],                                   billed: "Nieuwe functies, designwijzigingen en nieuwe pagina's worden apart gefactureerd op basis van het uurtarief." },
      blooming:   { forWhom: "Voor bedrijven die hun site af en toe willen vernieuwen of aanpassen.",          included: ["Alles uit Basic", "Kleine visuele en UI-aanpassingen", "Designaanpassingen"],                                              billed: "Nieuwe functies, nieuwe pagina's en zwaardere ontwikkeling worden per uur gefactureerd." },
      flourished: { forWhom: "Voor actief groeiende bedrijven.",                                              included: ["Alles uit Blooming", "Kleine nieuwe functies", "Op sjabloon gebaseerde pagina's"],                                        billed: "Maatwerk of zware ontwikkeling wordt per uur gefactureerd." },
      tropical:   { forWhom: "Voor bedrijven die hun website als kerngereedschap inzetten.",                  included: ["Alles uit Flourished", "Maatwerk en zware ontwikkeling", "Tot 8 uur per maand inbegrepen"],                               billed: "Werk buiten de scope wordt apart geoffreerd." },
    },
    rules: [
      ["Minimale looptijd", "Drie maanden bij aanmelding."],
      ["Upgrades",          "Upgraden herstart de minimale looptijd van drie maanden vanaf de upgradedatum."],
      ["Downgrades",        "Downgraden vereist dertig dagen schriftelijke opzegging na afloop van de minimale looptijd."],
      ["Doorschuiven",      "Inbegrepen werk wordt niet meegenomen naar de volgende maand."],
      ["Buiten scope",      "Het uurtarief is van toepassing op alles buiten de niveauomschrijving."],
      ["Eerlijk gebruik",   "Uitzonderlijk drukke maanden kunnen worden gemarkeerd en apart geoffreerd."],
    ] as [string, string][],
  },
};

// ─── Plant helper ─────────────────────────────────────────────────────────────

function PlantDecal({ img, imgW, imgH, intensity, tweakKey, corner }: {
  img: string; imgW: number; imgH: number; intensity: number;
  tweakKey: string; corner: Corner;
}) {
  const scale = TWEAKS[`${tweakKey}_scale`] ?? 1;
  const ox    = TWEAKS[`${tweakKey}_x`]     ?? 0.35;
  const oy    = TWEAKS[`${tweakKey}_y`]     ?? 0.35;
  const w = imgW * scale;
  const h = imgH * scale;

  const pos: React.CSSProperties = { position: "absolute", pointerEvents: "none", zIndex: 0, width: w, height: h, opacity: intensity };
  if (corner === "top-right")    { pos.right = -w * ox; pos.top    = -h * oy; }
  else if (corner === "top-left") { pos.left  = -w * ox; pos.top    = -h * oy; }
  else if (corner === "bottom-left") { pos.left  = -w * ox; pos.bottom = -h * oy; }
  else                            { pos.right = -w * ox; pos.bottom = -h * oy; }

  return (
    <div style={pos}>
      <img src={img} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", objectPosition: "bottom right", mixBlendMode: "multiply" }} />
    </div>
  );
}

// ─── TierCard ─────────────────────────────────────────────────────────────────

function TierCard({ tier, height }: { tier: Tier; height: number }) {
  const idx = TIERS.indexOf(tier) + 1;
  return (
    <article className="tier-card" style={{ height, width: "100%" }}>
      <PlantDecal img={tier.img} imgW={tier.imgW} imgH={tier.imgH} intensity={tier.intensity} tweakKey={tier.key} corner={tier.plantCorner} />

      {tier.plant2 && (
        <PlantDecal img={tier.plant2.img} imgW={tier.plant2.imgW} imgH={tier.plant2.imgH} intensity={tier.plant2.intensity} tweakKey={tier.key + "2"} corner={tier.plant2.corner} />
      )}

      <header className="tier-head">
        <span className="tier-index">{String(idx).padStart(2, "0")}</span>
        <span className="tier-pips" aria-hidden>
          {[0, 1, 2, 3].map(i => <span key={i} className={`pip${i < tier.pip ? " pip-on" : ""}`} />)}
        </span>
      </header>

      <div className="tier-label-block">
        <div className="tier-label">{tier.label}</div>
        <div className="tier-latin">{tier.latin}</div>
      </div>

      <div className="tier-price-block">
        <div className="tier-price">{tier.price}</div>
        <div className="tier-cadence">/ mo</div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Subscriptions() {
  const [lang, setLang] = useState<"en" | "nl">("en");
  const [contactOpen, setContactOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTier, setFormTier] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isMobile = useIsMobile();

  function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const subject = `Subscription enquiry — ${formTier || "General"}`;
    const body = `Name: ${formName}\nEmail: ${formEmail}\nTier: ${formTier || "Not specified"}\n\n${formMessage}`;
    window.location.href = `mailto:Boelie@attalogical.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }
  const c = CONTENT[lang];

  // Enable scrolling (globals.css sets overflow: hidden on html/body)
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

  const cardHeights = isMobile ? [260, 260, 280, 300] : [340, 380, 420, 460];

  const ROMAN = ["I", "II", "III", "IV"] as const;

  return (
    <main style={{ minHeight: "100vh", background: "#fff", paddingBottom: isMobile ? "80px" : "160px" }}>
      <div className="sub-page">

        {/* ── Nav ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "48px 0 0",
          fontFamily: "var(--font-geist-mono), ui-monospace, Menlo, monospace",
          fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase",
          color: "rgba(0,0,0,0.35)",
        }}>
          <Link href="/" className="sub-back">← ATTA logical</Link>
          <span>ATTA·SUB·2026</span>
        </div>

        {/* ── Hero ── */}
        <div className="sub-hero-center">
          <p className="sub-hero-kicker">{c.heroKicker}</p>
          <h1 className="sub-hero-title">
            <span className="glossy-text">{c.heroTitle}</span>
          </h1>
          <div className="sub-hero-reflection" aria-hidden>
            <span className="glossy-text">{c.heroTitle}</span>
          </div>
          <p className="sub-hero-lead">{c.heroLead}</p>
        </div>

        {/* ── Taxonomy plate ── */}
        <section className="sub-plate-wrap">
          <div className="sub-plate-border">

            <div className="sub-plate-title-row">
              <div>
                <div className="sub-plate-family">FAMILIA · ATTA</div>
                <div className="sub-plate-species">Subscriptiones — genus quadripartitum</div>
              </div>
              <div className="sub-plate-title-r">
                <div className="sub-plate-no">Plate</div>
                <div className="sub-plate-no-big">IV</div>
              </div>
            </div>

            <hr className="sub-plate-rule" />

            <div className="sub-plate-grid">
              {TIERS.map((tier, i) => (
                <div key={tier.key} className="sub-plate-cell">
                  <div className="sub-plate-cell-head">
                    <span className="sub-plate-cell-roman">{ROMAN[i]}</span>
                    <span className="sub-plate-cell-sep" />
                    <span className="sub-plate-cell-latin">{tier.latin}</span>
                  </div>
                  <div className="sub-plate-cell-body">
                    <TierCard tier={tier} height={cardHeights[i]} />
                  </div>
                </div>
              ))}
            </div>

            <hr className="sub-plate-rule" />

            <div className="sub-plate-foot-row">
              {([ ["Observator", "Bilal van Camp"], ["Anno", "MMXXVI"], ["Locus", "Antverpiae"], ["Catalogus", "ATTA·SUB·2026"] ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div className="sub-plate-foot-k">{k}</div>
                  <div className="sub-plate-foot-v">{v}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Scope ── */}
        <section className="sub-scope">
          <div className="sub-section-head">
            <span className="sub-section-kicker">{c.scopeKicker}</span>
            <h2 className="sub-section-title">{c.scopeTitle}</h2>
          </div>
          <div className="sub-scope-grid">
            {TIERS.map((tier, i) => {
              const s = c.scope[tier.key as keyof typeof c.scope];
              return (
                <article key={tier.key} className="sub-scope-row">
                  <div className="sub-scope-row-l">
                    <div className="sub-scope-row-mono">
                      <span>{ROMAN[i]}</span>
                      <span>·</span>
                      <span>{tier.price} {c.cadence}</span>
                    </div>
                    <div className="sub-scope-row-label">{tier.label}</div>
                    <div className="sub-scope-row-latin">{tier.latin}</div>
                  </div>
                  <div className="sub-scope-row-r">
                    <p className="sub-scope-forwhom">{s.forWhom}</p>
                    <ul className="sub-scope-included">
                      {s.included.map((item, j) => (
                        <li key={j}>
                          <span className="sub-scope-dash">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="sub-scope-billed">{s.billed}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Rules ── */}
        <section className="sub-rules">
          <div className="sub-section-head">
            <span className="sub-section-kicker">{c.rulesKicker}</span>
            <h2 className="sub-section-title">{c.rulesTitle}</h2>
          </div>
          <dl className="sub-rules-list">
            {c.rules.map(([k, v], i) => (
              <div key={i} className="sub-rules-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Footer ── */}
        <footer className="sub-footer">
          <div>
            <a href="mailto:Boelie@attalogical.com" className="sub-footer-email"
              style={{
                background: "linear-gradient(180deg, #000 0%, #111 40%, #666 80%, #888 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Boelie@attalogical.com
            </a>
            <p className="sub-footer-note">{c.footerNote}</p>
            <button className="sub-contact-trigger" style={{ marginTop: "28px" }} onClick={() => { setContactOpen(o => !o); setSubmitted(false); }}>
              {c.footerKicker}
              <span className="sub-contact-trigger-icon">{contactOpen ? "−" : "+"}</span>
            </button>
            <AnimatePresence>
              {contactOpen && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  {submitted ? (
                    <div className="sub-contact-thanks">
                      <p className="sub-contact-thanks-title">Message sent.</p>
                      <p className="sub-contact-thanks-note">Your email client should have opened. If not, write to Boelie@attalogical.com directly.</p>
                    </div>
                  ) : (
                    <form className="sub-contact-form" style={{ paddingTop: "16px" }} onSubmit={handleContactSubmit}>
                      <div className="sub-contact-row">
                        <label className="sub-contact-label">Name</label>
                        <input className="sub-contact-input" type="text" required autoComplete="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Your name" />
                      </div>
                      <div className="sub-contact-row">
                        <label className="sub-contact-label">Email</label>
                        <input className="sub-contact-input" type="email" required autoComplete="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="your@email.com" />
                      </div>
                      <div className="sub-contact-row">
                        <label className="sub-contact-label">Tier interest</label>
                        <select className="sub-contact-select" value={formTier} onChange={e => setFormTier(e.target.value)}>
                          <option value="">Not sure yet</option>
                          {TIERS.map(t => <option key={t.key} value={t.label}>{t.label} — {t.price} / mo</option>)}
                        </select>
                      </div>
                      <div className="sub-contact-row">
                        <label className="sub-contact-label">Message</label>
                        <textarea className="sub-contact-textarea" required rows={5} value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="Tell me a bit about your site and what you need." />
                      </div>
                      <button type="submit" className="sub-contact-send">Send message</button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="sub-footer-r">
            {([ ["Observator", "Bilal van Camp"], ["Locus", "Nederland"], ["Anno", "MMXXVI"], ["Catalogus", "ATTA·SUB·2026"] ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="sub-footer-meta">
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </footer>

      </div>

      {/* ── Language toggle (same glass button as homepage) ── */}
      <div style={{
        position: "fixed",
        ...(isMobile
          ? { top: "max(2rem, env(safe-area-inset-top, 1.5rem))", left: "max(1.5rem, env(safe-area-inset-left, 1.5rem))" }
          : { bottom: "max(1.5rem, env(safe-area-inset-bottom, 2rem))", left: "max(2rem, env(safe-area-inset-left, 2rem))" }
        ),
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem",
        zIndex: 100,
      }}>
        <motion.button
          onClick={() => setLang(l => l === "en" ? "nl" : "en")}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.91 }}
          style={{
            width: "3.1rem", height: "3.1rem",
            borderRadius: "50%",
            background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(235,236,240,0.88) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1.5px solid rgba(255,255,255,0.75)",
            boxShadow: [
              "0 6px 22px rgba(0,0,0,0.13)",
              "0 2px 6px rgba(0,0,0,0.08)",
              "inset 0 0 0 1px rgba(0,0,0,0.07)",
              "inset 0 2.5px 0 rgba(255,255,255,1)",
              "inset 0 -2.5px 0 rgba(0,0,0,0.14)",
              "inset 2px 0 0 rgba(255,255,255,0.45)",
              "inset -2px 0 0 rgba(0,0,0,0.05)",
            ].join(", "),
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(0,0,0,0.5)",
            padding: 0,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.3rem", height: "1.3rem" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </motion.button>
        <span style={{
          fontSize: "0.52rem", letterSpacing: "0.14em",
          color: "rgba(0,0,0,0.28)", textTransform: "uppercase",
          fontFamily: '"Playfair Display", serif',
          userSelect: "none",
        }}>
          {lang}
        </span>
      </div>
    </main>
  );
}
