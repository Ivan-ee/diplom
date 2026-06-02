import { describe, expect, it } from 'vitest';
import { computeConstructorCameraFrame } from '@/lib/constructor/camera-framing';

describe('constructor camera framing', () => {
  it('moves the orbit camera farther away for a 4-tier stack than a 3-tier stack', () => {
    const threeTierFrame = computeConstructorCameraFrame({
      totalHeight: 2.8,
      fovDeg: 45,
      aspect: 16 / 9,
    });
    const fourTierFrame = computeConstructorCameraFrame({
      totalHeight: 3.75,
      fovDeg: 45,
      aspect: 16 / 9,
    });

    expect(threeTierFrame.orbitDistance).toBeGreaterThanOrEqual(5.6);
    expect(fourTierFrame.orbitDistance).toBeGreaterThan(threeTierFrame.orbitDistance);
  });

  it('targets the vertical center of the actual stack height', () => {
    const frame = computeConstructorCameraFrame({
      totalHeight: 3.75,
      fovDeg: 45,
      aspect: 16 / 9,
    });

    expect(frame.targetY).toBeCloseTo(1.875, 5);
  });

  it('keeps mobile and top-view distances large enough for interaction limits', () => {
    const frame = computeConstructorCameraFrame({
      totalHeight: 3.75,
      fovDeg: 45,
      aspect: 390 / 340,
    });

    expect(frame.topDistance).toBeGreaterThan(frame.targetY);
    expect(frame.maxDistance).toBeGreaterThan(frame.orbitDistance);
    expect(frame.minDistance).toBeLessThan(frame.orbitDistance);
  });
});
