// =============================================================================
// @bakery/shared-types
// Shared TypeScript types used by both @bakery/api and @bakery/web.
// These definitions are the single source of truth — do not duplicate locally.
// =============================================================================

// ---------------------------------------------------------------------------
// Auth / User
// ---------------------------------------------------------------------------

/** User role in the system. */
export type UserRole = 'user' | 'admin';

/**
 * User data safe for client exposure.
 * Excludes passwordHash and updatedAt.
 * Mirrors: apps/api/src/common/types/user.type.ts
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * All possible order lifecycle statuses.
 * Mirrors: apps/api/src/admin/dto/update-status.dto.ts (OrderStatus enum)
 *          apps/web/src/components/account/OrderCard.tsx (OrderStatus type)
 */
export type OrderStatus =
  | 'created'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

/** Pickup time window options. */
export type PickupTimeSlot = 'morning' | 'day' | 'evening';

/** Discriminator for order line items. */
export type OrderItemType = 'product' | 'constructor';

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

/**
 * Cake configuration payload stored inside a constructor cart item.
 * Mirrors: apps/web/src/stores/cart-store.ts (CakeConfigData)
 */
export interface CakeConfigData {
  shape: string;
  tierCount: number;
  layers: Array<{ baseId: string; fillingId: string; weight: number }>;
  coating: { type: string; color: string };
  decorations: Array<{ decorationId: string; position: number[] }>;
  inscription?: string;
}

/**
 * A single item in the shopping cart.
 * Mirrors: apps/web/src/stores/cart-store.ts (CartItem)
 */
export interface CartItem {
  id: string;
  type: OrderItemType;
  productId?: string;
  name: string;
  imageUrl: string;
  weight: number;
  price: number;
  quantity: number;
  inscription?: string;
  cakeConfig?: CakeConfigData;
}

// ---------------------------------------------------------------------------
// Constructor catalog
// ---------------------------------------------------------------------------

/** Cake shape options available in the constructor. */
export type CakeShape = 'circle' | 'square' | 'heart';

/** Number of cake tiers. */
export type TierCount = 1 | 2 | 3;

/** Coating material type. */
export type CoatingType = 'cream' | 'fondant';

/** A single sponge/filling layer in a multi-tier cake. */
export interface CakeLayer {
  baseId: string;
  fillingId: string;
  weight: number;
}

/** Gradient coating option. */
export interface CoatingGradient {
  enabled: boolean;
  gradientEndColor: string;
  direction: 'vertical' | 'horizontal';
}

/** Drip decoration on top of the coating. */
export interface CoatingDrips {
  enabled: boolean;
  color: string;
  intensity: number;
}

/** Full coating configuration for one cake. */
export interface CakeCoating {
  type: CoatingType;
  coatingId: string;
  color: string;
  gradient: CoatingGradient | null;
  drips: CoatingDrips | null;
}

/** A placed decoration instance on the 3-D canvas. */
export interface PlacedDecoration {
  id: string;
  decorationId: string;
  position: [number, number, number];
  normal: [number, number, number];
}

/** Sponge/base ingredient. */
export interface IngredientBase {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  color?: string;
  available: boolean;
}

/** Filling category values matching the DB enum. */
export type FillingCategory =
  | 'white'
  | 'chocolate'
  | 'honey'
  | 'sour_cream'
  | 'shortcrust'
  | 'specialty';

/** Filling ingredient. */
export interface IngredientFilling {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  category: FillingCategory;
  available: boolean;
}

/** Coating ingredient. */
export interface IngredientCoating {
  id: string;
  type: CoatingType;
  name: string;
  pricePerKg: number;
  available: boolean;
}

/** Decoration item (topper, flowers, figurines, etc.). */
export interface IngredientDecoration {
  id: string;
  name: string;
  category: string;
  pricePerUnit: number;
  available: boolean;
}

/** Shape metadata including price surcharge. */
export interface ShapeInfo {
  id: CakeShape;
  name: string;
  surchargePercent: number;
}

/** Per-tier price surcharge entry. */
export interface TierSurcharge {
  tierCount: TierCount;
  surcharge: number;
}

/** Business rules / limits for the constructor. */
export interface ConstructorConfig {
  maxDecorations: number;
  maxInscriptionLength: number;
  minWeightPerTier: number;
  maxWeightPerTier: number;
  weightStep: number;
}

/**
 * Full constructor ingredients catalog returned by GET /api/constructor/ingredients.
 * Mirrors: apps/web/src/stores/constructor-store.ts (ConstructorCatalog)
 */
export interface ConstructorCatalog {
  bases: IngredientBase[];
  fillings: IngredientFilling[];
  coatings: IngredientCoating[];
  decorations: IngredientDecoration[];
  shapes: ShapeInfo[];
  tierSurcharges: TierSurcharge[];
  config: ConstructorConfig;
}

// ---------------------------------------------------------------------------
// Product catalog
// ---------------------------------------------------------------------------

/** How the product is priced. */
export type PriceType = 'per_kg' | 'per_unit';

/** Product category summary. */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * A single product as returned by GET /api/products and GET /api/products/:slug.
 * Mirrors: apps/web/src/components/catalog/ProductCard.tsx (Product interface)
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  composition?: string | null;
  imageUrl?: string | null;
  images?: string[];
  priceType: PriceType;
  /** Price per kilogram in kopecks. Present only when priceType === 'per_kg'. */
  pricePerKg?: number | null;
  /** Price per unit in kopecks. Present only when priceType === 'per_unit'. */
  pricePerUnit?: number | null;
  /** Numeric string in kg, e.g. "1.0" */
  minWeight?: string;
  /** Numeric string in kg, e.g. "5.0" */
  maxWeight?: string;
  /** Numeric string in kg, e.g. "0.5" */
  weightStep?: string;
  isAvailable?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  category?: ProductCategory | null;
  occasions?: Array<{ id: string; name: string; slug: string }>;
}

// ---------------------------------------------------------------------------
// API response wrapper
// ---------------------------------------------------------------------------

/**
 * Standard API envelope used by all endpoints.
 * Mirrors: apps/web/src/lib/api.ts (ApiResponse)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
  timestamp?: string;
  statusCode?: number;
}

/** Pagination metadata included in list responses. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}
