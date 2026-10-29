"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { acquireAtlasResource, acquireAtlasTextureResourceV289 } from "../lib/atlasResourceLifecycle";
import { createAtlasResourceScopeV308 } from "../lib/atlasResourceScopeV308";
import {
  publishKerrInteractiveBufferTelemetryV317,
  publishKerrScienceBandRasterTelemetryV321,
  registerAtlasResourceScopeBaselineV317,
  releaseAtlasResourceScopeV309,
} from "../lib/atlasStrongGravityTelemetryV309";
import {
  kerrInteractiveBufferDisjointFromObservedScienceV317,
} from "../lib/kerrScienceBufferIntegrityV317";
import {
  createKerrScienceBandRasterWithIntegrityV321,
  type KerrScienceBandRasterWithIntegrityV321,
} from "../lib/kerrScienceBandRasterV321";
import { acquireKerrSciencePayloadV299 } from "../lib/kerrSciencePayloadClientV299";
import { acquireKerrThinDiskBandViewV321 } from "../lib/kerrThinDiskBandClientV321";
import {
  resolveKerrInteractiveDimensionsV299,
} from "../lib/kerrInteractiveComputeV299";
import {
  KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
  KERR_INTERACTIVE_COMPUTE_VERSION_V317,
  createPendingKerrGpuDifferentialV317,
  validateKerrInteractiveComputeResponseV317,
  type KerrInteractiveComputeRequestV317,
  type KerrInteractiveComputeResponseV317,
} from "../lib/kerrInteractiveAuthorityV317";
import { clearKerrInteractiveValuesV317, releaseKerrDataTextureV317 } from "../lib/kerrTextureLifecycleV317";
import type { KerrRayTraceQualityV3 } from "../lib/kerrRayTraceV3";
import type { KerrScienceTransferPayloadV299, StrongGravityRenderModeV299 } from "../lib/strongGravityRenderingV299";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  createKerrCinematicRgbaV305,
  resolveKerrStrongGravityVisualContractV305,
  type KerrCinematicVisualContractV305,
  type KerrScienceVisualContractV305,
} from "../lib/kerrStrongGravityVisualV305";
import { KerrRayTraceRendererV3 } from "./KerrRayTraceRendererV3";

// Historical v317 contract remains immutable for evidence replay; the active
// Science path intentionally upgrades its materialization to v321 below.
// createKerrScienceRasterWithIntegrityV317

function createScienceTexture(
  payload: KerrScienceTransferPayloadV299,
  materialized: KerrScienceBandRasterWithIntegrityV321,
  contract: KerrScienceVisualContractV305,
) {
  const { raster } = materialized;
  const texture = new THREE.DataTexture(raster.rgba, raster.width, raster.height, THREE.RGBAFormat);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  texture.userData = {
    atlasAuthority: payload.authorityKind,
    geometryEvidenceSha256: payload.geometryEvidenceSha256,
    polarizationEvidenceSha256: payload.polarizationEvidenceSha256,
    rayPlanSha256: payload.rayPlanSha256,
    denseAggregateSha256: payload.denseAggregateSha256,
    errorBudgetVersion: payload.errorBudgetVersion,
    observerFrameVersion: payload.observerFrameVersion,
    observerSourceSha256: payload.observerSourceSha256,
    emitterFrameVersion: payload.emitterFrameVersion,
    emitterSourceSha256: payload.emitterSourceSha256,
    diskInnerEdgeModel: payload.diskInnerEdgeModel,
    diskOuterRadiusM: payload.diskOuterRadiusM,
    polarizationProjectionReplay: "bl-disk-seed+projected-normal+complex-wp-v299",
    walkerPenroseModel: payload.walkerPenroseModel,
    parallelTransportModel: payload.parallelTransportModel,
    denseCampaignComplete: payload.denseCampaignComplete,
    atlasDisplayTransform: contract.displayTransform,
    atlasVisualContractVersion: contract.version,
    atlasScienceExposure: contract.exposure,
    atlasScienceBloom: contract.bloom,
    atlasScienceNoise: contract.noise,
    atlasScienceBufferMutationAllowed: contract.scienceBufferMutationAllowed,
    atlasScienceRasterVersion: raster.version,
    atlasScienceRasterBoundary: raster.boundary,
    atlasScienceRasterSummary: raster.summary,
    atlasScienceRasterEncoding: raster.encoding,
    atlasSciencePayloadDigestSha256: materialized.integrity.payloadAfter.digestSha256,
    atlasScienceRasterDigestSha256: materialized.integrity.rasterDigestSha256,
    atlasScienceBuffersDisjoint: materialized.integrity.rasterBufferDisjoint,
    atlasScienceDenseBoundary: materialized.integrity.denseBoundary,
    atlasScienceBandArtifactSha256: materialized.integrity.bandArtifactSha256,
    atlasScienceBandViewDigestSha256: materialized.integrity.bandViewDigestAfterSha256,
    atlasScienceBandViewUnchanged: materialized.integrity.bandViewUnchanged,
    atlasScienceBandCount: materialized.raster.summary.fixedBandCount,
    atlasScienceBandSaturationCount: materialized.raster.summary.saturatedChannelCount,
    atlasScienceBandNormalization: materialized.raster.encoding.normalization,
    atlasScienceCinematicBufferShared: materialized.integrity.cinematicBufferShared,
  };
  return { ...materialized, texture };
}

