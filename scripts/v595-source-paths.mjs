/**
 * v595 is a delta identity layered on the sealed v594 source identity.
 * The parent is validated separately; this list contains only files that are
 * intentionally new or changed for v595.  A changed file must be listed here
 * explicitly, otherwise the manifest builder fails closed on v594 byte drift.
 */
export const V595_PARENT_VERSION = "v594";
export const V595_BASE_SOURCE_MANIFEST_PATH = "docs/release/v594/source-manifest-v594.json";

export const V595_PARENT_ARTIFACT_PATHS = Object.freeze({
  sourceManifest: V595_BASE_SOURCE_MANIFEST_PATH,
  candidateManifest: "public/data/stellar-relativity-v594/manifest.json",
  releaseDossier: "docs/release/v594/release-export-v594.json",
  resealReceipt: "docs/release/v594/reseal-receipt-v594.json",
});

export const V595_DELTA_SOURCE_PATHS = Object.freeze([
  "package.json",
  "next.config.mjs",
  "scripts/build-atlas-profile.mjs",
  "app/components/AtlasAppShell.tsx",
  "app/components/AtlasSceneCameraBridges.tsx",
  "app/components/AtlasSceneFocusCameraBridge.tsx",
  "app/components/BodyDetailSidebar.tsx",
  "app/components/SpacecraftModel.tsx",
  "app/components/AtlasCanvasSimulationContract.ts",
  "app/components/AtlasRuntimeSceneLayer.tsx",
  "app/components/AtlasRuntimeWorkbenchSurface.tsx",
  "app/components/AtlasUniverseSceneRuntime.tsx",
  "app/components/PostV593RelativityWorkbenchPanel.tsx",
  "app/components/PostV593RelativityWorkbenchPanel.test.tsx",
  "app/components/PostV595RelativityExactPresentationNode.tsx",
  "app/components/SelectedSkyTargetProxy.tsx",
  "app/components/SelectedSkyTargetProxy.test.tsx",
  "app/components/SolarSystemBodies.tsx",
  "app/components/UniverseCanvas.tsx",
  "app/components/V595ExactAbDomSurface.tsx",
  "app/components/V595ExactAbR3fConsumer.tsx",
  "app/components/V594CdpSoakSurface.tsx",
  "app/lib/atlasProductSceneFamilyContractV595.ts",
  "app/lib/atlasProductSceneFamilyContractV595.test.ts",
  "app/lib/atlasV595BuildIdentity.ts",
  "app/lib/atlasV595BuildIdentity.test.ts",
  "app/lib/timelikeKerrReferenceV595.ts",
  "app/lib/timelikeKerrReferenceV595.test.ts",
  "app/lib/useOptionalTexture.ts",
  "app/lib/useOptionalTexture.test.ts",
  "public/data/catalog-lite-v7/astrophysical-parameters.json.gz",
  "public/data/catalog-lite-v7/hr-statistics.json",
  "app/lib/v594CdpSoakSurface.test.ts",
  "app/lib/postV594SameRealmLifecycle.test.ts",
  "app/lib/v595ExactAbContract.ts",
  "app/lib/v595ExactAbContract.test.ts",
  "app/lib/v595ExactAbSelection.ts",
  "docs/release/post-v593/timelike-kerr-reference-receipt-v595.json",
  "public/data/post-v593-stellar-relativity/timelike-kerr-reference-v595.json",
  "scripts/build-v595-timelike-kerr-admission.mjs",
  "scripts/build-v595-source-manifest.mjs",
  "scripts/build-v595-source-manifest.test.mjs",
  "scripts/build-v595-stellar-relativity-candidate.mjs",
  "scripts/build-v595-stellar-relativity-candidate.test.mjs",
  "scripts/build-atlas-v595-profile.mjs",
  "scripts/build-catalog-v7.py",
  "scripts/build-atlas-v595-profile.test.mjs",
  "scripts/v595-formal-contract.mjs",
  "scripts/v595-formal-contract.test.mjs",
  "scripts/v595-source-paths.mjs",
  "scripts/v595-source-paths.test.mjs",
  "scripts/build-v595-current-source-lifecycle.test.mjs",
  "scripts/build-v595-current-source-soak.test.mjs",
  "scripts/build-v595-current-lite-matrix.test.mjs",
  "scripts/build-v595-final-sealed-browser-gate.test.mjs",
  "scripts/build-v595-human-visual-signoff.test.mjs",
  "scripts/build-v595-closure-dossier.test.mjs",
  "scripts/seal-v595-stellar-relativity-candidate.test.mjs",
  "scripts/verify-v595-stellar-relativity-candidate.test.mjs",
  "tmp/v595-browser-evidence-contract.mjs",
  "tmp/v595-browser-evidence-contract.test.mjs",
  "tmp/v595-browser-evidence-collector.mjs",
  "tmp/audit-v595-browser-evidence.mjs",
  "tmp/audit-v595-browser-evidence.test.mjs",
  "tmp/v595-24x2-stellar-browser-matrix.mjs",
  "tmp/v595-24x2-stellar-browser-matrix.test.mjs",
  "tmp/v595-product-scene-family-browser-journeys.mjs",
  "tmp/v595-product-scene-family-browser-journeys.test.mjs",
  "tmp/v595-real-desktop-chrome-evidence.mjs",
  "tmp/v595-real-desktop-chrome-evidence.test.mjs",
  "tmp/v595-same-realm-lifecycle-runner.mjs",
  "tmp/v595-same-realm-lifecycle-runner.test.mjs",
  "tmp/v595-cdp-renderer-soak-runner.mjs",
  "tmp/v595-cdp-renderer-soak-runner.test.mjs",
]);

export const V595_DELTA_PATHS = V595_DELTA_SOURCE_PATHS;

export const V595_CLOSURE_SOURCE_PATHS = Object.freeze([
  "scripts/build-v595-current-source-lifecycle.mjs",
  "scripts/build-v595-current-source-soak.mjs",
  "scripts/build-v595-current-lite-matrix.mjs",
  "scripts/build-v595-final-sealed-browser-gate.mjs",
  "scripts/build-v595-human-visual-signoff.mjs",
  "scripts/build-v595-closure-dossier.mjs",
  "scripts/seal-v595-stellar-relativity-candidate.mjs",
  "scripts/verify-v595-stellar-relativity-candidate.mjs",
]);
export const V595_SOURCE_PATHS = V595_DELTA_SOURCE_PATHS;
export const V595_ALL_RESERVED_SOURCE_PATHS = Object.freeze([
  ...V595_SOURCE_PATHS,
  ...V595_CLOSURE_SOURCE_PATHS,
]);

if (new Set(V595_ALL_RESERVED_SOURCE_PATHS).size !== V595_ALL_RESERVED_SOURCE_PATHS.length) {
  throw new Error("v595-source-paths-duplicate");
}
