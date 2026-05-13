import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore, type CakeConfigData } from '@/stores/cart-store';

type AddItemInput = Omit<import('@/stores/cart-store').CartItem, 'id' | 'quantity'> & { quantity?: number };

// Minimal cart item fixture (omits id and quantity – those are added by the store)
const makeItem = (overrides: Partial<AddItemInput> = {}) => ({
  type: 'product' as const,
  productId: 'prod-1',
  name: 'Торт ванильный',
  imageUrl: '/images/cake.jpg',
  weight: 1000,
  price: 150000,
  ...overrides,
});

const makeCakeConfig = (): CakeConfigData => ({
  shape: 'round',
  tierCount: 1,
  layers: [],
  coating: {
    type: 'cream',
    coatingId: 'c1',
    glazeVariant: 'cream',
    withDrips: false,
    colorMode: 'solid',
  },
  activeDecorations: [],
  selectedDecorations: [],
  hasCandle: false,
});

const resetStore = () => useCartStore.setState({ items: [] });

describe('cart-store', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  it('addItem adds a new item to the cart', () => {
    useCartStore.getState().addItem(makeItem());
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Торт ванильный');
    expect(items[0].price).toBe(150000);
  });

  // UPDATED: два вызова с одним productId дают 1 элемент (upsert), product ID стабильный
  it('addItem product: stable id and upsert on same productId', () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().addItem(makeItem());
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('product-prod-1');
  });

  it('addItem sets quantity to 1 by default', () => {
    useCartStore.getState().addItem(makeItem());
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('addItem respects an explicit quantity', () => {
    useCartStore.getState().addItem(makeItem({ quantity: 3 }));
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  it('removeItem removes the item with the given id', () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // UPDATED: используем РАЗНЫЕ productId чтобы upsert не слил их в один
  it('removeItem only removes the targeted item', () => {
    useCartStore.getState().addItem(makeItem({ productId: 'prod-A', name: 'Торт А' }));
    useCartStore.getState().addItem(makeItem({ productId: 'prod-B', name: 'Торт Б' }));
    const idA = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(idA);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Торт Б');
  });

  // ── updateQuantity ─────────────────────────────────────────────────────────

  it('updateQuantity changes the quantity of the target item', () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('updateQuantity with 0 removes the item', () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updateQuantity with negative value removes the item', () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  // UPDATED: два разных productId чтобы гарантированно 2 элемента перед clear
  it('clearCart empties the cart', () => {
    useCartStore.getState().addItem(makeItem({ productId: 'prod-1' }));
    useCartStore.getState().addItem(makeItem({ productId: 'prod-2' }));
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // ── getTotalPrice ──────────────────────────────────────────────────────────

  it('getTotalPrice returns 0 for empty cart', () => {
    expect(useCartStore.getState().getTotalPrice()).toBe(0);
  });

  // UPDATED: разные productId
  it('getTotalPrice sums price * quantity for all items', () => {
    useCartStore.getState().addItem(makeItem({ productId: 'prod-1', price: 100000, quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ productId: 'prod-2', price: 50000, quantity: 3 }));
    // 100000*2 + 50000*3 = 200000 + 150000 = 350000
    expect(useCartStore.getState().getTotalPrice()).toBe(350000);
  });

  it('getTotalPrice reflects quantity update', () => {
    useCartStore.getState().addItem(makeItem({ price: 100000 }));
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 4);
    expect(useCartStore.getState().getTotalPrice()).toBe(400000);
  });

  // ── getTotalItems ──────────────────────────────────────────────────────────

  it('getTotalItems returns 0 for empty cart', () => {
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });

  // UPDATED: разные productId
  it('getTotalItems sums quantities of all items', () => {
    useCartStore.getState().addItem(makeItem({ productId: 'prod-1', quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ productId: 'prod-2', quantity: 3 }));
    expect(useCartStore.getState().getTotalItems()).toBe(5);
  });

  // UPDATED: разные productId
  it('getTotalItems reflects removal', () => {
    useCartStore.getState().addItem(makeItem({ productId: 'prod-1', quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ productId: 'prod-2', quantity: 3 }));
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().getTotalItems()).toBe(3);
  });

  // ── upsert (product) ───────────────────────────────────────────────────────

  describe('upsert (product)', () => {
    it('addItem per_kg: повторный вызов с тем же productId обновляет weight и price', () => {
      useCartStore.getState().addItem(makeItem({
        productId: 'prod-kg',
        priceType: 'per_kg',
        pricePerKg: 200000,
        weight: 1000,
        price: 200000,
      }));
      useCartStore.getState().addItem(makeItem({
        productId: 'prod-kg',
        priceType: 'per_kg',
        pricePerKg: 200000,
        weight: 1500,
        price: 300000,
      }));
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].weight).toBe(1500);
      expect(items[0].price).toBe(300000);
    });

    it('addItem per_unit: повторный вызов с тем же productId НЕ дублирует (обновляет данные)', () => {
      useCartStore.getState().addItem(makeItem({
        productId: 'prod-unit',
        priceType: 'per_unit',
        pricePerUnit: 75000,
        weight: 500,
        price: 75000,
        name: 'Эклер старый',
      }));
      useCartStore.getState().addItem(makeItem({
        productId: 'prod-unit',
        priceType: 'per_unit',
        pricePerUnit: 75000,
        weight: 500,
        price: 75000,
        name: 'Эклер новый',
      }));
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Эклер новый');
    });

    it('addItem constructor: повторный вызов всегда создаёт новый элемент', () => {
      useCartStore.getState().addItem(makeItem({
        type: 'constructor',
        productId: undefined,
        cakeConfig: makeCakeConfig(),
      }));
      useCartStore.getState().addItem(makeItem({
        type: 'constructor',
        productId: undefined,
        cakeConfig: makeCakeConfig(),
      }));
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
      expect(items[0].id).not.toBe(items[1].id);
    });

    it('product item получает стабильный id product-{productId}', () => {
      useCartStore.getState().addItem(makeItem({ productId: 'prod-stable' }));
      expect(useCartStore.getState().items[0].id).toBe('product-prod-stable');
    });

    it('constructor item получает уникальный id с timestamp', () => {
      useCartStore.getState().addItem(makeItem({
        type: 'constructor',
        productId: undefined,
        cakeConfig: makeCakeConfig(),
      }));
      const id = useCartStore.getState().items[0].id;
      expect(id).toMatch(/^constructor-\d+-.+$/);
    });

    it('upsert обновляет inscription если передан', () => {
      useCartStore.getState().addItem(makeItem({ productId: 'prod-ins', inscription: 'С днём рождения' }));
      useCartStore.getState().addItem(makeItem({ productId: 'prod-ins', inscription: 'Поздравляю!' }));
      expect(useCartStore.getState().items[0].inscription).toBe('Поздравляю!');
    });

    it('upsert обновляет imageUrl и name', () => {
      useCartStore.getState().addItem(makeItem({ productId: 'prod-img', name: 'Старое имя', imageUrl: '/old.jpg' }));
      useCartStore.getState().addItem(makeItem({ productId: 'prod-img', name: 'Новое имя', imageUrl: '/new.jpg' }));
      const item = useCartStore.getState().items[0];
      expect(item.name).toBe('Новое имя');
      expect(item.imageUrl).toBe('/new.jpg');
    });
  });

  // ── updateWeight ───────────────────────────────────────────────────────────

  describe('updateWeight', () => {
    it('обновляет weight и пересчитывает price', () => {
      useCartStore.getState().addItem(makeItem({
        productId: 'prod-w1',
        priceType: 'per_kg',
        pricePerKg: 200000,
        weight: 1000,
        price: 200000,
        minWeight: 500,
      }));
      useCartStore.getState().updateWeight('prod-w1', 1500);
      const item = useCartStore.getState().items[0];
      expect(item.weight).toBe(1500);
      expect(item.price).toBe(300000); // 200000 * 1500 / 1000
    });

    it('удаляет элемент при weight < minWeight', () => {
      useCartStore.getState().addItem(makeItem({
        productId: 'prod-w2',
        priceType: 'per_kg',
        pricePerKg: 200000,
        weight: 1000,
        price: 200000,
        minWeight: 500,
      }));
      useCartStore.getState().updateWeight('prod-w2', 400);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('ограничивает weight значением maxWeight', () => {
      useCartStore.getState().addItem(makeItem({
        productId: 'prod-w3',
        priceType: 'per_kg',
        pricePerKg: 200000,
        weight: 1000,
        price: 200000,
        minWeight: 500,
        maxWeight: 2000,
      }));
      useCartStore.getState().updateWeight('prod-w3', 3000);
      const item = useCartStore.getState().items[0];
      expect(item.weight).toBe(2000);
      expect(item.price).toBe(400000); // 200000 * 2000 / 1000
    });

    it('игнорирует несуществующий productId', () => {
      useCartStore.getState().addItem(makeItem({ productId: 'prod-w4', price: 150000 }));
      useCartStore.getState().updateWeight('prod-nonexistent', 2000);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].price).toBe(150000);
    });

    it('не затрагивает constructor элементы', () => {
      useCartStore.getState().addItem(makeItem({
        type: 'constructor',
        productId: 'prod-w5',
        priceType: 'per_kg',
        pricePerKg: 200000,
        weight: 1000,
        price: 200000,
        cakeConfig: makeCakeConfig(),
      }));
      useCartStore.getState().updateWeight('prod-w5', 2000);
      // updateWeight ищет только type='product', constructor не трогает
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].weight).toBe(1000);
    });
  });

  // ── getItemByProductId ─────────────────────────────────────────────────────

  describe('getItemByProductId', () => {
    it('возвращает элемент по productId', () => {
      useCartStore.getState().addItem(makeItem({ productId: 'prod-find' }));
      const item = useCartStore.getState().getItemByProductId('prod-find');
      expect(item).not.toBeNull();
      expect(item!.productId).toBe('prod-find');
    });

    it('возвращает null если не найден', () => {
      const item = useCartStore.getState().getItemByProductId('prod-missing');
      expect(item).toBeNull();
    });

    it('игнорирует constructor элементы', () => {
      useCartStore.getState().addItem(makeItem({
        type: 'constructor',
        productId: 'prod-ctor',
        cakeConfig: makeCakeConfig(),
      }));
      const item = useCartStore.getState().getItemByProductId('prod-ctor');
      expect(item).toBeNull();
    });
  });
});
