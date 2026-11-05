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
const artifactPath = "dist/science/kerr-redshift-edge-redundancy-v493/edge-redundancy.json";
const svgPath = "dist/science/kerr-redshift-edge-redundancy-v493/edge-redundancy.svg";
const evidencePath = "dist/science/orbit-atlas-shadow-v493-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v493.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v492-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v492.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const payload = { edgeLeverages: artifact.edgeLeverages, deletionCases: artifact.deletionCases };

if (
  artifact.version !== "v493-kerr-redshift-edge-redundancy-artifact-v1" || evidence.version !== "orbit-atlas-shadow-v493-evidence-v1" || pointer.version !== "orbit-atlas-current-local-shadow-candidate-v493" ||
  sha(artifact) !== artifact.artifactSha256 || sha(payload) !== artifact.payloadSha256 || sha(evidence) !== evidence.evidenceSha256 || sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 || sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v492EvidenceSha256 !== previousEvidence.evidenceSha256 || evidence.dependency.v492PointerSha256 !== previousPointer.pointerSha256 || evidence.dependency.v493ArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 || pointer.evidence.fileSha256 !== fileSha(evidencePath) || fileSha(svgPath) !== artifact.vectorDiagnostic.fileSha256
) throw new Error("v493-canonical-chain");

const svg = text(svgPath);
if (
  artifact.edgeLeverages.length !== 6 || artifact.edgeLeverages.some((edge) => edge.leverageScore !== 0.5 || edge.bridge !== false) || artifact.audit.leverageSum !== 3 ||
  artifact.deletionCases.length !== 6 || artifact.deletionCases.some((entry) => JSON.stringify(entry.eigenvalues) !== JSON.stringify([0, 2, 4, 4]) || entry.numericalEigenvalues.length !== 4 || entry.eigenvalueResidual > 5e-15 || Math.abs(entry.nonzeroConditionNumber - 2) > 1e-15 || entry.connected !== true || entry.laplacianRank !== 3 || entry.gaugeNullity !== 1 || entry.nodeResidual > 1e-15 || entry.retainedEdgeResidual > 1e-15 || entry.removedEdgePredictionResidual > 1e-15 || entry.penroseResidual > 1e-15) ||
  artifact.audit.maximumDeletionEigenvalueResidual > 5e-15 || artifact.contract.statisticalJackknifeAuthorityGranted !== false || artifact.contract.noiseRobustnessAuthorityGranted !== false || artifact.contract.rssAllowed !== false || artifact.audit.summaryMatrixElementCount !== 0 || artifact.audit.sciencePixelRows !== 0 ||
  artifact.boundary.statisticalJackknifeAuthorityGranted !== false || artifact.boundary.noiseRobustnessAuthorityGranted !== false || artifact.boundary.scienceRasterAuthorityGranted !== false || artifact.boundary.browserQualification !== "not-run" ||
  !svg.includes("Six deletions, one connected truth") || svg.includes("<script") || /(?:href|src)=["'](?:https?:|data:|javascript:)/i.test(svg)
) throw new Error("v493-science-boundary");

const component = text("app/components/KerrRedshiftEdgeRedundancyV493.tsx");
const client = text("app/lib/kerrRedshiftEdgeRedundancyClientV493.ts");
const route = text("app/api/atlas/relativity-evidence/v493/redshift-edge-redundancy/route.ts");
const page = text("app/local-shadow-v493/page.tsx");
if (!component.includes("Load edge redundancy audit") || component.includes("useEffect") || component.includes("Math.random") || component.includes("<canvas") || !client.includes("requestCount: 0") || !client.includes("if (requestPromise) return requestPromise") || !route.includes('delivery !== "local-shadow"') || !route.includes("Content-Security-Policy") || !page.includes('NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"')) throw new Error("v493-runtime-boundary");

if (dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84 || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false) throw new Error("v493-continuity-boundary");
for (const entry of evidence.sourceManifest) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v493-source-manifest:${entry.path}`);
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v493-source-manifest-canonical");

console.log(JSON.stringify({ status: "passed-v493-low-memory-k4-edge-deletion-redundancy", artifactSha256: artifact.artifactSha256, payloadSha256: artifact.payloadSha256, svgSha256: artifact.vectorDiagnostic.fileSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, deletionCases: 6, edgeLeverage: 0.5, leverageSum: 3, maximumDeletionEigenvalueResidual: artifact.audit.maximumDeletionEigenvalueResidual, maximumRemovedEdgePredictionResidual: artifact.audit.maximumRemovedEdgePredictionResidual, statisticalJackknife: "blocked-not-claimed", sciencePixels: 0, browserQualification: "not-run", denseCampaign: "0/49", formalProductPointer: "v263" }, null, 2));
