'use client';

import { CakeViewport } from './scene/CakeViewport';
import { SettingsPanel } from './panels/SettingsPanel';

export function ConstructorLayout() {
  return (
    <>
      {/* Desktop layout: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] h-[calc(100dvh-64px)] overflow-hidden">
        {/* Left — 3D viewport */}
        <div className="relative h-full bg-gradient-to-b from-gray-50 to-white">
          <CakeViewport className="w-full h-full" />
        </div>

        {/* Right — settings panel */}
        <div className="h-full overflow-hidden border-l border-gray-100 flex flex-col">
          <SettingsPanel />
        </div>
      </div>

      {/* Mobile layout: stacked */}
      <div className="flex lg:hidden flex-col h-[calc(100dvh-64px)] overflow-hidden">
        {/* 3D viewport — top 55% */}
        <div className="h-[55%] relative flex-shrink-0 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
          <CakeViewport className="w-full h-full" />
        </div>

        {/* Settings panel — remaining 45% */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SettingsPanel />
        </div>
      </div>
    </>
  );
}
