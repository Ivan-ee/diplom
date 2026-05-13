import type { CartItem, CakeConfigData } from '@/stores/cart-store';

interface ConstructorTierDto {
  baseId: string;
  fillingId: string;
  weight: number;
}

interface ConstructorDecorationDto {
  decorationId: string;
  quantity: number;
}

export interface ConstructorOrderDto {
  shape: string;
  tiers: ConstructorTierDto[];
  coatingId: string;
  decorations?: ConstructorDecorationDto[];
  hasCandle?: boolean;
  inscription?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function groupDecorations(cakeConfig: CakeConfigData): ConstructorDecorationDto[] {
  const grouped = new Map<string, number>();

  for (const selection of cakeConfig.selectedDecorations ?? []) {
    grouped.set(
      selection.decorationId,
      (grouped.get(selection.decorationId) ?? 0) + selection.quantity,
    );
  }

  if (grouped.size === 0) {
    for (const decorationId of cakeConfig.activeDecorations) {
      if (!UUID_PATTERN.test(decorationId)) continue;
      grouped.set(decorationId, (grouped.get(decorationId) ?? 0) + 1);
    }
  }

  return Array.from(grouped, ([decorationId, quantity]) => ({
    decorationId,
    quantity,
  }));
}

export function cakeConfigToOrderDto(
  cakeConfig: NonNullable<CartItem['cakeConfig']>,
): ConstructorOrderDto {
  const decorations = groupDecorations(cakeConfig);

  return {
    shape: cakeConfig.shape,
    tiers: cakeConfig.layers.map((layer) => ({
      baseId: layer.baseId,
      fillingId: layer.fillingId,
      weight: Math.round(layer.weight / 100),
    })),
    coatingId: cakeConfig.coating.coatingId,
    ...(decorations.length > 0 && { decorations }),
    ...(cakeConfig.hasCandle && { hasCandle: true }),
    ...(cakeConfig.inscription && { inscription: cakeConfig.inscription }),
  };
}
