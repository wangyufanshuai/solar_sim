import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v441-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v441.json",
  artifact: "dist/science/kerr-detector-projection-admission-v442/detector-projection-admission.json",
  contract: "dist/science/kerr-detector-projection-admission-v442/admission-contract.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v442-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v442.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const contract = read(paths.contract);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousEvidence.version !== "orbit-atlas-shadow-v441-evidence-v1" || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v441" || artifact.version !== "v442-kerr-detector-projection-admission-v1" || artifact.status !== "blocked-detector-projection-inputs-unavailable" || artifact.counts?.gateCount !== 11 || artifact.counts.qualified !== 1 || artifact.counts.partial !== 1 || artifact.counts.missing !== 6 || artifact.counts.blocked !== 3 || artifact.wcs?.authority !== "qualified-linear-wcs" || artifact.wcs.coordinateRows !== 24 || artifact.projection?.detectorProjectionAvailable !== false || artifact.qualification?.measuredAuthorityGranted !== false || artifact.qualification.runtimeGeometryPublished !== false || contract.status !== "detector-projection-admission-fail-closed" || contract.runtimeProjectionAllowed !== false || contract.scienceRasterAllowed !== false || contract.cinematicScienceWritebackAllowed !== false || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v442-boundary");
const sourcePaths = ["app/lib/kerrDetectorProjectionAdmissionV442.ts", "app/lib/kerrDetectorProjectionAdmissionServerV442.ts", "app/lib/kerrDetectorProjectionAdmissionClientV442.ts", "app/api/atlas/relativity-evidence/v442/detector-projection-admission/route.ts", "app/components/KerrDetectorProjectionAdmissionV442.tsx", "app/local-shadow-v442/page.tsx", "scripts/build-kerr-detector-projection-admission-v442.ts", "scripts/build-kerr-detector-projection-admission-chain-v442.mjs", "scripts/build-shadow-candidate-v442.mjs", "scripts/verify-shadow-v442-light.mjs", "scripts/atlas.mjs"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "blocked-detector-projection-v442-admission-inputs-unavailable-browser-pending-dense-incomplete-0-of-49";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v442-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: { v441EvidenceSha256: previousEvidence.evidenceSha256, v441PointerSha256: previousPointer.pointerSha256, v441EvidenceFileSha256: fileSha(paths.previousEvidence), v441PointerFileSha256: fileSha(paths.previousPointer), v442ArtifactSha256: artifact.artifactSha256, v442ArtifactFileSha256: fileSha(paths.artifact), v442ContractFileSha256: fileSha(paths.contract) },
  detectorProjectionAdmission: { status: artifact.status, gateCounts: artifact.counts, gates: artifact.gates, missingFiles: artifact.inputs.missingFiles, partialSources: artifact.inputs.partialSources, wcs: artifact.wcs, projection: artifact.projection, qualification: artifact.qualification, networkAttempted: artifact.networkAttempted, attemptConsumed: artifact.attemptConsumed, automaticRetryApplied: artifact.automaticRetryApplied },
  runtimeIntegration: { evidenceObservatory: true, component: "KerrDetectorProjectionAdmissionV442", summaryOnlyInReactState: true, fullGateDetailsBounded: true, canvasCreated: false, detectorProjectionRequested: false, scienceRasterRequested: false, sciencePayloadMutation: false, cinematicScienceWriteback: false, localShadowManualOnly: true },
  denseCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable },
  qualification: { v441LinearWcs: "qualified", v442DetectorProjectionAdmission: "blocked-inputs-unavailable", measuredGeometry: "unavailable", distortionCalibration: "unavailable", psfCalibration: "unavailable", pixelResponseCalibration: "unavailable", independentValidation: "blocked", authorityAdmission: "blocked", runtimePublication: "blocked", browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "v442-coordinate-authority-does-not-enable-detector-projection-without-measured-geometry-distortion-psf-response-and-independent-admission",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v442", generatedAt: "2026-07-30T00:00:00Z", status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v441: "qualified-linear-wcs-coordinate-authority-detector-projection-blocked", v442DetectorProjectionAdmission: "blocked-inputs-unavailable", v442QualifiedGates: 1, v442PartialGates: 1, v442MissingGates: 6, v442BlockedGates: 3, v442RuntimeProjection: "blocked", v442ScienceRaster: "blocked", v442BrowserQualification: "not-run", v314DenseCampaign: "incomplete-0-of-49", denseAggregate: "unavailable" }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, gateCounts: artifact.counts, denseCampaign: state.status }, null, 2));
