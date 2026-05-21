import {
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { createPhysicsBufferViews, createSharedPhysicsArrayBuffer } from "./physicsSharedBuffer";
import { PhysicsRuntime } from "./physicsRuntime";
import { SolarSystemPhysics } from "./solarSystemPhysics";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";

export type { SolarSystemPhysicsRef } from "./solarSystemRef";

function readFixedRk4FromEnv(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NEXT_PUBLIC_SOLAR_FIXED_RK4 === "1";
}

export function useSolarSystemPhysics(): {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  physicsReady: boolean;
  physicsUsesSharedBuffer: boolean;
} {
  const physicsRef = useRef<SolarSystemPhysicsRef | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [physicsReady, setPhysicsReady] = useState(false);
  const [usesShared, setUsesShared] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    const isolated =
      typeof self !== "undefined" && self.crossOriginIsolated === true;
    const sabOk = typeof SharedArrayBuffer !== "undefined";

    if (isolated && sabOk) {
      const sab = createSharedPhysicsArrayBuffer();
      const views = createPhysicsBufferViews(sab);
      const w = new Worker(
        new URL("../workers/physics.worker.ts", import.meta.url)
      );

      const onMsg = (e: MessageEvent) => {
        if (cancelled) return;
        if (e.data?.type === "ready") {
          w.removeEventListener("message", onMsg);
          physicsRef.current = new PhysicsRuntime(views, w);
          workerRef.current = w;
          setUsesShared(true);
          setPhysicsReady(true);
        }
      };
      w.addEventListener("message", onMsg);
      w.postMessage({
        type: "init",
        sab,
        forceFixedRk4: readFixedRk4FromEnv(),
      });

      const t = window.setTimeout(() => {
        if (!cancelled && !physicsRef.current) {
          console.warn(
            "[physics] Worker init timeout; falling back to main-thread integrator."
          );
          w.terminate();
          physicsRef.current = new SolarSystemPhysics();
          workerRef.current = null;
          setUsesShared(false);
          setPhysicsReady(true);
        }
      }, 4000);

      return () => {
        cancelled = true;
        window.clearTimeout(t);
        w.removeEventListener("message", onMsg);
        workerRef.current?.terminate();
        workerRef.current = null;
        physicsRef.current = null;
        setPhysicsReady(false);
        setUsesShared(false);
      };
    }

    physicsRef.current = new SolarSystemPhysics();
    setUsesShared(false);
    setPhysicsReady(true);
    return () => {
      physicsRef.current = null;
      setPhysicsReady(false);
    };
  }, []);

  return {
    physicsRef,
    physicsReady,
    physicsUsesSharedBuffer: usesShared,
  };
}
