import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';
import { buildCakeStackLayout } from '@/lib/constructor/geometry';
import {
  getDeclaredModelPaths,
  getDecoModelPath,
  getFillModelPath,
  getAllFullTierPaths,
  getFullTierModelPath,
  getFullTierVariantMeta,
  getLayerModelPath,
  getModelVisualHeight,
  getModelYBounds,
  getTierModelRole,
  isFullTierVisualKeyAvailable,
  isDecoVisualKeyAvailable,
  isFillVisualKeyAvailable,
  isLayerVisualKeyAvailable,
} from '@/lib/constructor/model-registry';

const IGNORED_RUNTIME_MODELS = new Set(['/models/candle/DecoCandle2.glb']);

function runtimeModelPaths(): string[] {
  const modelsDir = path.resolve(process.cwd(), 'public/models');
  const files: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(filePath);
      } else if (entry.isFile() && entry.name.endsWith('.glb')) {
        files.push(`/models/${path.relative(modelsDir, filePath).replaceAll(path.sep, '/')}`);
      }
    }
  };

  walk(modelsDir);
  return files.sort();
}

function seedBases(): Array<{ name: string; visualKey: string; color: string; isAvailable: boolean }> {
  const seedPath = path.resolve(process.cwd(), '../../packages/db/seed-data/constructor-bases.json');
  return JSON.parse(readFileSync(seedPath, 'utf8')) as Array<{
    name: string;
    visualKey: string;
    color: string;
    isAvailable: boolean;
  }>;
}

