export type CakeShape = 'circle' | 'square' | 'heart';

const configuredModelsBase =
  process.env.NEXT_PUBLIC_CONSTRUCTOR_MODELS_BASE_URL?.replace(/\/+$/, '');
const MODELS_BASE = configuredModelsBase || '/models';

const SHAPE_FOLDER: Record<CakeShape, string> = {
  circle: 'circle',
  square: 'cube',
  heart: 'heart',
};

// ---------------------------------------------------------------------------
// Internal static maps — exact filenames from public/models/
// ---------------------------------------------------------------------------

type LayerVariant = 'default' | 'red' | 'cherry' | 'choco' | 'cream' | 'glaze' | 'pink';
type FillVariant = 'cream' | 'choco' | 'pink' | 'meringue' | 'glaze' | 'glaze-choco' | 'glaze-cream' | 'glaze-cream2' | 'meringue-pink';
type GlazeVariant =
  | 'cream'
  | 'cream-2'
  | 'choco'
  | 'choco-2'
  | 'pink'
  | 'pink-2'
  | 'milk'
  | 'cream-glaze';
type DecoVariant =
  | 'blueberry'
  | 'chocolate'
  | 'chocolate-choco'
  | 'chocolate-pink'
  | 'meringue'
  | 'glaze-cream'
  | 'glaze-cream2'
  | 'glaze-choco'
  | 'glaze-pink'
  | 'cream'
  | 'candle'
  | 'top-cream'
  | 'top-choco'
  | 'top-pink'
  | 'top-meringue'
  | 'top-glaze'
  | 'top-glaze-choco'
  | 'top-glaze-cream'
  | 'top-glaze-cream2'
  | 'top-meringue-pink';

export type DecorationPlacementSlot = 'surfaceDecor' | 'candle';
export type DecorationUiCategory =
  | 'berries'
  | 'chocolate'
  | 'creamGlaze'
  | 'meringue'
  | 'topDecor'
  | 'candle';

export interface DecorationPlacementRule {
  slot: DecorationPlacementSlot;
  maxPerCake: 1;
}

// --- Layers -----------------------------------------------------------------

const LAYER_FILES: Record<CakeShape, Partial<Record<LayerVariant, string>>> = {
  circle: {
    default: 'cakeLayer.glb',
    red: 'CakeLayerRed.glb',
    cherry: 'CakeLayerCherry.glb',
  },
  square: {
    default: 'CakeLayer.glb',
    red: 'CakeLayerRed.glb',
    cherry: 'CakeLayerCherry.glb',
  },
  heart: {
    default: 'CakeLayer.glb',
    red: 'CakeLayerRed.glb',
    cherry: 'CakeLayerCherry.glb',
  },
};

const FULL_TIER_FILES: Record<CakeShape, Partial<Record<LayerVariant, string>>> = {
  circle: {
    cherry: 'CakeBigLayerCherry.glb',
    choco: 'CakeBigLayerChoco.glb',
    cream: 'CakeBigLayerCream.glb',
    glaze: 'CakeBigLayerGlaze.glb',
  },
  square: {
    default: 'CakeBigLayer.glb',
    cherry: 'CakeBigLayerCherry.glb',
    cream: 'CakeBigLayerCream.glb',
    glaze: 'CakeBigLayerGlaze.glb',
  },
  heart: {
    choco: 'CakeBigLayerChoco.glb',
    cream: 'CakeBigLayerCream.glb',
    glaze: 'CakeBigLayerGlaze.glb',
    pink: 'CakeBigLayerPink.glb',
  },
};

export type TierModelRole = 'tierBody';

// --- Fills ------------------------------------------------------------------

const FILL_FILES: Record<CakeShape, Partial<Record<FillVariant, string>>> = {
  circle: {
    cream: 'cakeFillCream.glb',
    choco: 'CakeFillCreamChoco.glb',
    pink: 'CakeFillCreamPink.glb',
    meringue: 'cakeFillMeringua.glb',
  },
  square: {
    glaze: 'CakeFillGlaze.glb',
    'glaze-choco': 'CakeFillGlazeChoco.glb',
    'glaze-cream': 'CakeFillGlazeCream.glb',
    'glaze-cream2': 'CakeFillGlazeCream2.glb',
    meringue: 'CakeFillMeringue.glb',
  },
  heart: {
    cream: 'CakeFillMeringuePink.glb',
    meringue: 'CakeFillMeringue.glb',
    'meringue-pink': 'CakeFillMeringuePink.glb',
  },
};

