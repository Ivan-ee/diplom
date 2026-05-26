import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCakeStackLayout } from '@/lib/constructor/geometry';
import {
  getDeclaredModelPaths,
  getBakedCoatedTierModelPath,
  getDecoModelPath,
  getFillModelPath,
  getFullTierModelPath,
  getLayerModelPath,
  getModelVisualHeight,
  getModelYBounds,
  getTierModelRole,
  isFullTierVisualKeyAvailable,
  isDecoVisualKeyAvailable,
  isFillVisualKeyAvailable,
  isLayerVisualKeyAvailable,
} from '@/lib/constructor/model-registry';

describe('constructor model registry', () => {
  it('returns null instead of silently falling back when a visual key is unavailable', () => {
    expect(getLayerModelPath('circle', 'red', true)).toBeNull();
    expect(getFillModelPath('heart', 'glaze')).toBeNull();
    expect(getDecoModelPath('circle', 'meringue')).toBeNull();
  });

  it('exposes compatibility helpers for disabling impossible UI choices', () => {
    expect(isLayerVisualKeyAvailable('circle', 'default')).toBe(true);
    expect(isLayerVisualKeyAvailable('circle', 'cherry')).toBe(true);
    expect(isFillVisualKeyAvailable('heart', 'cream')).toBe(true);
    expect(isDecoVisualKeyAvailable('square', 'candle')).toBe(true);
  });

  it('exposes restored valid models from the canonical Cakes archive', () => {
    expect(getLayerModelPath('circle', 'cherry', false)).toBe('/models/circle/CakeLayerCherry.glb');
    expect(getBakedCoatedTierModelPath('circle', 'cherry')).toBe('/models/circle/CakeBigLayerCherry.glb');
    expect(getBakedCoatedTierModelPath('circle', 'cream')).toBe('/models/circle/CakeBigLayerCream.glb');
    expect(getBakedCoatedTierModelPath('circle', 'glaze')).toBe('/models/circle/CakeBigLayerGlaze.glb');
    expect(getFillModelPath('heart', 'meringue')).toBe('/models/heart/CakeFillMeringue.glb');
  });

  it('requires an explicit clean full-tier body model for every rendered Ярус', () => {
    expect(getFullTierModelPath('circle', 'default')).toBeNull();
    expect(isFullTierVisualKeyAvailable('circle', 'default')).toBe(false);
    expect(getFullTierModelPath('circle', 'choco')).toBeNull();
    expect(isFullTierVisualKeyAvailable('circle', 'choco')).toBe(false);

    expect(getFullTierModelPath('square', 'default')).toBe('/models/cube/CakeBigLayer.glb');
    expect(isFullTierVisualKeyAvailable('square', 'default')).toBe(true);
  });

  it('does not expose baked-coated BigLayer GLB files as clean tier bodies', () => {
    expect(getTierModelRole('circle', 'choco')).toBe('bakedCoatedTier');
    expect(getTierModelRole('heart', 'pink')).toBe('bakedCoatedTier');
    expect(getFullTierModelPath('circle', 'choco')).toBeNull();
    expect(getLayerModelPath('circle', 'choco', true)).toBeNull();
  });

  it('uses the same exact BigLayer GLB for 1, 2, and 3 tier layouts', () => {
    for (const tierCount of [1, 2, 3]) {
      const layout = buildCakeStackLayout({
        shape: 'square',
        tiers: Array.from({ length: tierCount }, () => ({
          baseVariant: 'default',
        })),
        glazeVariant: 'cream',
        withDrips: false,
        decorations: [],
      });

      expect(layout.tiers).toHaveLength(tierCount);
      expect(layout.tiers.map((tier) => tier.layerPath)).toEqual(
        Array.from({ length: tierCount }, () => '/models/cube/CakeBigLayer.glb'),
      );
      expect(layout.tiers.every((tier) => tier.isFullTier)).toBe(true);
      expect(new Set(layout.tiers.map((tier) => tier.height)).size).toBe(1);
    }
  });

  it('does not include filling GLB geometry in assembled tier layouts', () => {
    const layout = buildCakeStackLayout({
      shape: 'square',
      tiers: [
        { baseVariant: 'default' },
        { baseVariant: 'default' },
        { baseVariant: 'default' },
      ],
      glazeVariant: '',
      withDrips: false,
      decorations: [],
    });

    expect(layout.tiers).toHaveLength(3);

    const tierHeight = getModelVisualHeight('/models/cube/CakeBigLayer.glb') ?? 0;
    layout.tiers.forEach((tier, index) => {
      expect(tier).not.toHaveProperty('fillPath');
      expect(tier.layerPath).toBe('/models/cube/CakeBigLayer.glb');
      expect(tier.height).toBeCloseTo(tierHeight, 5);
      expect(tier.bottomY).toBeCloseTo(index * tierHeight, 5);
      expect(tier.topY).toBeCloseTo((index + 1) * tierHeight, 5);
    });
  });

  it('has physical GLB files for every declared registry entry', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const missing = getDeclaredModelPaths().filter((modelPath) => {
      if (!modelPath.startsWith('/models/')) return false;
      return !existsSync(path.join(publicDir, modelPath));
    });

    expect(missing).toEqual([]);
  });

  it('has no empty GLB files in the runtime model tree', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const empty = getDeclaredModelPaths().filter((modelPath) => {
      if (!modelPath.startsWith('/models/')) return false;
      const filePath = path.join(publicDir, modelPath);
      return existsSync(filePath) && statSync(filePath).size === 0;
    });

    expect(empty).toEqual([]);
  });

  it('has measured Y bounds for every declared registry entry', () => {
    const failures: string[] = [];

    for (const modelPath of getDeclaredModelPaths()) {
      const bounds = getModelYBounds(modelPath);
      if (!bounds || !Number.isFinite(bounds.minY) || !Number.isFinite(bounds.maxY) || bounds.maxY <= bounds.minY) {
        failures.push(`${modelPath}: missing or invalid Y bounds`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('builds a physical stack with monotonic non-overlapping Y ranges', () => {
    const layout = buildCakeStackLayout({
      shape: 'square',
      tiers: [
        { baseVariant: 'default' },
        { baseVariant: 'default' },
      ],
      glazeVariant: 'cream',
      withDrips: false,
      decorations: ['blueberry', 'candle'],
    });

    expect(layout.tiers).toHaveLength(2);
    expect(layout.tiers[0].bottomY).toBe(0);
    expect(layout.tiers[1].bottomY).toBeCloseTo(layout.tiers[0].topY, 5);
    expect(layout.tiers[1].topY).toBeGreaterThan(layout.tiers[1].bottomY);
    expect(layout.tiers[0]).not.toHaveProperty('weightScale');
    expect(layout.tiers[0]).not.toHaveProperty('xzScale');
    expect(layout.tiers[1]).not.toHaveProperty('weightScale');
    expect(layout.tiers[1]).not.toHaveProperty('xzScale');

    const firstTierLayerHeight = getModelVisualHeight(layout.tiers[0].layerPath) ?? 0;
    const secondTierLayerHeight = getModelVisualHeight(layout.tiers[1].layerPath) ?? 0;

    expect(layout.tiers[0]).not.toHaveProperty('fillPath');
    expect(layout.tiers[1]).not.toHaveProperty('fillPath');
    expect(layout.tiers[0].height).toBeCloseTo(firstTierLayerHeight, 5);
    expect(layout.tiers[1].height).toBeCloseTo(secondTierLayerHeight, 5);

    expect(layout.glaze).not.toBeNull();
    expect(layout.glaze?.path).toBe('/models/cube/GlazeCream.glb');
    expect(layout.glaze?.topY).toBeGreaterThan(layout.topTierTopY);
    expect(layout.glaze).not.toHaveProperty('xzScale');
    expect(layout.glaze?.bottomY).toBeLessThan(layout.glaze?.topY ?? 0);

    expect(layout.decorationBaseY).toBeGreaterThan(layout.glaze?.topY ?? 0);
    expect(layout.decorations[0]).not.toHaveProperty('xzScale');
    expect(layout.totalHeight).toBeGreaterThan(layout.decorationBaseY);
  });
});
