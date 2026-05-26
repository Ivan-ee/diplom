import {
  getDecoModelPath,
  getFullTierModelPath,
  getGlazeModelPath,
  getModelVisualHeight,
  type CakeShape,
} from './model-registry';

export const GLAZE_TOP_LIFT = 0.006;
export const DECORATION_LIFT = 0.014;

export interface StackTierInput {
  baseVariant: string;
}

export interface StackLayoutInput {
  shape: CakeShape;
  tiers: StackTierInput[];
  glazeVariant: string;
  withDrips: boolean;
  decorations: Array<string | StackDecorationInput>;
}

export interface StackRange {
  bottomY: number;
  topY: number;
  height: number;
}

export interface StackTierLayout extends StackRange {
  index: number;
  layerPath: string;
  isFullTier: true;
}

export interface StackGlazeLayout extends StackRange {
  path: string;
}

export interface StackDecorationLayout extends StackRange {
  instanceId: string;
  variantId: string;
  path: string;
  x: number;
  z: number;
}

export interface StackDecorationInput {
  instanceId?: string;
  variantId: string;
  position?: {
    x?: number;
    y?: number;
    z?: number;
  };
}

export interface CakeStackLayout {
  tiers: StackTierLayout[];
  glaze: StackGlazeLayout | null;
  decorations: StackDecorationLayout[];
  topTierTopY: number;
  decorationBaseY: number;
  totalHeight: number;
}

function modelHeight(modelPath: string | null): number {
  return getModelVisualHeight(modelPath) ?? 0;
}

export function buildCakeStackLayout(input: StackLayoutInput): CakeStackLayout {
  const tierLayouts: StackTierLayout[] = [];
  let nextBottomY = 0;

  input.tiers.forEach((tier, index) => {
    const layerPath = getFullTierModelPath(input.shape, tier.baseVariant);
    if (!layerPath) return;

    const layerHeight = modelHeight(layerPath);
    const height = layerHeight;
    const topY = nextBottomY + height;

    tierLayouts.push({
      index,
      bottomY: nextBottomY,
      topY,
      height,
      layerPath,
      isFullTier: true,
    });

    nextBottomY = topY;
  });

  const topTierTopY = tierLayouts.at(-1)?.topY ?? 0;
  const glazePath = getGlazeModelPath(input.shape, input.glazeVariant, input.withDrips);
  const glazeHeight = modelHeight(glazePath);
  const glazeTopY = topTierTopY + GLAZE_TOP_LIFT;
  const glaze = glazePath
    ? {
        path: glazePath,
        bottomY: glazeTopY - glazeHeight,
        topY: glazeTopY,
        height: glazeHeight,
      }
    : null;
  const decorationBaseY = (glaze?.topY ?? topTierTopY) + DECORATION_LIFT;

  const decorations = input.decorations.flatMap((decoration, index) => {
    const normalizedDecoration =
      typeof decoration === 'string'
        ? { instanceId: decoration, variantId: decoration, position: undefined }
        : decoration;
    const variantId = normalizedDecoration.variantId;
    const path = getDecoModelPath(input.shape, variantId);
    if (!path) return [];

    const bottomY = decorationBaseY;
    const height = modelHeight(path);
    return [{
      instanceId: normalizedDecoration.instanceId ?? `${variantId}-${index}`,
      variantId,
      path,
      bottomY,
      topY: bottomY + height,
      height,
      x: normalizedDecoration.position?.x ?? 0,
      z: normalizedDecoration.position?.z ?? 0,
    }];
  });

  const totalHeight = Math.max(
    topTierTopY,
    glaze?.topY ?? 0,
    ...decorations.map((decoration) => decoration.topY),
  );

  return {
    tiers: tierLayouts,
    glaze,
    decorations,
    topTierTopY,
    decorationBaseY,
    totalHeight,
  };
}
