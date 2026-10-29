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
import {
  ATLAS_V595_BUILD_IDENTITY,
  ATLAS_V595_FORMAL_PRODUCT_POINTER,
  ATLAS_V595_PARENT_V594_IDENTITY,
} from "../lib/atlasV595BuildIdentity";
import {
  ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION,
  deriveAtlasProductSceneFamilyV595,
} from "../lib/atlasProductSceneFamilyContractV595";
import { MAINLINE_A_RELEASE_IDENTITY_V626 } from "../lib/mainlineAReleaseIdentityBridgeV626";

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

  const productSceneFamily = deriveAtlasProductSceneFamilyV595(
    sceneMode,
    selectedObjectId,
  );

  return (
    <div
      ref={shellRef}
      {...divProps}
      data-atlas-app-shell="v131-runtime-simplification-resource-lifecycle"
      data-atlas-formal-product-pointer={ATLAS_V595_FORMAL_PRODUCT_POINTER}
      data-atlas-v595-source-manifest-sha256={ATLAS_V595_BUILD_IDENTITY.sourceManifestSha256}
      data-atlas-v595-candidate-manifest-sha256={ATLAS_V595_BUILD_IDENTITY.candidateManifestSha256}
      data-atlas-v595-build-fingerprint={ATLAS_V595_BUILD_IDENTITY.buildFingerprint}
      data-atlas-v595-build-id={ATLAS_V595_BUILD_IDENTITY.buildId}
      data-atlas-v595-deployment-id={ATLAS_V595_BUILD_IDENTITY.deploymentId}
      data-atlas-v595-delivery-tier={ATLAS_V595_BUILD_IDENTITY.deliveryTier}
      data-atlas-v595-identity-binding-status={ATLAS_V595_BUILD_IDENTITY.bindingStatus}
      data-mainline-build-id={process.env.NEXT_PUBLIC_MAINLINE_A_BUILD_ID || "unknown-build"}
      data-mainline-branch={process.env.NEXT_PUBLIC_MAINLINE_A_BRANCH || "unknown-branch"}
      data-mainline-head={process.env.NEXT_PUBLIC_MAINLINE_A_HEAD || "unknown-head"}
      data-mainline-a-release-identity={MAINLINE_A_RELEASE_IDENTITY_V626}
      data-mainline-a-root-runtime-name="solar-sim-viz"
      data-mainline-a-next-web-runtime-name="solar-next-web"
      data-mainline-a-runtime-name-relation="mapped-different"
      data-mainline-a-release-boundary="candidate-only-hold-not-admitted"
      data-mainline-a-scientific-payload-writeback="false"
      data-mainline-route={typeof window === "undefined" ? "/" : window.location.pathname}
      data-atlas-parent-v594-source-manifest-sha256={ATLAS_V595_PARENT_V594_IDENTITY.sourceManifestSha256}
      data-atlas-parent-v594-candidate-manifest-sha256={ATLAS_V595_PARENT_V594_IDENTITY.candidateManifestSha256}
      data-atlas-parent-v594-release-dossier-sha256={ATLAS_V595_PARENT_V594_IDENTITY.releaseDossierSha256}
      data-atlas-parent-v594-reseal-receipt-sha256={ATLAS_V595_PARENT_V594_IDENTITY.resealReceiptSha256}
      data-atlas-parent-v594-deployment-id={ATLAS_V595_PARENT_V594_IDENTITY.deploymentId}
      data-atlas-parent-v594-relationship={ATLAS_V595_PARENT_V594_IDENTITY.relationship}
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
      data-atlas-product-scene-family-v595={productSceneFamily.familyId}
      data-atlas-product-scene-family-stage-v595="hero"
      data-atlas-product-scene-family-version={ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION}
      data-atlas-product-scene-underlying-canvas-mode={productSceneFamily.underlyingCanvasMode}
      data-atlas-product-scene-single-canvas-policy="one-shared-main-canvas"
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
