import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v477-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v477.json",
  chart: "dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json",
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  v477: "dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v478-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v478.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256", "payloadSha256", "rowSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = target + "." + process.pid + ".part"; writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8"); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const chart = read(paths.chart);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v477-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v477" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  chart.version !== "v478-kerr-normalized-frequency-chart-artifact-v1" ||
  chart.status !== "normalized-frequency-chart-qualified-physical-bandpass-unavailable-browser-pending" ||
  canonicalSha(chart) !== chart.artifactSha256 ||
  canonicalSha(chart.rows) !== chart.payloadSha256 ||
  chart.rows.length !== 4 ||
  chart.rows.some((row) => canonicalSha(row) !== row.rowSha256 || row.samples.length !== 5) ||
  chart.audit.sampleCount !== 20 ||
  chart.audit.monotonicRowCount !== 4 ||
  chart.audit.maximumDirectOracleRelativeDifference >= 1e-12 ||
  chart.audit.maximumInverseRoundTripRelativeResidual >= 1e-12 ||
  chart.audit.absoluteFrequencyRowCount !== 0 ||
  chart.audit.physicalBandpassRowCount !== 0 ||
  chart.audit.bandIntegratedRadianceRowCount !== 0 ||
  chart.audit.sciencePixelRows !== 0 ||
  chart.applicability.absoluteFrequencyCoordinateQualified !== false ||
  chart.applicability.physicalBandpassQualified !== false ||
  chart.applicability.scienceRasterAllowed !== false ||
  chart.lifecycle.allResourcesAtBaseline !== true ||
  dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v478-evidence-boundary");

const sourcePaths = [paths.chart, paths.previousEvidence, paths.previousPointer, paths.v466, paths.v473, paths.v476, paths.v477, paths.dense, "app/lib/kerrNormalizedFrequencyChartV478.ts", "app/lib/kerrNormalizedFrequencyServerV478.ts", "app/lib/kerrNormalizedFrequencyClientV478.ts", "app/components/KerrNormalizedFrequencyChartV478.tsx", "app/api/atlas/relativity-evidence/v478/normalized-frequency-chart/route.ts", "app/local-shadow-v478/page.tsx", "scripts/build-kerr-normalized-frequency-chart-v478.ts", "scripts/build-shadow-candidate-v478.mjs", "scripts/verify-shadow-v478-light.mjs"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v478-normalized-frequency-chart-qualified-physical-bandpass-unavailable-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v478-evidence-v1", generatedAt: "2026-07-30T00:00:00Z", status,
  dependency: { v477EvidenceSha256: previousEvidence.evidenceSha256, v477EvidenceFileSha256: fileSha(paths.previousEvidence), v477PointerSha256: previousPointer.pointerSha256, v477PointerFileSha256: fileSha(paths.previousPointer), v478ArtifactSha256: chart.artifactSha256, v478PayloadSha256: chart.payloadSha256, v478ArtifactFileSha256: fileSha(paths.chart), v314StateSha256: dense.stateSha256 },
  coordinateChart: { rowCount: 4, anchorCountPerRow: 5, sampleCount: 20, normalizedFrequencyAnchors: chart.contract.normalizedFrequencyAnchors, mapping: chart.contract.mapping, inverseMapping: chart.contract.inverseMapping, blueshiftRowCount: 1, redshiftRowCount: 3, monotonicRowCount: 4, directLogOracle: "qualified", inverseRoundTrip: "qualified", uncertaintyPropagation: "qualified-short-budget" },
  physicalApplicability: { normalizedFrequencyRows: 4, absoluteFrequencyRows: 0, physicalBandpassRows: 0, detectorThroughputRows: 0, bandIntegratedRadianceRows: 0, sciencePixelRows: 0, unavailableIsNotZero: true },
  audit: chart.audit, applicability: chart.applicability,
  lifecycle: { ...chart.lifecycle, canvasCreatedByV478: false, sceneRevisionMutationAllowed: false }, boundary: chart.boundary,
  runtimeIntegration: { localShadowEntry: "app/local-shadow-v478/page.tsx", component: "KerrNormalizedFrequencyChartV478", endpoint: "/api/atlas/relativity-evidence/v478/normalized-frequency-chart", downloadQuery: "download=frequency-chart", maximumResponseBytes: 128 * 1024, serverFingerprint: "path+mtime+size+sha256", clientSingleFlight: true, clientNoStore: true, liteOrOrdinaryStandaloneVisible: false },
  qualification: { normalizedFrequencyChart: "qualified-20-samples", directMultiplyLogExpOracle: "qualified", inverseFrequencyMapping: "qualified", monotonicity: "qualified-4-rays", uncertaintyPropagation: "qualified-short-budget", absoluteFrequency: "blocked-no-reference-frequency", physicalBandpass: "blocked-no-instrument-authority", bandIntegratedRadiance: "blocked", detectorProjection: "blocked", scienceRaster: "blocked", browser: "not-run", visualMatrix: "not-run", soak: "not-run", rtxWebGpu: "not-run" },
  denseCampaign: { namespace: "v314", status: dense.status, completedShardCount: dense.completedShardCount, plannedShardCount: dense.plannedShardCount, attemptConsumed: dense.attemptConsumed, runNextAuthorized: dense.runNextAuthorized, aggregateAvailable: dense.aggregateAvailable },
  sourceManifest, sourceSha256: canonicalSha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundaryStatement: "v478-four-ray-twenty-sample-normalized-frequency-coordinate-only-no-absolute-frequency-physical-bandpass-throughput-radiance-detector-pixels-images-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) }; atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v478", generatedAt: "2026-07-30T00:00:00Z", status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v477PhotonTransfer: "qualified-4-rays", v478NormalizedFrequencyChart: "qualified-20-samples", v478Monotonicity: "qualified-4-rays", v478InverseMapping: "qualified", v478UncertaintyPropagation: "qualified-short-budget", v478AbsoluteFrequencyRows: 0, v478PhysicalBandpassRows: 0, v478BandIntegratedRadianceRows: 0, v478DetectorProjectedRows: 0, v478SciencePixelRows: 0, v478BrowserQualification: "not-run", v478VisualMatrixQualification: "not-run", v478SoakQualification: "not-run", v478RtxWebGpuQualification: "not-run", v314DenseCampaign: "incomplete-0-of-49" },
  promotion: { promotionAllowed: false, sciencePayloadAllowed: false, fitsWriteAllowed: false, pngWriteAllowed: false, localShadowDefaultApplied: false }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) }; atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, artifactSha256: chart.artifactSha256, payloadSha256: chart.payloadSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: 4, samples: 20, absoluteFrequencyRows: 0, physicalBandpassRows: 0, bandIntegratedRadianceRows: 0, sciencePixels: 0, denseCampaign: "0/49", browserQualification: "not-run", formalProductPointer: "v263" }, null, 2));
