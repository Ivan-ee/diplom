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

type LayerVariant = 'default' | 'red' | 'cherry' | 'choco';
type BigLayerVariant = 'default' | 'cherry' | 'cream' | 'glaze' | 'choco' | 'pink';
type FillVariant = 'cream' | 'choco' | 'pink' | 'meringue' | 'glaze' | 'glaze-choco' | 'glaze-cream' | 'glaze-cream2' | 'meringue-pink';
type GlazeVariant = 'cream' | 'choco' | 'pink' | 'milk' | 'cream-glaze';
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
  | 'candle';

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

const BIG_LAYER_FILES: Record<CakeShape, Partial<Record<BigLayerVariant, string>>> = {
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

// [withoutDrips, withDrips] — withDrips is null when no *2 variant exists
type GlazeEntry = [string, string | null];

const GLAZE_FILES: Record<CakeShape, Partial<Record<GlazeVariant, GlazeEntry>>> = {
  circle: {
    cream: ['GlazeCream.glb', 'GlazeCream2.glb'],
    choco: ['GlazeChoco.glb', 'GlazeChoco2.glb'],
    milk: ['cakeGlazeMilk.glb', null],
    pink: ['cakeGlazePink.glb', null],
  },
  square: {
    cream: ['GlazeCream.glb', null],
    choco: ['GlazeChoco.glb', null],
    pink: ['GlazePink.glb', null],
    'cream-glaze': ['GlazeCreamGlaze.glb', null],
  },
  heart: {
    cream: ['GlazeCream.glb', 'GlazeCream2.glb'],
    choco: ['GlazeChoco.glb', 'GlazeChoco2.glb'],
    pink: ['GlazePink.glb', 'GlazePink2.glb'],
  },
};

// --- Decos ------------------------------------------------------------------

const DECO_FILES: Record<CakeShape, Partial<Record<DecoVariant, string>>> = {
  circle: {
    blueberry: 'cakeDecorBlueberry.glb',
    'chocolate-pink': 'cakeDecorPinkChocolate.glb',
    cream: 'cakeDecorCream.glb',
    'glaze-cream': 'cakeDecorGlaze.glb',
  },
  square: {
    blueberry: 'DecoBlueberry.glb',
    chocolate: 'DecoChocolate.glb',
    'chocolate-choco': 'DecoChocolateChoco.glb',
    'glaze-choco': 'DecoGlazeChoco.glb',
    'glaze-cream': 'DecoGlazeCream.glb',
    'glaze-pink': 'DecoGlazePink.glb',
    meringue: 'DecoMeringue.glb',
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
    const bigMap = BIG_LAYER_FILES[shape];
    const bigFile = bigMap[baseVariant as BigLayerVariant];
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
  const bigFile = BIG_LAYER_FILES[shape][baseVariant as BigLayerVariant];

  return bigFile ? p(folder, bigFile) : null;
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
 * @param glazeVariant - 'cream' | 'choco' | 'pink' | 'milk' | 'cream-glaze'
 * @param withDrips    - true for the *2 drip variant
 */
export function getGlazeModelPath(
  shape: CakeShape,
  glazeVariant: string,
  withDrips: boolean,
): string | null {
  const folder = SHAPE_FOLDER[shape];
  const glazeMap = GLAZE_FILES[shape];

  const entry = glazeMap[glazeVariant as GlazeVariant];
  if (!entry) return null;

  const [base, drips] = entry;
  const file = withDrips && drips !== null ? drips : base;

  return p(folder, file);
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
    for (const file of Object.values(BIG_LAYER_FILES[shape])) paths.add(p(folder, file));
    for (const file of Object.values(FILL_FILES[shape])) paths.add(p(folder, file));
    for (const [base, drips] of Object.values(GLAZE_FILES[shape])) {
      paths.add(p(folder, base));
      if (drips) paths.add(p(folder, drips));
    }
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
  choco: { label: 'Шоколадная', color: '#4A2C17' },
  pink: { label: 'Розовая', color: '#FFB6C1' },
  milk: { label: 'Молочная', color: '#FFF8E7' },
  'cream-glaze': { label: 'Кремово-зеркальная', color: '#F5DEB3' },
};

export function getAvailableGlazes(shape: CakeShape): GlazeOption[] {
  const glazeMap = GLAZE_FILES[shape];

  return (Object.entries(glazeMap) as [GlazeVariant, GlazeEntry][]).map(
    ([variant, [, drips]]) => {
      const meta = GLAZE_META[variant] ?? { label: variant, color: '#FFFFFF' };
      return {
        id: variant,
        label: meta.label,
        color: meta.color,
        hasDripsVariant: drips !== null,
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
}

const DECO_META: Record<DecoVariant, { label: string; description: string }> = {
  blueberry: { label: 'Черника', description: 'Свежие ягоды черники' },
  chocolate: { label: 'Шоколад', description: 'Шоколадные фигурки' },
  'chocolate-choco': { label: 'Шоко-шоколад', description: 'Тёмные шоколадные фигурки' },
  'chocolate-pink': { label: 'Розовый шоколад', description: 'Фигурки из розового шоколада' },
  meringue: { label: 'Безе', description: 'Хрустящие меренги' },
  'glaze-cream': { label: 'Кремовая глазурь', description: 'Декор из кремовой глазури' },
  'glaze-cream2': { label: 'Кремовая глазурь 2', description: 'Второй вариант кремовой глазури' },
  'glaze-choco': { label: 'Шоколадная глазурь', description: 'Декор из шоколадной глазури' },
  'glaze-pink': { label: 'Розовая глазурь', description: 'Декор из розовой глазури' },
  cream: { label: 'Кремовый декор', description: 'Розочки и узоры из крема' },
  candle: { label: 'Свеча', description: 'Праздничная свеча' },
};

export function getAvailableDecos(shape: CakeShape): DecoOption[] {
  const decoMap = DECO_FILES[shape];

  return (Object.keys(decoMap) as DecoVariant[]).map((variant) => {
    const meta = DECO_META[variant] ?? { label: variant, description: '' };
    return { id: variant, label: meta.label, description: meta.description };
  });
}

export interface BaseVariant {
  id: string;
  label: string;
}

const LAYER_VARIANT_META: Record<LayerVariant, string> = {
  default: 'Ванильный',
  red: 'Красный бархат',
  cherry: 'Вишнёвый',
  choco: 'Шоколадный',
};

export function getAvailableBaseVariants(shape: CakeShape): BaseVariant[] {
  const layerMap = BIG_LAYER_FILES[shape];

  return (Object.keys(layerMap) as BigLayerVariant[]).map((variant) => ({
    id: variant,
    label: LAYER_VARIANT_META[variant as LayerVariant] ?? variant,
  }));
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
  for (const file of Object.values(BIG_LAYER_FILES[shape])) {
    if (file) paths.push(p(folder, file));
  }

  return paths;
}

export function getAllGlazePaths(shape: CakeShape): string[] {
  const folder = SHAPE_FOLDER[shape];
  const paths: string[] = [];

  for (const [base, drips] of Object.values(GLAZE_FILES[shape]) as GlazeEntry[]) {
    paths.push(p(folder, base));
    if (drips) paths.push(p(folder, drips));
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
