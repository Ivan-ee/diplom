import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMockIngredients } from '@/lib/constructor/mock-ingredients';
import { buildCakeStackLayout, DECORATION_LIFT } from '@/lib/constructor/geometry';
import {
  getDeclaredModelPaths,
  getDecorationAllowedSurfaces,
  getDecorationAllowedSurfacesLabel,
  getDecorationPlacementRule,
  getDecorationReplacementGroup,
  getDecorationUiCategory,
  getDecorationUiCategoryLabel,
  getDecoModelPath,
  getFillModelPath,
  getAllDecoPaths,
  getAllGlazePaths,
  getAllFullTierPaths,
  getAvailableGlazes,
  getFullTierModelPath,
  getFullTierVariantMeta,
  getGlazeModelPath,
  getLayerModelPath,
  getModelVisualHeight,
  getModelYBounds,
  getTierModelRole,
  isFullTierVisualKeyAvailable,
  isDecoVisualKeyAvailable,
  isFillVisualKeyAvailable,
  isLayerVisualKeyAvailable,
  isGlazeVisualKeyAvailable,
} from '@/lib/constructor/model-registry';

const IGNORED_RUNTIME_MODELS = new Set(['/models/candle/DecoCandle2.glb']);
const COATING_SOURCE_FOLDERS: Record<string, string> = {
  CakeCircle: 'circle',
  CakeCube: 'cube',
  CakeHeart: 'heart',
};
const NON_COATING_GLAZE_ROLE_PATHS = new Set([
  '/models/circle/CakeBigLayerGlaze.glb',
  '/models/circle/cakeDecorGlaze.glb',
  '/models/cube/CakeBigLayerGlaze.glb',
  '/models/cube/CakeFillGlaze.glb',
  '/models/cube/CakeFillGlazeChoco.glb',
  '/models/cube/CakeFillGlazeCream.glb',
  '/models/cube/CakeFillGlazeCream2.glb',
  '/models/cube/DecoGlazeChoco.glb',
  '/models/cube/DecoGlazeCream.glb',
  '/models/cube/DecoGlazePink.glb',
  '/models/heart/CakeBigLayerGlaze.glb',
  '/models/heart/DecoGlazeChoco.glb',
  '/models/heart/DecoGlazeCream.glb',
  '/models/heart/DecoGlazeCream2.glb',
  '/models/heart/DecoGlazePink.glb',
]);

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

function canonicalCoatingPathsFromCakes(): string[] {
  const cakesDir = path.resolve(process.cwd(), '../../Cakes');
  const paths: string[] = [];

  for (const [sourceFolder, runtimeFolder] of Object.entries(COATING_SOURCE_FOLDERS)) {
    const shapeDir = path.join(cakesDir, sourceFolder);
    for (const fileName of readdirSync(shapeDir)) {
      const isCoatingModel =
        (fileName.startsWith('Glaze') || fileName.startsWith('cakeGlaze')) &&
        fileName.endsWith('.glb');
      if (!isCoatingModel) continue;
      paths.push(`/models/${runtimeFolder}/${fileName}`);
    }
  }

  return paths.sort();
}

function canonicalDecorationPathsFromCakes(): string[] {
  const cakesDir = path.resolve(process.cwd(), '../../Cakes');
  const sourceFolders: Record<string, string> = {
    CakeCircle: 'circle',
    CakeCube: 'cube',
    CakeHeart: 'heart',
    Candle: 'candle',
  };
  const paths: string[] = [];

  for (const [sourceFolder, runtimeFolder] of Object.entries(sourceFolders)) {
    const shapeDir = path.join(cakesDir, sourceFolder);
    for (const fileName of readdirSync(shapeDir)) {
      const isDecorationModel =
        /^(Deco|cakeDecor|CakeFill|cakeFill).+\.glb$/.test(fileName);
      if (!isDecorationModel) continue;
      paths.push(`/models/${runtimeFolder}/${fileName}`);
    }
  }

  return paths.sort();
}

function runtimeGlazeNamedPaths(): string[] {
  return runtimeModelPaths().filter((modelPath) => /glaze/i.test(path.basename(modelPath)));
}

