import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function lightingSource(): string {
  return readFileSync(
    path.resolve(process.cwd(), 'src/components/constructor/scene/LightingRig.tsx'),
    'utf8',
  );
}

function canvasSource(): string {
  return readFileSync(
    path.resolve(process.cwd(), 'src/components/constructor/scene/CakeCanvasInner.tsx'),
    'utf8',
  );
}

describe('LightingRig', () => {
  it('uses a local neutral studio rig without external environment assets', () => {
    const source = lightingSource();

    expect(source).toContain('<ambientLight color="#fffaf0" intensity={0.55} />');
    expect(source).toContain("<hemisphereLight args={['#fff7ed', '#8b735c', 1.15]} />");
    expect(source).toContain('position={[4.5, 7, 4.5]}');
    expect(source).toContain('intensity={2.4}');
    expect(source).toContain('position={[-5, 4, 4]}');
    expect(source).toContain('intensity={1.15}');
    expect(source).toContain('position={[-3, 5, -5]}');
    expect(source).toContain('intensity={0.75}');
    expect(source).toContain('position={[0, 6, 0]}');
    expect(source).toContain('intensity={0.45}');
    expect(source).not.toMatch(/\bEnvironment\b|\bLightformer\b/);
  });

  it('keeps ACES tone mapping with brighter studio exposure', () => {
    const source = canvasSource();

    expect(source).toContain('toneMapping: THREE.ACESFilmicToneMapping');
    expect(source).toContain('toneMappingExposure: 1.25');
  });
});
