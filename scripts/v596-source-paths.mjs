/**
 * v596 is an explicit delta over the immutable, qualified v595 identity.
 * Parent records are rehashed unless the path is either a declared v596
 * delta or one of the retired parent-only evidence runners below.
 */
export const V596_PARENT_VERSION = "v595";
export const V596_BASE_SOURCE_MANIFEST_PATH =
  "docs/release/v595/source-manifest-v595.json";

export const V596_PARENT_ARTIFACT_PATHS = Object.freeze({
  sourceManifest: V596_BASE_SOURCE_MANIFEST_PATH,
  candidateManifest: "public/data/stellar-relativity-v595/manifest.json",
  releaseDossier: "docs/release/v595/release-export-v595.json",
  resealReceipt: "docs/release/v595/reseal-receipt-v595.json",
});

/**
 * These 14 v595 tmp runners are recorded by the sealed parent but no longer
 * exist in the workspace. They are not silently ignored: the v596 source
 * builder verifies their exact parent receipts, requires them to remain
 * absent, and serializes their retirement/replacement disposition.
 */
export const V596_PARENT_RETIRED_SOURCE_PATHS = Object.freeze([
  "tmp/audit-v595-browser-evidence.mjs",
  "tmp/audit-v595-browser-evidence.test.mjs",
  "tmp/v595-24x2-stellar-browser-matrix.mjs",
  "tmp/v595-24x2-stellar-browser-matrix.test.mjs",
  "tmp/v595-browser-evidence-collector.mjs",
  "tmp/v595-browser-evidence-contract.test.mjs",
  "tmp/v595-cdp-renderer-soak-runner.mjs",
  "tmp/v595-cdp-renderer-soak-runner.test.mjs",
  "tmp/v595-product-scene-family-browser-journeys.mjs",
  "tmp/v595-product-scene-family-browser-journeys.test.mjs",
  "tmp/v595-real-desktop-chrome-evidence.mjs",
  "tmp/v595-real-desktop-chrome-evidence.test.mjs",
  "tmp/v595-same-realm-lifecycle-runner.mjs",
  "tmp/v595-same-realm-lifecycle-runner.test.mjs",
]);

export const V596_PARENT_RETIRED_SOURCE_DISPOSITIONS = Object.freeze({
  "tmp/audit-v595-browser-evidence.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/audit-v596-browser-evidence.mjs"]),
  }),
  "tmp/audit-v595-browser-evidence.test.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/audit-v596-browser-evidence.test.mjs"]),
  }),
  "tmp/v595-24x2-stellar-browser-matrix.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-24x2-stellar-browser-matrix.mjs"]),
  }),
  "tmp/v595-24x2-stellar-browser-matrix.test.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-24x2-stellar-browser-matrix.test.mjs"]),
  }),
  "tmp/v595-browser-evidence-collector.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-browser-evidence-collector.mjs"]),
  }),
  "tmp/v595-browser-evidence-contract.test.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-browser-evidence-contract.test.mjs"]),
  }),
  "tmp/v595-cdp-renderer-soak-runner.mjs": Object.freeze({
    state: "retired-parent-runner-replaced-by-formal-closure-slot",
    replacements: Object.freeze(["tmp/v596-cdp-renderer-soak-runner.mjs"]),
  }),
  "tmp/v595-cdp-renderer-soak-runner.test.mjs": Object.freeze({
    state: "retired-parent-runner-replaced-by-formal-closure-slot",
    replacements: Object.freeze(["tmp/v596-cdp-renderer-soak-runner.test.mjs"]),
  }),
  "tmp/v595-product-scene-family-browser-journeys.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-product-scene-family-browser-journeys.mjs"]),
  }),
  "tmp/v595-product-scene-family-browser-journeys.test.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-product-scene-family-browser-journeys.test.mjs"]),
  }),
  "tmp/v595-real-desktop-chrome-evidence.mjs": Object.freeze({
    state: "retired-parent-supplemental-runner-replaced",
    replacements: Object.freeze(["tmp/v596-real-desktop-chrome-evidence.mjs"]),
  }),
  "tmp/v595-real-desktop-chrome-evidence.test.mjs": Object.freeze({
    state: "retired-parent-supplemental-runner-replaced",
    replacements: Object.freeze(["tmp/v596-real-desktop-chrome-evidence.test.mjs"]),
  }),
  "tmp/v595-same-realm-lifecycle-runner.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-same-realm-lifecycle-runner.mjs"]),
  }),
  "tmp/v595-same-realm-lifecycle-runner.test.mjs": Object.freeze({
    state: "retired-parent-runner-replaced",
    replacements: Object.freeze(["tmp/v596-same-realm-lifecycle-runner.test.mjs"]),
  }),
});

