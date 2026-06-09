import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';
import {
  getDecorationAllowedSurfaces,
  getDecorationPlacementRule,
  getDecorationReplacementGroup,
  getGlazeColor,
  isDecoVisualKeyAvailable,
  isFillVisualKeyAvailable,
  isFullTierVisualKeyAvailable,
  isGlazeVisualKeyAvailable,
  type CakeShape as RegistryCakeShape,
} from '@/lib/constructor/model-registry';
import { buildCakeStackLayout, clampDecorationXZ } from '@/lib/constructor/geometry';

export type CakeShape = 'circle' | 'square' | 'heart';
export type TierCount = 1 | 2 | 3 | 4;
export type CoatingType = 'cream' | 'fondant';
export type ConstructorStep = 1 | 2 | 3 | 4 | 5;
export type ColorMode = 'solid';
export type ViewMode = 'orbit' | 'top' | 'focus';
export type PricingStatus = 'idle' | 'stale' | 'updating' | 'verified' | 'error';

export interface CakeLayer {
  baseId: string;
  fillingId: string;
  weight: number;
}

export interface CoatingVisual {
  mode: ColorMode;
  primaryColor: string;
  secondaryColor?: string;
  splashes?: boolean;
}

export interface CakeCoating {
  type: CoatingType;
  coatingId: string;
  glazeVariant: string;
  withDrips: boolean;
  colorMode: ColorMode;
  secondaryGlazeVariant?: string;
  visual: CoatingVisual;
}

export interface IngredientBase {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  visualKey: string;
  color?: string;
  available: boolean;
}

export type FillingCategory =
  | 'white'
  | 'chocolate'
  | 'honey'
  | 'sour_cream'
  | 'shortcrust'
  | 'specialty';

export interface IngredientFilling {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  /** Category as returned by the API. May be absent in legacy mock data. */
  category?: FillingCategory;
  visualKey: string;
  imageUrl?: string;
  available: boolean;
}

export interface IngredientCoating {
  id: string;
  type: CoatingType;
  name: string;
  pricePerKg: number;
  visualKey: string;
  available: boolean;
}

export interface IngredientDecoration {
  id: string;
  name: string;
  category: string;
  pricePerUnit: number;
  visualKey: string;
  modelUrl?: string;
  available: boolean;
}

export interface DecorationSelection {
  variantId: string;
  decorationId: string;
  quantity: number;
}

export interface DecorationPosition {
  x: number;
  y: number;
  z: number;
}

export interface DecorationRotation {
  x: number;
  y: number;
  z: number;
}

export type DecorationSurface = 'top' | 'side';

export interface DecorationPlacement {
  surface: DecorationSurface;
  tierIndex: number;
  normal: DecorationPosition;
}

export interface DecorationInstance {
  instanceId: string;
  decorationId: string;
  visualKey: string;
  modelUrl?: string;
  position: DecorationPosition;
  rotation?: DecorationRotation;
  placement?: DecorationPlacement;
}

export interface ShapeInfo {
  id: CakeShape;
  name: string;
  surchargePercent: number;
}

export interface TierSurcharge {
  tierCount: TierCount;
  surcharge: number;
}

export interface ConstructorConfig {
  maxDecorations: number;
  maxInscriptionLength: number;
  minWeightPerTier: number;
  maxWeightPerTier: number;
  weightStep: number;
}

export interface ConstructorCatalog {
  bases: IngredientBase[];
  fillings: IngredientFilling[];
  coatings: IngredientCoating[];
  decorations: IngredientDecoration[];
  shapes: ShapeInfo[];
  tierSurcharges: TierSurcharge[];
  config: ConstructorConfig;
}

export interface ConstructorState {
  currentStep: ConstructorStep;
  viewMode: ViewMode;
  shape: CakeShape;
  tierCount: TierCount;
  layers: CakeLayer[];
  coating: CakeCoating;
  activeDecorations: string[];
  selectedDecorations: DecorationSelection[];
  decorationInstances: DecorationInstance[];
  selectedDecorationInstanceId: string | null;
  hasCandle: boolean;
  inscription: string;
  ingredients: ConstructorCatalog | null;
  totalPrice: number;
  pricingStatus: PricingStatus;
  priceBreakdown: ConstructorPriceBreakdown | null;
  priceError: string | null;
  priceVerifiedAt: number | null;
  lastPricingSignature: string | null;
  isLoading: boolean;

  setStep: (step: ConstructorStep) => void;
  setViewMode: (mode: ViewMode) => void;
  setShape: (shape: CakeShape) => void;
  setTierCount: (count: TierCount) => void;
  setLayerBase: (tierIndex: number, baseId: string) => void;
  setLayerFilling: (tierIndex: number, fillingId: string) => void;
  setLayerWeight: (tierIndex: number, weight: number) => void;
  setCoatingType: (type: CoatingType) => void;
  setCoatingId: (id: string) => void;
  setGlazeVariant: (variant: string) => void;
  addDecoration: (variantId: string, decorationId?: string) => void;
  addDecorationInstance: (
    visualKey: string,
    decorationId?: string,
    position?: Partial<DecorationPosition>,
    placement?: Partial<DecorationPlacement>,
  ) => void;
  selectDecorationInstance: (instanceId: string | null) => void;
  duplicateDecorationInstance: (instanceId: string) => void;
  moveDecorationInstance: (
    instanceId: string,
    position: Partial<DecorationPosition>,
    placement?: Partial<DecorationPlacement>,
  ) => void;
  rotateDecorationInstance: (instanceId: string, rotation: Partial<DecorationRotation>) => void;
  removeDecorationInstance: (instanceId: string) => void;
  removeDecoration: (variantId: string) => void;
  clearDecorations: () => void;
  setHasCandle: (hasCandle: boolean) => void;
  setInscription: (text: string) => void;
  loadIngredients: () => Promise<void>;
  recalculatePrice: () => void;
  syncServerPrice: () => Promise<void>;
  reset: () => void;
  getConfig: () => ConstructorConfig | null;
}

export interface ConstructorPriceBreakdown {
  tiers?: Array<{
    weightKg: number;
    base: { id: string; name: string; pricePerKg: number };
    filling: { id: string; name: string; pricePerKg: number };
    baseCost: number;
    fillingCost: number;
  }>;
  coating?: { id: string; name: string; pricePerKg: number; cost: number };
  decorations?: Array<{
    id: string;
    name: string;
    pricePerUnit: number;
    quantity: number;
    cost: number;
  }>;
  subtotal: number;
  shapeSurcharge: number;
  tierSurcharge: number;
  totalPrice: number;
  totalWeightKg: number;
}

const DEFAULT_LAYER: CakeLayer = {
  baseId: '',
  fillingId: '',
  weight: 1000,
};

