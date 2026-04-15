import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';

export type CakeShape = 'circle' | 'square' | 'heart';
export type TierCount = 1 | 2 | 3;
export type CoatingType = 'cream' | 'fondant';
export type ConstructorStep = 1 | 2 | 3 | 4 | 5;
export type ColorMode = 'solid' | 'gradient' | 'splashes';

export interface CakeLayer {
  baseId: string;
  fillingId: string;
  weight: number;
}

export interface CakeCoating {
  type: CoatingType;
  coatingId: string;
  glazeVariant: string;
  withDrips: boolean;
  colorMode: ColorMode;
  secondaryGlazeVariant?: string;
}

export interface IngredientBase {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
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
  imageUrl?: string;
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
  activeDecorations: string[];
  hasCandle: boolean;
  inscription: string;
  ingredients: ConstructorCatalog | null;
  totalPrice: number;
  isLoading: boolean;

  setStep: (step: ConstructorStep) => void;
  setShape: (shape: CakeShape) => void;
  setTierCount: (count: TierCount) => void;
  setLayerBase: (tierIndex: number, baseId: string) => void;
  setLayerFilling: (tierIndex: number, fillingId: string) => void;
  setLayerWeight: (tierIndex: number, weight: number) => void;
  setCoatingType: (type: CoatingType) => void;
  setCoatingId: (id: string) => void;
  setGlazeVariant: (variant: string) => void;
  setWithDrips: (withDrips: boolean) => void;
  setColorMode: (mode: ColorMode) => void;
  setSecondaryGlazeVariant: (variant: string) => void;
  addDecoration: (variantId: string) => void;
  removeDecoration: (variantId: string) => void;
  clearDecorations: () => void;
  setHasCandle: (hasCandle: boolean) => void;
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
  glazeVariant: 'cream',
  withDrips: false,
  colorMode: 'solid' as ColorMode,
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
      activeDecorations: [],
      hasCandle: false,
      inscription: '',
      ingredients: null,
      totalPrice: 0,
      isLoading: false,

      setStep: (step) => set({ currentStep: step }),

      setShape: (shape) => {
        set({ shape, activeDecorations: [], hasCandle: false });
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

      setCoatingId: (id) => {
        set((state) => ({ coating: { ...state.coating, coatingId: id } }));
        get().recalculatePrice();
      },

      setGlazeVariant: (variant) => {
        set((state) => ({ coating: { ...state.coating, glazeVariant: variant } }));
      },

      setWithDrips: (withDrips) => {
        set((state) => ({ coating: { ...state.coating, withDrips } }));
      },

      setColorMode: (mode) => {
        set((state) => ({
          coating: { ...state.coating, colorMode: mode, withDrips: mode === 'splashes' },
        }));
      },

      setSecondaryGlazeVariant: (variant) => {
        set((state) => ({
          coating: { ...state.coating, secondaryGlazeVariant: variant },
        }));
      },

      addDecoration: (variantId) => {
        const { activeDecorations, ingredients } = get();
        const max = ingredients?.config?.maxDecorations ?? 3;
        if (activeDecorations.length >= max || activeDecorations.includes(variantId)) return;
        set({ activeDecorations: [...activeDecorations, variantId] });
        get().recalculatePrice();
      },

      removeDecoration: (variantId) => {
        const { activeDecorations } = get();
        set({ activeDecorations: activeDecorations.filter((id) => id !== variantId) });
        get().recalculatePrice();
      },

      clearDecorations: () => {
        set({ activeDecorations: [] });
        get().recalculatePrice();
      },

      setHasCandle: (hasCandle) => {
        set({ hasCandle });
        get().recalculatePrice();
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
          // Normalize API field name (API returns isAvailable, mock returns available)
          if (catalog.bases) {
            catalog.bases = catalog.bases.map((b: any) => ({ ...b, available: b.available ?? b.isAvailable ?? true }));
          }
          if (catalog.fillings) {
            catalog.fillings = catalog.fillings.map((f: any) => ({
              ...f,
              available: f.available ?? f.isAvailable ?? true,
              imageUrl: f.imageUrl ?? f.image_url ?? null,
            }));
          }
          if (catalog.coatings) {
            catalog.coatings = catalog.coatings.map((c: any) => ({ ...c, available: c.available ?? c.isAvailable ?? true }));
          }
          if (catalog.decorations) {
            catalog.decorations = catalog.decorations.map((d: any) => ({ ...d, available: d.available ?? d.isAvailable ?? true }));
          }
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
        const { ingredients, layers, shape, tierCount, coating } = state;
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

        for (const variantId of state.activeDecorations) {
          const decoIngredient =
            ingredients.decorations.find((d) => d.id === variantId) ?? ingredients.decorations[0];
          if (decoIngredient) {
            runningTotal += decoIngredient.pricePerUnit;
          }
        }

        if (state.hasCandle) {
          const candleIngredient = ingredients.decorations.find(
            (d) => d.category === 'candle' || d.name.toLowerCase().includes('свеч'),
          );
          if (candleIngredient) {
            runningTotal += candleIngredient.pricePerUnit;
          }
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
          activeDecorations: [],
          hasCandle: false,
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
      version: 1,
      migrate: (persisted: any, _version: number) => {
        // Конвертировать старый decorVariant в activeDecorations
        if (persisted && 'decorVariant' in persisted) {
          persisted.activeDecorations = persisted.decorVariant ? [persisted.decorVariant] : [];
          delete persisted.decorVariant;
        }
        // Добавить colorMode если отсутствует
        if (persisted?.coating && !('colorMode' in persisted.coating)) {
          persisted.coating.colorMode = 'solid';
        }
        return persisted;
      },
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
        activeDecorations: state.activeDecorations,
        hasCandle: state.hasCandle,
        inscription: state.inscription,
      }) as unknown as ConstructorState,
    },
  ),
);
