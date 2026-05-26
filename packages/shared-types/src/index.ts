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
  layers: Array<{ baseId: string; fillingId: string; weight: number; baseName?: string; fillingName?: string }>;
  coating: {
    type: string;
    coatingId: string;
    coatingName?: string;
    glazeVariant: string;
    withDrips: boolean;
    colorMode?: string;
    secondaryGlazeVariant?: string;
    visual?: { mode: string; primaryColor: string; secondaryColor?: string; splashes?: boolean };
  };
  activeDecorations: string[];
  selectedDecorations?: Array<{ variantId: string; decorationId: string; quantity: number; name?: string }>;
  decorationInstances?: Array<{
    instanceId: string;
    decorationId: string;
    visualKey: string;
    position: { x: number; y: number; z: number };
    name?: string;
  }>;
  /** @deprecated Candles are paid decorations; kept optional for legacy persisted carts. */
  hasCandle?: boolean;
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

/** Full coating configuration for one cake. */
export interface CakeCoating {
  type: CoatingType;
  coatingId: string;
  glazeVariant: string;
  withDrips: boolean;
  visual?: { mode: 'solid' | 'gradient' | 'splashes'; primaryColor: string; secondaryColor?: string; splashes?: boolean };
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
  visualKey: string;
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
  visualKey: string;
  available: boolean;
}

/** Coating ingredient. */
export interface IngredientCoating {
  id: string;
  type: CoatingType;
  name: string;
  pricePerKg: number;
  visualKey: string;
  available: boolean;
}

/** Decoration item (topper, flowers, figurines, etc.). */
export interface IngredientDecoration {
  id: string;
  name: string;
  category: string;
  pricePerUnit: number;
  visualKey: string;
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
// Search
// ---------------------------------------------------------------------------

/** A single search result item returned by GET /api/search. */
export interface SearchHit {
  id: string;
  name: string;
  /** Product name with matched tokens wrapped in <mark> tags, or null if no highlight. */
  highlightedName: string | null;
  /** Product description with matched tokens wrapped in <mark> tags, or null if no highlight. */
  highlightedDescription: string | null;
  slug: string;
  imageUrl: string | null;
  pricePerKg: number | null;
  pricePerUnit: number | null;
  priceType: PriceType;
  category: string;
}

// ---------------------------------------------------------------------------
// Promo Codes
// ---------------------------------------------------------------------------

/** Type of discount applied by a promo code. */
export type DiscountType = 'percentage' | 'fixed';

/** Promo code entity as returned by admin API endpoints. */
export interface PromoCodeInfo {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usageCount: number;
  isActive: boolean;
  description: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** Result of promo code validation (POST /promo-codes/validate). */
export interface PromoValidationResult {
  valid: boolean;
  promoCodeId?: string;
  code: string;
  discountType?: DiscountType;
  discountValue?: number;
  /** Calculated discount amount in kopecks for the given cart total. */
  discountAmount: number;
  /** Human-readable reason if the code is invalid. */
  message?: string;
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
