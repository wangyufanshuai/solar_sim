import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v485-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v485.json",
  integration: "dist/science/kerr-photon-metrology-runtime-v486/integration.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v486-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v486.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const integration = read(paths.integration);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v485-evidence-v1" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v485" ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  integration.version !== "v486-kerr-photon-metrology-runtime-integration-v1" ||
  canonicalSha(integration) !== integration.artifactSha256 ||
  integration.qualification.staticIntentBoundary !== "qualified" ||
  integration.preloadBoundary.browserQualification !== "not-run" ||
  integration.deliveryProfiles.localShadow.componentImportAuthorizedWhenActive !== true ||
  integration.deliveryProfiles.standaloneFull.componentImportAuthorizedWhenActive !== false ||
  integration.deliveryProfiles.vercelLite.componentImportAuthorizedWhenActive !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v486-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.integration,
  paths.dense,
  paths.formal,
  "app/lib/atlasDeliveryProfile.ts",
  "app/lib/kerrPhotonMetrologyIntentV486.ts",
  "app/lib/kerrPhotonMetrologyIntentV486.test.ts",
  "app/components/KerrPhotonMetrologyCockpitIntentV486.tsx",
  "app/components/KerrPhotonMetrologyCockpitIntentV486.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/RelativityResearchWorkspaceSection.tsx",
  "app/components/AtlasRuntimeWorkbenchLazySurfaces.tsx",
  "scripts/build-kerr-photon-metrology-runtime-v486.mjs",
  "scripts/build-shadow-candidate-v486.mjs",
  "scripts/build-shadow-v486.mjs",
  "scripts/verify-shadow-v486-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v486-photon-metrology-intent-integration-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v486-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v485EvidenceSha256: previousEvidence.evidenceSha256,
    v485EvidenceFileSha256: fileSha(paths.previousEvidence),
    v485PointerSha256: previousPointer.pointerSha256,
    v485PointerFileSha256: fileSha(paths.previousPointer),
    v486IntegrationSha256: integration.artifactSha256,
    v486IntegrationFileSha256: fileSha(paths.integration),
    v314StateSha256: dense.stateSha256,
  },
  runtimeIntegration: integration.intentChain,
  deliveryProfiles: integration.deliveryProfiles,
  preloadBoundary: integration.preloadBoundary,
  lifecycle: integration.lifecycle,
  scienceBoundary: integration.scienceBoundary,
  qualification: integration.qualification,
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    runNextAuthorized: dense.runNextAuthorized,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  release: integration.release,
  boundaryStatement: integration.boundary,
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v486",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v485CockpitSummary: "qualified-heavy-runtime-pending",
    v486LocalShadowIntentIntegration: "implemented-awaiting-browser-qualification",
    v486ThreeLevelLazyBoundary: "source-qualified",
    v486SolarFirstScreenZeroCockpitLoad: "source-qualified-browser-not-run",
    v486StandaloneZeroCockpitLoad: "source-qualified-browser-not-run",
    v486LiteZeroCockpitLoad: "source-qualified-browser-not-run",
    v486PublicPanelIdAdded: false,
    v486CanvasCreated: false,
    v486SceneRevisionDelta: 0,
    v486PhysicsMutationAllowed: false,
    v486BrowserQualification: "not-run",
    v486VisualMatrixQualification: "not-run",
    v486SoakQualification: "not-run",
    v486RtxWebGpuQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    sciencePayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status,
  integrationSha256: integration.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  lazyBoundaryDepth: 3,
  browserQualification: "not-run",
  denseCampaign: "0/49",
  formalProductPointer: "v263",
}, null, 2));
