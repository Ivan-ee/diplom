import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';

// Mock fetch so loadIngredients falls back to mock data deterministically
vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network'))));

// Import store AFTER global mock is set up
import { useConstructorStore } from '@/stores/constructor-store';

const resetStore = () => useConstructorStore.setState({
  currentStep: 1,
  shape: 'circle',
  tierCount: 1,
  layers: [{ baseId: '', fillingId: '', weight: 1000 }],
  coating: { type: 'cream', coatingId: '', color: '#FFFFFF', gradient: null, drips: null },
  decorations: [],
  inscription: '',
  ingredients: null,
  totalPrice: 0,
  isLoading: false,
});

describe('constructor-store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── Default state ──────────────────────────────────────────────────────────

  it('has correct initial values', () => {
    const state = useConstructorStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.shape).toBe('circle');
    expect(state.tierCount).toBe(1);
    expect(state.layers).toHaveLength(1);
    expect(state.layers[0]).toMatchObject({ baseId: '', fillingId: '', weight: 1000 });
    expect(state.decorations).toEqual([]);
    expect(state.inscription).toBe('');
    expect(state.ingredients).toBeNull();
    expect(state.totalPrice).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  // ── setShape ───────────────────────────────────────────────────────────────

  it('setShape changes the shape', () => {
    const { setShape } = useConstructorStore.getState();
    setShape('heart');
    expect(useConstructorStore.getState().shape).toBe('heart');
  });

  it('setShape triggers price recalculation (price updates when ingredients are loaded)', () => {
    // Load real ingredients so the price engine has data to work with
    const ingredients = getMockIngredients();
    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: { type: 'cream', coatingId: 'coating-cream', color: '#FFFFFF', gradient: null, drips: null },
      decorations: [],
    });
    useConstructorStore.getState().recalculatePrice();
    const priceForCircle = useConstructorStore.getState().totalPrice;

    // square has a 10% surcharge — price must differ from circle
    useConstructorStore.getState().setShape('square');
    const priceForSquare = useConstructorStore.getState().totalPrice;

    expect(priceForSquare).toBeGreaterThan(priceForCircle);
    // base + filling + coating = 140000, +10% = 154000
    expect(priceForSquare).toBe(154000);
  });

  // ── setTierCount ───────────────────────────────────────────────────────────

  it('setTierCount to 2 creates two layers', () => {
    const { setTierCount } = useConstructorStore.getState();
    setTierCount(2);
    const { layers, tierCount } = useConstructorStore.getState();
    expect(tierCount).toBe(2);
    expect(layers).toHaveLength(2);
  });

  it('setTierCount to 3 creates three layers', () => {
    useConstructorStore.getState().setTierCount(3);
    expect(useConstructorStore.getState().layers).toHaveLength(3);
  });

  it('setTierCount back to 1 trims to one layer', () => {
    useConstructorStore.getState().setTierCount(3);
    useConstructorStore.getState().setTierCount(1);
    expect(useConstructorStore.getState().layers).toHaveLength(1);
  });

  it('setTierCount preserves existing layer data for kept tiers', () => {
    // Set up layer 0 with custom data
    useConstructorStore.getState().setTierCount(2);
    useConstructorStore.setState((s) => ({
      layers: [
        { baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1500 },
        { ...s.layers[1] },
      ],
    }));
    // Going back to 1 keeps the first layer intact
    useConstructorStore.getState().setTierCount(1);
    const { layers } = useConstructorStore.getState();
    expect(layers[0]).toMatchObject({ baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1500 });
  });

  // ── recalculatePrice ───────────────────────────────────────────────────────

  it('recalculatePrice with known ingredients computes correct total', () => {
    // Use real mock data so the formula is deterministic
    const ingredients = getMockIngredients();

    // Single tier, weight 1000g
    // base-vanilla: pricePerKg = 80000 → cost = (1000 * 80000) / 1000 = 80000
    // filling-strawberry: pricePerKg = 40000 → cost = 40000
    // coating-cream: pricePerKg = 20000 → cost = (1000 * 20000) / 1000 = 20000
    // shape circle: surchargePercent = 0
    // tierCount 1: surcharge = 0
    // Expected total = 80000 + 40000 + 20000 = 140000

    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: { type: 'cream', coatingId: 'coating-cream', color: '#FFFFFF', gradient: null, drips: null },
      decorations: [],
    });

    useConstructorStore.getState().recalculatePrice();
    expect(useConstructorStore.getState().totalPrice).toBe(140000);
  });

  it('recalculatePrice applies shape surcharge correctly', () => {
    const ingredients = getMockIngredients();

    // heart shape: surchargePercent = 15
    // base + filling + coating = 80000 + 40000 + 20000 = 140000
    // surcharge = 140000 * 0.15 = 21000 → total = 161000

    useConstructorStore.setState({
      ingredients,
      shape: 'heart',
      tierCount: 1,
      layers: [{ baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: { type: 'cream', coatingId: 'coating-cream', color: '#FFFFFF', gradient: null, drips: null },
      decorations: [],
    });

    useConstructorStore.getState().recalculatePrice();
    expect(useConstructorStore.getState().totalPrice).toBe(161000);
  });

  it('recalculatePrice applies tier surcharge correctly', () => {
    const ingredients = getMockIngredients();

    // 2 tiers each 1000g, circle shape (0%), tierCount=2 surcharge=30000
    // Tier 0: vanilla(80000) + strawberry(40000) = 120000
    // Tier 1: vanilla(80000) + strawberry(40000) = 120000
    // Coating: totalWeight=2000g * 20000/kg = 40000
    // subtotal = 280000 + tier surcharge 30000 = 310000

    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 2,
      layers: [
        { baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 },
        { baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 },
      ],
      coating: { type: 'cream', coatingId: 'coating-cream', color: '#FFFFFF', gradient: null, drips: null },
      decorations: [],
    });

    useConstructorStore.getState().recalculatePrice();
    expect(useConstructorStore.getState().totalPrice).toBe(310000);
  });

  it('recalculatePrice includes decoration costs', () => {
    const ingredients = getMockIngredients();

    // Base price = 140000 (from first test)
    // 2× decor-strawberry at pricePerUnit 5000 = 10000
    // 1× decor-rose at pricePerUnit 10000 = 10000
    // shape circle surcharge = 0
    // total = 140000 + 10000 + 10000 = 160000

    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: { type: 'cream', coatingId: 'coating-cream', color: '#FFFFFF', gradient: null, drips: null },
      decorations: [
        { id: 'd1', decorationId: 'decor-strawberry', position: [0, 0, 0], normal: [0, 1, 0] },
        { id: 'd2', decorationId: 'decor-strawberry', position: [1, 0, 0], normal: [0, 1, 0] },
        { id: 'd3', decorationId: 'decor-rose', position: [2, 0, 0], normal: [0, 1, 0] },
      ],
    });

    useConstructorStore.getState().recalculatePrice();
    expect(useConstructorStore.getState().totalPrice).toBe(160000);
  });

  it('recalculatePrice returns 0 when ingredients are null', () => {
    useConstructorStore.setState({ ingredients: null });
    useConstructorStore.getState().recalculatePrice();
    expect(useConstructorStore.getState().totalPrice).toBe(0);
  });

  // ── reset ──────────────────────────────────────────────────────────────────

  it('reset clears state back to defaults', () => {
    const store = useConstructorStore.getState();
    store.setShape('heart');
    store.setTierCount(3);
    store.setInscription('Hello');
    store.reset();

    const state = useConstructorStore.getState();
    expect(state.shape).toBe('circle');
    expect(state.tierCount).toBe(1);
    expect(state.layers).toHaveLength(1);
    expect(state.layers[0]).toMatchObject({ baseId: '', fillingId: '', weight: 1000 });
    expect(state.inscription).toBe('');
    expect(state.decorations).toEqual([]);
    expect(state.totalPrice).toBe(0);
    expect(state.currentStep).toBe(1);
  });
});