const DEFAULT_COATING: CakeCoating = {
  type: 'cream',
  coatingId: '',
  glazeVariant: '',
  withDrips: false,
  colorMode: 'solid' as ColorMode,
  visual: {
    mode: 'solid',
    primaryColor: getGlazeColor('cream'),
  },
};

const DEFAULT_DECORATION_POSITION: Record<string, DecorationPosition> = {
  surfaceDecor: { x: 0, y: 0, z: 0 },
  candle: { x: 0, y: 0, z: 0.28 },
};
const DEFAULT_DECORATION_ROTATION: DecorationRotation = { x: 0, y: 0, z: 0 };
const DEFAULT_TOP_DECORATION_NORMAL: DecorationPosition = { x: 0, y: 1, z: 0 };
const DEFAULT_SIDE_DECORATION_NORMAL: DecorationPosition = { x: 1, y: 0, z: 0 };
const SHAPE_ORDER: CakeShape[] = ['circle', 'square', 'heart'];

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function uniqueDecorationKeys(variantIds: string[]): string[] {
  return Array.from(new Set(asArray(variantIds).filter(Boolean)));
}

export function normalizeCoating(coating?: Partial<CakeCoating> | null): CakeCoating {
  const glazeVariant = coating?.coatingId ? (coating?.glazeVariant ?? DEFAULT_COATING.glazeVariant) : '';

  return {
    type: coating?.type ?? DEFAULT_COATING.type,
    coatingId: coating?.coatingId ?? DEFAULT_COATING.coatingId,
    glazeVariant,
    withDrips: false,
    colorMode: 'solid',
    secondaryGlazeVariant: undefined,
    visual: {
      mode: 'solid',
      primaryColor: getGlazeColor(glazeVariant),
      splashes: false,
    },
  };
}

function normalizeConstructorStateFields(
  state: Partial<ConstructorState> & { decorVariant?: unknown },
): Partial<ConstructorState> {
  const tierCount = state.tierCount ?? 1;
  const legacyDecorVariant = typeof state.decorVariant === 'string' ? state.decorVariant : null;
  const activeDecorations = asArray(state.activeDecorations);
  const normalizedActiveDecorations =
    activeDecorations.length > 0
      ? uniqueDecorationKeys(activeDecorations)
      : legacyDecorVariant
        ? uniqueDecorationKeys([legacyDecorVariant])
        : [];
  const decorationInstances = normalizeDecorationInstances(asArray(state.decorationInstances), tierCount);
  const syncedDecorations = decorationInstances.length > 0
    ? syncDecorationState(decorationInstances)
    : {
        activeDecorations: normalizedActiveDecorations,
        selectedDecorations: asArray(state.selectedDecorations),
        hasCandle: normalizedActiveDecorations.includes('candle') || Boolean(state.hasCandle),
      };

  return {
    layers: buildLayers(tierCount, asArray(state.layers)),
    coating: normalizeCoating(state.coating),
    activeDecorations: syncedDecorations.activeDecorations,
    selectedDecorations: syncedDecorations.selectedDecorations,
    decorationInstances,
    selectedDecorationInstanceId: null,
    hasCandle: syncedDecorations.hasCandle,
    pricingStatus: 'stale',
    priceBreakdown: null,
    priceError: null,
    priceVerifiedAt: null,
    lastPricingSignature: null,
  };
}

const buildLayers = (count: TierCount, existing: CakeLayer[] = []): CakeLayer[] => {
  const arr: CakeLayer[] = [];
  for (let i = 0; i < count; i++) {
    arr.push(existing[i] ?? { ...DEFAULT_LAYER });
  }
  return arr;
};

export function createDecorationSelection(
  variantId: string,
  decorations: IngredientDecoration[],
  decorationId?: string,
): DecorationSelection | null {
  const availableDecorations = asArray(decorations).filter((decoration) => decoration.available);
  if (availableDecorations.length === 0) return null;

  const variant = variantId.toLowerCase();
  let selectedDecoration = decorationId
    ? availableDecorations.find((decoration) => decoration.id === decorationId)
    : undefined;

  if (!selectedDecoration) {
    selectedDecoration = availableDecorations.find(
      (decoration) => decoration.visualKey?.toLowerCase() === variant,
    );
  }

  const decoration = selectedDecoration;
  if (!decoration) return null;

  return {
    variantId,
    decorationId: decoration.id,
    quantity: 1,
  };
}

function buildDecorationSelections(
  variantIds: string[],
  decorations: IngredientDecoration[],
): DecorationSelection[] {
  return asArray(variantIds).flatMap((variantId) => {
    const selection = createDecorationSelection(variantId, decorations);
    return selection ? [selection] : [];
  });
}

