"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { AtlasRuntimeQualityTier } from "../lib/simulationDiagnosticsTypes";
import { atlasRuntimeStore, type AtlasSceneModeV2 } from "../lib/atlasRuntimeStore";
import { useAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
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

export default function AtlasAppShell({
  children,
  sceneMode,
  qualityTier,
  selectedObjectId = "",
  ...divProps
}: AtlasAppShellProps) {
  const resources = useAtlasResourceSnapshot();
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  useEffect(() => {
    atlasRuntimeStore.setRuntimeContext({
      sceneMode,
      qualityTier,
      selectedObjectId,
    });
  }, [qualityTier, sceneMode, selectedObjectId]);

  return (
    <div
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
      data-atlas-resource-total={resources.total}
      data-atlas-resource-workers={resources.workers}
      data-atlas-resource-render-targets={resources.gpuRenderTargets}
      data-atlas-resource-textures={resources.textures}
      data-atlas-resource-models={resources.models}
      data-atlas-resource-subscriptions={resources.subscriptions}
      data-atlas-resource-camera-locks={resources.cameraLocks}
    >
      {children}
    </div>
  );
}
