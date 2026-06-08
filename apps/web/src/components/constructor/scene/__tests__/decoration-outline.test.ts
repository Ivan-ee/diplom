import { describe, expect, it } from 'vitest';
import { getSelectionOutlineThickness } from '../decoration-outline';

describe('decoration-outline', () => {
  it.each([
    [0.6, 0.08],
    [1.0, 0.055],
    [1.4, 0.038],
    [1.8, 0.03],
    [2.4, 0.024],
    [3.2, 0.02],
  ])('returns %p for model size %p', (maxModelSize, expectedThickness) => {
    expect(getSelectionOutlineThickness(maxModelSize)).toBe(expectedThickness);
  });

  it('returns default thickness for invalid model sizes', () => {
    expect(getSelectionOutlineThickness(NaN)).toBe(0.08);
    expect(getSelectionOutlineThickness(Infinity)).toBe(0.08);
    expect(getSelectionOutlineThickness(-5)).toBe(0.08);
    expect(getSelectionOutlineThickness(0)).toBe(0.08);
  });
});
