import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/stores/cart-store';

// Minimal cart item fixture (omits id and quantity – those are added by the store)
const makeItem = (overrides: Partial<Parameters<typeof useCartStore.getState>['0']['addItem'] extends (item: infer I) => void ? I : never> = {}) => ({
  type: 'product' as const,
  productId: 'prod-1',
  name: 'Торт ванильный',
  imageUrl: '/images/cake.jpg',
  weight: 1000,
  price: 150000,
  ...overrides,
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

  it('addItem assigns a unique id', () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().addItem(makeItem());
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
    expect(items[0].id).not.toBe(items[1].id);
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

  it('removeItem only removes the targeted item', () => {
    useCartStore.getState().addItem(makeItem({ name: 'Торт А' }));
    useCartStore.getState().addItem(makeItem({ name: 'Торт Б' }));
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

  it('clearCart empties the cart', () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // ── getTotalPrice ──────────────────────────────────────────────────────────

  it('getTotalPrice returns 0 for empty cart', () => {
    expect(useCartStore.getState().getTotalPrice()).toBe(0);
  });

  it('getTotalPrice sums price * quantity for all items', () => {
    useCartStore.getState().addItem(makeItem({ price: 100000, quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ price: 50000, quantity: 3 }));
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

  it('getTotalItems sums quantities of all items', () => {
    useCartStore.getState().addItem(makeItem({ quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ quantity: 3 }));
    expect(useCartStore.getState().getTotalItems()).toBe(5);
  });

  it('getTotalItems reflects removal', () => {
    useCartStore.getState().addItem(makeItem({ quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ quantity: 3 }));
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().getTotalItems()).toBe(3);
  });
});
