export type ProductType = 'one-of-one' | 'made-to-order' | 'dropship';

export type AvailabilityState =
  | { kind: 'in-stock'; quantity?: number }
  | { kind: 'made-to-order'; fulfillment: 'ready' | 'days' | 'week' }
  | { kind: 'sold'; soldAt?: string }
  | { kind: 'coming-soon' }
  | { kind: 'drop'; opensAt: string; closesAt?: string };

export type StoreProduct = {
  slug: string;
  /** Lineage family id — for one-of-ones that share a product name (e.g. "clear-bag") */
  lineageId?: string;
  /** Display version label: "01", "02", or a short descriptor */
  lineageVersion?: string;
  type: ProductType;
  name: string;
  description: string;
  /** Material / construction note — shown on made-to-order and one-of-ones */
  material?: string;
  price: number;
  currency: 'EUR';
  /** Paths from /public */
  images: string[];
  availability: AvailabilityState;
  tags?: string[];
  /** Dev flag — remove when the product is real and ready */
  placeholder?: boolean;
  /** Makes the dropship grid item span 2 columns with a wider image */
  featured?: boolean;
};

export type ProductLineage = {
  id: string;
  name: string;
  description: string;
};

// ─── Lineages ─────────────────────────────────────────────────────────────────
// Add lineage entries when a one-of-one product type has multiple versions.
export const PRODUCT_LINEAGES: ProductLineage[] = [
  {
    id: 'clear-bag',
    name: 'Clear Bag',
    description: 'Reworked transparent vinyl shoulder bag — each piece individually composed.',
  },
];

// ─── Products ─────────────────────────────────────────────────────────────────
// Test products — replace with real catalogue when launching.
// Product type governs visual density in the store listing:
//   dropship    → compact, scannable, can group
//   made-to-order → medium presence, horizontal layout, fulfillment indicator
//   one-of-one  → full presence, singular treatment, version record
export const STORE_PRODUCTS: StoreProduct[] = [
  // ── Dropship ──
  {
    slug: 'sticker-laugical-mark',
    type: 'dropship',
    name: 'Laugical mark sticker',
    description: 'Die-cut vinyl, weatherproof. 7×7 cm.',
    price: 4.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'in-stock', quantity: 50 },
    tags: ['sticker'],
    placeholder: true,
  },
  {
    slug: 'sticker-atta-logo',
    type: 'dropship',
    name: 'ATTA logo sticker',
    description: 'Holographic finish. 5×5 cm.',
    price: 4.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'in-stock', quantity: 30 },
    tags: ['sticker'],
    placeholder: true,
  },
  {
    slug: 'print-construct-01',
    type: 'dropship',
    name: 'Construct 01 — A4 print',
    description: 'Giclée print on 230gsm matte. Edition of 50.',
    price: 22.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'in-stock', quantity: 12 },
    tags: ['print'],
    placeholder: true,
  },
  {
    slug: 'print-field-record',
    type: 'dropship',
    name: 'Field Record — A3 print',
    description: 'Giclée print on 230gsm matte. Edition of 25.',
    price: 38.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'coming-soon' },
    tags: ['print'],
    placeholder: true,
  },

  {
    slug: 'sticker-system-error',
    type: 'dropship',
    name: 'System Error sticker',
    description: 'Die-cut vinyl, weatherproof. 9×5 cm.',
    price: 4.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'in-stock', quantity: 40 },
    tags: ['sticker'],
    placeholder: true,
  },
  {
    slug: 'zine-archive-vol1',
    type: 'dropship',
    name: 'Archive Vol. 1 — zine',
    description: 'A5 risograph zine, 24 pages. First edition of 100.',
    price: 14.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'coming-soon' },
    tags: ['print', 'zine'],
    placeholder: true,
  },
  {
    slug: 'print-atlas-a2',
    type: 'dropship',
    name: 'Atlas — A2 print',
    description: 'Large format Giclée on 310gsm cotton rag. Edition of 15.',
    price: 65.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'in-stock', quantity: 8 },
    tags: ['print'],
    featured: true,
    placeholder: true,
  },

  // ── Made to order ──
  {
    slug: 'tee-logical-fade',
    type: 'made-to-order',
    name: 'Logical Fade tee',
    description: 'Heavyweight cotton, screen-printed graphic.',
    material: '100% organic cotton, 240gsm.',
    price: 45.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'made-to-order', fulfillment: 'days' },
    tags: ['apparel'],
    placeholder: true,
  },
  {
    slug: 'hoodie-atta-archive',
    type: 'made-to-order',
    name: 'ATTA Archive hoodie',
    description: 'Embroidered chest mark, garment-dyed.',
    material: '380gsm brushed-back cotton fleece.',
    price: 95.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'made-to-order', fulfillment: 'week' },
    tags: ['apparel'],
    placeholder: true,
  },

  {
    slug: 'cap-atta-mark',
    type: 'made-to-order',
    name: 'ATTA Mark cap',
    description: 'Six-panel structured cap, embroidered ATTA mark.',
    material: 'Cotton twill, adjustable buckle strap.',
    price: 55.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'made-to-order', fulfillment: 'week' },
    tags: ['apparel'],
    placeholder: true,
  },

  // ── One of one ──
  {
    slug: 'clear-bag-001',
    lineageId: 'clear-bag',
    lineageVersion: '01',
    type: 'one-of-one',
    name: 'Clear Bag No. 01',
    description: 'Transparent PVC, internal collage of pressed flora and Dymo-tape annotations.',
    material: 'PVC, cotton webbing, brass hardware.',
    price: 180.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'in-stock', quantity: 1 },
    tags: ['bag', 'one-of-one'],
    placeholder: true,
  },
  {
    slug: 'clear-bag-002',
    lineageId: 'clear-bag',
    lineageVersion: '02',
    type: 'one-of-one',
    name: 'Clear Bag No. 02',
    description: 'Transparent PVC, internal layered receipts and waxed thread structure.',
    material: 'PVC, waxed cotton thread, steel rivets.',
    price: 195.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'sold', soldAt: '2026-04-12' },
    tags: ['bag', 'one-of-one'],
    placeholder: true,
  },
  {
    slug: 'clear-bag-003',
    lineageId: 'clear-bag',
    lineageVersion: '03',
    type: 'one-of-one',
    name: 'Clear Bag No. 03',
    description: 'Transparent PVC with internal collage — composition in progress.',
    price: 210.0,
    currency: 'EUR',
    images: [],
    availability: { kind: 'coming-soon' },
    tags: ['bag', 'one-of-one'],
    placeholder: true,
  },
];
