"use client";

import * as THREE from "three";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

export type BloomSceneActions = {
  registerBloomTarget: (object: THREE.Object3D) => void;
  unregisterBloomTarget: (object: THREE.Object3D) => void;
  bindSunLight: (light: THREE.PointLight | null) => void;
};

export type BloomSceneState = {
  bloomTargets: THREE.Object3D[];
  sunLight: THREE.PointLight | null;
};

export type BloomSceneValue = BloomSceneActions & BloomSceneState;

const BloomSceneActionsContext = createContext<BloomSceneActions | null>(null);
const BloomSceneStateContext = createContext<BloomSceneState | null>(null);

export function BloomSceneProvider({ children }: { children: ReactNode }) {
  const [registryVersion, bump] = useReducer((n: number) => n + 1, 0);
  const bloomSetRef = useRef(new Set<THREE.Object3D>());
  const sunLightRef = useRef<THREE.PointLight | null>(null);

  const registerBloomTarget = useCallback((object: THREE.Object3D) => {
    bloomSetRef.current.add(object);
    bump();
  }, []);

  const unregisterBloomTarget = useCallback((object: THREE.Object3D) => {
    bloomSetRef.current.delete(object);
    bump();
  }, []);

  const bindSunLight = useCallback((light: THREE.PointLight | null) => {
    sunLightRef.current = light;
    bump();
  }, []);

  /** Stable identity across `bump()` — avoids layout effects re-firing unregister/register loops. */
  const actions = useMemo(
    () => ({
      registerBloomTarget,
      unregisterBloomTarget,
      bindSunLight,
    }),
    [registerBloomTarget, unregisterBloomTarget, bindSunLight]
  );

  const state = useMemo(
    () => ({
      bloomTargets: Array.from(bloomSetRef.current),
      sunLight: sunLightRef.current,
    }),
    [registryVersion]
  );

  return (
    <BloomSceneActionsContext.Provider value={actions}>
      <BloomSceneStateContext.Provider value={state}>
        {children}
      </BloomSceneStateContext.Provider>
    </BloomSceneActionsContext.Provider>
  );
}

export function useBloomScene(): BloomSceneValue {
  const actions = useContext(BloomSceneActionsContext);
  const st = useContext(BloomSceneStateContext);
  if (!actions || !st) {
    throw new Error("useBloomScene must be used inside BloomSceneProvider");
  }
  return useMemo(
    () => ({ ...actions, ...st }),
    [actions, st.bloomTargets, st.sunLight]
  );
}

/**
 * Use this in layout effects that register/unregister objects: `actions` does not change when the
 * bloom target list updates, so effect cleanups are not spuriously re-run.
 */
export function useOptionalBloomSceneActions(): BloomSceneActions | null {
  return useContext(BloomSceneActionsContext);
}

/** @deprecated Prefer `useOptionalBloomSceneActions` for registration; merged value changes every bump. */
export function useOptionalBloomScene(): BloomSceneValue | null {
  const actions = useContext(BloomSceneActionsContext);
  const st = useContext(BloomSceneStateContext);
  if (!actions || !st) return null;
  return { ...actions, ...st };
}
