"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { AtlasRuntimeQualityTier } from "../lib/simulationDiagnosticsTypes";
import { atlasRuntimeStore, type AtlasSceneModeV2 } from "../lib/atlasRuntimeStore";
import {
  getAtlasResourceSnapshot,
  subscribeAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "../lib/atlasResourceLifecycle";
import { CURRENT_ATLAS_PRODUCT_RELEASE_V167 } from "../lib/atlasProductReleaseV167";
import {
  atlasDeliveryCapabilities,
  getAtlasDeliveryProfile,
} from "../lib/atlasDeliveryProfile";

type AtlasAppShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  sceneMode: AtlasSceneModeV2;
  qualityTier: AtlasRuntimeQualityTier;
  selectedObjectId?: string;
};

const CURRENT_RELEASE = CURRENT_ATLAS_PRODUCT_RELEASE_V167;
const DELIVERY_PROFILE = getAtlasDeliveryProfile();
const DELIVERY_CAPABILITIES = atlasDeliveryCapabilities(DELIVERY_PROFILE);
const LEGACY_ROOT_COMPATIBILITY = {
  millionStarVersion: "v135-million-star-sqlite-atlas",
  finalReleaseVersion: "v140-windows-scientific-cinematic-atlas-1.0",
} as const;

function writeResourceAttributes(node: HTMLDivElement, resources: AtlasRuntimeResourceSnapshot): void {
  node.dataset.atlasResourceTotal = String(resources.total);
  node.dataset.atlasResourceWorkers = String(resources.workers);
  node.dataset.atlasResourceRenderTargets = String(resources.gpuRenderTargets);
  node.dataset.atlasResourceGpuBuffers = String(resources.gpuBuffers);
  node.dataset.atlasResourceGpuPipelines = String(resources.gpuComputePipelines);
  node.dataset.atlasResourceGpuQueries = String(resources.gpuQueries);
  node.dataset.atlasResourceTextures = String(resources.textures);
  node.dataset.atlasResourceModels = String(resources.models);
  node.dataset.atlasResourceSubscriptions = String(resources.subscriptions);
  node.dataset.atlasResourceObjectUrls = String(resources.objectUrls);
  node.dataset.atlasResourceTypedArrayCaches = String(resources.typedArrayCaches);
  node.dataset.atlasResourceCameraLocks = String(resources.cameraLocks);
  node.dataset.atlasResourceEstimatedBytes = String(resources.estimatedBytes);
  node.dataset.atlasResourceEstimatedGpuBytes = String(resources.estimatedGpuBytes);
  node.dataset.atlasResourceIdentityDigest = resources.identityDigest;
  node.dataset.atlasResourceOwnerCount = String(Object.keys(resources.byOwner).length);
  node.dataset.atlasResourceRevision = String(resources.revision);
}

export default function AtlasAppShell({
  children,
  sceneMode,
  qualityTier,
  selectedObjectId = "",
  ...divProps
}: AtlasAppShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  useEffect(() => {
    atlasRuntimeStore.setRuntimeContext({
      sceneMode,
      qualityTier,
      selectedObjectId,
    });
  }, [qualityTier, sceneMode, selectedObjectId]);

  useEffect(() => {
    const publish = () => {
      if (shellRef.current) writeResourceAttributes(shellRef.current, getAtlasResourceSnapshot());
    };
    publish();
    return subscribeAtlasResourceSnapshot(publish);
  }, []);

  return (
    <div
      ref={shellRef}
      {...divProps}
      data-atlas-app-shell="v131-runtime-simplification-resource-lifecycle"
      data-atlas-delivery-profile={DELIVERY_PROFILE}
      data-atlas-delivery-million-catalog={DELIVERY_CAPABILITIES.millionStarCatalog ? "enabled" : "disabled"}
      data-atlas-delivery-full-observations={DELIVERY_CAPABILITIES.fullObservationFixtures ? "enabled" : "disabled"}
      data-atlas-app-shell-current="v161-runtime-architecture-v3"
      data-atlas-million-star-version={LEGACY_ROOT_COMPATIBILITY.millionStarVersion}
      data-atlas-final-release-version={LEGACY_ROOT_COMPATIBILITY.finalReleaseVersion}
      data-atlas-app-shell-render-count={renderCountRef.current}
      data-atlas-runtime-store-listeners={atlasRuntimeStore.getListenerCount()}
      data-atlas-runtime-architecture={CURRENT_RELEASE.runtimeArchitectureVersion}
      data-atlas-scene-mode-v2={sceneMode}
      data-atlas-extreme-release={CURRENT_RELEASE.version}
      data-atlas-extreme-release-profile={CURRENT_RELEASE.profile}
      data-atlas-extreme-release-status={CURRENT_RELEASE.releaseStatus}
      data-atlas-extreme-release-default-kernel={CURRENT_RELEASE.defaultScientificKernel}
      data-atlas-extreme-release-boundary={CURRENT_RELEASE.boundary}
      data-atlas-product-release-status={CURRENT_RELEASE.productReleaseStatus}
      data-atlas-scientific-promotion-status={CURRENT_RELEASE.scientificPromotionStatus}
      data-atlas-scientific-shadow-kernel={CURRENT_RELEASE.shadowScientificKernel}
      data-atlas-asset-delivery-version={CURRENT_RELEASE.assetDeliveryVersion}
      data-atlas-asset-resolver-version={CURRENT_RELEASE.assetResolverVersion}
      data-atlas-visual-director-version={CURRENT_RELEASE.visualDirectorVersion}
      data-atlas-planet-render-graph-version={CURRENT_RELEASE.planetRenderGraphVersion}
      data-atlas-stellar-material-version={CURRENT_RELEASE.stellarMaterialVersion}
      data-atlas-orbit-director-version={CURRENT_RELEASE.orbitDirectorVersion}
      data-atlas-launch-cinematic-version={CURRENT_RELEASE.launchVersion}
      data-atlas-scientific-experience-version={CURRENT_RELEASE.scienceVersion}
      data-atlas-resource-total="0"
      data-atlas-resource-workers="0"
      data-atlas-resource-render-targets="0"
      data-atlas-resource-gpu-buffers="0"
      data-atlas-resource-gpu-pipelines="0"
      data-atlas-resource-gpu-queries="0"
      data-atlas-resource-textures="0"
      data-atlas-resource-models="0"
      data-atlas-resource-subscriptions="0"
      data-atlas-resource-object-urls="0"
      data-atlas-resource-typed-array-caches="0"
      data-atlas-resource-camera-locks="0"
      data-atlas-resource-estimated-bytes="0"
      data-atlas-resource-estimated-gpu-bytes="0"
      data-atlas-resource-revision="0"
    >
      {children}
    </div>
  );
}
