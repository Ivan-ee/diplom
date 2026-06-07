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
    glazeVariant: '',
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
    expect(state.coating.coatingId).toBe('');
    expect(state.coating.glazeVariant).toBe('');
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
    // base + repaired square-compatible filling + coating = 155000, +10% = 170500
    expect(priceForSquare).toBe(170500);
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

  it('setTierCount to 4 creates four layers', () => {
    useConstructorStore.getState().setTierCount(4);
    const { layers, tierCount } = useConstructorStore.getState();
    expect(tierCount).toBe(4);
    expect(layers).toHaveLength(4);
  });

  it('normalizes legacy coating modes to model-backed solid coating', () => {
    useConstructorStore.setState({
      ingredients: getMockIngredients(),
      shape: 'square',
      coating: {
        type: 'cream',
        coatingId: 'coating-cream',
        glazeVariant: 'cream',
        withDrips: true,
        colorMode: 'gradient' as never,
        secondaryGlazeVariant: 'choco',
        visual: {
          mode: 'gradient' as never,
          primaryColor: '#FFF5E0',
          secondaryColor: '#4A2C17',
          splashes: true,
        },
      },
    });

    useConstructorStore.getState().setCoatingId('coating-cream');

    const coating = useConstructorStore.getState().coating;
    expect(coating.glazeVariant).toBe('cream');
    expect(coating.withDrips).toBe(false);
    expect(coating.colorMode).toBe('solid');
    expect(coating.secondaryGlazeVariant).toBeUndefined();
    expect(coating.visual).toEqual({
      mode: 'solid',
      primaryColor: '#FFF5E0',
      splashes: false,
    });
  });

  it('repairs coating id and visual key together when shape changes', () => {
    useConstructorStore.setState({
      ingredients: getMockIngredients(),
      shape: 'circle',
      tierCount: 1,
      layers: [{ baseId: 'base-chocolate', fillingId: 'filling-strawberry', weight: 1000 }],
      coating: {
        type: 'cream',
        coatingId: 'coating-milk',
        glazeVariant: 'milk',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: '#FFF8E7',
        },
      },
    });

    useConstructorStore.getState().setShape('heart');

    const coating = useConstructorStore.getState().coating;
    expect(coating.glazeVariant).not.toBe('milk');
    expect(coating.coatingId).toBe('coating-cream');
    expect(coating.glazeVariant).toBe('cream');
    expect(coating.type).toBe('cream');
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

  it('setTierCount repairs tiers to full-tier model compatibility', () => {
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

    expect(useConstructorStore.getState().shape).toBe('circle');
    expect(useConstructorStore.getState().layers).toEqual([
      { baseId: 'base-chocolate', fillingId: 'filling-strawberry', weight: 1000 },
      { baseId: 'base-chocolate', fillingId: 'filling-strawberry', weight: 1000 },
    ]);
  });

  // ── recalculatePrice ───────────────────────────────────────────────────────

  it('recalculatePrice with known ingredients computes correct total', () => {
    // Use real mock data so the formula is deterministic
    const ingredients = getMockIngredients();

    // Single tier, weight 1000g
    // base-vanilla/default: pricePerKg = 85000 → cost = (1000 * 85000) / 1000 = 85000
    // filling-strawberry: pricePerKg = 40000 → cost = 40000
    // coating-cream: pricePerKg = 20000 → cost = (1000 * 20000) / 1000 = 20000
    // shape circle: surchargePercent = 0
    // tierCount 1: surcharge = 0
    // Expected total = 85000 + 40000 + 20000 = 145000

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
    expect(useConstructorStore.getState().totalPrice).toBe(145000);
  });

  it('clearing coating removes coating cost from the local price', () => {
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

    useConstructorStore.getState().setCoatingId('');

    const state = useConstructorStore.getState();
    expect(state.coating.coatingId).toBe('');
    expect(state.coating.glazeVariant).toBe('');
    expect(state.totalPrice).toBe(125000);
  });

  it('recalculatePrice applies shape surcharge correctly', () => {
    const ingredients = getMockIngredients();

    // heart shape: surchargePercent = 15
    // base + filling + coating = 85000 + 40000 + 20000 = 145000
    // surcharge = 145000 * 0.15 = 21750 → total = 166750

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
    expect(useConstructorStore.getState().totalPrice).toBe(166750);
  });

  it('recalculatePrice applies tier surcharge correctly', () => {
    const ingredients = getMockIngredients();

    // 2 tiers each 1000g, circle shape (0%), tierCount=2 surcharge=30000
    // Tier 0: default base(85000) + strawberry(40000) = 125000
    // Tier 1: default base(85000) + strawberry(40000) = 125000
    // Coating: totalWeight=2000g * 20000/kg = 40000
    // subtotal = 290000 + tier surcharge 30000 = 320000

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
    expect(useConstructorStore.getState().totalPrice).toBe(320000);
  });

  it('recalculatePrice includes decoration costs', () => {
    const ingredients = getMockIngredients();

    // Base price = 145000 (from first test)
    // 1× decor-berries at pricePerUnit 6000
    // 1× decor-candle-gold at pricePerUnit 15000
    // shape circle surcharge = 0
    // total = 145000 + 6000 + 15000 = 166000

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
          decorationId: 'decor-berries',
          visualKey: 'blueberry',
          position: { x: 0, y: 0, z: 0 },
        },
        {
          instanceId: 'decor-2',
          decorationId: 'decor-candle-gold',
          visualKey: 'candle',
          position: { x: 0.15, y: 0, z: 0 },
        },
      ],
    });

    useConstructorStore.getState().recalculatePrice();
    expect(useConstructorStore.getState().totalPrice).toBe(166000);
  });

  it('adds multiple decoration instances and posts grouped pricing quantities', async () => {
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

    useConstructorStore.getState().addDecorationInstance('blueberry', 'decor-berries', {
      x: -0.18,
      y: 0,
      z: 0.1,
    });
    useConstructorStore.getState().addDecorationInstance('top-cream', 'decor-top-cream', {
      x: 0.18,
      y: 0,
      z: 0.1,
    });

    const state = useConstructorStore.getState();
    expect(state.activeDecorations).toEqual(['blueberry', 'top-cream']);
    expect(state.decorationInstances).toHaveLength(2);
    expect(state.decorationInstances.map((instance) => instance.visualKey)).toEqual([
      'blueberry',
      'top-cream',
    ]);
    expect(state.selectedDecorations).toEqual([
      { variantId: 'blueberry', decorationId: 'decor-berries', quantity: 1 },
      { variantId: 'top-cream', decorationId: 'decor-top-cream', quantity: 1 },
    ]);

    await useConstructorStore.getState().syncServerPrice();

    const [, requestInit] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit];
    const requestBody = JSON.parse(String(requestInit.body));
    expect(requestBody.decorations).toEqual([
      { decorationId: 'decor-berries', quantity: 1 },
      { decorationId: 'decor-top-cream', quantity: 1 },
    ]);
  });

  it('replaces singleton top decorations while allowing multiple free decorations and candles', () => {
    const ingredients = getMockIngredients();
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

    useConstructorStore.getState().addDecorationInstance('blueberry', 'decor-berries');
    useConstructorStore.getState().addDecorationInstance('candle', 'decor-candle-gold');
    useConstructorStore.getState().addDecorationInstance('top-cream', 'decor-top-cream');
    useConstructorStore.getState().addDecorationInstance('top-choco', 'decor-top-choco');
    useConstructorStore.getState().addDecorationInstance('candle', 'decor-candle-gold');

    const state = useConstructorStore.getState();
    expect(state.decorationInstances).toHaveLength(4);
    expect(state.decorationInstances.map((instance) => instance.visualKey)).toEqual([
      'blueberry',
      'candle',
      'top-choco',
      'candle',
    ]);
    expect(state.activeDecorations).toEqual([
      'blueberry',
      'candle',
      'top-choco',
    ]);
    expect(state.selectedDecorations).toEqual([
      { variantId: 'blueberry', decorationId: 'decor-berries', quantity: 1 },
      { variantId: 'candle', decorationId: 'decor-candle-gold', quantity: 2 },
      { variantId: 'top-choco', decorationId: 'decor-top-choco', quantity: 1 },
    ]);
  });

  it('keeps singleton groups separate and rejects side placement for top-only decor', () => {
    const ingredients = getMockIngredients();
    useConstructorStore.setState({
      ingredients,
      shape: 'square',
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

    const sidePlacement = {
      surface: 'side' as const,
      tierIndex: 0,
      normal: { x: 1, y: 0, z: 0 },
    };

    useConstructorStore.getState().addDecorationInstance('glaze-cream', 'decor-glaze-cream');
    useConstructorStore.getState().addDecorationInstance('top-glaze', 'decor-top-glaze');
    useConstructorStore.getState().addDecorationInstance('glaze-choco', 'decor-glaze-choco');
    useConstructorStore.getState().addDecorationInstance('meringue', 'decor-meringue');
    useConstructorStore.getState().addDecorationInstance('blueberry', 'decor-berries', undefined, sidePlacement);
    useConstructorStore.getState().addDecorationInstance('candle', 'decor-candle-gold', undefined, sidePlacement);
    useConstructorStore.getState().addDecorationInstance('top-meringue', 'decor-top-meringue', undefined, sidePlacement);

    const state = useConstructorStore.getState();
    expect(state.decorationInstances.map((instance) => instance.visualKey)).toEqual([
      'glaze-choco',
      'meringue',
      'blueberry',
      'candle',
    ]);
    expect(state.decorationInstances.find((instance) => instance.visualKey === 'blueberry')?.placement?.surface).toBe('side');
    expect(state.decorationInstances.find((instance) => instance.visualKey === 'candle')?.placement?.surface).toBe('side');
    expect(state.selectedDecorations).toEqual([
      { variantId: 'glaze-choco', decorationId: 'decor-glaze-choco', quantity: 1 },
      { variantId: 'meringue', decorationId: 'decor-meringue', quantity: 1 },
      { variantId: 'blueberry', decorationId: 'decor-berries', quantity: 1 },
      { variantId: 'candle', decorationId: 'decor-candle-gold', quantity: 1 },
    ]);
  });

  it('does not duplicate singleton decorations', () => {
    const ingredients = getMockIngredients();
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

    useConstructorStore.getState().addDecorationInstance('top-cream', 'decor-top-cream');
    const singletonId = useConstructorStore.getState().decorationInstances[0]?.instanceId;
    if (!singletonId) throw new Error('Expected singleton decoration instance');
    useConstructorStore.getState().duplicateDecorationInstance(singletonId);

    useConstructorStore.getState().addDecorationInstance('candle', 'decor-candle-gold');
    const candleId = useConstructorStore.getState().decorationInstances.find(
      (instance) => instance.visualKey === 'candle',
    )?.instanceId;
    if (!candleId) throw new Error('Expected candle decoration instance');
    useConstructorStore.getState().duplicateDecorationInstance(candleId);

    const state = useConstructorStore.getState();
    expect(state.decorationInstances.map((instance) => instance.visualKey)).toEqual([
      'top-cream',
      'candle',
      'candle',
    ]);
    expect(state.selectedDecorations).toEqual([
      { variantId: 'top-cream', decorationId: 'decor-top-cream', quantity: 1 },
      { variantId: 'candle', decorationId: 'decor-candle-gold', quantity: 2 },
    ]);
  });

  it('normalizes legacy decoration instances to the last singleton per group', () => {
    const ingredients = getMockIngredients();
    useConstructorStore.setState({
      ingredients,
      shape: 'square',
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
      activeDecorations: ['blueberry', 'glaze-cream', 'top-glaze', 'candle'],
      selectedDecorations: [],
      decorationInstances: [
        {
          instanceId: 'legacy-berries',
          decorationId: 'decor-berries',
          visualKey: 'blueberry',
          position: { x: 0, y: 0, z: 0 },
        },
        {
          instanceId: 'legacy-glaze-cream',
          decorationId: 'decor-glaze-cream',
          visualKey: 'glaze-cream',
          position: { x: -0.1, y: 0, z: 0 },
        },
        {
          instanceId: 'legacy-glaze-choco',
          decorationId: 'decor-glaze-choco',
          visualKey: 'glaze-choco',
          position: { x: -0.2, y: 0, z: 0 },
        },
        {
          instanceId: 'legacy-top',
          decorationId: 'decor-top-glaze',
          visualKey: 'top-glaze',
          position: { x: 0.1, y: 0, z: 0 },
        },
        {
          instanceId: 'legacy-top-meringue',
          decorationId: 'decor-top-meringue',
          visualKey: 'top-meringue',
          position: { x: 0.15, y: 0, z: 0 },
          placement: {
            surface: 'side',
            tierIndex: 0,
            normal: { x: 1, y: 0, z: 0 },
          },
        },
        {
          instanceId: 'legacy-candle-1',
          decorationId: 'decor-candle-gold',
          visualKey: 'candle',
          position: { x: 0, y: 0, z: 0 },
        },
        {
          instanceId: 'legacy-candle-2',
          decorationId: 'decor-candle-gold',
          visualKey: 'candle',
          position: { x: 0.2, y: 0, z: 0 },
        },
      ],
    });

    useConstructorStore.getState().setShape('square');

    const state = useConstructorStore.getState();
    expect(state.decorationInstances.map((instance) => instance.instanceId)).toEqual([
      'legacy-berries',
      'legacy-glaze-choco',
      'legacy-top-meringue',
      'legacy-candle-1',
      'legacy-candle-2',
    ]);
    expect(state.selectedDecorations).toEqual([
      { variantId: 'blueberry', decorationId: 'decor-berries', quantity: 1 },
      { variantId: 'glaze-choco', decorationId: 'decor-glaze-choco', quantity: 1 },
      { variantId: 'top-meringue', decorationId: 'decor-top-meringue', quantity: 1 },
      { variantId: 'candle', decorationId: 'decor-candle-gold', quantity: 2 },
    ]);
    expect(state.decorationInstances.find((instance) => instance.visualKey === 'top-meringue')?.placement?.surface).toBe('top');
    expect(state.hasCandle).toBe(true);
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
    expect(state.coating.coatingId).toBe('');
    expect(state.coating.glazeVariant).toBe('');
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

  it('syncServerPrice omits coatingId when no coating is selected', async () => {
    const ingredients = getMockIngredients();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalPrice: 125000,
          breakdown: {
            tiers: [],
            decorations: [],
            subtotal: 125000,
            shapeSurcharge: 0,
            tierSurcharge: 0,
            totalPrice: 125000,
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
        coatingId: '',
        glazeVariant: '',
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

    await useConstructorStore.getState().syncServerPrice();

    const [, requestInit] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit];
    const requestBody = JSON.parse(String(requestInit.body));
    expect(requestBody.coatingId).toBeUndefined();
    expect(useConstructorStore.getState().pricingStatus).toBe('verified');
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

  it('reset keeps the constructor on a compatible full-tier shape when ingredients are loaded', () => {
    useConstructorStore.setState({ ingredients: getMockIngredients() });

    useConstructorStore.getState().reset();

    const state = useConstructorStore.getState();
    expect(state.shape).toBe('circle');
    expect(state.layers[0]).toMatchObject({
      baseId: 'base-chocolate',
      fillingId: 'filling-strawberry',
    });
    expect(state.coating.coatingId).toBe('');
    expect(state.coating.glazeVariant).toBe('');
  });
});
