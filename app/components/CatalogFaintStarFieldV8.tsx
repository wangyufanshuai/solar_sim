"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { AtlasGaiaStarfieldEnhancementQualityTier } from "../lib/simulationDiagnosticsTypes";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { CATALOG_STREAM_BUDGET_V8 } from "../lib/catalogTileV8";
import type {
  CatalogStreamWorkerRequestV9,
  CatalogStreamWorkerResponseV9,
} from "../workers/catalogStream.worker";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";

const SKY_RADIUS = 10_000_000;

type PointState = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  recordCount: number;
};

function galacticDirectionToIcrs(
  direction: THREE.Vector3,
): { raDeg: number; decDeg: number } {
  const x = -0.0548755604 * direction.x + 0.4941094279 * direction.y - 0.867666149 * direction.z;
  const y = -0.8734370902 * direction.x - 0.44482963 * direction.y - 0.1980763734 * direction.z;
  const z = -0.4838350155 * direction.x + 0.7469822445 * direction.y + 0.4559837762 * direction.z;
  const length = Math.hypot(x, y, z) || 1;
  return {
    raDeg: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360,
    decDeg: (Math.asin(THREE.MathUtils.clamp(z / length, -1, 1)) * 180) / Math.PI,
  };
}

export default function CatalogFaintStarFieldV8({
  enabled,
  qualityTier,
  closeupSuppressed,
  selectedSourceId = "",
}: {
  enabled: boolean;
  qualityTier: AtlasGaiaStarfieldEnhancementQualityTier;
  closeupSuppressed: boolean;
  selectedSourceId?: string;
}) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const size = useThree((state) => state.size);
  const pointsRef = useRef<THREE.Points>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const viewKeyRef = useRef("");
  const directionRef = useRef(new THREE.Vector3());
  const [pointState, setPointState] = useState<PointState | null>(null);
  const catalogOpacityMultiplier = useAtlasRuntimeStore(
    (snapshot) => {
      const profile = resolveAtlasVisualProfileV299(snapshot.visualProfile);
      return profile.catalogOpacityMultiplier * profile.groups.catalog.faintStarOpacity;
    },
  );
  const streamEnabled = enabled && getAtlasDeliveryProfile() !== "vercel-lite";
  const recordBudget = closeupSuppressed
    ? CATALOG_STREAM_BUDGET_V8.closeup.faint
    : CATALOG_STREAM_BUDGET_V8[qualityTier].faint;

  useEffect(() => {
    if (!streamEnabled || typeof Worker === "undefined") return;
    const worker = new Worker(new URL("../workers/catalogStream.worker.ts", import.meta.url));
    const releaseWorker = acquireAtlasResource("worker", "atlas", "catalog-stream-v9", { owner: "catalog" });
    workerRef.current = worker;
    const resolveSource = (event: Event) => {
      const sourceId = String((event as CustomEvent<{ sourceId?: string }>).detail?.sourceId ?? "");
      if (!/^\d+$/.test(sourceId)) return;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      worker.postMessage({ type: "resolve-source", requestId, sourceId } satisfies CatalogStreamWorkerRequestV9);
    };
    window.addEventListener("atlas:catalog-resolve-source-v264", resolveSource);
    worker.onmessage = (event: MessageEvent<CatalogStreamWorkerResponseV9>) => {
      const message = event.data;
      if (message.type === "snapshot") {
        window.dispatchEvent(new CustomEvent("atlas:catalog-stream-snapshot-v264", { detail: message.snapshot }));
        return;
      }
      if (message.type === "source") {
        window.dispatchEvent(new CustomEvent("atlas:catalog-source-resolution-v264", { detail: message }));
        return;
      }
      if (message.type !== "points" || message.requestId !== requestIdRef.current) return;
      setPointState({
        positions: message.positions,
        colors: message.colors,
        sizes: message.sizes,
        recordCount: message.recordCount,
      });
    };
    worker.postMessage({ type: "init" } satisfies CatalogStreamWorkerRequestV9);
    return () => {
      worker.terminate();
      window.removeEventListener("atlas:catalog-resolve-source-v264", resolveSource);
      releaseWorker();
      workerRef.current = null;
      viewKeyRef.current = "";
      setPointState(null);
    };
  }, [streamEnabled]);

  useEffect(() => {
    viewKeyRef.current = "";
  }, [recordBudget, selectedSourceId]);

  const geometry = useMemo(() => {
    if (!pointState) return null;
    const scaledPositions = new Float32Array(pointState.positions.length);
    for (let index = 0; index < pointState.positions.length; index += 1) {
      scaledPositions[index] = pointState.positions[index]! * SKY_RADIUS;
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(scaledPositions, 3));
    next.setAttribute("color", new THREE.BufferAttribute(pointState.colors, 3));
    next.setAttribute("pointSize", new THREE.BufferAttribute(pointState.sizes, 1));
    next.setDrawRange(0, pointState.recordCount);
    return next;
  }, [pointState]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexColors: true,
    uniforms: { uOpacity: { value: 0.44 } },
    vertexShader: `
      attribute float pointSize;
      varying vec3 vColor;
      void main() {
        vColor = color;
        gl_PointSize = pointSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float r2 = dot(p, p) * 4.0;
        if (r2 > 1.0) discard;
        float alpha = (1.0 - smoothstep(0.12, 1.0, r2)) * uOpacity;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  }), []);

  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => {
    if (!geometry || !pointState) return;
    return acquireAtlasResource("gpu-buffer", "atlas", "catalog-faint-v9-points", {
      owner: "catalog",
      estimatedBytes: pointState.positions.byteLength + pointState.colors.byteLength + pointState.sizes.byteLength,
    });
  }, [geometry, pointState]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    material.uniforms.uOpacity.value = 0.44 * catalogOpacityMultiplier;
  }, [catalogOpacityMultiplier, material]);

  useFrame(() => {
    const worker = workerRef.current;
    if (!streamEnabled || !worker) return;
    if (pointsRef.current) pointsRef.current.position.copy(camera.position);
    camera.getWorldDirection(directionRef.current);
    const { raDeg, decDeg } = galacticDirectionToIcrs(directionRef.current);
    const fovDeg = Math.min(180, camera.fov * Math.max(1, size.width / Math.max(1, size.height)));
    const key = `${Math.round(raDeg * 4)}:${Math.round(decDeg * 4)}:${Math.round(fovDeg)}:${recordBudget}:${selectedSourceId}`;
    if (key === viewKeyRef.current) return;
    viewKeyRef.current = key;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    worker.postMessage({
      type: "view",
      requestId,
      raDeg,
      decDeg,
      fovDeg,
      recordBudget,
      selectedSourceId,
    } satisfies CatalogStreamWorkerRequestV9);
  });

  if (!streamEnabled || !geometry) return null;
  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-500}
      data-atlas-catalog-stream="v264-healpix-v9-points"
    />
  );
}
