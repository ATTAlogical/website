/* ATTA Logical — Subscriptions page
   Wraps the taxonomy plate in a full page: hero, scope details, rules, footer.
   Aesthetic matches attalogical.com: Playfair Display + Geist Mono,
   glossy-text heading, glass-pane subtle, black-on-white with opacity tiers. */

/* ──────────────────────────────────────────────────────
   Per-tier scope copy (from brief, tone: direct & calm)
   ────────────────────────────────────────────────────── */
const SCOPE = {
  basic: {
    forWhom: 'For businesses that need their site kept alive and stable.',
    included: [
      'Uptime monitoring',
      'Security updates',
      'Bug fixes',
      'Minor text edits',
    ],
    billed: 'New features, design changes, and new pages are billed separately at the hourly rate.',
  },
  blooming: {
    forWhom: 'For businesses that occasionally want to refresh or adjust things.',
    included: [
      'Everything in Basic',
      'Small visual and UI tweaks',
      'Design adjustments',
    ],
    billed: 'New features, new pages, and heavier development are billed hourly.',
  },
  flourished: {
    forWhom: 'For actively evolving businesses.',
    included: [
      'Everything in Blooming',
      'Small new features',
      'Template-based pages',
    ],
    billed: 'Custom-built or heavy development work is billed hourly.',
  },
  tropical: {
    forWhom: 'For businesses that treat their website as a core tool.',
    included: [
      'Everything in Flourished',
      'Custom builds and heavy development',
      'Up to 8 hours per month included',
    ],
    billed: 'Out-of-scope work is quoted separately.',
  },
};

/* ──────────────────────────────────────────────────────
   Hero
   ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <header className="page-hero">
      <div className="page-chrome">
        <a href="https://attalogical.com" className="page-back">← attalogical.com</a>
        <span className="page-chrome-mono">ATTA·SUB·2026</span>
      </div>

      <div className="hero-center">
        <div className="hero-kicker">Subscriptiones — genus quadripartitum</div>
        <h1 className="hero-title">
          <span className="glossy-text">Subscriptions</span>
        </h1>
        <div className="hero-reflection" aria-hidden="true">
          <span className="glossy-text">Subscriptions</span>
        </div>
        <p className="hero-lead">
          Ongoing website maintenance and development, at a rhythm you choose.
          Four tiers, from keeping a site alive to treating it as a core tool.
        </p>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────
   Plate — reuses the specimen plate from cards.jsx
   ────────────────────────────────────────────────────── */
function PlateFrame({ tweaks }) {
  return (
    <section className="page-plate-wrap">
      <LayoutPlate tweaks={tweaks} />
    </section>
  );
}

/* ──────────────────────────────────────────────────────
   Scope — per-tier included/billed breakdown
   ────────────────────────────────────────────────────── */
function ScopeSection() {
  return (
    <section className="page-scope">
      <div className="scope-head">
        <div className="scope-kicker">§ II  ·  Scope per tier</div>
        <h2 className="scope-title">What each tier includes</h2>
      </div>

      <div className="scope-grid">
        {TIERS.map((tier, i) => {
          const s = SCOPE[tier.key];
          return (
            <article key={tier.key} className="scope-row">
              <div className="scope-row-l">
                <div className="scope-row-mono">
                  <span>{['I', 'II', 'III', 'IV'][i]}</span>
                  <span>·</span>
                  <span>{tier.price} / month</span>
                </div>
                <div className="scope-row-label">{tier.label}</div>
                <div className="scope-row-latin">{tier.latin}</div>
              </div>

              <div className="scope-row-r">
                <p className="scope-forwhom">{s.forWhom}</p>
                <ul className="scope-included">
                  {s.included.map((item, j) => (
                    <li key={j}>
                      <span className="scope-dash">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="scope-billed">{s.billed}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────
   Rules — fine print in mono
   ────────────────────────────────────────────────────── */
function RulesSection() {
  const rules = [
    ['Minimum term',          'Three months on signup.'],
    ['Upgrades',              'Upgrading resets the three-month minimum from the upgrade date.'],
    ['Downgrades',            'Downgrading requires thirty days written notice after the minimum term.'],
    ['Rollover',              'Included work does not roll over month to month.'],
    ['Out of scope',          'The hourly rate applies to anything outside the tier scope.'],
    ['Fair use',              'Unusually heavy months may be flagged and quoted separately.'],
  ];
  return (
    <section className="page-rules">
      <div className="scope-head">
        <div className="scope-kicker">§ III  ·  Rules</div>
        <h2 className="scope-title">How it works</h2>
      </div>

      <dl className="rules-list">
        {rules.map(([k, v], i) => (
          <div key={i} className="rules-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ──────────────────────────────────────────────────────
   Contact / footer
   ────────────────────────────────────────────────────── */
function PageFooter() {
  return (
    <footer className="page-footer">
      <div className="footer-l">
        <div className="scope-kicker">Get in touch</div>
        <a href="mailto:Boelie@attalogical.com" className="footer-email">
          <span className="glossy-text">Boelie@attalogical.com</span>
        </a>
        <p className="footer-note">
          Write with a sentence about your site and we'll pick a tier together.
        </p>
      </div>

      <div className="footer-r">
        <div className="footer-meta"><span>Observator</span><span>Bilal van Camp</span></div>
        <div className="footer-meta"><span>Locus</span><span>Nederland</span></div>
        <div className="footer-meta"><span>Anno</span><span>MMXXVI</span></div>
        <div className="footer-meta"><span>Catalogus</span><span>ATTA·SUB·2026</span></div>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────
   Page — wires it all together with existing Tweaks
   ────────────────────────────────────────────────────── */
function Page() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const cardControls = (key, label) => (
    <TweakSection label={label}>
      <TweakSlider label="Scale"    value={t[`${key}_scale`]} min={0.4} max={2}   step={0.05} onChange={(v) => setTweak(`${key}_scale`, v)} />
      <TweakSlider label="Offset X" value={t[`${key}_x`]}     min={-0.4} max={0.6} step={0.01} onChange={(v) => setTweak(`${key}_x`, v)} />
      <TweakSlider label="Offset Y" value={t[`${key}_y`]}     min={-0.4} max={0.6} step={0.01} onChange={(v) => setTweak(`${key}_y`, v)} />
    </TweakSection>
  );

  return (
    <>
      <div className="atta-page">
        <Hero />
        <PlateFrame tweaks={t} />
        <ScopeSection />
        <RulesSection />
        <PageFooter />
      </div>

      <TweaksPanel title="Plant placement">
        {cardControls('basic',       '01 · Basic · Plantula')}
        {cardControls('blooming',    '02 · Blooming · Germinatio')}
        {cardControls('flourished',  '03 · Flourished · fern')}
        {cardControls('flourished2', '03 · Flourished · palm')}
        {cardControls('tropical',    '04 · Tropical · Silva pluvialis')}
      </TweaksPanel>
    </>
  );
}

window.__ATTA_PAGE__ = true;
const pageRoot = ReactDOM.createRoot(document.getElementById('root'));
pageRoot.render(<Page />);
