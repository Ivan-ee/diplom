'use client';

import { CakeViewport } from './scene/CakeViewport';
import { SettingsPanel } from './panels/SettingsPanel';

export function ConstructorLayout() {
  return (
    <>
      <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] h-[calc(100dvh-64px)] overflow-hidden">
        <div className="relative h-full bg-gradient-to-b from-[var(--color-warm-ivory)] to-[var(--color-milk-white)]">
          <CakeViewport className="w-full h-full" />
        </div>

        <div className="h-full overflow-hidden border-l border-[var(--color-champagne)] flex flex-col">
          <SettingsPanel />
        </div>
      </div>

      <div className="flex lg:hidden flex-col h-[calc(100dvh-64px)] overflow-hidden">
        <div className="h-[55%] relative flex-shrink-0 bg-gradient-to-b from-[var(--color-warm-ivory)] to-[var(--color-milk-white)] border-b border-[var(--color-champagne)]">
          <CakeViewport className="w-full h-full" />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SettingsPanel />
        </div>
      </div>
    </>
  );
}