// --- Glazes -----------------------------------------------------------------

const GLAZE_FILES: Record<CakeShape, Partial<Record<GlazeVariant, string>>> = {
  circle: {
    cream: 'GlazeCream.glb',
    'cream-2': 'GlazeCream2.glb',
    choco: 'GlazeChoco.glb',
    'choco-2': 'GlazeChoco2.glb',
    milk: 'cakeGlazeMilk.glb',
    pink: 'cakeGlazePink.glb',
  },
  square: {
    cream: 'GlazeCream.glb',
    choco: 'GlazeChoco.glb',
    pink: 'GlazePink.glb',
    'cream-glaze': 'GlazeCreamGlaze.glb',
  },
  heart: {
    cream: 'GlazeCream.glb',
    'cream-2': 'GlazeCream2.glb',
    choco: 'GlazeChoco.glb',
    'choco-2': 'GlazeChoco2.glb',
    pink: 'GlazePink.glb',
    'pink-2': 'GlazePink2.glb',
  },
};

// --- Decos ------------------------------------------------------------------

const DECO_FILES: Record<CakeShape, Partial<Record<DecoVariant, string>>> = {
  circle: {
    blueberry: 'cakeDecorBlueberry.glb',
    'chocolate-pink': 'cakeDecorPinkChocolate.glb',
    cream: 'cakeDecorCream.glb',
    'glaze-cream': 'cakeDecorGlaze.glb',
    'top-cream': 'cakeFillCream.glb',
    'top-choco': 'CakeFillCreamChoco.glb',
    'top-pink': 'CakeFillCreamPink.glb',
    'top-meringue': 'cakeFillMeringua.glb',
  },
  square: {
    blueberry: 'DecoBlueberry.glb',
    chocolate: 'DecoChocolate.glb',
    'chocolate-choco': 'DecoChocolateChoco.glb',
    'glaze-choco': 'DecoGlazeChoco.glb',
    'glaze-cream': 'DecoGlazeCream.glb',
    'glaze-pink': 'DecoGlazePink.glb',
    meringue: 'DecoMeringue.glb',
    'top-glaze': 'CakeFillGlaze.glb',
    'top-glaze-choco': 'CakeFillGlazeChoco.glb',
    'top-glaze-cream': 'CakeFillGlazeCream.glb',
    'top-glaze-cream2': 'CakeFillGlazeCream2.glb',
    'top-meringue': 'CakeFillMeringue.glb',
  },
  heart: {
    blueberry: 'DecoBlueberry.glb',
    'chocolate-choco': 'DecoChocolateChoco.glb',
    'chocolate-pink': 'DecoChocolatePink.glb',
    'glaze-cream': 'DecoGlazeCream.glb',
    'glaze-cream2': 'DecoGlazeCream2.glb',
    'glaze-choco': 'DecoGlazeChoco.glb',
    'glaze-pink': 'DecoGlazePink.glb',
    meringue: 'DecoMeringue.glb',
    'top-meringue': 'CakeFillMeringue.glb',
    'top-meringue-pink': 'CakeFillMeringuePink.glb',
  },
};

// --- Candles ----------------------------------------------------------------

const CANDLE_FILES: Record<CakeShape, string> = {
  // circle has no candle in its own folder → use shared candle/
  circle: `${MODELS_BASE}/candle/DecoCandle.glb`,
  square: `${MODELS_BASE}/cube/DecoCandle1.glb`,
  heart: `${MODELS_BASE}/heart/DecoCandle3.glb`,
};

export interface ModelYBounds {
  minY: number;
  maxY: number;
}

