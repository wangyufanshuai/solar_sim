import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const text = (path) => bytes(path).toString("utf8");
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const artifactPath = "dist/science/kerr-photon-metrology-observatory-v488/integration.json", evidencePath = "dist/science/orbit-atlas-shadow-v488-evidence.json", pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v488.json";
const artifact = read(artifactPath), evidence = read(evidencePath), pointer = read(pointerPath), previousEvidence = read("dist/science/orbit-atlas-shadow-v487-evidence.json"), previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v487.json"), dense = read("dist/science/kerr-campaign-v314/campaign-state.json"), formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json"), formalEvidence = read(formal.source);
if (
  artifact.version !== "v488-kerr-photon-metrology-observatory-integration-v1" || evidence.version !== "orbit-atlas-shadow-v488-evidence-v1" || pointer.version !== "orbit-atlas-current-local-shadow-candidate-v488" ||
  canonicalSha(artifact) !== artifact.artifactSha256 || canonicalSha(evidence) !== evidence.evidenceSha256 || canonicalSha(pointer) !== pointer.pointerSha256 ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 || canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v487EvidenceSha256 !== previousEvidence.evidenceSha256 || evidence.dependency.v487PointerSha256 !== previousPointer.pointerSha256 || evidence.dependency.v488IntegrationSha256 !== artifact.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 || pointer.evidence.fileSha256 !== fileSha(evidencePath)
) throw new Error("v488-canonical-chain");

const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV488.tsx"), workbench = text("app/components/RelativityResearchWorkbenchV280.tsx"), atlasClient = text("app/lib/kerrDimensionlessPhotonAtlasClientV487.ts"), atlasComponent = text("app/components/KerrDimensionlessPhotonAtlasV487.tsx");
if (
  artifact.intentChain.publicPanelId !== "relativity-observables" || artifact.intentChain.publicPanelIdAddedByV488 !== false || artifact.intentChain.componentLazyBoundaryDepth !== 3 || artifact.intentChain.atlasDataIntentDepth !== 4 ||
  artifact.requestBoundary.localShadowCampaignAtlasDataAuthorizedByWrapper !== false || artifact.requestBoundary.localShadowCampaignAtlasDataRequiresExplicitClick !== true || artifact.requestBoundary.browserObservedRequests !== null || artifact.requestBoundary.browserQualification !== "not-run" ||
  artifact.scienceBoundary.sciencePixelRows !== 0 || artifact.scienceBoundary.scienceRasterAuthorityGranted !== false || artifact.lifecycle.canvasCreatedByV488 !== false || artifact.lifecycle.sceneRevisionDelta !== 0 || artifact.lifecycle.physicsMutationAllowed !== false ||
  !wrapper.includes('() => import("./KerrPhotonMetrologyCockpitV485")') || !wrapper.includes('() => import("./KerrDimensionlessPhotonAtlasV487")') || wrapper.includes("loadKerrDimensionlessPhotonAtlasSummaryV487") || wrapper.includes("/api/atlas/relativity-evidence/v487") || wrapper.includes("Math.random") || wrapper.includes("<canvas") ||
  !workbench.includes('<KerrPhotonMetrologyObservatoryIntentV488 active={tab === "campaign-evidence"} />') || workbench.includes('from "./KerrPhotonMetrologyCockpitV485"') || workbench.includes('from "./KerrDimensionlessPhotonAtlasV487"') ||
  !atlasClient.includes("requestCount: 0") || !atlasClient.includes("if (requestPromise) return requestPromise") || !atlasComponent.includes("Load bounded coordinate atlas") || atlasComponent.includes("useEffect")
) throw new Error("v488-runtime-boundary");

if (dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84 || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false) throw new Error("v488-continuity-boundary");
for (const entry of evidence.sourceManifest) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v488-source-manifest:${entry.path}`);
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v488-source-manifest-canonical");
console.log(JSON.stringify({ status: "passed-v488-low-memory-unified-metrology-observatory", integrationSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, componentLazyBoundaryDepth: 3, atlasDataIntentDepth: 4, atlasRequestBeforeExplicitIntent: 0, browserQualification: "not-run", denseCampaign: "0/49", formalProductPointer: "v263" }, null, 2));
