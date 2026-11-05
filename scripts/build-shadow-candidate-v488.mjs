import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v487-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v487.json",
  integration: "dist/science/kerr-photon-metrology-observatory-v488/integration.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v488-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v488.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer), integration = read(paths.integration), dense = read(paths.dense), formal = read(paths.formal), formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v487-evidence-v1" || canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v487" || canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  integration.version !== "v488-kerr-photon-metrology-observatory-integration-v1" || canonicalSha(integration) !== integration.artifactSha256 ||
  integration.requestBoundary.localShadowCampaignAtlasDataAuthorizedByWrapper !== false || integration.requestBoundary.browserQualification !== "not-run" ||
  dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v488-evidence-boundary");

const sourcePaths = [
  paths.previousEvidence, paths.previousPointer, paths.integration, paths.dense, paths.formal,
  "app/lib/kerrPhotonMetrologyObservatoryIntentV488.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV488.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV488.tsx", "app/components/KerrPhotonMetrologyObservatoryIntentV488.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "app/components/RelativityResearchWorkspaceSection.tsx", "app/components/AtlasRuntimeWorkbenchLazySurfaces.tsx",
  "app/lib/kerrDimensionlessPhotonAtlasClientV487.ts", "app/components/KerrDimensionlessPhotonAtlasV487.tsx",
  "scripts/build-kerr-photon-metrology-observatory-v488.mjs", "scripts/build-shadow-candidate-v488.mjs", "scripts/build-shadow-v488.mjs", "scripts/verify-shadow-v488-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v488-unified-metrology-observatory-implemented-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v488-evidence-v1", generatedAt: "2026-08-01T00:00:00Z", status,
  dependency: { v487EvidenceSha256: previousEvidence.evidenceSha256, v487EvidenceFileSha256: fileSha(paths.previousEvidence), v487PointerSha256: previousPointer.pointerSha256, v487PointerFileSha256: fileSha(paths.previousPointer), v488IntegrationSha256: integration.artifactSha256, v488IntegrationFileSha256: fileSha(paths.integration), v314StateSha256: dense.stateSha256 },
  supersession: integration.supersession, intentChain: integration.intentChain, requestBoundary: integration.requestBoundary, scienceBoundary: integration.scienceBoundary, lifecycle: integration.lifecycle, qualification: integration.qualification,
  denseCampaign: { namespace: "v314", status: dense.status, completedShardCount: dense.completedShardCount, plannedShardCount: dense.plannedShardCount, attemptConsumed: dense.attemptConsumed, aggregateAvailable: dense.aggregateAvailable },
  sourceManifest, sourceSha256: canonicalSha(sourceManifest), release: integration.release, boundaryStatement: integration.boundary,
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) }; atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v488", generatedAt: "2026-08-01T00:00:00Z", status,
  formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: {
    v485Cockpit: "qualified-bounded-summary", v486RuntimeWrapper: "superseded-by-v488", v487CoordinateAtlas: "qualified-dimensionless-only",
    v488UnifiedObservatory: "implemented-awaiting-browser-qualification", v488ThreeLevelComponentLazyBoundary: "source-qualified", v488FourthLevelAtlasDataIntent: "source-qualified",
    v488StandaloneZeroLoad: "source-qualified-browser-not-run", v488LiteZeroLoad: "source-qualified-browser-not-run", v488SolarFirstScreenZeroLoad: "source-qualified-browser-not-run",
    v488PhysicalObservables: "blocked", v488ScienceRaster: "blocked", v488BrowserQualification: "not-run", v488VisualMatrixQualification: "not-run", v488SoakQualification: "not-run", v488RtxWebGpuQualification: "not-run", v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: { promotionAllowed: false, scienceRasterPayloadAllowed: false, fitsWriteAllowed: false, pngWriteAllowed: false, localShadowDefaultApplied: false },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) }; atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, integrationSha256: integration.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, componentLazyBoundaryDepth: 3, atlasDataIntentDepth: 4, browserQualification: "not-run", denseCampaign: "0/49", formalProductPointer: "v263" }, null, 2));
