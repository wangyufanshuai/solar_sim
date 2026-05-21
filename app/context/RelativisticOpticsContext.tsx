"use client";

import {
  createContext,
  useContext,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import * as THREE from "three";

export type RelativisticOpticsFrameState = {
  active: boolean;
  cEffScenePerReal: number;
  camVelScenePerReal: THREE.Vector3;
  daysPerSecond: number;
  relativityPhysicsOn: boolean;
  /** World-space rotation applied to distant backdrop (aberration). */
  aberrationQuat: THREE.Quaternion;
};

function createState(): RelativisticOpticsFrameState {
  return {
    active: false,
    cEffScenePerReal: 1,
    camVelScenePerReal: new THREE.Vector3(),
    daysPerSecond: 1,
    relativityPhysicsOn: false,
    aberrationQuat: new THREE.Quaternion(),
  };
}

const RelativisticOpticsContext =
  createContext<MutableRefObject<RelativisticOpticsFrameState> | null>(null);

export function RelativisticOpticsProvider({ children }: { children: ReactNode }) {
  const ref = useRef<RelativisticOpticsFrameState>(createState());
  return (
    <RelativisticOpticsContext.Provider value={ref}>
      {children}
    </RelativisticOpticsContext.Provider>
  );
}

export function useRelativisticOpticsStateRef(): MutableRefObject<RelativisticOpticsFrameState> | null {
  return useContext(RelativisticOpticsContext);
}
