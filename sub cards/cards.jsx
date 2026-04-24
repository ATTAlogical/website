/* ATTA subscription tier cards */

const TIERS = [
  {
    key: 'basic',
    label: 'Basic',
    latin: 'Plantula',
    price: '€12',
    cadence: '/ month',
    descriptor: 'A seed set down.',
    img: 'assets/seedling.png',
    imgW: 190,
    imgH: 176,
    intensity: 0.95,
    pip: 1,
    plantCorner: 'bottom-right',
  },
  {
    key: 'blooming',
    label: 'Blooming',
    latin: 'Germinatio',
    price: '€30',
    cadence: '/ month',
    descriptor: 'First leaf, unfolding.',
    img: 'assets/sprig.png',
    imgW: 260,
    imgH: 214,
    intensity: 0.95,
    pip: 2,
    plantCorner: 'top-right',
  },
  {
    key: 'flourished',
    label: 'Flourished',
    latin: 'Frondescentia',
    price: '€65',
    cadence: '/ month',
    descriptor: '',
    img: 'assets/branch.png',
    imgW: 380,
    imgH: 212,
    intensity: 0.95,
    pip: 3,
    plantCorner: 'bottom-right',
    // Second plant layered on this card (palm fronds hanging from top-right)
    plant2: {
      img: 'assets/palm.png',
      imgW: 170,
      imgH: 255,
      corner: 'top-right',
      intensity: 0.95,
    },
  },
  {
    key: 'tropical',
    label: 'Silva pluvialis',
    latin: 'Silva pluvialis',
    price: '€120',
    cadence: '/ month',
    descriptor: 'Canopy. Entire weather.',
    img: 'assets/canopy.png',
    imgW: 340,
    imgH: 510,   // ~658:987 aspect
    intensity: 0.95,
    pip: 4,
    plantCorner: 'top-right',
  },
];
// restore Tropical label (copy-paste stumble above)
TIERS[3].label = 'Tropical';

/* Per-tier tweak defaults — scale (multiplier) + offset (fraction of image bleeding past corner).
   Card 2's y default is pulled UP so the vine doesn't clip the bottom edge of its cell. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "basic_scale": 1,
  "basic_x": 0.28,
  "basic_y": -0.05,
  "blooming_scale": 1,
  "blooming_x": -0.02,
  "blooming_y": 0.12,
  "flourished_scale": 1,
  "flourished_x": 0.15,
  "flourished_y": -0.1,
  "flourished2_scale": 1,
  "flourished2_x": -0.05,
  "flourished2_y": 0.08,
  "tropical_scale": 1,
  "tropical_x": 0.35,
  "tropical_y": 0.35
}/*EDITMODE-END*/;

/* ─────────────────────────────────────────────────────────────
   Card — canonical specimen card
   ───────────────────────────────────────────────────────────── */

