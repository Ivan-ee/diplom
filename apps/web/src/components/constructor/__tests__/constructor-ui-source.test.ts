import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
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
});
