import {
  getDecoModelPath,
  getFullTierModelPath,
  getGlazeModelPath,
  getModelVisualHeight,
  type CakeShape,
} from './model-registry';

export const GLAZE_TOP_LIFT = 0.006;
// Tiny technical lift keeps GLB decor in contact with the cake surface without visible floating.
export const DECORATION_LIFT = 0.001;

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
  y: number;
  z: number;
  placement?: StackDecorationPlacement;
}

export interface StackDecorationInput {
  instanceId?: string;
  variantId: string;
  position?: {
    x?: number;
    y?: number;
    z?: number;
  };
  placement?: StackDecorationPlacement;
}

export interface StackDecorationPlacement {
  surface: 'top' | 'side';
  tierIndex: number;
  normal: {
    x: number;
    y: number;
    z: number;
  };
}

const DECORATION_SURFACE_LIMITS: Record<CakeShape, { x: number; z: number; radius?: number }> = {
  circle: { x: 0.82, z: 0.82, radius: 0.82 },
  square: { x: 0.78, z: 0.78 },
  heart: { x: 0.72, z: 0.68, radius: 0.72 },
};

export function clampDecorationXZ(shape: CakeShape, x: number, z: number): { x: number; z: number } {
  const limits = DECORATION_SURFACE_LIMITS[shape] ?? DECORATION_SURFACE_LIMITS.circle;
  const clampedX = Math.max(-limits.x, Math.min(limits.x, x));
  const clampedZ = Math.max(-limits.z, Math.min(limits.z, z));

  if (!limits.radius) {
    return { x: clampedX, z: clampedZ };
  }

  const normalizedDistance = Math.hypot(clampedX / limits.x, clampedZ / limits.z);
  if (normalizedDistance <= 1) {
    return { x: clampedX, z: clampedZ };
  }

  return {
    x: clampedX / normalizedDistance,
    z: clampedZ / normalizedDistance,
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

    const bottomY = normalizedDecoration.placement?.surface === 'side'
      ? normalizedDecoration.position?.y ?? decorationBaseY
      : decorationBaseY;
    const height = modelHeight(path);
    return [{
      instanceId: normalizedDecoration.instanceId ?? `${variantId}-${index}`,
      variantId,
      path,
      bottomY,
      topY: bottomY + height,
      height,
      x: normalizedDecoration.position?.x ?? 0,
      y: bottomY,
      z: normalizedDecoration.position?.z ?? 0,
      placement: normalizedDecoration.placement,
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
