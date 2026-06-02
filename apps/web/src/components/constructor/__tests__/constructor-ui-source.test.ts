import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function constructorUiSource(): string {
  const constructorDir = path.resolve(process.cwd(), 'src/components/constructor');
  const files: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '__tests__') continue;

      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(filePath);
      } else if (entry.isFile() && filePath.endsWith('.tsx')) {
        files.push(filePath);
      }
    }
  };

  walk(constructorDir);

  return files.map((filePath) => readFileSync(filePath, 'utf8')).join('\n');
}

describe('constructor UI source regressions', () => {
  it('keeps mobile active step controls visible above the sticky footer', () => {
    const layout = source('src/components/constructor/ConstructorLayout.tsx');
    const settingsPanel = source('src/components/constructor/panels/SettingsPanel.tsx');

    expect(layout).toContain('h-[34dvh]');
    expect(layout).toContain('showSpecSummary={false}');
    expect(settingsPanel).toContain('showSpecSummary');
    expect(settingsPanel).toContain('{showSpecSummary && <CompactSpecSummary />}');
  });

  it('uses pointer-based decoration placement instead of native HTML5 drag/drop', () => {
    const decorStep = source('src/components/constructor/panels/StepDecor.tsx');
    const canvas = source('src/components/constructor/scene/CakeCanvasInner.tsx');

    expect(decorStep).toContain('DECORATION_POINTER_DROP_EVENT');
    expect(decorStep).toContain('onPointerDown={handlePointerDown}');
    expect(decorStep).not.toMatch(/\bdraggable=/);
    expect(decorStep).not.toContain('onDragStart');
    expect(canvas).toContain('window.addEventListener(DECORATION_POINTER_DROP_EVENT');
  });

  it('keeps the constructor UI free of decorative marketing copy and internal model terms', () => {
    const uiSource = constructorUiSource();

    expect(uiSource).not.toContain('Cake Atelier Pro');
    expect(uiSource).not.toContain('Студия сборки');
    expect(uiSource).not.toContain('Sparkles');
    expect(uiSource).not.toContain('full-tier GLB');
    expect(uiSource).not.toContain('BigLayer');
    expect(uiSource).not.toContain('GLB-модель');
    expect(uiSource).not.toContain('Градиент создаёт');
    expect(uiSource).not.toContain('Начинка располагается');
    expect(uiSource).not.toMatch(/[💡🍓🎨🎂]/u);
  });

  it('hides incompatible base choices instead of rendering disabled base cards', () => {
    const stepBase = source('src/components/constructor/panels/StepBase.tsx');

    expect(stepBase).toContain('isFullTierVisualKeyAvailable(shape as CakeShape, b.visualKey)');
    expect(stepBase).not.toContain("disabled={!isCompatible}");
    expect(stepBase).not.toContain('Недоступно для выбранной формы');
  });

  it('offers four tier-count options in the constructor shape step', () => {
    const stepShape = source('src/components/constructor/panels/StepShape.tsx');

    expect(stepShape).toContain('const TIERS: TierCount[] = [1, 2, 3, 4];');
    expect(stepShape).toContain("4: '4 яруса'");
  });

  it('frames the camera from stack height instead of a fixed orbit distance', () => {
    const cameraController = source('src/components/constructor/scene/CameraController.tsx');

    expect(cameraController).toContain('computeConstructorCameraFrame');
    expect(cameraController).not.toContain('const ORBIT_DISTANCE = 5.6;');
    expect(cameraController).not.toContain('distance independent from tier count');
  });
});
