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

    const failures = readSceneSources().flatMap(({ relativePath, source }) =>
      forbidden.flatMap(({ label, pattern }) => {
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

  it('renders coating GLB files with original materials and retained loading', () => {
    const sceneSources = readSceneSources();
    const glazeSource = sceneSources.find(
      ({ relativePath }) => relativePath === 'src/components/constructor/scene/GlbGlaze.tsx',
    )?.source;
    const canvasSource = sceneSources.find(
      ({ relativePath }) => relativePath === 'src/components/constructor/scene/CakeCanvasInner.tsx',
    )?.source;

    expect(glazeSource).toBeDefined();
    expect(glazeSource).toContain('visibleGlazeUrl');
    expect(glazeSource).toContain('GlbGlazeModelPreloader');
    expect(glazeSource).not.toContain('applyCoatingShader');
    expect(glazeSource).not.toContain('visual.mode');
    expect(canvasSource).toContain('preloadGlazeModels(shape)');
  });

  it('uses silhouette outline only as selected decoration UI', () => {
    const sceneSources = readSceneSources();
    const decorationSource = sceneSources.find(
      ({ relativePath }) => relativePath === 'src/components/constructor/scene/GlbDecoration.tsx',
    )?.source;
    const canvasSource = sceneSources.find(
      ({ relativePath }) => relativePath === 'src/components/constructor/scene/CakeCanvasInner.tsx',
    )?.source;

    expect(decorationSource).toBeDefined();
    expect(decorationSource).toContain('Outlines');
    expect(decorationSource).toContain('Clone');
    expect(decorationSource).toContain('inject={outlineInjector}');
    expect(canvasSource).toContain('onPointerMissed={handlePointerMissed}');
    expect(canvasSource).toContain('selectDecorationInstance(null)');

    const outlineLeaks = sceneSources.flatMap(({ relativePath, source }) =>
      relativePath === 'src/components/constructor/scene/GlbDecoration.tsx' || !source.includes('Outlines')
        ? []
        : [relativePath],
    );
    expect(outlineLeaks).toEqual([]);
  });
});