function createCinematicTexture(response: KerrInteractiveComputeResponseV317, contract: KerrCinematicVisualContractV305): THREE.DataTexture {
  const data = createKerrCinematicRgbaV305(response, contract);
  const texture = new THREE.DataTexture(data, response.width, response.height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  texture.userData = {
    atlasBackend: response.backend,
    atlasAuthoritative: false,
    atlasVersion: response.version,
    atlasAuthoritySha256: response.authoritySha256,
    atlasVisualContractVersion: contract.version,
    atlasVisualProfile: contract.profileId,
    atlasTokenSource: contract.tokenSource,
    atlasDetailSeed: contract.detailSeed,
    atlasScienceBufferMutationAllowed: contract.scienceBufferMutationAllowed,
  };
  return texture;
}

function ScienceSparseRenderer({ radiusScene, contract }: { radiusScene: number; contract: KerrScienceVisualContractV305 }) {
  const [texture, setTexture] = useState<THREE.DataTexture | null>(null);
  useEffect(() => {
    setTexture(null);
    const controller = new AbortController();
    const scope = createAtlasResourceScopeV308("kerr-science-sparse-texture");
    registerAtlasResourceScopeBaselineV317(scope);
    let cancelled = false;
    void acquireKerrSciencePayloadV299({ signal: controller.signal }).then(async (acquiredPayload) => {
      scope.add("science-payload", acquiredPayload.release);
      if (cancelled) return;
      const acquiredBands = await acquireKerrThinDiskBandViewV321(controller.signal);
      scope.add("science-fixed-band-view", acquiredBands.release);
      if (cancelled) return;
      const rasterWithIntegrity = await createKerrScienceBandRasterWithIntegrityV321(acquiredPayload.payload, acquiredBands.view);
      if (cancelled) return;
      const materialized = createScienceTexture(acquiredPayload.payload, rasterWithIntegrity, contract);
      const nextTexture = materialized.texture;
      scope.add("science-texture-dispose", () => {
        setTexture((current) => current === nextTexture ? null : current);
        releaseKerrDataTextureV317(nextTexture);
      });
      scope.add("science-texture-registry", acquireAtlasTextureResourceV289(nextTexture, "kerr", "kerr-v321-science-fixed-band-sparse", "strong-gravity-science"));
      publishKerrScienceBandRasterTelemetryV321(materialized.raster, materialized.integrity);
      if (!cancelled) setTexture(nextTexture);
    }).catch((error: unknown) => {
      releaseAtlasResourceScopeV309(scope, "kerr-science-sparse-texture", "science-load-failed");
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (!cancelled) setTexture(null);
    });
    return () => {
      cancelled = true;
      controller.abort();
      releaseAtlasResourceScopeV309(scope, "kerr-science-sparse-texture", "science-effect-cleanup");
    };
  }, [contract]);
  if (!texture) return null;
  return (
    <sprite scale={[radiusScene * 10, radiusScene * 10, 1]} renderOrder={-15} userData={{ atlasScienceRenderer: "v321-fixed-band-sparse-authority", atlasDenseCampaign: "incomplete", atlasVisualContract: contract.version }}>
      <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} toneMapped={contract.toneMapped} opacity={contract.exposure} />
    </sprite>
  );
}

