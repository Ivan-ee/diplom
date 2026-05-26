import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  applyCoatingShader,
  COATING_SHADER_AMBIENT_FLOOR,
  COATING_SHADER_SHADOW_LIFT,
} from '../GlbCoatingShader';

describe('applyCoatingShader', () => {
  it('does not throw for legacy coating state without visual settings', () => {
    expect(() => applyCoatingShader(new THREE.Group(), undefined as never)).not.toThrow();
  });

  it('sets bounds-aware uniforms for gradient coating', () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 1), new THREE.MeshBasicMaterial()));

    applyCoatingShader(group, {
      mode: 'gradient',
      primaryColor: '#FFF5E0',
      secondaryColor: '#4A2C17',
    });

    const mesh = group.children[0] as THREE.Mesh;
    const material = mesh.material as THREE.ShaderMaterial;

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.uniforms.uMode.value).toBe(1);
    expect(material.uniforms.uHasSecondaryColor.value).toBe(1);
    expect(material.uniforms.uBoundsXZ.value.x).toBeLessThan(material.uniforms.uBoundsXZ.value.y);
    expect(material.uniforms.uBoundsXZ.value.z).toBeLessThan(material.uniforms.uBoundsXZ.value.w);
    expect(material.uniforms.uPrimaryColor.value.equals(material.uniforms.uSecondaryColor.value)).toBe(false);
  });

  it('keeps dark gradient coating above a near-black lighting floor', () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 1), new THREE.MeshBasicMaterial()));

    applyCoatingShader(group, {
      mode: 'gradient',
      primaryColor: '#120804',
      secondaryColor: '#050302',
    });

    const mesh = group.children[0] as THREE.Mesh;
    const material = mesh.material as THREE.ShaderMaterial;
    const darkestColor = new THREE.Color('#050302');
    const darkestLitChannel = darkestColor.r * COATING_SHADER_AMBIENT_FLOOR + COATING_SHADER_SHADOW_LIFT;

    expect(material.uniforms.uAmbientFloor.value).toBe(COATING_SHADER_AMBIENT_FLOOR);
    expect(material.uniforms.uShadowLift.value).toBe(COATING_SHADER_SHADOW_LIFT);
    expect(darkestLitChannel).toBeGreaterThan(0.06);
  });
});