export const V596_DELTA_SOURCE_PATHS = Object.freeze([
  "next.config.mjs",
  "scripts/build-atlas-profile.mjs",
  "app/components/AtlasCanvasSimulationContract.ts",
  "app/components/AtlasDeepSpacePresentationSubtreeV275.tsx",
  "app/components/AtlasRuntimeSceneLayer.tsx",
  "app/components/AtlasRuntimeWorkbenchSurface.tsx",
  "app/components/AtlasUniverseSceneRuntime.tsx",
  "app/components/V594CdpSoakSurface.tsx",
  "app/components/BrightGalaxyMarkers.tsx",
  "app/components/BrightStarCatalog.tsx",
  "app/components/ConstellationLines.tsx",
  "app/components/NebulaMarkers.tsx",
  "app/components/ObservationFovOverlayV266.tsx",
  "app/components/PulsarField.tsx",
  "app/components/SelectedSkyTargetProxy.tsx",
  "app/components/StarClusterMarkers.tsx",
  "app/components/StellarPortraitMaterialV596.tsx",
  "app/components/StellarPortraitMaterialV596.test.tsx",
  "app/components/stellarResourceTeardownV596.test.ts",
  "app/components/V596VisualCheckpointDomSurface.tsx",
  "app/components/V596VisualCheckpointR3fConsumer.tsx",
  "app/effects/ThreeJsPostPipeline.tsx",
  "app/lib/atlasV596BuildIdentity.ts",
  "app/lib/atlasV596BuildIdentity.test.ts",
  "app/lib/atlasV596VisualCheckpointIdentity.ts",
  "app/lib/atlasV596VisualCheckpointIdentity.test.ts",
  "app/lib/v596FormalEvidenceContract.ts",
  "app/lib/v596FormalEvidenceContract.test.ts",
  "app/lib/kerrDetectorObservationInputsClientV446.ts",
  "app/lib/kerrDetectorObservationInputsClientV446.test.ts",
  "app/lib/stellarPortraitRenderContractV596.ts",
  "app/lib/stellarPortraitRenderContractV596.test.ts",
  "app/lib/v596VisualCheckpointContract.ts",
  "app/lib/v596VisualCheckpointContract.test.ts",
  "app/lib/v596VisualCheckpointSelection.ts",
  "app/lib/v594CdpSoakSurface.test.ts",
  "app/components/V596FormalEvidenceDomSurface.tsx",
  "app/components/UniverseSandboxHud.tsx",
  "scripts/build-v596-source-manifest.mjs",
  "scripts/build-v596-source-manifest.test.mjs",
  "scripts/build-v596-stellar-visible-leap-candidate.mjs",
  "scripts/build-v596-stellar-visible-leap-candidate.test.mjs",
  "scripts/build-atlas-v596-profile.mjs",
  "scripts/build-atlas-v596-profile.test.mjs",
  "scripts/v596-formal-contract.mjs",
  "scripts/v596-formal-contract.test.mjs",
  "scripts/v596-source-paths.mjs",
  "scripts/v596-source-paths.test.mjs",
  "scripts/build-v596-current-source-lifecycle.test.mjs",
  "scripts/build-v596-current-source-soak.test.mjs",
  "scripts/build-v596-current-lite-matrix.test.mjs",
  "scripts/build-v596-final-sealed-browser-gate.test.mjs",
  "scripts/build-v596-human-visual-signoff.test.mjs",
  "scripts/build-v596-closure-dossier.test.mjs",
  "scripts/seal-v596-stellar-visible-leap-candidate.test.mjs",
  "scripts/verify-v596-stellar-visible-leap-candidate.test.mjs",
  "tmp/v596-build-checkpoint-human-decision.mjs",
  "tmp/v596-build-checkpoint-human-decision.test.mjs",
  "tmp/v596-build-staging-candidate.mjs",
  "tmp/v596-build-staging-candidate.test.mjs",
  "tmp/v596-build-visual-checkpoint-identity.mjs",
  "tmp/v596-build-visual-checkpoint-identity.test.mjs",
  "tmp/v596-phase4-24x2-stellar-browser-matrix.mjs",
  "tmp/v596-phase4-24x2-stellar-browser-matrix.test.mjs",
  "tmp/v596-phase4-lifecycle-browser-regression.mjs",
  "tmp/v596-phase4-lifecycle-browser-regression.test.mjs",
  "tmp/v596-visual-checkpoint-ab-collector.mjs",
  "tmp/v596-visual-checkpoint-ab-collector.test.mjs",
  "tmp/v596-browser-evidence-contract.mjs",
  "tmp/v596-browser-evidence-contract.test.mjs",
  "tmp/v596-browser-evidence-collector.mjs",
  "tmp/v596-browser-evidence-collector.test.mjs",
  "tmp/audit-v596-browser-evidence.mjs",
  "tmp/audit-v596-browser-evidence.test.mjs",
  "tmp/v596-24x2-stellar-browser-matrix.mjs",
  "tmp/v596-24x2-stellar-browser-matrix.test.mjs",
  "tmp/v596-product-scene-family-browser-journeys.mjs",
  "tmp/v596-product-scene-family-browser-journeys.test.mjs",
  "tmp/v596-real-desktop-chrome-evidence.mjs",
  "tmp/v596-real-desktop-chrome-evidence.test.mjs",
  "tmp/v596-same-realm-lifecycle-runner.mjs",
  "tmp/v596-same-realm-lifecycle-runner.test.mjs",
  "tmp/v596-cdp-renderer-soak-runner.mjs",
  "tmp/v596-cdp-renderer-soak-runner.test.mjs",
]);

