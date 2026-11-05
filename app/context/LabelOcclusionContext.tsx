"use client";

import * as THREE from "three";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export const LABEL_OCCLUDER_BODY_INDEX_KEY = "labelOccluderBodyIndex" as const;

type LabelOcclusionContextValue = {
  registerOccluder: (mesh: THREE.Mesh, bodyIndex: number) => void;
  unregisterOccluder: (mesh: THREE.Mesh) => void;
  /** Read in `useFrame` only; mutates on register/unregister. */
  getOccluders: () => readonly THREE.Mesh[];
};

const LabelOcclusionContext = createContext<LabelOcclusionContextValue | null>(
  null
);

export function LabelOcclusionProvider({ children }: { children: ReactNode }) {
  const listRef = useRef<THREE.Mesh[]>([]);

  const registerOccluder = useCallback((mesh: THREE.Mesh, bodyIndex: number) => {
    mesh.userData[LABEL_OCCLUDER_BODY_INDEX_KEY] = bodyIndex;
    const list = listRef.current;
    if (!list.includes(mesh)) list.push(mesh);
  }, []);

  const unregisterOccluder = useCallback((mesh: THREE.Mesh) => {
    delete mesh.userData[LABEL_OCCLUDER_BODY_INDEX_KEY];
    listRef.current = listRef.current.filter((m) => m !== mesh);
  }, []);

  const value = useMemo(
    () => ({
      registerOccluder,
      unregisterOccluder,
      getOccluders: () => listRef.current,
    }),
    [registerOccluder, unregisterOccluder]
  );

  return (
    <LabelOcclusionContext.Provider value={value}>
      {children}
    </LabelOcclusionContext.Provider>
  );
}

export function useOptionalLabelOcclusion(): LabelOcclusionContextValue | null {
  return useContext(LabelOcclusionContext);
}