function runtimeDecorationPaths(): string[] {
  return runtimeModelPaths().filter((modelPath) =>
    /^(Deco|cakeDecor|CakeFill|cakeFill).+\.glb$/.test(path.basename(modelPath)),
  );
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

function seedCoatings(): Array<{ name: string; visualKey: string; pricePerKg: number; isAvailable: boolean }> {
  const seedPath = path.resolve(process.cwd(), '../../packages/db/seed-data/constructor-coatings.json');
  return JSON.parse(readFileSync(seedPath, 'utf8')) as Array<{
    name: string;
    visualKey: string;
    pricePerKg: number;
    isAvailable: boolean;
  }>;
}

function seedDecorations(): Array<{ name: string; visualKey: string; pricePerUnit: number; isAvailable: boolean }> {
  const seedPath = path.resolve(process.cwd(), '../../packages/db/seed-data/constructor-decorations.json');
  return JSON.parse(readFileSync(seedPath, 'utf8')) as Array<{
    name: string;
    visualKey: string;
    pricePerUnit: number;
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

  it('declares every Step 5 decoration GLB from Cakes and runtime models', () => {
    const registryDecorationPaths = Array.from(new Set(
      (['circle', 'square', 'heart'] as const).flatMap((shape) => getAllDecoPaths(shape)),
    )).sort();
    const cakesDecorationPaths = canonicalDecorationPathsFromCakes()
      .filter((modelPath) => !IGNORED_RUNTIME_MODELS.has(modelPath))
      .sort();
    const runtimeDecorations = runtimeDecorationPaths()
      .filter((modelPath) => !IGNORED_RUNTIME_MODELS.has(modelPath))
      .sort();

    expect(registryDecorationPaths).toEqual(cakesDecorationPaths);
    expect(registryDecorationPaths).toEqual(runtimeDecorations);
    expect(runtimeModelPaths()).toContain('/models/candle/DecoCandle2.glb');
    expect(registryDecorationPaths).not.toContain('/models/candle/DecoCandle2.glb');
  });

  it('classifies decoration placement slots and UI categories from the registry', () => {
    expect(getDecorationPlacementRule('blueberry')).toMatchObject({
      slot: 'surfaceDecor',
      maxPerCake: 40,
    });
    expect(getDecorationPlacementRule('glaze-choco')).toMatchObject({
      slot: 'surfaceDecor',
      maxPerCake: 40,
      replacementGroup: 'creamGlaze',
    });
    expect(getDecorationPlacementRule('top-glaze-cream2')).toMatchObject({
      slot: 'surfaceDecor',
      maxPerCake: 40,
      replacementGroup: 'topDecor',
    });
    expect(getDecorationPlacementRule('candle')).toMatchObject({
      slot: 'candle',
      maxPerCake: 40,
    });
    expect(getDecorationReplacementGroup('meringue')).toBe('topDecor');
    expect(getDecorationReplacementGroup('candle')).toBeNull();
    expect(getDecorationAllowedSurfaces('glaze-choco')).toEqual(['top']);
    expect(getDecorationAllowedSurfaces('top-cream')).toEqual(['top']);
    expect(getDecorationAllowedSurfaces('candle')).toEqual(['top', 'side']);
    expect(getDecorationAllowedSurfacesLabel('glaze-choco')).toBe('1 на торт · сверху');
    expect(getDecorationAllowedSurfacesLabel('blueberry')).toBe('Сверху и сбоку');
    expect(getDecorationUiCategory('blueberry')).toBe('berries');
    expect(getDecorationUiCategory('glaze-choco')).toBe('creamGlaze');
    expect(getDecorationUiCategory('meringue')).toBe('topDecor');
    expect(getDecorationUiCategory('top-cream')).toBe('topDecor');
    expect(getDecorationUiCategoryLabel('creamGlaze')).toBe('Крем / глазурь');
  });

  it('exposes every ready coating GLB as a standalone visual key', () => {
    expect(getGlazeModelPath('circle', 'cream', false)).toBe('/models/circle/GlazeCream.glb');
    expect(getGlazeModelPath('circle', 'cream-2', false)).toBe('/models/circle/GlazeCream2.glb');
    expect(getGlazeModelPath('circle', 'choco', false)).toBe('/models/circle/GlazeChoco.glb');
    expect(getGlazeModelPath('circle', 'choco-2', false)).toBe('/models/circle/GlazeChoco2.glb');
    expect(getGlazeModelPath('circle', 'milk', false)).toBe('/models/circle/cakeGlazeMilk.glb');
    expect(getGlazeModelPath('circle', 'pink', false)).toBe('/models/circle/cakeGlazePink.glb');
    expect(getAvailableGlazes('circle').map((option) => option.id)).toEqual([
      'cream',
      'cream-2',
      'choco',
      'choco-2',
      'milk',
      'pink',
    ]);

    expect(getGlazeModelPath('square', 'cream', false)).toBe('/models/cube/GlazeCream.glb');
    expect(getGlazeModelPath('square', 'choco', false)).toBe('/models/cube/GlazeChoco.glb');
    expect(getGlazeModelPath('square', 'pink', false)).toBe('/models/cube/GlazePink.glb');
    expect(getGlazeModelPath('square', 'cream-glaze', false)).toBe('/models/cube/GlazeCreamGlaze.glb');
    expect(getAvailableGlazes('square').map((option) => option.id)).toEqual([
      'cream',
      'choco',
      'pink',
      'cream-glaze',
    ]);

    expect(getGlazeModelPath('heart', 'cream', false)).toBe('/models/heart/GlazeCream.glb');
    expect(getGlazeModelPath('heart', 'cream-2', false)).toBe('/models/heart/GlazeCream2.glb');
    expect(getGlazeModelPath('heart', 'choco', false)).toBe('/models/heart/GlazeChoco.glb');
    expect(getGlazeModelPath('heart', 'choco-2', false)).toBe('/models/heart/GlazeChoco2.glb');
    expect(getGlazeModelPath('heart', 'pink', false)).toBe('/models/heart/GlazePink.glb');
    expect(getGlazeModelPath('heart', 'pink-2', false)).toBe('/models/heart/GlazePink2.glb');
    expect(getAvailableGlazes('heart').map((option) => option.id)).toEqual([
      'cream',
      'cream-2',
      'choco',
      'choco-2',
      'pink',
      'pink-2',
    ]);

    expect(getGlazeModelPath('circle', 'cream', true)).toBe('/models/circle/GlazeCream.glb');
    expect(isGlazeVisualKeyAvailable('heart', 'milk')).toBe(false);
  });

  it('declares every Step 4 coating GLB from Cakes and runtime models', () => {
    const registryCoatingPaths = (['circle', 'square', 'heart'] as const)
      .flatMap((shape) => getAllGlazePaths(shape))
      .sort();
    const cakesCoatingPaths = canonicalCoatingPathsFromCakes();
    const runtimeCoatingPaths = runtimeGlazeNamedPaths()
      .filter((modelPath) => !NON_COATING_GLAZE_ROLE_PATHS.has(modelPath))
      .sort();

    expect(registryCoatingPaths).toEqual(cakesCoatingPaths);
    expect(registryCoatingPaths).toEqual(runtimeCoatingPaths);
    for (const modelPath of registryCoatingPaths) {
      expect(getDeclaredModelPaths()).toContain(modelPath);
      expect(runtimeModelPaths()).toContain(modelPath);
    }
  });

  it('classifies Glaze-named assets from other roles outside Step 4 coatings', () => {
    const registryCoatingPaths = new Set(
      (['circle', 'square', 'heart'] as const).flatMap((shape) => getAllGlazePaths(shape)),
    );

    for (const modelPath of NON_COATING_GLAZE_ROLE_PATHS) {
      expect(runtimeModelPaths(), `${modelPath} missing from runtime models`).toContain(modelPath);
      expect(registryCoatingPaths, `${modelPath} leaked into Step 4 coatings`).not.toContain(modelPath);
    }
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

  it('keeps mock and seed coatings unique and backed by at least one coating GLB', () => {
    for (const [sourceName, coatings] of [
      ['mock', getMockIngredients().coatings.map((coating) => ({
        name: coating.name,
        visualKey: coating.visualKey,
        pricePerKg: coating.pricePerKg,
        isAvailable: coating.available,
      }))],
      ['seed', seedCoatings()],
    ] as const) {
      const availableCoatings = coatings.filter((coating) => coating.isAvailable);
      const duplicateVisualKeys = availableCoatings
        .map((coating) => coating.visualKey)
        .filter((visualKey, index, visualKeys) => visualKeys.indexOf(visualKey) !== index);
      const unsupportedVisualKeys = availableCoatings
        .map((coating) => coating.visualKey)
        .filter((visualKey) => !(['circle', 'square', 'heart'] as const).some((shape) =>
          isGlazeVisualKeyAvailable(shape, visualKey),
        ));

      expect(duplicateVisualKeys, `${sourceName} has duplicate coating visualKeys`).toEqual([]);
      expect(unsupportedVisualKeys, `${sourceName} has unavailable coating visualKeys`).toEqual([]);
      expect(availableCoatings.map((coating) => coating.visualKey)).toEqual([
        'cream',
        'cream-2',
        'milk',
        'choco',
        'choco-2',
        'pink',
        'pink-2',
        'cream-glaze',
      ]);
      expect(
        availableCoatings.find((coating) => coating.visualKey === 'cream-2')?.pricePerKg,
        `${sourceName} cream-2 price`,
      ).toBe(availableCoatings.find((coating) => coating.visualKey === 'cream')?.pricePerKg);
      expect(
        availableCoatings.find((coating) => coating.visualKey === 'choco-2')?.pricePerKg,
        `${sourceName} choco-2 price`,
      ).toBe(availableCoatings.find((coating) => coating.visualKey === 'choco')?.pricePerKg);
      expect(
        availableCoatings.find((coating) => coating.visualKey === 'pink-2')?.pricePerKg,
        `${sourceName} pink-2 price`,
      ).toBe(availableCoatings.find((coating) => coating.visualKey === 'pink')?.pricePerKg);
    }
  });

  it('keeps mock and seed decorations unique and backed by at least one decor GLB', () => {
    for (const [sourceName, decorations] of [
      ['mock', getMockIngredients().decorations.map((decoration) => ({
        name: decoration.name,
        visualKey: decoration.visualKey,
        pricePerUnit: decoration.pricePerUnit,
        isAvailable: decoration.available,
      }))],
      ['seed', seedDecorations()],
    ] as const) {
      const availableDecorations = decorations.filter((decoration) => decoration.isAvailable);
      const duplicateVisualKeys = availableDecorations
        .map((decoration) => decoration.visualKey)
        .filter((visualKey, index, visualKeys) => visualKeys.indexOf(visualKey) !== index);
      const unsupportedVisualKeys = availableDecorations
        .map((decoration) => decoration.visualKey)
        .filter((visualKey) => !(['circle', 'square', 'heart'] as const).some((shape) =>
          isDecoVisualKeyAvailable(shape, visualKey),
        ));

      expect(duplicateVisualKeys, `${sourceName} has duplicate decoration visualKeys`).toEqual([]);
      expect(unsupportedVisualKeys, `${sourceName} has unavailable decoration visualKeys`).toEqual([]);
      expect(availableDecorations.map((decoration) => decoration.visualKey)).toEqual([
        'blueberry',
        'chocolate-choco',
        'chocolate-pink',
        'chocolate',
        'cream',
        'glaze-cream',
        'glaze-cream2',
        'glaze-choco',
        'glaze-pink',
        'meringue',
        'top-cream',
        'top-choco',
        'top-pink',
        'top-meringue',
        'top-glaze',
        'top-glaze-choco',
        'top-glaze-cream',
        'top-glaze-cream2',
        'top-meringue-pink',
        'candle',
      ]);
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
    expect(layout.glaze).toBeNull();
    expect(layout.decorationBaseY).toBeCloseTo(layout.topTierTopY + DECORATION_LIFT, 5);

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