export const V596_DELTA_PATHS = V596_DELTA_SOURCE_PATHS;

export const V596_CLOSURE_SOURCE_PATHS = Object.freeze([
  "scripts/build-v596-current-source-lifecycle.mjs",
  "scripts/build-v596-current-source-soak.mjs",
  "scripts/build-v596-current-lite-matrix.mjs",
  "scripts/build-v596-final-sealed-browser-gate.mjs",
  "scripts/build-v596-human-visual-signoff.mjs",
  "scripts/build-v596-closure-dossier.mjs",
  "scripts/seal-v596-stellar-visible-leap-candidate.mjs",
  "scripts/verify-v596-stellar-visible-leap-candidate.mjs",
]);

export const V596_SOURCE_PATHS = V596_DELTA_SOURCE_PATHS;
export const V596_ALL_RESERVED_SOURCE_PATHS = Object.freeze([
  ...V596_SOURCE_PATHS,
  ...V596_CLOSURE_SOURCE_PATHS,
]);

if (new Set(V596_ALL_RESERVED_SOURCE_PATHS).size !== V596_ALL_RESERVED_SOURCE_PATHS.length) {
  throw new Error("v596-source-paths-duplicate");
}
if (new Set(V596_PARENT_RETIRED_SOURCE_PATHS).size !== V596_PARENT_RETIRED_SOURCE_PATHS.length) {
  throw new Error("v596-retired-source-paths-duplicate");
}
if (Object.keys(V596_PARENT_RETIRED_SOURCE_DISPOSITIONS).length
  !== V596_PARENT_RETIRED_SOURCE_PATHS.length
  || V596_PARENT_RETIRED_SOURCE_PATHS.some(
    (path) => !(path in V596_PARENT_RETIRED_SOURCE_DISPOSITIONS),
  )) throw new Error("v596-retired-source-dispositions-incomplete");
