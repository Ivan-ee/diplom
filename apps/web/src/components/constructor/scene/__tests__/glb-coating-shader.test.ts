import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { applyCoatingShader } from '../GlbCoatingShader';

describe('applyCoatingShader', () => {
  it('does not throw for legacy coating state without visual settings', () => {
    expect(() => applyCoatingShader(new THREE.Group(), undefined as never)).not.toThrow();
  });
});
