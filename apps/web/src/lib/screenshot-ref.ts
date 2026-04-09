import type * as THREE from 'three';

/**
 * Module-level ref to the WebGL renderer from the cake canvas.
 * CakeCanvasInner writes to this; StepNavigation reads from it.
 * Kept as a plain mutable object to avoid React context overhead
 * and to remain accessible outside the R3F tree.
 */
export const glRef: { current: THREE.WebGLRenderer | null } = { current: null };
