import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CakeConfigData {
  shape: string;
  tierCount: number;
  layers: Array<{ baseId: string; fillingId: string; weight: number }>;
  coating: {
    type: string;
    coatingId: string;
    color: string;
    gradient?: unknown;
    drips?: unknown;
  };
  decorations: Array<{
    id: string;
    decorationId: string;
    position: number[];
    normal?: number[];
  }>;
  inscription?: string;
}

export interface PromoResult {
  valid: boolean;
  code: string;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  message?: string;
}

export interface CartItem {
  id: string;
  type: 'product' | 'constructor';
  productId?: string;
  name: string;
  imageUrl: string;
  /** integer grams */
  weight: number;
  price: number;
  quantity: number;
  inscription?: string;
  cakeConfig?: CakeConfigData;
  /** копейки за кг — для пересчёта per_kg */
  pricePerKg?: number;
  /** копейки за штуку — для пересчёта per_unit */
  pricePerUnit?: number;
  priceType?: 'per_kg' | 'per_unit';
  /** шаг веса в граммах (500 = 0.5 кг) */
  weightStep?: number;
  /** мин. вес в граммах */
  minWeight?: number;
  /** макс. вес в граммах */
  maxWeight?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateWeight: (productId: string, newWeight: number) => void;
  getItemByProductId: (productId: string) => CartItem | null;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  promoResult: PromoResult | null;
  setPromoResult: (result: PromoResult | null) => void;
  clearPromo: () => void;
}

// Версия схемы persist — увеличить при изменении формата CartItem
const CART_VERSION = 1;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        // Constructor — всегда уникальный элемент
        if (item.type === 'constructor') {
          const id = `constructor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const newItem: CartItem = {
            ...item,
            id,
            quantity: item.quantity ?? 1,
          };
          set((state) => ({ items: [...state.items, newItem] }));
          return;
        }

        // Product — upsert по productId
        const stableId = `product-${item.productId}`;
        const existing = get().items.find(
          (i) => i.type === 'product' && i.productId === item.productId
        );

        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === existing.id
                ? {
                    ...i,
                    weight: item.weight,
                    price: item.price,
                    name: item.name,
                    imageUrl: item.imageUrl,
                    inscription: item.inscription !== undefined ? item.inscription : i.inscription,
                    pricePerKg: item.pricePerKg ?? i.pricePerKg,
                    pricePerUnit: item.pricePerUnit ?? i.pricePerUnit,
                    priceType: item.priceType ?? i.priceType,
                    weightStep: item.weightStep ?? i.weightStep,
                    minWeight: item.minWeight ?? i.minWeight,
                    maxWeight: item.maxWeight ?? i.maxWeight,
                  }
                : i
            ),
          }));
          return;
        }

        const newItem: CartItem = {
          ...item,
          id: stableId,
          quantity: item.quantity ?? 1,
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      updateWeight: (productId, newWeight) => {
        const item = get().items.find(
          (i) => i.type === 'product' && i.productId === productId
        );
        if (!item) return;

        const min = item.minWeight ?? 0;
        if (newWeight < min) {
          get().removeItem(item.id);
          return;
        }

        const clampedWeight = item.maxWeight !== undefined
          ? Math.min(newWeight, item.maxWeight)
          : newWeight;

        const newPrice = Math.round((item.pricePerKg ?? 0) * clampedWeight / 1000);

        set((state) => ({
          items: state.items.map((i) =>
            i.id === item.id
              ? { ...i, weight: clampedWeight, price: newPrice }
              : i
          ),
        }));
      },

      getItemByProductId: (productId) => {
        return (
          get().items.find(
            (i) => i.type === 'product' && i.productId === productId
          ) ?? null
        );
      },

      clearCart: () => set({ items: [], promoResult: null }),

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      promoResult: null,

      setPromoResult: (result) => set({ promoResult: result }),

      clearPromo: () => set({ promoResult: null }),
    }),
    {
      name: 'bakery-cart',
      version: CART_VERSION,
      migrate: (persistedState, version) => {
        const state = persistedState as { items: CartItem[] };

        if (version === CART_VERSION) return state;

        // v0 → v1: дедупликация product по productId, стабилизация ID,
        // приблизительное восстановление pricePerKg
        const seen = new Set<string>();
        const migratedItems: CartItem[] = [];

        for (const item of state.items ?? []) {
          if (item.type === 'constructor') {
            migratedItems.push(item);
            continue;
          }

          const pid = item.productId;
          if (!pid || seen.has(pid)) continue;
          seen.add(pid);

          const restoredPricePerKg =
            item.pricePerKg ??
            (item.weight > 0
              ? Math.round(item.price / (item.weight / 1000))
              : undefined);

          migratedItems.push({
            ...item,
            id: `product-${pid}`,
            pricePerKg: restoredPricePerKg,
          });
        }

        return { ...state, items: migratedItems };
      },
    }
  )
);
