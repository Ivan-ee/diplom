export function getSelectionOutlineThickness(maxModelSize: number): number {
  if (!Number.isFinite(maxModelSize) || maxModelSize <= 0) return 0.08;

  if (maxModelSize <= 0.65) return 0.08;
  if (maxModelSize <= 1.25) return 0.055;
  if (maxModelSize <= 1.65) return 0.011;
  if (maxModelSize <= 2.2) return 0.001;
  if (maxModelSize <= 3.0) return 0.001;
  return 0.02;
}