function TierCard({ tier, height = 420, width = 300, tweaks }) {
  const scale = tweaks[`${tier.key}_scale`] ?? 1;
  const ox = tweaks[`${tier.key}_x`] ?? 0.35;
  const oy = tweaks[`${tier.key}_y`] ?? 0.35;
  const corner = tier.plantCorner || 'bottom-right';
  const imgW = tier.imgW * scale;
  const imgH = tier.imgH * scale;

  const plantStyle = { width: imgW, height: imgH, opacity: tier.intensity };
  if (corner === 'top-right')       { plantStyle.right = -imgW * ox; plantStyle.top = -imgH * oy; }
  else if (corner === 'top-left')   { plantStyle.left  = -imgW * ox; plantStyle.top = -imgH * oy; }
  else if (corner === 'bottom-left'){ plantStyle.left  = -imgW * ox; plantStyle.bottom = -imgH * oy; }
  else                              { plantStyle.right = -imgW * ox; plantStyle.bottom = -imgH * oy; }

  return (
    <article className="tier-card" style={{ height, width }}>
      <div className="tier-plant" style={plantStyle}>
        <img src={tier.img + '?v=5'} alt="" draggable="false" />
      </div>

      {tier.plant2 && (() => {
        const p2 = tier.plant2;
        const k2 = tier.key + '2';
        const s2 = tweaks[`${k2}_scale`] ?? 1;
        const x2 = tweaks[`${k2}_x`] ?? 0.1;
        const y2 = tweaks[`${k2}_y`] ?? 0.05;
        const w2 = p2.imgW * s2, h2 = p2.imgH * s2;
        const st2 = { width: w2, height: h2, opacity: p2.intensity ?? 0.95 };
        const c2 = p2.corner || 'top-right';
        if (c2 === 'top-right')       { st2.right = -w2 * x2; st2.top = -h2 * y2; }
        else if (c2 === 'top-left')   { st2.left  = -w2 * x2; st2.top = -h2 * y2; }
        else if (c2 === 'bottom-left'){ st2.left  = -w2 * x2; st2.bottom = -h2 * y2; }
        else                          { st2.right = -w2 * x2; st2.bottom = -h2 * y2; }
        return (
          <div className="tier-plant" style={st2}>
            <img src={p2.img + '?v=5'} alt="" draggable="false" />
          </div>
        );
      })()}

      <header className="tier-head">
        <span className="tier-index">{String(TIERS.indexOf(tier) + 1).padStart(2, '0')}</span>
        <span className="tier-pips" aria-hidden="true">
          {[...Array(4)].map((_, i) => (
            <span key={i} className={`pip ${i < tier.pip ? 'pip-on' : ''}`} />
          ))}
        </span>
      </header>

      <div className="tier-label-block">
        <div className="tier-label">{tier.label}</div>
        <div className="tier-latin">{tier.latin}</div>
      </div>

      <div className="tier-price-block">
        <div className="tier-price">{tier.price}</div>
        <div className="tier-cadence">{tier.cadence}</div>
      </div>

      <p className="tier-descriptor">{tier.descriptor}</p>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────
   Layouts
   ───────────────────────────────────────────────────────────── */

function LayoutRow({ tweaks }) {
  return (
    <div className="artboard-surface layout-row">
      <div className="plate-meta">
        <div className="meta-l">
          <div className="meta-kicker">ATTA / Logical</div>
          <div className="meta-title">Specimen Index — Subscription Tiers</div>
        </div>
        <div className="meta-r">
          <div className="meta-small">Plate 01 / IV</div>
          <div className="meta-small">Cat. ATTA·SUB·2026</div>
        </div>
      </div>

      <div className="row-grid">
        {TIERS.map((t) => (
          <TierCard key={t.key} tier={t} height={440} width={260} tweaks={tweaks} />
        ))}
      </div>

      <div className="plate-foot">
        <span>ATTA</span><span>—</span>
        <span>observed and catalogued</span>
        <span>—</span><span>B. van Camp</span>
      </div>
    </div>
  );
}

function LayoutStagger({ tweaks }) {
  const offsets = [60, 20, 90, 0];
  return (
    <div className="artboard-surface layout-stagger">
      <div className="stagger-head">
        <div className="stagger-kicker">Four tiers, four climates</div>
        <div className="stagger-lead">
          A subscription is a small weather system.<br />
          You choose how much of it grows around you.
        </div>
      </div>

      <div className="stagger-rail">
        {TIERS.map((t, i) => (
          <div key={t.key} className="stagger-slot" style={{ transform: `translateY(${offsets[i]}px)` }}>
            <TierCard tier={t} height={420 + (i % 2 === 0 ? 0 : 30)} width={240} tweaks={tweaks} />
            <div className="stagger-caption">
              <span className="stagger-caption-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="stagger-caption-txt">{t.latin}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="stagger-foot"><span>ATTA · Laugical</span></div>
    </div>
  );
}

function LayoutPlate({ tweaks }) {
  const sizes = [
    { w: 300, h: 340 },
    { w: 340, h: 380 },
    { w: 380, h: 420 },
    { w: 420, h: 460 },
  ];
  return (
    <div className="artboard-surface layout-plate">
      <div className="plate-border">
        <div className="plate-title-row">
          <div className="plate-title-l">
            <div className="plate-family">FAMILIA · ATTA</div>
            <div className="plate-species">Subscriptiones — genus quadripartitum</div>
          </div>
          <div className="plate-title-r">
            <div className="plate-no">Plate</div>
            <div className="plate-no-big">IV</div>
          </div>
        </div>

        <div className="plate-rule" />

        <div className="plate-grid">
          {TIERS.map((t, i) => (
            <div key={t.key} className="plate-cell">
              <div className="plate-cell-head">
                <span className="plate-cell-roman">{['I', 'II', 'III', 'IV'][i]}</span>
                <span className="plate-cell-sep" />
                <span className="plate-cell-latin">{t.latin}</span>
              </div>
              <div className="plate-cell-body">
                <TierCard tier={t} height={sizes[i].h} width={sizes[i].w} tweaks={tweaks} />
              </div>
            </div>
          ))}
        </div>

        <div className="plate-rule" />

        <div className="plate-footer-row">
          <div className="plate-foot-col"><div className="plate-foot-k">Observator</div><div className="plate-foot-v">Bilal van Camp</div></div>
          <div className="plate-foot-col"><div className="plate-foot-k">Anno</div><div className="plate-foot-v">MMXXVI</div></div>
          <div className="plate-foot-col"><div className="plate-foot-k">Locus</div><div className="plate-foot-v">Antverpiae</div></div>
          <div className="plate-foot-col"><div className="plate-foot-k">Catalogus</div><div className="plate-foot-v">ATTA·SUB·2026</div></div>
        </div>
      </div>
    </div>
  );
}

function LayoutCloseup({ tweaks }) {
  return (
    <div className="artboard-surface layout-closeup">
      <div className="closeup-marginalia closeup-tl">
        <div className="meta-kicker">Reference</div>
        <div className="meta-title">Canonical card — Tropical</div>
      </div>
      <div className="closeup-marginalia closeup-tr">
        <div className="meta-small">0.5px border</div>
        <div className="meta-small">10px radius</div>
        <div className="meta-small">plant at {Math.round(TIERS[3].intensity * 100)}% opacity</div>
      </div>
      <div className="closeup-stage">
        <TierCard tier={TIERS[3]} height={560} width={400} tweaks={tweaks} />
      </div>
      <div className="closeup-marginalia closeup-bl">
        <div className="meta-small">Prata / 400</div>
        <div className="meta-small">system sans / tracking 0.2em</div>
      </div>
      <div className="closeup-marginalia closeup-br">
        <div className="meta-small">ATTA — specimen card</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tweaks-wired App (used only by Subscription Cards.html design canvas)
   ───────────────────────────────────────────────────────────── */

function CanvasApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const cardControls = (key, label) => (
    <TweakSection label={label}>
      <TweakSlider label="Scale"    value={t[`${key}_scale`]} min={0.4} max={2}   step={0.05}                         onChange={(v) => setTweak(`${key}_scale`, v)} />
      <TweakSlider label="Offset X" value={t[`${key}_x`]}     min={-0.4} max={0.6} step={0.01}                          onChange={(v) => setTweak(`${key}_x`, v)} />
      <TweakSlider label="Offset Y" value={t[`${key}_y`]}     min={-0.4} max={0.6} step={0.01}                          onChange={(v) => setTweak(`${key}_y`, v)} />
    </TweakSection>
  );

  return (
    <>
      <DesignCanvas title="ATTA — Subscription Tier Cards" subtitle="Taxonomy plate, four specimens.">
        <DCSection id="variants" title="Specimen plate">
          <DCArtboard id="plate"   label="Taxonomy plate (2×2)"     width={1400} height={1180}>
            <LayoutPlate tweaks={t} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Plant placement">
        {cardControls('basic',      '01 · Basic · Plantula')}
        {cardControls('blooming',   '02 · Blooming · Germinatio')}
        {cardControls('flourished', '03 · Flourished · fern')}
        {cardControls('flourished2','03 · Flourished · palm')}
        {cardControls('tropical',   '04 · Tropical · Silva pluvialis')}
      </TweaksPanel>
    </>
  );
}

const root = document.getElementById('root');
if (root && !window.__ATTA_PAGE__) {
  ReactDOM.createRoot(root).render(<CanvasApp />);
}
