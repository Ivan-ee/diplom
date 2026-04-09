import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';

export type CakeShape = 'circle' | 'square' | 'heart';
export type TierCount = 1 | 2 | 3;
export type CoatingType = 'cream' | 'fondant';
export type ConstructorStep = 1 | 2 | 3 | 4 | 5;

export interface CakeLayer {
  baseId: string;
  fillingId: string;
  weight: number;
}

export interface CoatingGradient {
  enabled: boolean;
  gradientEndColor: string;
  direction: 'vertical' | 'horizontal';
}

export interface CoatingDrips {
  enabled: boolean;
  color: string;
  intensity: number;
}

export interface CakeCoating {
  type: CoatingType;
  coatingId: string;
  color: string;
  gradient: CoatingGradient | null;
  drips: CoatingDrips | null;
}

export interface PlacedDecoration {
  id: string;
  decorationId: string;
  position: [number, number, number];
  normal: [number, number, number];
}

export interface IngredientBase {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  color?: string;
  available: boolean;
}

export interface IngredientFilling {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  available: boolean;
}

export interface IngredientCoating {
  id: string;
  type: CoatingType;
  name: string;
  pricePerKg: number;
  available: boolean;
}

export interface IngredientDecoration {
  id: string;
  name: string;
  category: string;
  pricePerUnit: number;
  available: boolean;
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
  shape: CakeShape;
  tierCount: TierCount;
  layers: CakeLayer[];
  coating: CakeCoating;
  decorations: PlacedDecoration[];
  inscription: string;
  ingredients: ConstructorCatalog | null;
  totalPrice: number;
  isLoading: boolean;

  /** ID of the decoration type currently being placed via click-to-place mode. Null when idle. */
  placingDecorationId: string | null;
  setPlacingDecorationId: (id: string | null) => void;

  setStep: (step: ConstructorStep) => void;
  setShape: (shape: CakeShape) => void;
  setTierCount: (count: TierCount) => void;
  setLayerBase: (tierIndex: number, baseId: string) => void;
  setLayerFilling: (tierIndex: number, fillingId: string) => void;
  setLayerWeight: (tierIndex: number, weight: number) => void;
  setCoatingType: (type: CoatingType) => void;
  setCoatingColor: (color: string) => void;
  setCoatingId: (id: string) => void;
  setGradient: (gradient: CoatingGradient | null) => void;
  setDrips: (drips: CoatingDrips | null) => void;
  addDecoration: (decorationId: string, position: [number, number, number], normal: [number, number, number]) => void;
  removeDecoration: (id: string) => void;
  moveDecoration: (id: string, position: [number, number, number], normal: [number, number, number]) => void;
  setInscription: (text: string) => void;
  loadIngredients: () => Promise<void>;
  recalculatePrice: () => void;
  reset: () => void;
  getConfig: () => ConstructorConfig | null;
}

const DEFAULT_LAYER: CakeLayer = {
  baseId: '',
  fillingId: '',
  weight: 1000,
};

const DEFAULT_COATING: CakeCoating = {
  type: 'cream',
  coatingId: '',
  color: '#FFFFFF',
  gradient: null,
  drips: null,
};

const buildLayers = (count: TierCount, existing: CakeLayer[]): CakeLayer[] => {
  const arr: CakeLayer[] = [];
  for (let i = 0; i < count; i++) {
    arr.push(existing[i] ?? { ...DEFAULT_LAYER });
  }
  return arr;
};

function applyDefaultSelections(
  state: Pick<ConstructorState, 'coating' | 'layers'>,
  ingredients: ConstructorCatalog,
): Partial<ConstructorState> {
  const updates: Partial<ConstructorState> = {};

  if (!state.coating.coatingId && ingredients.coatings.length > 0) {
    const defaultCoating = ingredients.coatings.find((c) => c.type === 'cream') ?? ingredients.coatings[0];
    updates.coating = { ...state.coating, coatingId: defaultCoating.id };
  }

  if (state.layers[0] && !state.layers[0].baseId && ingredients.bases.length > 0) {
    const layers = state.layers.map((l, i) => ({
      ...l,
      baseId: l.baseId || (ingredients.bases[i % ingredients.bases.length]?.id ?? ''),
      fillingId: l.fillingId || (ingredients.fillings[0]?.id ?? ''),
    }));
    updates.layers = layers;
  }

  return updates;
}

