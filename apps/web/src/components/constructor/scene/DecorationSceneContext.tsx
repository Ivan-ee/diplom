'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as THREE from 'three';

export type DecorationSurface = 'top' | 'side';

export interface DecorationSurfaceRegistration {
  id: string;
  tierIndex: number;
  object: THREE.Object3D;
}

interface DecorationSceneContextValue {
  isDecorationDragging: boolean;
  beginDecorationDrag: () => void;
  endDecorationDrag: () => void;
  registerTierSurface: (surface: DecorationSurfaceRegistration) => () => void;
  getTierSurfaces: () => DecorationSurfaceRegistration[];
}

const DecorationSceneContext = createContext<DecorationSceneContextValue | null>(null);

export function DecorationSceneProvider({ children }: { children: ReactNode }) {
  const tierSurfacesRef = useRef(new Map<string, DecorationSurfaceRegistration>());
  const dragLockCountRef = useRef(0);
  const [isDecorationDragging, setIsDecorationDragging] = useState(false);

  const beginDecorationDrag = useCallback(() => {
    dragLockCountRef.current += 1;
    setIsDecorationDragging(true);
  }, []);

  const endDecorationDrag = useCallback(() => {
    dragLockCountRef.current = Math.max(0, dragLockCountRef.current - 1);
    if (dragLockCountRef.current === 0) {
      setIsDecorationDragging(false);
    }
  }, []);

  const registerTierSurface = useCallback((surface: DecorationSurfaceRegistration) => {
    tierSurfacesRef.current.set(surface.id, surface);

    return () => {
      tierSurfacesRef.current.delete(surface.id);
    };
  }, []);

  const getTierSurfaces = useCallback(
    () => Array.from(tierSurfacesRef.current.values()),
    [],
  );

  const value = useMemo(
    () => ({
      isDecorationDragging,
      beginDecorationDrag,
      endDecorationDrag,
      registerTierSurface,
      getTierSurfaces,
    }),
    [
      beginDecorationDrag,
      endDecorationDrag,
      getTierSurfaces,
      isDecorationDragging,
      registerTierSurface,
    ],
  );

  return (
    <DecorationSceneContext.Provider value={value}>
      {children}
    </DecorationSceneContext.Provider>
  );
}

export function useDecorationScene() {
  const context = useContext(DecorationSceneContext);
  if (!context) {
    throw new Error('useDecorationScene must be used within DecorationSceneProvider');
  }

  return context;
}