function CinematicComputeRenderer({ radiusScene, spinA, quality, contract }: { radiusScene: number; spinA: number; quality: KerrRayTraceQualityV3; contract: KerrCinematicVisualContractV305 }) {
  const size = useThree((state) => state.size);
  const [texture, setTexture] = useState<THREE.DataTexture | null>(null);
  const dimensions = useMemo(() => resolveKerrInteractiveDimensionsV299({
    mobile: quality === "mobile-safe" || size.width < 700,
    width: Math.max(1, size.width),
    height: Math.max(1, size.height),
  }), [quality, size.height, size.width]);
  useEffect(() => {
    setTexture(null);
    const scope = createAtlasResourceScopeV308("kerr-cinematic-compute-texture");
    registerAtlasResourceScopeBaselineV317(scope);
    let cancelled = false;
    let worker: Worker;
    let stopWorker: () => void;
    try {
      worker = new Worker(new URL("../workers/kerrInteractiveCompute.worker.ts", import.meta.url), { name: "orbit-atlas-kerr-v317" });
      const releaseWorkerInstance = scope.add("cinematic-worker-instance", () => {
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
      });
      const releaseWorkerRegistry = scope.add("cinematic-worker-registry", acquireAtlasResource("worker", "kerr", "kerr-interactive-compute-v317", { owner: "strong-gravity-cinematic" }));
      stopWorker = () => {
        releaseWorkerRegistry();
        releaseWorkerInstance();
      };
    } catch {
      releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-worker-construction-failed");
      setTexture(null);
      return () => releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-worker-construction-cleanup");
    }
    const request: KerrInteractiveComputeRequestV317 = {
      version: KERR_INTERACTIVE_COMPUTE_VERSION_V317,
      authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
      requestId: `kerr-v317-${dimensions.width}x${dimensions.height}-${spinA.toFixed(4)}`,
      intent: "research-kerr",
      width: dimensions.width,
      height: dimensions.height,
      spinA,
      seed: contract.detailSeed,
      allowWebGpu: true,
      differential: createPendingKerrGpuDifferentialV317(),
    };
    worker.onmessage = (event: MessageEvent<KerrInteractiveComputeResponseV317>) => {
      const response = event.data;
      stopWorker();
      if (cancelled) {
        clearKerrInteractiveValuesV317(response.values);
        return;
      }
      const validation = validateKerrInteractiveComputeResponseV317(response, request);
      if (!validation.passed || response.backend === "precomputed-transfer-map") {
        clearKerrInteractiveValuesV317(response.values);
        releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-response-rejected");
        return;
      }
      const responseBuffersDisjoint = kerrInteractiveBufferDisjointFromObservedScienceV317(response.values);
      publishKerrInteractiveBufferTelemetryV317(response.authoritySha256, responseBuffersDisjoint);
      if (!responseBuffersDisjoint) {
        clearKerrInteractiveValuesV317(response.values);
        releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-response-buffer-alias");
        return;
      }
      const releaseResponseCache = scope.add("cinematic-response-cache", acquireAtlasResource("typed-array-cache", "kerr", "kerr-interactive-values-v317", {
        owner: "strong-gravity-cinematic",
        estimatedBytes: response.values.byteLength,
      }));
      try {
        const nextTexture = createCinematicTexture(response, contract);
        scope.add("cinematic-texture-dispose", () => {
          setTexture((current) => current === nextTexture ? null : current);
          releaseKerrDataTextureV317(nextTexture);
        });
        scope.add("cinematic-texture-registry", acquireAtlasTextureResourceV289(nextTexture, "kerr", "kerr-interactive-texture-v317", "strong-gravity-cinematic"));
        if (!cancelled) setTexture(nextTexture);
      } catch {
        releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-response-materialization-failed");
        if (!cancelled) setTexture(null);
      } finally {
        clearKerrInteractiveValuesV317(response.values);
        releaseResponseCache();
      }
    };
    worker.onerror = () => {
      stopWorker();
      releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-worker-failed");
      if (!cancelled) setTexture(null);
    };
    worker.postMessage(request);
    return () => {
      cancelled = true;
      stopWorker();
      releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-effect-cleanup");
    };
  }, [contract, dimensions.height, dimensions.width, spinA]);
  if (!texture) {
    return (
      <group userData={{ atlasFallback: "legacy-visual-approximation-not-science-authority", atlasAuthoritative: false }}>
        <KerrRayTraceRendererV3 radiusScene={radiusScene} spinA={spinA} quality={quality} />
      </group>
    );
  }
  return (
    <group userData={{ atlasCinematicRenderer: "v305-seeded-bloom", atlasScienceAuthority: false, atlasVisualContract: contract.version, atlasTokenSource: contract.tokenSource }}>
      <sprite scale={[radiusScene * 10, radiusScene * 10, 1]} renderOrder={-16}>
        <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} toneMapped={contract.toneMapped} opacity={contract.exposure} />
      </sprite>
      {contract.bloom > 0 ? (
        <sprite scale={[radiusScene * 10 * contract.bloomScale, radiusScene * 10 * contract.bloomScale, 1]} renderOrder={-15} userData={{ atlasCinematicBloom: contract.bloom }}>
          <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} toneMapped={false} opacity={Math.min(0.3, contract.bloom * 0.28)} blending={THREE.AdditiveBlending} />
        </sprite>
      ) : null}
    </group>
  );
}

export function KerrStrongGravityRendererV299({
  mode,
  radiusScene,
  spinA,
  quality,
}: {
  mode: StrongGravityRenderModeV299;
  radiusScene: number;
  spinA: number;
  quality: KerrRayTraceQualityV3;
}) {
  const profile = useAtlasRuntimeStore((snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile));
  const contract = useMemo(() => resolveKerrStrongGravityVisualContractV305(profile, mode), [mode, profile]);
  return mode === "science"
    ? <ScienceSparseRenderer radiusScene={radiusScene} contract={contract as KerrScienceVisualContractV305} />
    : <CinematicComputeRenderer radiusScene={radiusScene} spinA={spinA} quality={quality} contract={contract as KerrCinematicVisualContractV305} />;
}
