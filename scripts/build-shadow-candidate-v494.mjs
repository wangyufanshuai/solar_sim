import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v493-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v493.json",
  integration: "dist/science/kerr-photon-metrology-observatory-v494/integration.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v494-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v494.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const integration = read(paths.integration);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v493-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v493" || sha(previousPointer) !== previousPointer.pointerSha256 ||
  integration.version !== "v494-kerr-photon-metrology-observatory-integration-v1" || sha(integration) !== integration.artifactSha256 ||
  integration.intentChain.automaticComponentImportCount !== 1 || integration.intentChain.detailComponentCatalogSize !== 4 || integration.intentChain.concurrentDetailSurfaceCount !== 1 || integration.requestBudget.detailDataRequestAuthorizedByWrapper !== false ||
  dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v494-evidence-boundary");

const sourcePaths = [
  paths.previousEvidence, paths.previousPointer, paths.integration, paths.dense, paths.formal,
  "app/lib/kerrPhotonMetrologyObservatoryIntentV494.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV494.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV494.tsx", "app/components/KerrPhotonMetrologyObservatoryIntentV494.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "app/components/RelativityResearchWorkspaceSection.tsx", "app/components/AtlasRuntimeWorkbenchLazySurfaces.tsx",
  "app/lib/kerrDimensionlessPhotonAtlasClientV487.ts", "app/lib/kerrRedshiftContrastLatticeClientV489.ts", "app/lib/kerrRedshiftGaugeReconstructionClientV491.ts", "app/lib/kerrRedshiftEdgeRedundancyClientV493.ts",
  "scripts/build-kerr-photon-metrology-observatory-v494.mjs", "scripts/build-shadow-candidate-v494.mjs", "scripts/build-shadow-v494.mjs", "scripts/verify-shadow-v494-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v494-five-level-four-exclusive-detail-observatory-implemented-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v494-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v493EvidenceSha256: previousEvidence.evidenceSha256,
    v493EvidenceFileSha256: fileSha(paths.previousEvidence),
    v493PointerSha256: previousPointer.pointerSha256,
    v493PointerFileSha256: fileSha(paths.previousPointer),
    v494IntegrationSha256: integration.artifactSha256,
    v494IntegrationFileSha256: fileSha(paths.integration),
    v314StateSha256: dense.stateSha256,
  },
  supersession: integration.supersession,
  intentChain: integration.intentChain,
  requestBudget: integration.requestBudget,
  scienceBoundary: integration.scienceBoundary,
  lifecycle: integration.lifecycle,
  qualification: integration.qualification,
  denseCampaign: { namespace: "v314", status: dense.status, completedShardCount: dense.completedShardCount, plannedShardCount: dense.plannedShardCount, attemptConsumed: dense.attemptConsumed, aggregateAvailable: dense.aggregateAvailable },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: integration.release,
  boundaryStatement: integration.boundary,
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v494",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v485Cockpit: "qualified-bounded-summary",
    v487CoordinateAtlas: "qualified-dimensionless-only",
    v489ContrastLattice: "qualified-dimensionless-only",
    v491GaugeReconstruction: "qualified-relative-only",
    v493EdgeRedundancy: "qualified-deterministic-algebraic-only",
    v494FiveLevelIntent: "source-qualified",
    v494AutomaticComponents: "source-qualified-1",
    v494DetailCatalog: "source-qualified-4",
    v494ConcurrentDetails: "source-qualified-1",
    v494SecondExplicitDataIntent: "source-qualified",
    v494StandaloneZeroLoad: "source-qualified-browser-not-run",
    v494LiteZeroLoad: "source-qualified-browser-not-run",
    v494SolarFirstScreenZeroLoad: "source-qualified-browser-not-run",
    v494StatisticalJackknife: "blocked-not-claimed",
    v494PhysicalObservables: "blocked",
    v494ScienceRaster: "blocked",
    v494BrowserQualification: "not-run",
    v494VisualMatrixQualification: "not-run",
    v494SoakQualification: "not-run",
    v494RtxWebGpuQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: { promotionAllowed: false, scienceRasterPayloadAllowed: false, fitsWriteAllowed: false, pngWriteAllowed: false, localShadowDefaultApplied: false },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, integrationSha256: integration.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, automaticComponents: 1, detailCatalog: 4, concurrentDetails: 1, componentIntentDepth: 4, dataIntentDepth: 5, browserQualification: "not-run", denseCampaign: "0/49" }, null, 2));
