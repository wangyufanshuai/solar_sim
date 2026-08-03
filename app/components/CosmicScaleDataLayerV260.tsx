"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useReducer, useRef } from "react";
import * as THREE from "three";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { atlasScaleLayerOpacityV273 } from "../lib/atlasScalePresentationV273";
import { createAtlasScaleResourceSnapshotV273 } from "../lib/atlasScaleResourceSnapshotV273";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import type { AtlasScaleJourneyV268 } from "../lib/atlasScaleJourneyV268";
import type { AtlasScaleBand } from "../lib/atlasRuntimeStateV256";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import type { CosmicScaleWorkerRequestV260, CosmicScaleWorkerResponseV260 } from "../workers/cosmicScale.worker";

type CosmicBand = "local-group" | "near-universe";
type PointState = { positions: Float32Array; colors: Float32Array; sizes: Float32Array; count: number; blocked: boolean; provenance: string };

const decodedCache = new Map<CosmicBand, PointState>();
const decodedCacheResourceReleases = new Map<CosmicBand, () => void>();

function clearDecodedCacheV273(): void {
  decodedCacheResourceReleases.forEach((release) => release());
  decodedCacheResourceReleases.clear();
  decodedCache.clear();
}

export default function CosmicScaleDataLayerV260() {
  const current = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const journey = useAtlasRuntimeStore((snapshot) => snapshot.scaleJourney);
  const [, refresh] = useReducer((value) => value + 1, 0);
  const requestedRef = useRef(new Set<CosmicBand>());
  const requestBandsRef = useRef(new Map<number, CosmicBand>());
  const requestIdRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const activeBands = useMemo(() => {
    const bands = new Set<CosmicBand>();
    if (current === "local-group" || current === "near-universe") bands.add(current);
    if (journey.lifecycle === "transition") {
      if (journey.from === "local-group" || journey.from === "near-universe") bands.add(journey.from);
      if (journey.to === "local-group" || journey.to === "near-universe") bands.add(journey.to);
    }
    return [...bands];
  }, [current, journey]);

  useEffect(() => {
    const requested = requestedRef.current;
    const requestBands = requestBandsRef.current;
    const worker = new Worker(new URL("../workers/cosmicScale.worker.ts", import.meta.url), { name: "orbit-atlas-cosmic-coordinator-v273" });
    workerRef.current = worker;
    const release = acquireAtlasResource("worker", "atlas", "cosmic-scale-coordinator-v273", { owner: "cosmic" });
    worker.onmessage = (event: MessageEvent<CosmicScaleWorkerResponseV260>) => {
      const message = event.data;
      const requestedBand = requestBands.get(message.requestId);
      requestBands.delete(message.requestId);
      if (message.type === "points") {
        const decodedBytes = message.positions.byteLength + message.colors.byteLength + message.sizes.byteLength;
        decodedCacheResourceReleases.get(message.band)?.();
        decodedCache.set(message.band, {
          positions: message.positions,
          colors: message.colors,
          sizes: message.sizes,
          count: message.count,
          blocked: message.publicDeploymentBlocked,
          provenance: message.provenance,
        });
        decodedCacheResourceReleases.set(message.band, acquireAtlasResource(
          "typed-array-cache",
          "atlas",
          `cosmic-${message.band}-decoded-v273`,
          { owner: "cosmic", estimatedBytes: decodedBytes },
        ));
        requested.delete(message.band);
        refresh();
        window.dispatchEvent(new CustomEvent("atlas:cosmic-scale-snapshot-v273", { detail: createAtlasScaleResourceSnapshotV273({ band: message.band, status: "ready", count: message.count, cacheHit: false, decodedBytes, provenance: message.provenance, publicDeploymentBlocked: message.publicDeploymentBlocked }) }));
      } else {
        if (requestedBand) requested.delete(requestedBand);
        window.dispatchEvent(new CustomEvent("atlas:cosmic-scale-snapshot-v273", { detail: createAtlasScaleResourceSnapshotV273({ band: requestedBand, status: "unavailable", error: message.message }) }));
      }
    };
    return () => {
      worker.onmessage = null;
      workerRef.current = null;
      requestBands.clear();
      requested.clear();
      worker.terminate();
      release();
      clearDecodedCacheV273();
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    for (const band of activeBands) {
      if (decodedCache.has(band)) {
        window.dispatchEvent(new CustomEvent("atlas:cosmic-scale-snapshot-v273", { detail: createAtlasScaleResourceSnapshotV273({ band, status: "ready", cacheHit: true }) }));
        continue;
      }
      if (requestedRef.current.has(band)) continue;
      requestedRef.current.add(band);
      const requestId = ++requestIdRef.current;
      requestBandsRef.current.set(requestId, band);
      worker.postMessage({ type: "load", band, requestId } satisfies CosmicScaleWorkerRequestV260);
    }
  }, [activeBands]);

  return <>{(["local-group", "near-universe"] as const).map((band) => <CosmicBandPointsV273 key={band} band={band} points={decodedCache.get(band) ?? null} current={current} journey={journey} />)}</>;
}

function CosmicBandPointsV273({ band, points, current, journey }: { band: CosmicBand; points: PointState | null; current: AtlasScaleBand; journey: AtlasScaleJourneyV268 }) {
  const visualOpacity = useAtlasRuntimeStore((snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile).groups.catalog.cosmicPointOpacity);
  const geometry = useMemo(() => {
    if (!points) return null;
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(points.positions, 3));
    next.setAttribute("color", new THREE.BufferAttribute(points.colors, 3));
    next.setAttribute("size", new THREE.BufferAttribute(points.sizes, 1));
    next.setDrawRange(0, points.count);
    return next;
  }, [points]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexColors: true,
    vertexShader: "attribute float size; varying vec3 vColor; void main(){vColor=color;gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: "uniform float uOpacity; varying vec3 vColor; void main(){vec2 p=gl_PointCoord-.5;float r=dot(p,p)*4.;if(r>1.)discard;gl_FragColor=vec4(vColor,(1.-smoothstep(.1,1.,r))*.72*uOpacity);}",
  }), []);
  useFrame(() => { material.uniforms.uOpacity.value = atlasScaleLayerOpacityV273(band, current, journey) * visualOpacity; });
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => {
    if (!geometry || !points) return;
    return acquireAtlasResource("gpu-buffer", "atlas", `cosmic-${band}-points`, {
      owner: "cosmic",
      estimatedBytes: points.positions.byteLength + points.colors.byteLength + points.sizes.byteLength,
    });
  }, [band, geometry, points]);
  useEffect(() => () => material.dispose(), [material]);
  if (!geometry || !points) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-470} userData={{ atlasCosmicScale: band, atlasScaleJourney: journey.lifecycle, atlasPublicDeploymentBlocked: points.blocked, atlasProvenance: points.provenance, atlasCache: "module-readonly-v273" }} />;
}