describe('constructor model registry', () => {
  it('returns null instead of silently falling back when a visual key is unavailable', () => {
    expect(getLayerModelPath('circle', 'red', true)).toBeNull();
    expect(getFullTierModelPath('circle', 'default')).toBeNull();
    expect(getFullTierModelPath('square', 'choco')).toBeNull();
    expect(getFillModelPath('heart', 'glaze')).toBeNull();
    expect(getDecoModelPath('circle', 'meringue')).toBeNull();
  });

  it('exposes compatibility helpers for disabling impossible UI choices', () => {
    expect(isLayerVisualKeyAvailable('circle', 'default')).toBe(true);
    expect(isLayerVisualKeyAvailable('circle', 'cherry')).toBe(true);
    expect(isFullTierVisualKeyAvailable('circle', 'choco')).toBe(true);
    expect(isFullTierVisualKeyAvailable('heart', 'pink')).toBe(true);
    expect(isFillVisualKeyAvailable('heart', 'cream')).toBe(true);
    expect(isDecoVisualKeyAvailable('square', 'candle')).toBe(true);
    expect(isDecoVisualKeyAvailable('circle', 'top-cream')).toBe(true);
  });

  it('exposes all ready full-tier and top-decor models from the canonical Cakes archive', () => {
    expect(getLayerModelPath('circle', 'cherry', false)).toBe('/models/circle/CakeLayerCherry.glb');
    expect(getFullTierModelPath('circle', 'cherry')).toBe('/models/circle/CakeBigLayerCherry.glb');
    expect(getFullTierModelPath('circle', 'cream')).toBe('/models/circle/CakeBigLayerCream.glb');
    expect(getFullTierModelPath('circle', 'glaze')).toBe('/models/circle/CakeBigLayerGlaze.glb');
    expect(getFullTierModelPath('heart', 'pink')).toBe('/models/heart/CakeBigLayerPink.glb');
    expect(getFillModelPath('heart', 'meringue')).toBe('/models/heart/CakeFillMeringue.glb');
    expect(getDecoModelPath('square', 'top-glaze-cream2')).toBe('/models/cube/CakeFillGlazeCream2.glb');
    expect(getDecoModelPath('heart', 'top-meringue-pink')).toBe('/models/heart/CakeFillMeringuePink.glb');
  });

  it('requires an explicit full-tier model for every rendered Ярус', () => {
    expect(getFullTierModelPath('circle', 'default')).toBeNull();
    expect(getFullTierModelPath('circle', 'red')).toBeNull();
    expect(isFullTierVisualKeyAvailable('circle', 'default')).toBe(false);
    expect(isFullTierVisualKeyAvailable('heart', 'red')).toBe(false);
    expect(getFullTierModelPath('circle', 'choco')).toBe('/models/circle/CakeBigLayerChoco.glb');
    expect(isFullTierVisualKeyAvailable('circle', 'choco')).toBe(true);

    expect(getFullTierModelPath('square', 'default')).toBe('/models/cube/CakeBigLayer.glb');
    expect(isFullTierVisualKeyAvailable('square', 'default')).toBe(true);
    expect(getTierModelRole('circle', 'choco')).toBe('tierBody');
    expect(getTierModelRole('heart', 'pink')).toBe('tierBody');
  });

  it('exposes GLB-derived full-tier labels and colors by shape', () => {
    expect(getFullTierVariantMeta('circle', 'cherry')).toEqual({
      label: 'Вишнёвый',
      color: '#E7A8B4',
    });
    expect(getFullTierVariantMeta('square', 'cherry')).toEqual({
      label: 'Вишнёвый',
      color: '#FFABAE',
    });
    expect(getFullTierVariantMeta('heart', 'pink')).toEqual({
      label: 'Розовый',
      color: '#FFABAE',
    });
    expect(getFullTierVariantMeta('circle', 'red')).toBeNull();
  });

  it('keeps mock and seed bases unique and backed by a full-tier GLB', () => {
    const runtimeVisualKeys = new Set(['default', 'cherry', 'choco', 'cream', 'glaze', 'pink']);

    for (const [sourceName, bases] of [
      ['mock', getMockIngredients().bases.map((base) => ({
        name: base.name,
        visualKey: base.visualKey,
        color: base.color ?? '',
        isAvailable: base.available,
      }))],
      ['seed', seedBases()],
    ] as const) {
      const availableBases = bases.filter((base) => base.isAvailable);
      const duplicateVisualKeys = availableBases
        .map((base) => base.visualKey)
        .filter((visualKey, index, visualKeys) => visualKeys.indexOf(visualKey) !== index);
      const unsupportedVisualKeys = availableBases
        .map((base) => base.visualKey)
        .filter((visualKey) => !runtimeVisualKeys.has(visualKey));

      expect(duplicateVisualKeys, `${sourceName} has duplicate base visualKeys`).toEqual([]);
      expect(unsupportedVisualKeys, `${sourceName} has unavailable base visualKeys`).toEqual([]);
      expect(availableBases.some((base) => base.visualKey === 'red'), `${sourceName} still exposes red`).toBe(false);
    }
  });

  it('uses the same exact BigLayer GLB for 1, 2, 3, and 4 tier layouts', () => {
    for (const [shape, baseVariant, expectedPath] of [
      ['circle', 'choco', '/models/circle/CakeBigLayerChoco.glb'],
      ['square', 'default', '/models/cube/CakeBigLayer.glb'],
      ['heart', 'pink', '/models/heart/CakeBigLayerPink.glb'],
    ] as const) {
      for (const tierCount of [1, 2, 3, 4]) {
      const layout = buildCakeStackLayout({
        shape,
        tiers: Array.from({ length: tierCount }, () => ({
          baseVariant,
        })),
        glazeVariant: 'cream',
        withDrips: false,
        decorations: [],
      });

      expect(layout.tiers).toHaveLength(tierCount);
      expect(layout.tiers.map((tier) => tier.layerPath)).toEqual(
        Array.from({ length: tierCount }, () => expectedPath),
      );
      expect(layout.tiers.every((tier) => tier.isFullTier)).toBe(true);
      expect(new Set(layout.tiers.map((tier) => tier.height)).size).toBe(1);
      }
    }
  });

  it('exposes only full-tier CakeBigLayer paths for base preloading', () => {
    const circleFullTierPaths = getAllFullTierPaths('circle');

    expect(circleFullTierPaths).toEqual([
      '/models/circle/CakeBigLayerCherry.glb',
      '/models/circle/CakeBigLayerChoco.glb',
      '/models/circle/CakeBigLayerCream.glb',
      '/models/circle/CakeBigLayerGlaze.glb',
    ]);
    expect(circleFullTierPaths.every((modelPath) => modelPath.includes('CakeBigLayer'))).toBe(true);
    expect(circleFullTierPaths.some((modelPath) => modelPath.includes('CakeLayer'))).toBe(false);
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

  it('declares every runtime GLB or explicitly ignores it', () => {
    const declared = new Set(getDeclaredModelPaths());
    const missing = runtimeModelPaths().filter(
      (modelPath) => !declared.has(modelPath) && !IGNORED_RUNTIME_MODELS.has(modelPath),
    );

    expect(missing).toEqual([]);
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
