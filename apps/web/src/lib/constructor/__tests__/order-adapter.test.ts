import { describe, expect, it } from 'vitest';
import { cakeConfigToOrderDto } from '@/lib/constructor/order-adapter';
import type { CakeConfigData } from '@/stores/cart-store';

const UUID_DECORATION_ID = '7d4248d7-84b6-4f12-9b32-2b9b8ed0c805';

function makeConfig(overrides: Partial<CakeConfigData> = {}): CakeConfigData {
  return {
    shape: 'circle',
    tierCount: 1,
    layers: [{ baseId: 'base-id', fillingId: 'filling-id', weight: 1500 }],
    coating: {
      type: 'cream',
      coatingId: 'coating-id',
      glazeVariant: 'cream',
      withDrips: false,
      colorMode: 'solid',
    },
    activeDecorations: ['blueberry'],
    selectedDecorations: [
      { variantId: 'blueberry', decorationId: UUID_DECORATION_ID, quantity: 2 },
    ],
    hasCandle: true,
    inscription: 'Codex',
    ...overrides,
  };
}

describe('cakeConfigToOrderDto', () => {
  it('converts constructor cart config to API calculate/order DTO', () => {
    const dto = cakeConfigToOrderDto(makeConfig());

    expect(dto).toEqual({
      shape: 'circle',
      tiers: [{ baseId: 'base-id', fillingId: 'filling-id', weight: 15 }],
      coatingId: 'coating-id',
      decorations: [{ decorationId: UUID_DECORATION_ID, quantity: 2 }],
      hasCandle: true,
      inscription: 'Codex',
    });
  });

  it('omits visual-only legacy decoration variants instead of sending invalid UUIDs', () => {
    const dto = cakeConfigToOrderDto(
      makeConfig({
        activeDecorations: ['blueberry', 'cream'],
        selectedDecorations: [],
      }),
    );

    expect(dto.decorations).toBeUndefined();
  });

  it('keeps legacy UUID decoration ids when selectedDecorations is absent', () => {
    const dto = cakeConfigToOrderDto(
      makeConfig({
        activeDecorations: [UUID_DECORATION_ID],
        selectedDecorations: undefined,
      }),
    );

    expect(dto.decorations).toEqual([{ decorationId: UUID_DECORATION_ID, quantity: 1 }]);
  });
});