function createDecorationInstanceId(): string {
  return `decor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTopTierIndex(tierCount: number | null | undefined): number {
  const normalizedTierCount = Number.isFinite(tierCount) ? Math.max(1, Math.trunc(Number(tierCount))) : 1;
  return normalizedTierCount - 1;
}

function normalizeDecorationSurface(surface: unknown): DecorationSurface {
  return surface === 'side' ? 'side' : 'top';
}

function normalizeDecorationNormal(
  normal: Partial<DecorationPosition> | null | undefined,
  surface: DecorationSurface,
): DecorationPosition {
  const fallback = surface === 'side' ? DEFAULT_SIDE_DECORATION_NORMAL : DEFAULT_TOP_DECORATION_NORMAL;
  const raw = {
    x: Number.isFinite(normal?.x) ? Number(normal?.x) : fallback.x,
    y: Number.isFinite(normal?.y) ? Number(normal?.y) : fallback.y,
    z: Number.isFinite(normal?.z) ? Number(normal?.z) : fallback.z,
  };
  const length = Math.hypot(raw.x, raw.y, raw.z);
  if (length <= 0.0001) return fallback;

  return {
    x: raw.x / length,
    y: raw.y / length,
    z: raw.z / length,
  };
}

function normalizeDecorationPlacement(
  placement: Partial<DecorationPlacement> | null | undefined,
  tierCount: number | null | undefined,
): DecorationPlacement {
  const surface = normalizeDecorationSurface(placement?.surface);
  const hasKnownTierCount = Number.isFinite(tierCount);
  const topTierIndex = getTopTierIndex(tierCount);
  const rawTierIndex = Number.isFinite(placement?.tierIndex)
    ? Math.max(0, Math.trunc(Number(placement?.tierIndex)))
    : topTierIndex;
  const tierIndex = hasKnownTierCount
    ? Math.max(0, Math.min(topTierIndex, rawTierIndex))
    : rawTierIndex;

  return {
    surface,
    tierIndex,
    normal: normalizeDecorationNormal(placement?.normal, surface),
  };
}

function normalizeDecorationPosition(
  visualKey: string,
  position?: Partial<DecorationPosition>,
): DecorationPosition {
  const slot = getDecorationPlacementRule(visualKey).slot;
  const fallback = DEFAULT_DECORATION_POSITION[slot] ?? DEFAULT_DECORATION_POSITION.surfaceDecor;

  return {
    x: position?.x ?? fallback.x,
    y: position?.y ?? fallback.y,
    z: position?.z ?? fallback.z,
  };
}

function normalizeDecorationRotation(rotation?: Partial<DecorationRotation> | null): DecorationRotation {
  return {
    x: Number.isFinite(rotation?.x) ? Number(rotation?.x) : DEFAULT_DECORATION_ROTATION.x,
    y: Number.isFinite(rotation?.y) ? Number(rotation?.y) : DEFAULT_DECORATION_ROTATION.y,
    z: Number.isFinite(rotation?.z) ? Number(rotation?.z) : DEFAULT_DECORATION_ROTATION.z,
  };
}

function normalizeDecorationInstance(instance: DecorationInstance, tierCount?: number): DecorationInstance {
  return {
    ...instance,
    position: normalizeDecorationPosition(instance.visualKey, instance.position),
    rotation: normalizeDecorationRotation(instance.rotation),
    placement: normalizeDecorationPlacement(instance.placement, tierCount),
  };
}

function compactDecorationSingletonGroups(instances: DecorationInstance[]): DecorationInstance[] {
  const result: DecorationInstance[] = [];

  for (const instance of asArray(instances)) {
    const replacementGroup = getDecorationReplacementGroup(instance.visualKey);
    if (replacementGroup) {
      const existingIndex = result.findIndex(
        (candidate) => getDecorationReplacementGroup(candidate.visualKey) === replacementGroup,
      );
      if (existingIndex >= 0) {
        result.splice(existingIndex, 1);
      }
    }
    result.push(instance);
  }

  return result;
}

function normalizeDecorationInstances(instances: DecorationInstance[], tierCount?: number): DecorationInstance[] {
  return compactDecorationSingletonGroups(
    asArray(instances).map((instance) => {
      const normalized = normalizeDecorationInstance(instance, tierCount);
      if (isDecorationPlacementAllowed(normalized.visualKey, normalized.placement)) {
        return normalized;
      }

      return {
        ...normalized,
        placement: normalizeDecorationPlacement(
          {
            surface: 'top',
            tierIndex: normalized.placement?.tierIndex,
            normal: DEFAULT_TOP_DECORATION_NORMAL,
          },
          tierCount,
        ),
      };
    }),
  );
}

function isDecorationPlacementAllowed(
  visualKey: string,
  placement: Partial<DecorationPlacement> | null | undefined,
): boolean {
  const surface = normalizeDecorationSurface(placement?.surface);
  return getDecorationAllowedSurfaces(visualKey).includes(surface);
}

function activeDecorationKeysFromInstances(instances: DecorationInstance[]): string[] {
  return Array.from(new Set(asArray(instances).map((instance) => instance.visualKey)));
}

function groupDecorationInstances(instances: DecorationInstance[]): DecorationSelection[] {
  const grouped = new Map<string, DecorationSelection>();

  for (const instance of asArray(instances)) {
    const current = grouped.get(instance.decorationId);
    if (current) {
      current.quantity += 1;
    } else {
      grouped.set(instance.decorationId, {
        variantId: instance.visualKey,
        decorationId: instance.decorationId,
        quantity: 1,
      });
    }
  }

  return Array.from(grouped.values());
}

function syncDecorationState(instances: DecorationInstance[]): Pick<
  ConstructorState,
  'activeDecorations' | 'selectedDecorations' | 'hasCandle'
> {
  const normalizedInstances = asArray(instances);
  const activeDecorations = activeDecorationKeysFromInstances(normalizedInstances);

  return {
    activeDecorations,
    selectedDecorations: groupDecorationInstances(normalizedInstances),
    hasCandle: activeDecorations.includes('candle'),
  };
}

function getLayerBaseVariant(layer: CakeLayer, ingredients: ConstructorCatalog | null): string {
  return ingredients?.bases.find((base) => base.id === layer.baseId)?.visualKey ?? 'default';
}

function getDecorationBaseYForState(
  state: Pick<ConstructorState, 'shape' | 'tierCount' | 'layers' | 'coating' | 'ingredients'>,
): number {
  const coating = normalizeCoating(state.coating);
  const layout = buildCakeStackLayout({
    shape: state.shape as RegistryCakeShape,
    tiers: buildLayers(state.tierCount, asArray(state.layers)).map((layer) => ({
      baseVariant: getLayerBaseVariant(layer, state.ingredients),
    })),
    glazeVariant: coating.coatingId ? coating.glazeVariant : '',
    withDrips: false,
    decorations: [],
  });

  return layout.decorationBaseY;
}

function withDecorationBaseY(
  instances: DecorationInstance[],
  decorationBaseY: number,
  tierCount?: number,
): DecorationInstance[] {
  return normalizeDecorationInstances(instances, tierCount).map((instance) => ({
    ...instance,
    position: {
      ...instance.position,
      y: instance.placement?.surface === 'side' ? instance.position.y : decorationBaseY,
    },
  }));
}

function createDefaultDecorationPosition(
  visualKey: string,
  instances: DecorationInstance[],
  shape: CakeShape,
  decorationBaseY: number,
): DecorationPosition {
  const normalizedInstances = asArray(instances);
  const slot = getDecorationPlacementRule(visualKey).slot;
  const fallback = DEFAULT_DECORATION_POSITION[slot] ?? DEFAULT_DECORATION_POSITION.surfaceDecor;
  const index = normalizedInstances.length;
  const angle = index * 2.399963229728653;
  const radius = Math.min(0.68, 0.16 + 0.075 * Math.sqrt(index));
  const clamped = clampDecorationXZ(
    shape as RegistryCakeShape,
    fallback.x + Math.cos(angle) * radius,
    fallback.z + Math.sin(angle) * radius,
  );

  return {
    x: clamped.x,
    y: decorationBaseY,
    z: clamped.z,
  };
}

function findCompatibleBaseId(
  bases: IngredientBase[],
  shape: CakeShape,
  preferredId?: string,
): string {
  const registryShape = shape as RegistryCakeShape;
  const isCompatible = (base: IngredientBase) =>
    base.available && isFullTierVisualKeyAvailable(registryShape, base.visualKey);

  const preferred = bases.find((base) => base.id === preferredId);
  if (preferred && isCompatible(preferred)) return preferred.id;

  return bases.find(isCompatible)?.id ?? '';
}

function shapeHasCompatibleBase(bases: IngredientBase[], shape: CakeShape): boolean {
  const registryShape = shape as RegistryCakeShape;
  return bases.some(
    (base) => base.available && isFullTierVisualKeyAvailable(registryShape, base.visualKey),
  );
}

function catalogShapeOrder(ingredients: ConstructorCatalog): CakeShape[] {
  const catalogShapes = asArray(ingredients.shapes)
    .map((shape) => shape.id)
    .filter((shape): shape is CakeShape => SHAPE_ORDER.includes(shape));

  return catalogShapes.length > 0 ? catalogShapes : SHAPE_ORDER;
}

function findCompatibleShape(
  bases: IngredientBase[],
  preferredShape: CakeShape,
  ingredients: ConstructorCatalog,
): CakeShape {
  if (shapeHasCompatibleBase(bases, preferredShape)) return preferredShape;
  return catalogShapeOrder(ingredients).find((shape) => shapeHasCompatibleBase(bases, shape)) ?? preferredShape;
}

function findCompatibleFillingId(
  fillings: IngredientFilling[],
  shape: CakeShape,
  preferredId?: string,
): string {
  const registryShape = shape as RegistryCakeShape;
  const isCompatible = (filling: IngredientFilling) =>
    filling.available && isFillVisualKeyAvailable(registryShape, filling.visualKey);

  const preferred = fillings.find((filling) => filling.id === preferredId);
  if (preferred && isCompatible(preferred)) return preferred.id;

  return fillings.find(isCompatible)?.id ?? '';
}

function findCompatibleCoating(
  coatings: IngredientCoating[],
  shape: CakeShape,
  preferredId?: string,
  preferredVisualKey?: string,
): IngredientCoating | undefined {
  const registryShape = shape as RegistryCakeShape;
  const isCompatible = (coating: IngredientCoating) =>
    coating.available && isGlazeVisualKeyAvailable(registryShape, coating.visualKey);

  const preferredById = coatings.find((coating) => coating.id === preferredId);
  if (preferredById && isCompatible(preferredById)) return preferredById;

  const preferredByVisualKey = coatings.find(
    (coating) => coating.visualKey === preferredVisualKey && isCompatible(coating),
  );
  if (preferredByVisualKey) return preferredByVisualKey;

  return coatings.find(isCompatible);
}

function repairDecorationsForShape(
  activeDecorations: string[],
  selectedDecorations: DecorationSelection[],
  decorationInstances: DecorationInstance[],
  decorations: IngredientDecoration[],
  shape: CakeShape,
  tierCount: TierCount,
): {
  activeDecorations: string[];
  selectedDecorations: DecorationSelection[];
  decorationInstances: DecorationInstance[];
} {
  const registryShape = shape as RegistryCakeShape;
  const normalizedActiveDecorations = asArray(activeDecorations);
  const normalizedSelectedDecorations = asArray(selectedDecorations);
  const normalizedDecorationInstances = asArray(decorationInstances);
  const normalizedDecorations = asArray(decorations);

  if (normalizedDecorationInstances.length > 0) {
    const compatibleInstances = normalizeDecorationInstances(
      normalizedDecorationInstances.filter((instance) => {
        const decoration = normalizedDecorations.find((item) => item.id === instance.decorationId);
        return Boolean(
          decoration?.available &&
            decoration.visualKey === instance.visualKey &&
            isDecoVisualKeyAvailable(registryShape, decoration.visualKey),
        );
      }),
      tierCount,
    );
    const synced = syncDecorationState(compatibleInstances);

    return {
      ...synced,
      decorationInstances: compatibleInstances,
    };
  }

  const compatibleActiveDecorations = uniqueDecorationKeys(
    normalizedActiveDecorations.filter((variantId) =>
      isDecoVisualKeyAvailable(registryShape, variantId),
    ),
  );
  const compatibleSelections = normalizedSelectedDecorations.filter((selection) => {
    if (!compatibleActiveDecorations.includes(selection.variantId)) return false;
    const decoration = normalizedDecorations.find((item) => item.id === selection.decorationId);
    return Boolean(
      decoration?.available &&
        decoration.visualKey === selection.variantId &&
        isDecoVisualKeyAvailable(registryShape, decoration.visualKey),
    );
  });

  const missingSelections = compatibleActiveDecorations.filter(
    (variantId) => !compatibleSelections.some((selection) => selection.variantId === variantId),
  );

  return {
    activeDecorations: compatibleActiveDecorations,
    selectedDecorations: [
      ...compatibleSelections,
      ...buildDecorationSelections(missingSelections, normalizedDecorations),
    ],
    decorationInstances: [],
  };
}

function repairSelectionsForCompatibility(
  state: Pick<
    ConstructorState,
    | 'shape'
    | 'tierCount'
    | 'layers'
    | 'coating'
    | 'activeDecorations'
    | 'selectedDecorations'
    | 'decorationInstances'
  >,
  ingredients: ConstructorCatalog | null,
): Pick<
  ConstructorState,
  'shape' | 'layers' | 'coating' | 'activeDecorations' | 'selectedDecorations' | 'decorationInstances' | 'hasCandle'
> {
  const normalizedLayers = buildLayers(state.tierCount, asArray(state.layers));
  const normalizedCoating = normalizeCoating(state.coating);
  const normalizedActiveDecorations = asArray(state.activeDecorations);
  const normalizedSelectedDecorations = asArray(state.selectedDecorations);
  const normalizedDecorationInstances = asArray(state.decorationInstances);

  if (!ingredients) {
    const decorationInstances = normalizeDecorationInstances(normalizedDecorationInstances, state.tierCount);
    const activeDecorations = decorationInstances.length > 0
      ? activeDecorationKeysFromInstances(decorationInstances)
      : uniqueDecorationKeys(normalizedActiveDecorations);
    const selectedDecorations = decorationInstances.length > 0
      ? groupDecorationInstances(decorationInstances)
      : normalizedSelectedDecorations.filter((selection) =>
          activeDecorations.includes(selection.variantId),
        );

    return {
      shape: state.shape,
      layers: normalizedLayers,
      coating: normalizedCoating,
      activeDecorations,
      selectedDecorations,
      decorationInstances,
      hasCandle: activeDecorations.includes('candle'),
    };
  }

  const compatibleShape = findCompatibleShape(ingredients.bases, state.shape, ingredients);
  const layers = normalizedLayers.map((layer, index) => ({
    ...layer,
    baseId: findCompatibleBaseId(
      ingredients.bases,
      compatibleShape,
      layer.baseId,
    ),
    fillingId: findCompatibleFillingId(ingredients.fillings, compatibleShape, layer.fillingId),
  }));
  const compatibleCoating = normalizedCoating.coatingId
    ? findCompatibleCoating(
        ingredients.coatings,
        compatibleShape,
        normalizedCoating.coatingId,
        normalizedCoating.glazeVariant,
      )
    : null;
  const coating = normalizedCoating.coatingId && compatibleCoating
    ? normalizeCoating({
        ...normalizedCoating,
        type: compatibleCoating.type,
        coatingId: compatibleCoating.id,
        glazeVariant: compatibleCoating.visualKey,
        withDrips: false,
        visual: {
          ...normalizedCoating.visual,
          primaryColor: getGlazeColor(compatibleCoating.visualKey),
        },
      })
    : normalizedCoating;
  const decorations = repairDecorationsForShape(
    normalizedActiveDecorations,
    normalizedSelectedDecorations,
    normalizedDecorationInstances,
    ingredients.decorations,
    compatibleShape,
    state.tierCount,
  );

  return {
    shape: compatibleShape,
    layers,
    coating,
    activeDecorations: decorations.activeDecorations,
    selectedDecorations: decorations.selectedDecorations,
    decorationInstances: decorations.decorationInstances,
    hasCandle: decorations.activeDecorations.includes('candle'),
  };
}

function applyDefaultSelections(
  state: Pick<ConstructorState, 'shape' | 'coating' | 'layers'>,
  ingredients: ConstructorCatalog,
): Partial<ConstructorState> {
  const updates: Partial<ConstructorState> = {};
  const compatibleShape = findCompatibleShape(ingredients.bases, state.shape, ingredients);

  if (compatibleShape !== state.shape) {
    updates.shape = compatibleShape;
  }

  const layersForDefaults = asArray(state.layers);
  if (layersForDefaults[0] && !layersForDefaults[0].baseId && ingredients.bases.length > 0) {
    const layers = layersForDefaults.map((l, i) => ({
      ...l,
      baseId: l.baseId || findCompatibleBaseId(ingredients.bases, compatibleShape),
      fillingId: l.fillingId || findCompatibleFillingId(ingredients.fillings, compatibleShape),
    }));
    updates.layers = layers;
  }

  return updates;
}

function normalizeConfig(config: Partial<ConstructorConfig> & {
  minWeight?: number;
  maxWeight?: number;
  maxInscription?: number;
}): ConstructorConfig {
  return {
    maxDecorations: config.maxDecorations ?? 40,
    maxInscriptionLength: config.maxInscriptionLength ?? config.maxInscription ?? 50,
    minWeightPerTier: config.minWeightPerTier ?? (config.minWeight ? config.minWeight * 1000 : 500),
    maxWeightPerTier: config.maxWeightPerTier ?? (config.maxWeight ? config.maxWeight * 1000 : 5000),
    weightStep: config.weightStep ?? 500,
  };
}

function normalizeCatalog(catalog: Partial<ConstructorCatalog> | null | undefined): ConstructorCatalog {
  return {
    bases: asArray(catalog?.bases).map((b: any) => ({
      ...b,
      available: b.available ?? b.isAvailable ?? true,
      visualKey: b.visualKey ?? 'default',
    })),
    fillings: asArray(catalog?.fillings).map((f: any) => ({
      ...f,
      available: f.available ?? f.isAvailable ?? true,
      imageUrl: f.imageUrl ?? f.image_url ?? null,
      visualKey: f.visualKey ?? 'cream',
    })),
    coatings: asArray(catalog?.coatings).map((c: any) => ({
      ...c,
      available: c.available ?? c.isAvailable ?? true,
      visualKey: c.visualKey ?? 'cream',
    })),
    decorations: asArray(catalog?.decorations).map((d: any) => ({
      ...d,
      available: d.available ?? d.isAvailable ?? true,
      visualKey: d.visualKey ?? 'cream',
    })),
    shapes: asArray(catalog?.shapes),
    tierSurcharges: asArray(catalog?.tierSurcharges),
    config: normalizeConfig(catalog?.config ?? {}),
  };
}

function buildPricingPayload(state: ConstructorState) {
  const decorationInstances = asArray(state.decorationInstances);
  const selectedDecorations = asArray(state.selectedDecorations);
  const decorationSelections =
    decorationInstances.length > 0
      ? groupDecorationInstances(decorationInstances)
      : selectedDecorations;
  const decorations =
    decorationSelections.length > 0
      ? decorationSelections.map(({ decorationId, quantity }) => ({
          decorationId,
          quantity,
        }))
      : undefined;

  const coatingId = normalizeCoating(state.coating).coatingId;

  return {
    shape: state.shape,
    tiers: asArray(state.layers).map((layer) => ({
      baseId: layer.baseId,
      fillingId: layer.fillingId,
      weight: Math.round(layer.weight / 100),
    })),
    ...(coatingId ? { coatingId } : {}),
    ...(decorations && decorations.length > 0 ? { decorations } : {}),
    ...(state.inscription?.trim() ? { inscription: state.inscription.trim() } : {}),
  };
}

function hasCompletePricingPayload(state: ConstructorState): boolean {
  const layers = asArray(state.layers);
  return (
    layers.length > 0 &&
    layers.every((layer) => layer.baseId && layer.fillingId && layer.weight > 0)
  );
}

function markPriceStale(set: (partial: Partial<ConstructorState>) => void) {
  set({
    pricingStatus: 'stale',
    priceError: null,
    priceVerifiedAt: null,
  });
}

function refreshDecorationBaseY(
  get: () => ConstructorState,
  set: (partial: Partial<ConstructorState>) => void,
) {
  const instances = asArray(get().decorationInstances);
  if (instances.length === 0) return;
  set({
    decorationInstances: withDecorationBaseY(instances, getDecorationBaseYForState(get()), get().tierCount),
  });
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match?.[1] ?? null;
}

export const useConstructorStore = create<ConstructorState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      currentStep: 1,
      viewMode: 'orbit',
      shape: 'circle',
      tierCount: 1,
      layers: [{ ...DEFAULT_LAYER }],
      coating: { ...DEFAULT_COATING },
      activeDecorations: [],
      selectedDecorations: [],
      decorationInstances: [],
      selectedDecorationInstanceId: null,
      hasCandle: false,
      inscription: '',
      ingredients: null,
      totalPrice: 0,
      pricingStatus: 'idle',
      priceBreakdown: null,
      priceError: null,
      priceVerifiedAt: null,
      lastPricingSignature: null,
      isLoading: false,

      setStep: (step) => set({ currentStep: step }),

      setViewMode: (viewMode) => set({ viewMode }),

      setShape: (shape) => {
        const current = get();
        const repaired = repairSelectionsForCompatibility({ ...current, shape }, current.ingredients);
        const decorationBaseY = getDecorationBaseYForState({
          ...current,
          ...repaired,
          shape: repaired.shape,
          layers: repaired.layers,
          coating: repaired.coating,
        });
        const decorationInstances = withDecorationBaseY(
          repaired.decorationInstances,
          decorationBaseY,
          current.tierCount,
        );
        const selectedDecorationInstanceId =
          current.selectedDecorationInstanceId &&
          decorationInstances.some((instance) => instance.instanceId === current.selectedDecorationInstanceId)
            ? current.selectedDecorationInstanceId
            : null;
        set({
          ...repaired,
          decorationInstances,
          ...syncDecorationState(decorationInstances),
          selectedDecorationInstanceId,
        });
        get().recalculatePrice();
        markPriceStale(set);
      },

      setTierCount: (count) => {
        const current = get();
        const repaired = repairSelectionsForCompatibility(
          { ...current, tierCount: count, layers: buildLayers(count, current.layers) },
          current.ingredients,
        );
        const decorationBaseY = getDecorationBaseYForState({
          ...current,
          ...repaired,
          tierCount: count,
          layers: repaired.layers,
          coating: repaired.coating,
        });
        const decorationInstances = withDecorationBaseY(repaired.decorationInstances, decorationBaseY, count);
        set({
          tierCount: count,
          ...repaired,
          decorationInstances,
          ...syncDecorationState(decorationInstances),
        });
        get().recalculatePrice();
        markPriceStale(set);
      },

      setLayerBase: (tierIndex, baseId) => {
        const layers = [...asArray(get().layers)];
        if (layers[tierIndex]) {
          const { ingredients, shape } = get();
          const base = ingredients?.bases.find((item) => item.id === baseId);
          if (
            base &&
            !isFullTierVisualKeyAvailable(shape as RegistryCakeShape, base.visualKey)
          ) {
            return;
          }
          layers[tierIndex] = { ...layers[tierIndex], baseId };
          set({ layers });
          refreshDecorationBaseY(get, set);
          get().recalculatePrice();
          markPriceStale(set);
        }
      },

      setLayerFilling: (tierIndex, fillingId) => {
        const layers = [...asArray(get().layers)];
        if (layers[tierIndex]) {
          const { ingredients, shape } = get();
          const filling = ingredients?.fillings.find((item) => item.id === fillingId);
          if (
            filling &&
            !isFillVisualKeyAvailable(shape as RegistryCakeShape, filling.visualKey)
          ) {
            return;
          }
          layers[tierIndex] = { ...layers[tierIndex], fillingId };
          set({ layers });
          get().recalculatePrice();
          markPriceStale(set);
        }
      },

      setLayerWeight: (tierIndex, weight) => {
        const layers = [...asArray(get().layers)];
        if (layers[tierIndex]) {
          layers[tierIndex] = { ...layers[tierIndex], weight };
          set({ layers });
          get().recalculatePrice();
          markPriceStale(set);
        }
      },

      setCoatingType: (type) => {
        const ingredients = get().ingredients;
        const shape = get().shape;
        const matchingCoating = ingredients?.coatings.find(
          (c) =>
            c.type === type &&
            c.available &&
            isGlazeVisualKeyAvailable(shape as RegistryCakeShape, c.visualKey),
        );
        set((state) => {
          const currentCoating = normalizeCoating(state.coating);
          return {
            coating: normalizeCoating({
              ...currentCoating,
              type,
              coatingId: matchingCoating?.id ?? currentCoating.coatingId,
              glazeVariant: matchingCoating?.visualKey ?? currentCoating.glazeVariant,
            }),
          };
        });
        refreshDecorationBaseY(get, set);
        get().recalculatePrice();
        markPriceStale(set);
      },

      setCoatingId: (id) => {
        if (!id) {
          set({ coating: { ...DEFAULT_COATING } });
          refreshDecorationBaseY(get, set);
          get().recalculatePrice();
          markPriceStale(set);
          return;
        }

        const { ingredients, shape } = get();
        const coating = ingredients?.coatings.find((item) => item.id === id);
        if (
          coating &&
          !isGlazeVisualKeyAvailable(shape as RegistryCakeShape, coating.visualKey)
        ) {
          return;
        }
        set((state) => {
          const currentCoating = normalizeCoating(state.coating);
          return {
            coating: normalizeCoating({
              ...currentCoating,
              coatingId: id,
              glazeVariant: coating?.visualKey ?? currentCoating.glazeVariant,
              type: coating?.type ?? currentCoating.type,
            }),
          };
        });
        refreshDecorationBaseY(get, set);
        get().recalculatePrice();
        markPriceStale(set);
      },

      setGlazeVariant: (variant) => {
        if (!variant) {
          get().setCoatingId('');
          return;
        }

        const { shape, ingredients } = get();
        if (!isGlazeVisualKeyAvailable(shape as RegistryCakeShape, variant)) return;
        const matchingCoating = ingredients?.coatings.find(
          (coating) => coating.available && coating.visualKey === variant,
        );
        set((state) => {
          const currentCoating = normalizeCoating(state.coating);
          return {
            coating: normalizeCoating({
              ...currentCoating,
              glazeVariant: variant,
              coatingId: matchingCoating?.id ?? currentCoating.coatingId,
              type: matchingCoating?.type ?? currentCoating.type,
            }),
          };
        });
        refreshDecorationBaseY(get, set);
        markPriceStale(set);
      },

      addDecoration: (variantId, decorationId) => {
        get().addDecorationInstance(variantId, decorationId);
      },

      addDecorationInstance: (visualKey, decorationId, position, placement) => {
        const { ingredients, shape, tierCount } = get();
        const decorationInstances = normalizeDecorationInstances(asArray(get().decorationInstances), tierCount);
        const normalizedPlacement = normalizeDecorationPlacement(placement, tierCount);
        if (!isDecorationPlacementAllowed(visualKey, normalizedPlacement)) return;

        const replacementGroup = getDecorationReplacementGroup(visualKey);
        const baseInstances = replacementGroup
          ? decorationInstances.filter(
              (instance) => getDecorationReplacementGroup(instance.visualKey) !== replacementGroup,
            )
          : decorationInstances;
        const max = ingredients?.config?.maxDecorations ?? 40;
        if (baseInstances.length >= max) return;
        if (!isDecoVisualKeyAvailable(shape as RegistryCakeShape, visualKey)) return;

        const selectedDecoration = createDecorationSelection(visualKey, ingredients?.decorations ?? [], decorationId);
        if (!selectedDecoration) return;
        const decorationData = (ingredients?.decorations ?? []).find(
          (d) => d.id === selectedDecoration.decorationId,
        );
        const decorationBaseY = getDecorationBaseYForState(get());
        const instanceId = createDecorationInstanceId();
        const shouldClampPosition = normalizedPlacement.surface === 'top';
        const nextPosition = position
          ? {
              ...normalizeDecorationPosition(visualKey, position),
              ...(shouldClampPosition
                ? clampDecorationXZ(shape as RegistryCakeShape, position.x ?? 0, position.z ?? 0)
                : {
                    x: position.x ?? 0,
                    z: position.z ?? 0,
                  }),
              y: position.y ?? decorationBaseY,
            }
          : createDefaultDecorationPosition(visualKey, decorationInstances, shape, decorationBaseY);
        const nextInstances: DecorationInstance[] = [
          ...baseInstances,
          {
            instanceId,
            decorationId: selectedDecoration.decorationId,
            visualKey,
            modelUrl: decorationData?.modelUrl,
            position: nextPosition,
            rotation: { ...DEFAULT_DECORATION_ROTATION },
            placement: normalizedPlacement,
          },
        ];
        set({
          decorationInstances: nextInstances,
          selectedDecorationInstanceId: instanceId,
          ...syncDecorationState(nextInstances),
        });
        get().recalculatePrice();
        markPriceStale(set);
      },

      selectDecorationInstance: (instanceId) => {
        const exists = instanceId
          ? asArray(get().decorationInstances).some((instance) => instance.instanceId === instanceId)
          : false;
        set({ selectedDecorationInstanceId: exists ? instanceId : null });
      },

      duplicateDecorationInstance: (instanceId) => {
        const { ingredients, shape, tierCount } = get();
        const decorationInstances = normalizeDecorationInstances(asArray(get().decorationInstances), tierCount);
        const max = ingredients?.config?.maxDecorations ?? 40;
        if (decorationInstances.length >= max) return;

        const source = decorationInstances.find((instance) => instance.instanceId === instanceId);
        if (!source || !isDecoVisualKeyAvailable(shape as RegistryCakeShape, source.visualKey)) return;
        if (getDecorationReplacementGroup(source.visualKey)) return;

        const nextId = createDecorationInstanceId();
        const shifted =
          source.placement?.surface === 'side'
            ? { x: source.position.x, z: source.position.z }
            : clampDecorationXZ(
                shape as RegistryCakeShape,
                source.position.x + 0.12,
                source.position.z + 0.12,
              );
        const nextInstances = [
          ...decorationInstances,
          {
            ...source,
            instanceId: nextId,
            position: {
              ...source.position,
              x: shifted.x,
              z: shifted.z,
              y: source.placement?.surface === 'side' ? source.position.y : getDecorationBaseYForState(get()),
            },
            rotation: normalizeDecorationRotation(source.rotation),
            placement: source.placement
              ? normalizeDecorationPlacement(source.placement, tierCount)
              : undefined,
          },
        ];

        set({
          decorationInstances: nextInstances,
          selectedDecorationInstanceId: nextId,
          ...syncDecorationState(nextInstances),
        });
        get().recalculatePrice();
        markPriceStale(set);
      },

      moveDecorationInstance: (instanceId, position, placement) => {
        const shape = get().shape as RegistryCakeShape;
        const nextInstances = asArray(get().decorationInstances).map((instance) => {
          const normalized = normalizeDecorationInstance(instance, get().tierCount);
          if (normalized.instanceId !== instanceId) return normalized;
          const nextPlacement = placement
            ? normalizeDecorationPlacement(placement, get().tierCount)
            : normalized.placement;
          if (!isDecorationPlacementAllowed(normalized.visualKey, nextPlacement)) return normalized;

          const x = position.x ?? normalized.position.x;
          const z = position.z ?? normalized.position.z;
          const clamped = nextPlacement?.surface === 'side'
            ? { x, z }
            : clampDecorationXZ(shape, x, z);

          return {
            ...normalized,
            ...(nextPlacement ? { placement: nextPlacement } : {}),
            position: {
              ...normalized.position,
              ...position,
              x: clamped.x,
              z: clamped.z,
            },
          };
        });
        set({ decorationInstances: nextInstances });
      },

      rotateDecorationInstance: (instanceId, rotation) => {
        const nextInstances = normalizeDecorationInstances(
          asArray(get().decorationInstances),
          get().tierCount,
        ).map((instance) =>
          instance.instanceId === instanceId
            ? {
                ...instance,
                rotation: normalizeDecorationRotation({
                  ...instance.rotation,
                  ...rotation,
                }),
              }
            : instance,
        );
        set({ decorationInstances: nextInstances });
      },

      removeDecorationInstance: (instanceId) => {
        const nextInstances = asArray(get().decorationInstances).filter(
          (instance) => instance.instanceId !== instanceId,
        );
        set({
          decorationInstances: nextInstances,
          selectedDecorationInstanceId:
            get().selectedDecorationInstanceId === instanceId ? null : get().selectedDecorationInstanceId,
          ...syncDecorationState(nextInstances),
        });
        get().recalculatePrice();
        markPriceStale(set);
      },

      removeDecoration: (variantId) => {
        const { activeDecorations, selectedDecorations, decorationInstances } = get();
        const normalizedDecorationInstances = asArray(decorationInstances);
        const nextInstances = normalizedDecorationInstances.filter((instance) => instance.visualKey !== variantId);
        if (normalizedDecorationInstances.length > 0) {
          const selectedDecorationInstanceId =
            get().selectedDecorationInstanceId &&
            nextInstances.some((instance) => instance.instanceId === get().selectedDecorationInstanceId)
              ? get().selectedDecorationInstanceId
              : null;
          set({
            decorationInstances: nextInstances,
            selectedDecorationInstanceId,
            ...syncDecorationState(nextInstances),
          });
          get().recalculatePrice();
          markPriceStale(set);
          return;
        }

        set({
          activeDecorations: asArray(activeDecorations).filter((id) => id !== variantId),
          selectedDecorations: asArray(selectedDecorations).filter((selection) => selection.variantId !== variantId),
          decorationInstances: [],
          selectedDecorationInstanceId: null,
        });
        get().recalculatePrice();
        markPriceStale(set);
      },

      clearDecorations: () => {
        set({
          activeDecorations: [],
          selectedDecorations: [],
          decorationInstances: [],
          selectedDecorationInstanceId: null,
          hasCandle: false,
        });
        get().recalculatePrice();
        markPriceStale(set);
      },

      setHasCandle: (hasCandle) => {
        set({ hasCandle });
        get().recalculatePrice();
        markPriceStale(set);
      },

      setInscription: (text) => {
        const max = get().getConfig()?.maxInscriptionLength ?? 50;
        set({ inscription: text.slice(0, max) });
        markPriceStale(set);
      },

      loadIngredients: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/constructor/ingredients');
          if (!res.ok) throw new Error('API unavailable');
          const envelope = (await res.json()) as { data?: ConstructorCatalog } | ConstructorCatalog;
          const catalog = normalizeCatalog(
            (envelope as { data?: ConstructorCatalog }).data ?? (envelope as ConstructorCatalog)
          );
          set({ ingredients: catalog, isLoading: false });
        } catch (err) {
          console.error('Failed to load constructor ingredients, using mock data:', err);
          const mock = normalizeCatalog(getMockIngredients());
          set({ ingredients: mock, isLoading: false });
        }

        // Set sensible defaults after loading
        set(normalizeConstructorStateFields(get()));
        const state = get();
        const { ingredients } = state;
        if (!ingredients) return;

        const updates = applyDefaultSelections(state, ingredients);
        if (Object.keys(updates).length > 0) {
          set(updates as Partial<ConstructorState>);
        }

        const current = get();
        set(
          repairSelectionsForCompatibility(
            {
              ...current,
              selectedDecorations: buildDecorationSelections(
                asArray(current.activeDecorations),
                ingredients.decorations,
              ),
            },
            ingredients,
          ),
        );

        get().recalculatePrice();
      },

      recalculatePrice: () => {
        const state = get();
        const { ingredients, shape, tierCount } = state;
        const layers = asArray(state.layers);
        const coating = normalizeCoating(state.coating);
        if (!ingredients) {
          set({ totalPrice: 0 });
          return;
        }

        let runningTotal = 0;

        for (const layer of layers) {
          const base = ingredients.bases.find((b) => b.id === layer.baseId);
          const filling = ingredients.fillings.find((f) => f.id === layer.fillingId);
          if (base) runningTotal += (layer.weight * base.pricePerKg) / 1000;
          if (filling) runningTotal += (layer.weight * filling.pricePerKg) / 1000;
        }

        const totalWeight = layers.reduce((sum, l) => sum + l.weight, 0);
        const coatingIngredient = ingredients.coatings.find((c) => c.id === coating.coatingId);
        if (coatingIngredient) {
          runningTotal += (totalWeight * coatingIngredient.pricePerKg) / 1000;
        }

        const decorationSelections =
          asArray(state.decorationInstances).length > 0
            ? groupDecorationInstances(asArray(state.decorationInstances))
            : asArray(state.selectedDecorations).length > 0
              ? asArray(state.selectedDecorations)
              : buildDecorationSelections(asArray(state.activeDecorations), ingredients.decorations);

        for (const selection of decorationSelections) {
          const decoIngredient = ingredients.decorations.find((d) => d.id === selection.decorationId);
          if (decoIngredient) {
            runningTotal += decoIngredient.pricePerUnit * selection.quantity;
          }
        }

        const shapeInfo = ingredients.shapes.find((s) => s.id === shape);
        const shapeSurchargePercent = shapeInfo?.surchargePercent ?? 0;
        runningTotal += (runningTotal * shapeSurchargePercent) / 100;

        const tierSurcharge = ingredients.tierSurcharges.find((t) => t.tierCount === tierCount);
        runningTotal += tierSurcharge?.surcharge ?? 0;

        set({ totalPrice: Math.round(runningTotal) });
      },

      syncServerPrice: async () => {
        const state = get();
        if (!hasCompletePricingPayload(state)) {
          set({
            pricingStatus: 'stale',
            priceBreakdown: null,
            priceError: 'Заполните основу и начинку',
            priceVerifiedAt: null,
          });
          return;
        }

        const payload = buildPricingPayload(state);
        const signature = JSON.stringify(payload);
        set({
          pricingStatus: 'updating',
          priceError: null,
          lastPricingSignature: signature,
        });

        try {
          const csrfToken = getCsrfToken();
          const res = await fetch('/api/constructor/calculate', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
            },
            body: signature,
          });
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const envelope = (await res.json()) as {
            data?: { totalPrice: number; breakdown: ConstructorPriceBreakdown };
            totalPrice?: number;
            breakdown?: ConstructorPriceBreakdown;
          };
          const data = envelope.data ?? envelope;

          if (get().lastPricingSignature !== signature) return;

          set({
            totalPrice: data.totalPrice ?? 0,
            priceBreakdown: data.breakdown ?? null,
            pricingStatus: 'verified',
            priceError: null,
            priceVerifiedAt: Date.now(),
          });
        } catch (err) {
          if (get().lastPricingSignature !== signature) return;
          set({
            pricingStatus: 'error',
            priceError: err instanceof Error ? err.message : 'Не удалось подтвердить цену',
            priceVerifiedAt: null,
          });
        }
      },

      reset: () => {
        const ingredients = get().ingredients;
        const resetState: Partial<ConstructorState> = {
          currentStep: 1,
          viewMode: 'orbit',
          shape: 'circle',
          tierCount: 1,
          layers: [{ ...DEFAULT_LAYER }],
          coating: { ...DEFAULT_COATING },
          activeDecorations: [],
          selectedDecorations: [],
          decorationInstances: [],
          selectedDecorationInstanceId: null,
          hasCandle: false,
          inscription: '',
          totalPrice: 0,
          pricingStatus: 'idle',
          priceBreakdown: null,
          priceError: null,
          priceVerifiedAt: null,
          lastPricingSignature: null,
        };

        if (!ingredients) {
          set(resetState);
          return;
        }

        const withDefaults = {
          ...resetState,
          ...applyDefaultSelections({
            shape: resetState.shape ?? 'circle',
            coating: resetState.coating ?? DEFAULT_COATING,
            layers: resetState.layers ?? [{ ...DEFAULT_LAYER }],
          }, ingredients),
        } as Partial<ConstructorState>;
        const repaired = repairSelectionsForCompatibility(
          {
            shape: withDefaults.shape ?? 'circle',
            tierCount: withDefaults.tierCount ?? 1,
            layers: withDefaults.layers ?? [{ ...DEFAULT_LAYER }],
            coating: withDefaults.coating ?? DEFAULT_COATING,
            activeDecorations: [],
            selectedDecorations: [],
            decorationInstances: [],
          },
          ingredients,
        );

        set({
          ...withDefaults,
          ...repaired,
          pricingStatus: 'idle',
          priceBreakdown: null,
          priceError: null,
          priceVerifiedAt: null,
          lastPricingSignature: null,
        });
        get().recalculatePrice();
      },

      getConfig: () => {
        return get().ingredients?.config ?? null;
      },
    })),
    {
      name: 'bakery-constructor',
      version: 3,
      migrate: (persisted: any, _version: number) => {
        return {
          ...persisted,
          viewMode: persisted?.viewMode ?? 'orbit',
          ...normalizeConstructorStateFields(persisted ?? {}),
        };
      },
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ConstructorState>),
        ...normalizeConstructorStateFields((persisted ?? {}) as Partial<ConstructorState>),
      }),
      storage: {
        getItem: (key) => {
          const value = sessionStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        shape: state.shape,
        tierCount: state.tierCount,
        layers: asArray(state.layers),
        coating: normalizeCoating(state.coating),
        activeDecorations: asArray(state.activeDecorations),
        selectedDecorations: asArray(state.selectedDecorations),
        decorationInstances: normalizeDecorationInstances(asArray(state.decorationInstances), state.tierCount),
        hasCandle: asArray(state.decorationInstances).some((instance) => instance.visualKey === 'candle') ||
          asArray(state.activeDecorations).includes('candle') ||
          state.hasCandle,
        inscription: state.inscription,
      }) as unknown as ConstructorState,
    },
  ),
);
