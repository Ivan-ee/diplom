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
  | 'cream';

// --- Layers -----------------------------------------------------------------

const LAYER_FILES: Record<CakeShape, Partial<Record<LayerVariant, string>>> = {
  circle: {
    default: 'cakeLayer.glb',
    red: 'CakeLayerRed.glb',
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
    choco: 'CakeBigLayerChoco.glb',
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
    'meringue-pink': 'CakeFillMeringuePink.glb',
  },
};

// --- Glazes -----------------------------------------------------------------

// [withoutDrips, withDrips] — withDrips is null when no *2 variant exists
type GlazeEntry = [string, string | null];

const GLAZE_FILES: Record<CakeShape, Partial<Record<GlazeVariant, GlazeEntry>>> = {
  circle: {
    cream: ['GlazeCream.glb', 'GlazeCream2.glb'],
    choco: ['GlazeChoco.glb', null],
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
    cream: 'cakeDecorCream.glb',
    'glaze-cream': 'cakeDecorGlaze.glb',
    'chocolate-pink': 'cakeDecorPinkChocolate.glb',
  },
  square: {
    blueberry: 'DecoBlueberry.glb',
    chocolate: 'DecoChocolate.glb',
    'chocolate-choco': 'DecoChocolateChoco.glb',
    'glaze-cream': 'DecoGlazeCream.glb',
    'glaze-choco': 'DecoGlazeChoco.glb',
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function p(folder: string, file: string): string {
  return `${MODELS_BASE}/${folder}/${file}`;
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
): string {
  const folder = SHAPE_FOLDER[shape];

  if (isBig) {
    const bigMap = BIG_LAYER_FILES[shape];
    const file =
      bigMap[baseVariant as BigLayerVariant] ??
      // fallback: first available big layer
      Object.values(bigMap)[0] ??
      // last-resort fallback: regular layer
      Object.values(LAYER_FILES[shape])[0];

    if (file) return p(folder, file);
  }

  const layerMap = LAYER_FILES[shape];
  const file =
    layerMap[baseVariant as LayerVariant] ??
    layerMap['default'] ??
    Object.values(layerMap)[0]!;

  return p(folder, file);
}

/**
 * Returns the path to a Fill GLB.
 *
 * @param shape       - cake shape
 * @param fillVariant - 'cream' | 'choco' | 'pink' | 'meringue' | 'glaze' | etc.
 */
export function getFillModelPath(shape: CakeShape, fillVariant: string): string {
  const folder = SHAPE_FOLDER[shape];
  const fillMap = FILL_FILES[shape];

  const file =
    fillMap[fillVariant as FillVariant] ??
    // fallback: cream, then first available
    fillMap['cream'] ??
    Object.values(fillMap)[0];

  if (!file) {
    // absolute last resort — circle cream fill always exists
    return `${MODELS_BASE}/circle/cakeFillCream.glb`;
  }

  return p(folder, file);
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
): string {
  const folder = SHAPE_FOLDER[shape];
  const glazeMap = GLAZE_FILES[shape];

  const entry =
    glazeMap[glazeVariant as GlazeVariant] ??
    glazeMap['cream'] ??
    (Object.values(glazeMap)[0] as GlazeEntry | undefined);

  if (!entry) {
    return `${MODELS_BASE}/circle/GlazeCream.glb`;
  }

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
  const layerMap = LAYER_FILES[shape];

  return (Object.keys(layerMap) as LayerVariant[]).map((variant) => ({
    id: variant,
    label: LAYER_VARIANT_META[variant] ?? variant,
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
