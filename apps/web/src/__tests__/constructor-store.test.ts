import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';

// Mock fetch so loadIngredients falls back to mock data deterministically
vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network'))));

// Import store AFTER global mock is set up
import { useConstructorStore } from '@/stores/constructor-store';

const resetStore = () => useConstructorStore.setState({
  currentStep: 1,
  viewMode: 'orbit',
  shape: 'circle',
  tierCount: 1,
  layers: [{ baseId: '', fillingId: '', weight: 1000 }],
  coating: {
    type: 'cream',
    coatingId: '',
    glazeVariant: 'cream',
    withDrips: false,
    colorMode: 'solid',
    visual: {
      mode: 'solid',
      primaryColor: '#FFF5E0',
    },
  },
  activeDecorations: [],
  selectedDecorations: [],
  decorationInstances: [],
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
});

describe('constructor-store', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network'))));
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
    expect(state.activeDecorations).toEqual([]);
    expect(state.selectedDecorations).toEqual([]);
    expect(state.decorationInstances).toEqual([]);
    expect(state.hasCandle).toBe(false);
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
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
      activeDecorations: [],
      selectedDecorations: [],
      decorationInstances: [],
    });
    useConstructorStore.getState().recalculatePrice();
    const priceForCircle = useConstructorStore.getState().totalPrice;

    // square has a 10% surcharge — price must differ from circle
    useConstructorStore.getState().setShape('square');
    const priceForSquare = useConstructorStore.getState().totalPrice;

    expect(priceForSquare).toBeGreaterThan(priceForCircle);
    // base + repaired square-compatible filling + coating = 150000, +10% = 165000
    expect(priceForSquare).toBe(165000);
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

  it('setColorMode gradient chooses a secondary color different from primary', () => {
    useConstructorStore.setState({
      ingredients: getMockIngredients(),
      shape: 'square',
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
    });

    useConstructorStore.getState().setColorMode('gradient');

    const coating = useConstructorStore.getState().coating;
    expect(coating.colorMode).toBe('gradient');
    expect(coating.secondaryGlazeVariant).toBeDefined();
    expect(coating.secondaryGlazeVariant).not.toBe(coating.glazeVariant);
    expect(coating.visual.secondaryColor).toBeDefined();
    expect(coating.visual.secondaryColor).not.toBe(coating.visual.primaryColor);
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

  it('setTierCount repairs shape and tiers to clean full-tier model compatibility', () => {
    const ingredients = getMockIngredients();
    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
    });

    useConstructorStore.getState().setTierCount(2);

    expect(useConstructorStore.getState().shape).toBe('square');
    expect(useConstructorStore.getState().layers).toEqual([
      { baseId: 'base-vanilla', fillingId: 'filling-caramel', weight: 1000 },
      { baseId: 'base-vanilla', fillingId: 'filling-caramel', weight: 1000 },
    ]);
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
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
      activeDecorations: [],
      selectedDecorations: [],
      decorationInstances: [],
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
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
      activeDecorations: [],
      selectedDecorations: [],
      decorationInstances: [],
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
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
      activeDecorations: [],
      selectedDecorations: [],
      decorationInstances: [],
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
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
      activeDecorations: ['blueberry', 'cream'],
      selectedDecorations: [],
      decorationInstances: [
        {
          instanceId: 'decor-1',
          decorationId: 'decor-strawberry',
          visualKey: 'blueberry',
          position: { x: 0, y: 0, z: 0 },
        },
        {
          instanceId: 'decor-2',
          decorationId: 'decor-strawberry',
          visualKey: 'blueberry',
          position: { x: 0.15, y: 0, z: 0 },
        },
        {
          instanceId: 'decor-3',
          decorationId: 'decor-rose',
          visualKey: 'cream',
          position: { x: -0.15, y: 0, z: 0 },
        },
      ],
    });

    useConstructorStore.getState().recalculatePrice();
    expect(useConstructorStore.getState().totalPrice).toBe(160000);
  });

  it('adds multiple decoration instances of the same visual key and groups them for pricing', async () => {
    const ingredients = getMockIngredients();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalPrice: 150000,
          breakdown: {
            tiers: [],
            decorations: [],
            subtotal: 150000,
            shapeSurcharge: 0,
            tierSurcharge: 0,
            totalPrice: 150000,
            totalWeightKg: 1,
          },
        },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-chocolate', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
      activeDecorations: [],
      selectedDecorations: [],
      decorationInstances: [],
    });

    useConstructorStore.getState().addDecorationInstance('blueberry', 'decor-strawberry', {
      x: -0.18,
      y: 0,
      z: 0.1,
    });
    useConstructorStore.getState().addDecorationInstance('blueberry', 'decor-strawberry', {
      x: 0.18,
      y: 0,
      z: 0.1,
    });

    const state = useConstructorStore.getState();
    expect(state.activeDecorations).toEqual(['blueberry']);
    expect(state.decorationInstances).toHaveLength(2);
    expect(state.selectedDecorations).toEqual([
      { variantId: 'blueberry', decorationId: 'decor-strawberry', quantity: 2 },
    ]);

    await useConstructorStore.getState().syncServerPrice();

    const [, requestInit] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit];
    const requestBody = JSON.parse(String(requestInit.body));
    expect(requestBody.decorations).toEqual([
      { decorationId: 'decor-strawberry', quantity: 2 },
    ]);
  });

  it('normalizes legacy persisted constructor state before loading ingredients', async () => {
    useConstructorStore.setState({
      activeDecorations: undefined,
      selectedDecorations: undefined,
      decorationInstances: undefined,
      coating: {
        type: 'cream',
        coatingId: '',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
      },
    } as unknown as Partial<ReturnType<typeof useConstructorStore.getState>>);

    await expect(useConstructorStore.getState().loadIngredients()).resolves.toBeUndefined();

    const state = useConstructorStore.getState();
    expect(state.activeDecorations).toEqual([]);
    expect(state.selectedDecorations).toEqual([]);
    expect(state.decorationInstances).toEqual([]);
    expect(state.coating.visual).toMatchObject({
      mode: 'solid',
      primaryColor: '#FFF5E0',
    });
    expect(state.hasCandle).toBe(false);
  });

  it('posts pricing from legacy state without decoration arrays', async () => {
    const ingredients = getMockIngredients();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalPrice: 140000,
          breakdown: {
            tiers: [],
            decorations: [],
            subtotal: 140000,
            shapeSurcharge: 0,
            tierSurcharge: 0,
            totalPrice: 140000,
            totalWeightKg: 1,
          },
        },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-chocolate', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
      },
      activeDecorations: undefined,
      selectedDecorations: undefined,
      decorationInstances: undefined,
    } as unknown as Partial<ReturnType<typeof useConstructorStore.getState>>);

    await expect(useConstructorStore.getState().syncServerPrice()).resolves.toBeUndefined();

    const [, requestInit] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit];
    const requestBody = JSON.parse(String(requestInit.body));
    expect(requestBody.decorations).toBeUndefined();
    expect(useConstructorStore.getState().pricingStatus).toBe('verified');
  });

  it('syncServerPrice posts the constructor config and marks the price as verified', async () => {
    const ingredients = getMockIngredients();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalPrice: 166000,
          breakdown: {
            tiers: [],
            decorations: [],
            subtotal: 166000,
            shapeSurcharge: 0,
            tierSurcharge: 0,
            totalPrice: 166000,
            totalWeightKg: 1,
          },
        },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    useConstructorStore.setState({
      ingredients,
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-vanilla', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF5E0',
        },
      },
      activeDecorations: ['candle'],
      selectedDecorations: [],
      decorationInstances: [
        {
          instanceId: 'candle-1',
          decorationId: 'decor-candle-gold',
          visualKey: 'candle',
          position: { x: 0, y: 0, z: 0 },
        },
      ],
      inscription: 'Codex',
    });

    await useConstructorStore.getState().syncServerPrice();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/constructor/calculate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('decor-candle-gold'),
      }),
    );
    expect(useConstructorStore.getState().pricingStatus).toBe('verified');
    expect(useConstructorStore.getState().totalPrice).toBe(166000);
    expect(useConstructorStore.getState().priceBreakdown).toMatchObject({
      totalPrice: 166000,
    });
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
    expect(state.activeDecorations).toEqual([]);
    expect(state.selectedDecorations).toEqual([]);
    expect(state.decorationInstances).toEqual([]);
    expect(state.totalPrice).toBe(0);
    expect(state.currentStep).toBe(1);
  });

  it('reset keeps the constructor on a compatible clean-tier shape when ingredients are loaded', () => {
    useConstructorStore.setState({ ingredients: getMockIngredients() });

    useConstructorStore.getState().reset();

    const state = useConstructorStore.getState();
    expect(state.shape).toBe('square');
    expect(state.layers[0]).toMatchObject({
      baseId: 'base-vanilla',
      fillingId: 'filling-caramel',
    });
    expect(state.coating.coatingId).toBe('coating-cream');
  });
});
