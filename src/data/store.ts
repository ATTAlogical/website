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
};

export type ProductLineage = {
  id: string;
  name: string;
  description: string;
};

// ─── Lineages ─────────────────────────────────────────────────────────────────
// Add lineage entries when a one-of-one product type has multiple versions.
export const PRODUCT_LINEAGES: ProductLineage[] = [];

// ─── Products ─────────────────────────────────────────────────────────────────
// Empty at launch. Add products here as they become available.
// Product type governs visual density in the store listing:
//   dropship    → compact, scannable, can group
//   made-to-order → medium presence, horizontal layout, fulfillment indicator
//   one-of-one  → full presence, singular treatment, version record
export const STORE_PRODUCTS: StoreProduct[] = [];