export const useConstructorStore = create<ConstructorState>()(
  persist(
    subscribeWithSelector((set, get) => ({
    currentStep: 1,
    shape: 'circle',
    tierCount: 1,
    layers: [{ ...DEFAULT_LAYER }],
    coating: { ...DEFAULT_COATING },
    decorations: [],
    inscription: '',
    ingredients: null,
    totalPrice: 0,
    isLoading: false,
    placingDecorationId: null,

    setPlacingDecorationId: (id) => set({ placingDecorationId: id }),

    setStep: (step) => set({ currentStep: step }),

    setShape: (shape) => {
      set({ shape });
      get().recalculatePrice();
    },

    setTierCount: (count) => {
      const existing = get().layers;
      set({ tierCount: count, layers: buildLayers(count, existing) });
      get().recalculatePrice();
    },

    setLayerBase: (tierIndex, baseId) => {
      const layers = [...get().layers];
      if (layers[tierIndex]) {
        layers[tierIndex] = { ...layers[tierIndex], baseId };
        set({ layers });
        get().recalculatePrice();
      }
    },

    setLayerFilling: (tierIndex, fillingId) => {
      const layers = [...get().layers];
      if (layers[tierIndex]) {
        layers[tierIndex] = { ...layers[tierIndex], fillingId };
        set({ layers });
        get().recalculatePrice();
      }
    },

    setLayerWeight: (tierIndex, weight) => {
      const layers = [...get().layers];
      if (layers[tierIndex]) {
        layers[tierIndex] = { ...layers[tierIndex], weight };
        set({ layers });
        get().recalculatePrice();
      }
    },

    setCoatingType: (type) => {
      const ingredients = get().ingredients;
      const matchingCoating = ingredients?.coatings.find((c) => c.type === type);
      set((state) => ({
        coating: {
          ...state.coating,
          type,
          coatingId: matchingCoating?.id ?? state.coating.coatingId,
        },
      }));
      get().recalculatePrice();
    },

    setCoatingColor: (color) => {
      set((state) => ({ coating: { ...state.coating, color } }));
    },

    setCoatingId: (id) => {
      set((state) => ({ coating: { ...state.coating, coatingId: id } }));
      get().recalculatePrice();
    },

    setGradient: (gradient) => {
      set((state) => ({ coating: { ...state.coating, gradient } }));
    },

    setDrips: (drips) => {
      set((state) => ({ coating: { ...state.coating, drips } }));
    },

    addDecoration: (decorationId, position, normal) => {
      const config = get().getConfig();
      const max = config?.maxDecorations ?? 20;
      if (get().decorations.length >= max) return;
      const id = `${decorationId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      set((state) => ({
        decorations: [...state.decorations, { id, decorationId, position, normal }],
      }));
      get().recalculatePrice();
    },

    removeDecoration: (id) => {
      set((state) => ({
        decorations: state.decorations.filter((d) => d.id !== id),
      }));
      get().recalculatePrice();
    },

    moveDecoration: (id, position, normal) => {
      set((state) => ({
        decorations: state.decorations.map((d) =>
          d.id === id ? { ...d, position, normal } : d,
        ),
      }));
    },

    setInscription: (text) => {
      const max = get().getConfig()?.maxInscriptionLength ?? 50;
      set({ inscription: text.slice(0, max) });
    },

    loadIngredients: async () => {
      set({ isLoading: true });
      try {
        const res = await fetch('/api/constructor/ingredients');
        if (!res.ok) throw new Error('API unavailable');
        const envelope = (await res.json()) as { data?: ConstructorCatalog } | ConstructorCatalog;
        const catalog: ConstructorCatalog = (
          (envelope as { data?: ConstructorCatalog }).data ?? (envelope as ConstructorCatalog)
        );
        set({ ingredients: catalog, isLoading: false });
      } catch (err) {
        console.error('Failed to load constructor ingredients, using mock data:', err);
        const mock = getMockIngredients();
        set({ ingredients: mock, isLoading: false });
      }

      // Set sensible defaults after loading
      const state = get();
      const { ingredients } = state;
      if (!ingredients) return;

      const updates = applyDefaultSelections(state, ingredients);
      if (Object.keys(updates).length > 0) {
        set(updates as Partial<ConstructorState>);
      }

      get().recalculatePrice();
    },

    recalculatePrice: () => {
      const state = get();
      const { ingredients, layers, shape, tierCount, coating, decorations } = state;
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

      const decorationCounts: Record<string, number> = {};
      for (const d of decorations) {
        decorationCounts[d.decorationId] = (decorationCounts[d.decorationId] ?? 0) + 1;
      }
      for (const [decorId, count] of Object.entries(decorationCounts)) {
        const decor = ingredients.decorations.find((d) => d.id === decorId);
        if (decor) runningTotal += decor.pricePerUnit * count;
      }

      const shapeInfo = ingredients.shapes.find((s) => s.id === shape);
      const shapeSurchargePercent = shapeInfo?.surchargePercent ?? 0;
      runningTotal += (runningTotal * shapeSurchargePercent) / 100;

      const tierSurcharge = ingredients.tierSurcharges.find((t) => t.tierCount === tierCount);
      runningTotal += tierSurcharge?.surcharge ?? 0;

      set({ totalPrice: Math.round(runningTotal) });
    },

    reset: () => {
      set({
        currentStep: 1,
        shape: 'circle',
        tierCount: 1,
        layers: [{ ...DEFAULT_LAYER }],
        coating: { ...DEFAULT_COATING },
        decorations: [],
        inscription: '',
        totalPrice: 0,
      });
    },

    getConfig: () => {
      return get().ingredients?.config ?? null;
    },
  })),
  {
    name: 'bakery-constructor',
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
      layers: state.layers,
      coating: state.coating,
      decorations: state.decorations,
      inscription: state.inscription,
    }) as unknown as ConstructorState,
  }
)
);