const MODEL_Y_BOUNDS: Record<string, ModelYBounds> = {
  '/models/candle/DecoCandle.glb': { minY: -0.003, maxY: 0.3471 },
  '/models/candle/DecoCandle2.glb': { minY: -0.0197, maxY: 0.3523 },

  '/models/circle/CakeBigLayerCherry.glb': { minY: -0.0114, maxY: 0.9357 },
  '/models/circle/CakeBigLayerChoco.glb': { minY: -0.0114, maxY: 0.9357 },
  '/models/circle/CakeBigLayerCream.glb': { minY: -0.0114, maxY: 0.9357 },
  '/models/circle/CakeBigLayerGlaze.glb': { minY: -0.0114, maxY: 0.9357 },
  '/models/circle/CakeFillCreamChoco.glb': { minY: 0.1949, maxY: 0.382 },
  '/models/circle/CakeFillCreamPink.glb': { minY: 0.1949, maxY: 0.382 },
  '/models/circle/CakeLayerCherry.glb': { minY: 0.0083, maxY: 0.2343 },
  '/models/circle/CakeLayerRed.glb': { minY: 0.0083, maxY: 0.2343 },
  '/models/circle/GlazeChoco.glb': { minY: 0.6127, maxY: 0.9407 },
  '/models/circle/GlazeChoco2.glb': { minY: 0.1743, maxY: 0.9385 },
  '/models/circle/GlazeCream.glb': { minY: 0.6127, maxY: 0.9407 },
  '/models/circle/GlazeCream2.glb': { minY: 0.1743, maxY: 0.9385 },
  '/models/circle/cakeDecorBlueberry.glb': { minY: -0.0831, maxY: 0.167 },
  '/models/circle/cakeDecorCream.glb': { minY: -0.007, maxY: 0.1354 },
  '/models/circle/cakeDecorGlaze.glb': { minY: -0.056, maxY: 0.7453 },
  '/models/circle/cakeDecorPinkChocolate.glb': { minY: -0.0259, maxY: 0.3759 },
  '/models/circle/cakeFillCream.glb': { minY: -0.0936, maxY: 0.0936 },
  '/models/circle/cakeFillMeringua.glb': { minY: -0.0355, maxY: 0.1627 },
  '/models/circle/cakeGlazeMilk.glb': { minY: -0.7463, maxY: 0.018 },
  '/models/circle/cakeGlazePink.glb': { minY: -0.3155, maxY: 0.0125 },
  '/models/circle/cakeLayer.glb': { minY: 0.0083, maxY: 0.2343 },

  '/models/cube/CakeBigLayer.glb': { minY: 0.0016, maxY: 0.9099 },
  '/models/cube/CakeBigLayerCherry.glb': { minY: 0.0016, maxY: 0.9099 },
  '/models/cube/CakeBigLayerCream.glb': { minY: 0.0016, maxY: 0.9099 },
  '/models/cube/CakeBigLayerGlaze.glb': { minY: 0.0016, maxY: 0.9099 },
  '/models/cube/CakeFillGlaze.glb': { minY: 0.2767, maxY: 0.4763 },
  '/models/cube/CakeFillGlazeChoco.glb': { minY: 0.2767, maxY: 0.4763 },
  '/models/cube/CakeFillGlazeCream.glb': { minY: 0.2767, maxY: 0.4763 },
  '/models/cube/CakeFillGlazeCream2.glb': { minY: 0.2767, maxY: 0.4763 },
  '/models/cube/CakeFillMeringue.glb': { minY: 0.2857, maxY: 0.4839 },
  '/models/cube/CakeLayer.glb': { minY: 0.0056, maxY: 0.3269 },
  '/models/cube/CakeLayerCherry.glb': { minY: 0.0056, maxY: 0.3269 },
  '/models/cube/CakeLayerRed.glb': { minY: 0.0056, maxY: 0.3269 },
  '/models/cube/DecoBlueberry.glb': { minY: -0.0432, maxY: 0.1905 },
  '/models/cube/DecoCandle1.glb': { minY: -0.0031, maxY: 0.3514 },
  '/models/cube/DecoChocolate.glb': { minY: -0.0471, maxY: 0.4461 },
  '/models/cube/DecoChocolateChoco.glb': { minY: -0.0471, maxY: 0.4461 },
  '/models/cube/DecoGlazeChoco.glb': { minY: -0.0023, maxY: 0.1385 },
  '/models/cube/DecoGlazeCream.glb': { minY: -0.0023, maxY: 0.1385 },
  '/models/cube/DecoGlazePink.glb': { minY: -0.0023, maxY: 0.1385 },
  '/models/cube/DecoMeringue.glb': { minY: -0.0821, maxY: 0.4143 },
  '/models/cube/GlazeChoco.glb': { minY: -0.2349, maxY: 0.4699 },
  '/models/cube/GlazeCream.glb': { minY: -0.2349, maxY: 0.4699 },
  '/models/cube/GlazeCreamGlaze.glb': { minY: -0.2349, maxY: 0.4699 },
  '/models/cube/GlazePink.glb': { minY: -0.2349, maxY: 0.4699 },

  '/models/heart/CakeBigLayerChoco.glb': { minY: 0.0034, maxY: 0.9398 },
  '/models/heart/CakeBigLayerCream.glb': { minY: 0.0034, maxY: 0.9398 },
  '/models/heart/CakeBigLayerGlaze.glb': { minY: 0.0034, maxY: 0.9398 },
  '/models/heart/CakeBigLayerPink.glb': { minY: 0.0034, maxY: 0.9398 },
  '/models/heart/CakeFillMeringue.glb': { minY: -0.036, maxY: 0.1628 },
  '/models/heart/CakeFillMeringuePink.glb': { minY: -0.036, maxY: 0.1628 },
  '/models/heart/CakeLayer.glb': { minY: 0.0081, maxY: 0.249 },
  '/models/heart/CakeLayerCherry.glb': { minY: 0.0081, maxY: 0.249 },
  '/models/heart/CakeLayerRed.glb': { minY: 0.0081, maxY: 0.249 },
  '/models/heart/DecoBlueberry.glb': { minY: -0.0568, maxY: 0.1948 },
  '/models/heart/DecoCandle3.glb': { minY: -0.0109, maxY: 0.3507 },
  '/models/heart/DecoChocolateChoco.glb': { minY: -0.0683, maxY: 0.425 },
  '/models/heart/DecoChocolatePink.glb': { minY: -0.0683, maxY: 0.425 },
  '/models/heart/DecoGlazeChoco.glb': { minY: -0.0097, maxY: 0.0871 },
  '/models/heart/DecoGlazeCream.glb': { minY: -0.0097, maxY: 0.0871 },
  '/models/heart/DecoGlazeCream2.glb': { minY: -0.0097, maxY: 0.0871 },
  '/models/heart/DecoGlazePink.glb': { minY: -0.0097, maxY: 0.0871 },
  '/models/heart/DecoMeringue.glb': { minY: -0.0025, maxY: 0.4207 },
  '/models/heart/GlazeChoco.glb': { minY: 0.5656, maxY: 0.9447 },
  '/models/heart/GlazeChoco2.glb': { minY: 0.3897, maxY: 0.9447 },
  '/models/heart/GlazeCream.glb': { minY: 0.5656, maxY: 0.9447 },
  '/models/heart/GlazeCream2.glb': { minY: 0.3897, maxY: 0.9447 },
  '/models/heart/GlazePink.glb': { minY: 0.5656, maxY: 0.9447 },
  '/models/heart/GlazePink2.glb': { minY: 0.3897, maxY: 0.9447 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function p(folder: string, file: string): string {
  return `${MODELS_BASE}/${folder}/${file}`;
}

function normalizeModelPath(modelPath: string): string {
  const modelMarker = '/models/';
  const markerIndex = modelPath.indexOf(modelMarker);
  if (markerIndex >= 0) return modelPath.slice(markerIndex);

  const knownSuffix = Object.keys(MODEL_Y_BOUNDS).find((knownPath) => {
    const suffix = knownPath.replace(/^\/models\//, '/');
    return modelPath.endsWith(suffix);
  });

  return knownSuffix ?? modelPath;
}

export function getModelYBounds(modelPath: string | null): ModelYBounds | null {
  if (!modelPath) return null;
  return MODEL_Y_BOUNDS[normalizeModelPath(modelPath)] ?? null;
}

export function getModelVisualHeight(modelPath: string | null): number | null {
  const bounds = getModelYBounds(modelPath);
  if (!bounds) return null;
  return bounds.maxY - bounds.minY;
}

// ---------------------------------------------------------------------------
// Public API — path resolvers
// ---------------------------------------------------------------------------

/**
 * Returns the path to a Layer or BigLayer GLB.
 *
 * @param shape       - cake shape
 * @param baseVariant - 'default' | 'red' | 'cherry' | 'choco'
 * @param isBig       - true for the bottom tier of a multi-tier cake
 */
export function getLayerModelPath(
  shape: CakeShape,
  baseVariant: string,
  isBig: boolean,
): string | null {
  const folder = SHAPE_FOLDER[shape];

  if (isBig) {
    const bigMap = FULL_TIER_FILES[shape];
    const bigFile = bigMap[baseVariant as LayerVariant];
    return bigFile ? p(folder, bigFile) : null;
  }

  const layerMap = LAYER_FILES[shape];
  const file = layerMap[baseVariant as LayerVariant];

  return file ? p(folder, file) : null;
}

/**
 * Returns the canonical full-tier GLB for a cake tier.
 * Every rendered Ярус uses this exact BigLayer model; regular CakeLayer files
 * are kept in the registry for compatibility/preload checks but are not full tiers.
 */
export function getFullTierModelPath(shape: CakeShape, baseVariant: string): string | null {
  const folder = SHAPE_FOLDER[shape];
  const bigFile = FULL_TIER_FILES[shape][baseVariant as LayerVariant];

  return bigFile ? p(folder, bigFile) : null;
}

export function getTierModelRole(shape: CakeShape, variant: string): TierModelRole | null {
  if (FULL_TIER_FILES[shape][variant as LayerVariant]) return 'tierBody';
  return null;
}

/**
 * Returns the path to a Fill GLB.
 *
 * @param shape       - cake shape
 * @param fillVariant - 'cream' | 'choco' | 'pink' | 'meringue' | 'glaze' | etc.
 */
export function getFillModelPath(shape: CakeShape, fillVariant: string): string | null {
  const folder = SHAPE_FOLDER[shape];
  const fillMap = FILL_FILES[shape];

  const file = fillMap[fillVariant as FillVariant];

  return file ? p(folder, file) : null;
}

/**
 * Returns the path to a Glaze GLB.
 *
 * @param shape        - cake shape
 * @param glazeVariant - exact coating visual key backed by a GLB
 * @param withDrips    - ignored legacy flag; *-2 models use explicit visual keys
 */
export function getGlazeModelPath(
  shape: CakeShape,
  glazeVariant: string,
  withDrips: boolean,
): string | null {
  const folder = SHAPE_FOLDER[shape];
  const glazeMap = GLAZE_FILES[shape];

  void withDrips;
  const file = glazeMap[glazeVariant as GlazeVariant];

  return file ? p(folder, file) : null;
}

/**
 * Returns the path to a Deco GLB, or null when the variant is unavailable
 * for the requested shape (no decoration should be rendered).
 *
 * @param shape        - cake shape
 * @param decorVariant - 'blueberry' | 'chocolate' | 'meringue' | 'glaze-cream' | etc.
 */
export function getDecoModelPath(shape: CakeShape, decorVariant: string): string | null {
  if (decorVariant === 'candle') return CANDLE_FILES[shape];

  const folder = SHAPE_FOLDER[shape];
  const decoMap = DECO_FILES[shape];

  const file = decoMap[decorVariant as DecoVariant];
  if (!file) return null;

  return p(folder, file);
}

/**
 * Returns the path to the candle GLB for a given shape.
 */
export function getCandleModelPath(shape: CakeShape): string {
  return CANDLE_FILES[shape];
}

export function isLayerVisualKeyAvailable(
  shape: CakeShape,
  visualKey: string,
  isBig = false,
): boolean {
  return getLayerModelPath(shape, visualKey, isBig) !== null;
}

export function isFullTierVisualKeyAvailable(
  shape: CakeShape,
  visualKey: string,
): boolean {
  return getFullTierModelPath(shape, visualKey) !== null;
}

export function isFillVisualKeyAvailable(shape: CakeShape, visualKey: string): boolean {
  return getFillModelPath(shape, visualKey) !== null;
}

export function isDecoVisualKeyAvailable(shape: CakeShape, visualKey: string): boolean {
  return getDecoModelPath(shape, visualKey) !== null;
}

export function isGlazeVisualKeyAvailable(shape: CakeShape, visualKey: string): boolean {
  return GLAZE_FILES[shape][visualKey as GlazeVariant] !== undefined;
}

export function getDeclaredModelPaths(): string[] {
  const paths = new Set<string>();

  for (const shape of Object.keys(SHAPE_FOLDER) as CakeShape[]) {
    const folder = SHAPE_FOLDER[shape];
    for (const file of Object.values(LAYER_FILES[shape])) paths.add(p(folder, file));
    for (const file of Object.values(FULL_TIER_FILES[shape])) paths.add(p(folder, file));
    for (const file of Object.values(FILL_FILES[shape])) paths.add(p(folder, file));
    for (const file of Object.values(GLAZE_FILES[shape])) paths.add(p(folder, file));
    for (const file of Object.values(DECO_FILES[shape])) paths.add(p(folder, file));
    paths.add(CANDLE_FILES[shape]);
  }

  return Array.from(paths).sort();
}

// ---------------------------------------------------------------------------
// UI option lists
// ---------------------------------------------------------------------------

export interface GlazeOption {
  id: string;
  label: string;
  color: string;
  hasDripsVariant: boolean;
}

const GLAZE_META: Record<GlazeVariant, { label: string; color: string }> = {
  cream: { label: 'Кремовая', color: '#FFF5E0' },
  'cream-2': { label: 'Кремовая версия 2', color: '#FFF5E0' },
  choco: { label: 'Шоколадная', color: '#4A2C17' },
  'choco-2': { label: 'Шоколадная версия 2', color: '#4A2C17' },
  pink: { label: 'Розовая', color: '#FFB6C1' },
  'pink-2': { label: 'Розовая версия 2', color: '#FFB6C1' },
  milk: { label: 'Молочная', color: '#FFF8E7' },
  'cream-glaze': { label: 'Кремово-зеркальная', color: '#F5DEB3' },
};

export function getAvailableGlazes(shape: CakeShape): GlazeOption[] {
  const glazeMap = GLAZE_FILES[shape];

  return (Object.keys(glazeMap) as GlazeVariant[]).map(
    (variant) => {
      const meta = GLAZE_META[variant] ?? { label: variant, color: '#FFFFFF' };
      return {
        id: variant,
        label: meta.label,
        color: meta.color,
        hasDripsVariant: false,
      };
    },
  );
}

/**
 * Returns the hex color of a glaze variant (for shader uniforms).
 */
export function getGlazeColor(glazeVariant: string): string {
  const meta = GLAZE_META[glazeVariant as GlazeVariant];
  return meta?.color ?? '#FFF5E0';
}

export interface DecoOption {
  id: string;
  label: string;
  description: string;
  uiCategory: DecorationUiCategory;
  uiCategoryLabel: string;
  placementSlot: DecorationPlacementSlot;
}

const DECORATION_UI_CATEGORY_LABELS: Record<DecorationUiCategory, string> = {
  berries: 'Ягоды',
  chocolate: 'Шоколад',
  creamGlaze: 'Крем / глазурь',
  meringue: 'Меренга',
  topDecor: 'Верхний декор',
  candle: 'Свеча',
};

const DECO_META: Record<DecoVariant, {
  label: string;
  description: string;
  uiCategory: DecorationUiCategory;
  placementSlot: DecorationPlacementSlot;
}> = {
  blueberry: {
    label: 'Ягодный декор',
    description: 'Готовый ягодный набор',
    uiCategory: 'berries',
    placementSlot: 'surfaceDecor',
  },
  chocolate: {
    label: 'Шоколадный декор',
    description: 'Готовый шоколадный набор',
    uiCategory: 'chocolate',
    placementSlot: 'surfaceDecor',
  },
  'chocolate-choco': {
    label: 'Тёмный шоколад',
    description: 'Готовый набор из тёмного шоколада',
    uiCategory: 'chocolate',
    placementSlot: 'surfaceDecor',
  },
  'chocolate-pink': {
    label: 'Розовый шоколад',
    description: 'Готовый набор из розового шоколада',
    uiCategory: 'chocolate',
    placementSlot: 'surfaceDecor',
  },
  meringue: {
    label: 'Меренга',
    description: 'Готовый набор из меренги',
    uiCategory: 'meringue',
    placementSlot: 'surfaceDecor',
  },
  'glaze-cream': {
    label: 'Кремовая глазурь',
    description: 'Готовый декор из кремовой глазури',
    uiCategory: 'creamGlaze',
    placementSlot: 'surfaceDecor',
  },
  'glaze-cream2': {
    label: 'Кремовая глазурь 2',
    description: 'Второй готовый декор из кремовой глазури',
    uiCategory: 'creamGlaze',
    placementSlot: 'surfaceDecor',
  },
  'glaze-choco': {
    label: 'Шоколадная глазурь',
    description: 'Готовый декор из шоколадной глазури',
    uiCategory: 'creamGlaze',
    placementSlot: 'surfaceDecor',
  },
  'glaze-pink': {
    label: 'Розовая глазурь',
    description: 'Готовый декор из розовой глазури',
    uiCategory: 'creamGlaze',
    placementSlot: 'surfaceDecor',
  },
  cream: {
    label: 'Кремовый декор',
    description: 'Готовый кремовый набор',
    uiCategory: 'creamGlaze',
    placementSlot: 'surfaceDecor',
  },
  candle: {
    label: 'Свеча',
    description: 'Праздничная свеча',
    uiCategory: 'candle',
    placementSlot: 'candle',
  },
  'top-cream': {
    label: 'Крем сверху',
    description: 'Верхний кремовый декор',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-choco': {
    label: 'Шоколад сверху',
    description: 'Верхний шоколадный декор',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-pink': {
    label: 'Розовый крем сверху',
    description: 'Верхний розовый декор',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-meringue': {
    label: 'Меренга сверху',
    description: 'Верхний декор из меренги',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-glaze': {
    label: 'Глазурь сверху',
    description: 'Верхний глазурный декор',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-glaze-choco': {
    label: 'Шоколадная глазурь сверху',
    description: 'Верхний шоколадный глазурный декор',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-glaze-cream': {
    label: 'Кремовая глазурь сверху',
    description: 'Верхний кремовый глазурный декор',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-glaze-cream2': {
    label: 'Кремовая глазурь сверху 2',
    description: 'Второй верхний кремовый глазурный декор',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
  'top-meringue-pink': {
    label: 'Розовая меренга сверху',
    description: 'Верхний розовый декор из меренги',
    uiCategory: 'topDecor',
    placementSlot: 'surfaceDecor',
  },
};

export function getDecorationPlacementRule(visualKey: string): DecorationPlacementRule {
  const meta = DECO_META[visualKey as DecoVariant];
  return {
    slot: meta?.placementSlot ?? 'surfaceDecor',
    maxPerCake: 1,
  };
}

export function getDecorationUiCategory(visualKey: string): DecorationUiCategory {
  return DECO_META[visualKey as DecoVariant]?.uiCategory ?? 'topDecor';
}

export function getDecorationUiCategoryLabel(category: DecorationUiCategory): string {
  return DECORATION_UI_CATEGORY_LABELS[category];
}

export function getDecorationMeta(visualKey: string): DecoOption | null {
  const meta = DECO_META[visualKey as DecoVariant];
  if (!meta) return null;

  return {
    id: visualKey,
    label: meta.label,
    description: meta.description,
    uiCategory: meta.uiCategory,
    uiCategoryLabel: getDecorationUiCategoryLabel(meta.uiCategory),
    placementSlot: meta.placementSlot,
  };
}

export function getAvailableDecos(shape: CakeShape): DecoOption[] {
  const decoMap = DECO_FILES[shape];

  return (Object.keys(decoMap) as DecoVariant[]).map((variant) => {
    const meta = getDecorationMeta(variant) ?? {
      id: variant,
      label: variant,
      description: '',
      uiCategory: 'topDecor' as DecorationUiCategory,
      uiCategoryLabel: getDecorationUiCategoryLabel('topDecor'),
      placementSlot: 'surfaceDecor' as DecorationPlacementSlot,
    };
    return meta;
  });
}

export interface BaseVariant {
  id: string;
  label: string;
  color: string;
}

const LAYER_VARIANT_META: Record<LayerVariant, string> = {
  default: 'Тёмный',
  red: 'Красный бархат',
  cherry: 'Вишнёвый',
  choco: 'Шоколадный',
  cream: 'Кремовый',
  glaze: 'Кремовая глазурь',
  pink: 'Розовый',
};

const FULL_TIER_VARIANT_META: Record<
  CakeShape,
  Partial<Record<LayerVariant, { label: string; color: string }>>
> = {
  circle: {
    cherry: { label: 'Вишнёвый', color: '#E7A8B4' },
    choco: { label: 'Шоколадный', color: '#3B260E' },
    cream: { label: 'Кремовый', color: '#E7CEAB' },
    glaze: { label: 'Кремовая глазурь', color: '#E8C092' },
  },
  square: {
    default: { label: 'Тёмный', color: '#462F1E' },
    cherry: { label: 'Вишнёвый', color: '#FFABAE' },
    cream: { label: 'Кремовый', color: '#E7CEAB' },
    glaze: { label: 'Кремовая глазурь', color: '#E8C092' },
  },
  heart: {
    choco: { label: 'Шоколадный', color: '#3B260E' },
    cream: { label: 'Кремовый', color: '#E7CEAB' },
    glaze: { label: 'Кремовая глазурь', color: '#E8C092' },
    pink: { label: 'Розовый', color: '#FFABAE' },
  },
};

export function getFullTierVariantMeta(
  shape: CakeShape,
  visualKey: string,
): { label: string; color: string } | null {
  return FULL_TIER_VARIANT_META[shape][visualKey as LayerVariant] ?? null;
}

export function getAvailableBaseVariants(shape: CakeShape): BaseVariant[] {
  const layerMap = FULL_TIER_FILES[shape];

  return (Object.keys(layerMap) as LayerVariant[]).map((variant) => {
    const meta = getFullTierVariantMeta(shape, variant);
    return {
      id: variant,
      label: meta?.label ?? LAYER_VARIANT_META[variant] ?? variant,
      color: meta?.color ?? '#FFFFFF',
    };
  });
}

const FILL_VARIANT_META: Record<FillVariant, string> = {
  cream: 'Крем',
  choco: 'Шоколадный крем',
  pink: 'Розовый крем',
  meringue: 'Меренга',
  'meringue-pink': 'Розовая меренга',
  glaze: 'Глазурь',
  'glaze-choco': 'Шоколадная глазурь',
  'glaze-cream': 'Кремовая глазурь',
  'glaze-cream2': 'Кремовая глазурь 2',
};

export function getAvailableFillVariants(
  shape: CakeShape,
): { id: string; label: string }[] {
  const fillMap = FILL_FILES[shape];

  return (Object.keys(fillMap) as FillVariant[]).map((variant) => ({
    id: variant,
    label: FILL_VARIANT_META[variant] ?? variant,
  }));
}

// ---------------------------------------------------------------------------
// Convenience: all paths for a shape (used by preloader)
// ---------------------------------------------------------------------------

export function getAllLayerPaths(shape: CakeShape): string[] {
  const folder = SHAPE_FOLDER[shape];
  const paths: string[] = [];

  for (const file of Object.values(LAYER_FILES[shape])) {
    if (file) paths.push(p(folder, file));
  }
  for (const file of Object.values(FULL_TIER_FILES[shape])) {
    if (file) paths.push(p(folder, file));
  }

  return paths;
}

export function getAllFullTierPaths(shape: CakeShape): string[] {
  const folder = SHAPE_FOLDER[shape];
  const paths: string[] = [];

  for (const file of Object.values(FULL_TIER_FILES[shape])) {
    if (file) paths.push(p(folder, file));
  }

  return paths;
}

export function getAllGlazePaths(shape: CakeShape): string[] {
  const folder = SHAPE_FOLDER[shape];
  const paths: string[] = [];

  for (const file of Object.values(GLAZE_FILES[shape])) {
    if (file) paths.push(p(folder, file));
  }

  return paths;
}

export function getAllFillPaths(shape: CakeShape): string[] {
  const folder = SHAPE_FOLDER[shape];
  const paths: string[] = [];

  for (const file of Object.values(FILL_FILES[shape])) {
    if (file) paths.push(p(folder, file));
  }

  return paths;
}

export function getAllDecoPaths(shape: CakeShape): string[] {
  const folder = SHAPE_FOLDER[shape];
  const paths: string[] = [];

  for (const file of Object.values(DECO_FILES[shape])) {
    if (file) paths.push(p(folder, file));
  }

  paths.push(getCandleModelPath(shape));

  return paths;
}
