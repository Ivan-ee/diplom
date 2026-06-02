import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSceneSources() {
  const sceneDir = path.resolve(process.cwd(), 'src/components/constructor/scene');
  const files: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(filePath);
      } else if (entry.isFile() && filePath.endsWith('.tsx')) {
        files.push(filePath);
      }
    }
  };

  walk(sceneDir);

  return files.map((filePath) => ({
    filePath,
    relativePath: path.relative(process.cwd(), filePath),
    source: readFileSync(filePath, 'utf8'),
  }));
}

describe('constructor scene GLB-only purity', () => {
  it('does not scale or procedurally draw constructor geometry', () => {
    const forbidden = [
      { label: '@react-spring/three', pattern: /@react-spring\/three/ },
      { label: 'animated R3F group', pattern: /animated\./ },
      { label: 'spring scale animation', pattern: /useSpring\s*\(/ },
      { label: 'group or primitive scale prop', pattern: /\bscale\s*=/ },
      { label: 'object rotation prop', pattern: /\brotation\s*=/ },
      { label: 'procedural mesh', pattern: /<mesh[\s>]/ },
      { label: 'sphere geometry', pattern: /sphereGeometry/ },
      { label: 'cylinder geometry', pattern: /cylinderGeometry/ },
      { label: 'box geometry', pattern: /boxGeometry/ },
      { label: 'inline standard material', pattern: /meshStandardMaterial/ },
      { label: 'contact shadows', pattern: /ContactShadows/ },
      { label: 'scene traversal mutation', pattern: /\.traverse\s*\(/ },
      { label: 'material assignment', pattern: /\.material\s*=/ },
      { label: 'material cloning', pattern: /\.material\.clone\s*\(|mat\.clone\s*\(/ },
      { label: 'shader material', pattern: /ShaderMaterial/ },
    ];

    const shaderAllowlist = new Set([
      'src/components/constructor/scene/GlbCoatingShader.tsx',
    ]);

    const failures = readSceneSources().flatMap(({ relativePath, source }) =>
      forbidden.flatMap(({ label, pattern }) => {
        if (shaderAllowlist.has(relativePath) && (
          label === 'scene traversal mutation' ||
          label === 'material assignment' ||
          label === 'material cloning' ||
          label === 'shader material'
        )) {
          return [];
        }

        return pattern.test(source) ? [`${relativePath}: ${label}`] : [];
      }),
    );

    expect(failures).toEqual([]);
  });

  it('does not render filling GLB files in the assembled cake scene', () => {
    const tierSource = readSceneSources().find(
      ({ relativePath }) => relativePath === 'src/components/constructor/scene/GlbTier.tsx',
    )?.source;

    expect(tierSource).toBeDefined();
    expect(tierSource).not.toMatch(/\bgetFillModelPath\b/);
    expect(tierSource).not.toMatch(/\bfillPath\b/);
    expect(tierSource).not.toMatch(/\bfillGltf\b|\bclonedFill\b/);
  });

  it('keeps the previous tier model visible while a new biscuit GLB loads', () => {
    const sceneSources = readSceneSources();
    const tierSource = sceneSources.find(
      ({ relativePath }) => relativePath === 'src/components/constructor/scene/GlbTier.tsx',
    )?.source;
    const canvasSource = sceneSources.find(
      ({ relativePath }) => relativePath === 'src/components/constructor/scene/CakeCanvasInner.tsx',
    )?.source;

    expect(tierSource).toBeDefined();
    expect(tierSource).toContain('visibleLayerPath');
    expect(tierSource).toContain('GlbTierModelPreloader');
    expect(tierSource).toContain('<Suspense fallback={null}>');
    expect(canvasSource).toContain('preloadFullTierModels(shape)');
  });
});
