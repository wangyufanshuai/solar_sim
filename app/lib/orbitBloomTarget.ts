import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";

/**
 * Registers a line-like orbit object into selective bloom target set.
 * Keeps registration lifecycle local to orbit components.
 */
export function useOrbitBloomTarget(object: THREE.Object3D | null): void {
  const bloomActions = useOptionalBloomSceneActions();
  useLayoutEffect(() => {
    if (!bloomActions || !object) return;
    bloomActions.registerBloomTarget(object);
    return () => bloomActions.unregisterBloomTarget(object);
  }, [bloomActions, object]);
}
