import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const text = (path) => bytes(path).toString("utf8");
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const artifactPath = "dist/science/kerr-photon-metrology-observatory-v494/integration.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v494-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v494.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v493-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v493.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  artifact.version !== "v494-kerr-photon-metrology-observatory-integration-v1" || evidence.version !== "orbit-atlas-shadow-v494-evidence-v1" || pointer.version !== "orbit-atlas-current-local-shadow-candidate-v494" ||
  sha(artifact) !== artifact.artifactSha256 || sha(evidence) !== evidence.evidenceSha256 || sha(pointer) !== pointer.pointerSha256 || sha(previousEvidence) !== previousEvidence.evidenceSha256 || sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v493EvidenceSha256 !== previousEvidence.evidenceSha256 || evidence.dependency.v493PointerSha256 !== previousPointer.pointerSha256 || evidence.dependency.v494IntegrationSha256 !== artifact.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 || pointer.evidence.fileSha256 !== fileSha(evidencePath)
) throw new Error("v494-canonical-chain");

const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV494.tsx");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
const clients = [text("app/lib/kerrDimensionlessPhotonAtlasClientV487.ts"), text("app/lib/kerrRedshiftContrastLatticeClientV489.ts"), text("app/lib/kerrRedshiftGaugeReconstructionClientV491.ts"), text("app/lib/kerrRedshiftEdgeRedundancyClientV493.ts")];
if (
  artifact.intentChain.automaticComponentImportCount !== 1 || artifact.intentChain.detailComponentCatalogSize !== 4 || artifact.intentChain.concurrentDetailSurfaceCount !== 1 || artifact.intentChain.detailDefault !== "none" || artifact.intentChain.componentIntentDepth !== 4 || artifact.intentChain.dataIntentDepth !== 5 ||
  artifact.requestBudget.automaticCockpitSummaryRequestBudget !== 1 || artifact.requestBudget.detailDataRequestAuthorizedByWrapper !== false || artifact.requestBudget.browserObservedRequests !== null || artifact.requestBudget.browserQualification !== "not-run" ||
  artifact.scienceBoundary.sciencePixelRows !== 0 || artifact.scienceBoundary.statisticalJackknifeAuthorityGranted !== false || artifact.lifecycle.canvasCreatedByV494 !== false || artifact.lifecycle.maximumConcurrentDetailSurfaces !== 1 ||
  !wrapper.includes('useState<KerrPhotonMetrologyDetailSurfaceV494>("none")') || !wrapper.includes('detail === "coordinate-atlas"') || !wrapper.includes('detail === "contrast-lattice"') || !wrapper.includes('detail === "gauge-reconstruction"') || !wrapper.includes('detail === "edge-redundancy"') ||
  wrapper.includes("loadKerrDimensionlessPhotonAtlasSummaryV487") || wrapper.includes("loadKerrRedshiftContrastLatticeSummaryV489") || wrapper.includes("loadKerrRedshiftGaugeReconstructionSummaryV491") || wrapper.includes("loadKerrRedshiftEdgeRedundancySummaryV493") || wrapper.includes("Math.random") || wrapper.includes("<canvas") ||
  !workbench.includes('<KerrPhotonMetrologyObservatoryIntentV494 active={tab === "campaign-evidence"} />') || clients.some((source) => !source.includes("requestCount:0") && !source.includes("requestCount: 0"))
) throw new Error("v494-runtime-boundary");

if (dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84 || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false) throw new Error("v494-continuity-boundary");
for (const entry of evidence.sourceManifest) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v494-source-manifest:${entry.path}`);
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v494-source-manifest-canonical");

console.log(JSON.stringify({ status: "passed-v494-low-memory-five-level-four-exclusive-detail-observatory", integrationSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, automaticComponents: 1, detailCatalog: 4, concurrentDetails: 1, componentIntentDepth: 4, dataIntentDepth: 5, detailRequestsBeforeSecondIntent: 0, statisticalJackknife: "blocked-not-claimed", browserQualification: "not-run", denseCampaign: "0/49", formalProductPointer: "v263" }, null, 2));
