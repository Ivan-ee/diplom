import { useGLTF } from '@react-three/drei';

import type { CakeShape } from './model-registry';
import {
  getAllDecoPaths,
  getAllFillPaths,
  getAllFullTierPaths,
  getAllGlazePaths,
  getAllLayerPaths,
  getCandleModelPath,
  getGlazeModelPath,
  getLayerModelPath,
} from './model-registry';

/**
 * Preloads the minimum set of models needed before the 3D scene mounts:
 * default layer + default glaze (no drips) for the given shape.
 *
 * Call this as early as possible — e.g. when the user picks a shape.
 */
export function preloadEssentialModels(shape: CakeShape): void {
  const layerPath = getLayerModelPath(shape, 'default', false);
  const glazePath = getGlazeModelPath(shape, 'cream', false);
  if (layerPath) useGLTF.preload(layerPath);
  if (glazePath) useGLTF.preload(glazePath);
}

/**
 * Preloads all Layer and BigLayer variants for the given shape.
 * Covers every base-biscuit colour option the user can pick in step 1.
 */
export function preloadLayerModels(shape: CakeShape): void {
  for (const path of getAllLayerPaths(shape)) {
    useGLTF.preload(path);
  }
}

export function preloadFullTierModels(shape: CakeShape): void {
  for (const path of getAllFullTierPaths(shape)) {
    useGLTF.preload(path);
  }
}

/**
 * Preloads all Glaze variants (with and without drips) for the given shape.
 * Covers every coating option the user can pick in step 3.
 */
export function preloadGlazeModels(shape: CakeShape): void {
  for (const path of getAllGlazePaths(shape)) {
    useGLTF.preload(path);
  }
}

/**
 * Preloads all Fill variants for the given shape.
 * Covers every filling option the user can pick in step 2.
 */
export function preloadFillModels(shape: CakeShape): void {
  for (const path of getAllFillPaths(shape)) {
    useGLTF.preload(path);
  }
}

/**
 * Preloads all Deco and Candle variants for the given shape.
 * Covers every decoration option the user can pick in step 4–5.
 */
export function preloadDecoModels(shape: CakeShape): void {
  for (const path of getAllDecoPaths(shape)) {
    useGLTF.preload(path);
  }
  useGLTF.preload(getCandleModelPath(shape));
}

/**
 * Preloads every model for the given shape in one call.
 *
 * Suitable for background preloading after the scene has already rendered
 * with essential models. Triggers browser asset fetches for the full set
 * so subsequent shape-step transitions are instant.
 */
export function preloadAllShapeModels(shape: CakeShape): void {
  preloadFullTierModels(shape);
  preloadFillModels(shape);
  preloadGlazeModels(shape);
  preloadDecoModels(shape);
}
