export interface ConstructorCameraFrameInput {
  totalHeight: number;
  fovDeg: number;
  aspect: number;
  minOrbitDistance?: number;
  minTopDistance?: number;
  minFocusDistance?: number;
  minDistance?: number;
  margin?: number;
  verticalPadding?: number;
  footprintWidth?: number;
  orbitYOffset?: number;
}

export interface ConstructorCameraFrame {
  targetY: number;
  orbitDistance: number;
  orbitYOffset: number;
  topDistance: number;
  focusDistance: number;
  focusTargetY: number;
  minDistance: number;
  maxDistance: number;
}

const DEFAULT_MIN_ORBIT_DISTANCE = 5.6;
const DEFAULT_MIN_TOP_DISTANCE = 5.4;
const DEFAULT_MIN_FOCUS_DISTANCE = 4.4;
const DEFAULT_MIN_DISTANCE = 3;
const DEFAULT_MARGIN = 1.2;
const DEFAULT_VERTICAL_PADDING = 0.85;
const DEFAULT_FOOTPRINT_WIDTH = 3.2;
const DEFAULT_ORBIT_Y_OFFSET = 2.4;
const MIN_VISIBLE_HEIGHT = 0.6;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function safePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function computeConstructorCameraFrame(input: ConstructorCameraFrameInput): ConstructorCameraFrame {
  const totalHeight = Math.max(safePositive(input.totalHeight, MIN_VISIBLE_HEIGHT), MIN_VISIBLE_HEIGHT);
  const fovDeg = safePositive(input.fovDeg, 45);
  const aspect = safePositive(input.aspect, 16 / 9);
  const margin = safePositive(input.margin ?? DEFAULT_MARGIN, DEFAULT_MARGIN);
  const verticalPadding = Math.max(input.verticalPadding ?? DEFAULT_VERTICAL_PADDING, 0);
  const footprintWidth = safePositive(input.footprintWidth ?? DEFAULT_FOOTPRINT_WIDTH, DEFAULT_FOOTPRINT_WIDTH);
  const minOrbitDistance = safePositive(input.minOrbitDistance ?? DEFAULT_MIN_ORBIT_DISTANCE, DEFAULT_MIN_ORBIT_DISTANCE);
  const minTopDistance = safePositive(input.minTopDistance ?? DEFAULT_MIN_TOP_DISTANCE, DEFAULT_MIN_TOP_DISTANCE);
  const minFocusDistance = safePositive(input.minFocusDistance ?? DEFAULT_MIN_FOCUS_DISTANCE, DEFAULT_MIN_FOCUS_DISTANCE);
  const minDistance = safePositive(input.minDistance ?? DEFAULT_MIN_DISTANCE, DEFAULT_MIN_DISTANCE);
  const orbitYOffset = safePositive(input.orbitYOffset ?? DEFAULT_ORBIT_Y_OFFSET, DEFAULT_ORBIT_Y_OFFSET);

  const verticalFov = degToRad(fovDeg);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const paddedHeight = totalHeight + verticalPadding;

  const verticalFitDistance = (paddedHeight * margin) / (2 * Math.tan(verticalFov / 2));
  const horizontalFitDistance = (footprintWidth * margin) / (2 * Math.tan(horizontalFov / 2));
  const orbitDistance = Math.max(minOrbitDistance, verticalFitDistance, horizontalFitDistance);

  return {
    targetY: totalHeight / 2,
    orbitDistance,
    orbitYOffset,
    topDistance: Math.max(minTopDistance, totalHeight + footprintWidth * 1.15),
    focusDistance: Math.max(minFocusDistance, orbitDistance * 0.78),
    focusTargetY: Math.max(0.35, totalHeight * 0.72),
    minDistance,
    maxDistance: Math.max(12, orbitDistance * 1.75),
  };
}
