import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const out = "dist/science/kerr-detector-electron-expectation-v445";
const transient = new Set(["generatedAt", "artifactSha256"]);
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const fileSha = (path: string): string => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
// These upstream artifacts are intentionally consumed as open JSON at the evidence boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const read = (path: string): any => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const atomic = (path: string, value: unknown): void => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };

const paths = {
  v444: "dist/science/kerr-photon-response-envelope-v444/photon-response-envelope.json",
  v361: "dist/science/detector-calibration-v361/inspect.json",
  v365: "dist/science/detector-calibration-v365/inspect.json",
  v366: "dist/science/detector-calibration-v366/inspect.json",
  v367: "dist/science/detector-calibration-v367/inspect.json",
  v368: "dist/science/detector-response-v368/inspect.json",
  v442: "dist/science/kerr-detector-projection-admission-v442/detector-projection-admission.json",
  v443: "dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
};
const source = Object.fromEntries(Object.entries(paths).map(([id, path]) => [id, read(path)]));
const formalEvidence = read(source.formal.source);
if (source.v444.version !== "v444-kerr-photon-response-envelope-v1" || source.v444.status !== "computational-photon-response-envelope-qualified-scientific-systematics-unavailable" || source.v444.rows?.length !== 4 || source.v444.qualification?.photonObservableQualified !== true || source.v444.qualification?.detectorElectronExpectationAvailable !== false || source.v444.qualification?.observedCountsAvailable !== false || source.v444.qualification?.scienceImageAvailable !== false || source.v361.status !== "blocked-measured-calibration-input-unavailable" || source.v365.status !== "blocked-measured-acquisition-files-unavailable" || source.v366.status !== "blocked-validation-inputs-unavailable" || source.v367.status !== "blocked-admission-inputs-unavailable" || source.v368.status !== "unavailable-v367-authority-artifacts-missing" || source.v442.projection?.detectorProjectionAvailable !== false || source.v442.qualification?.measuredAuthorityGranted !== false || source.v443.status !== "blocked-staging-directory-missing" || source.v443.readyFileCount !== 0 || source.v443.measuredAuthorityGranted !== false || source.state.status !== "incomplete-0-of-49" || source.state.completedShardCount !== 0 || source.state.attemptConsumed !== false || source.state.aggregateAvailable !== false || source.formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v445-source-boundary");

const sourceManifest = Object.entries(paths).filter(([id]) => id !== "formal" && id !== "state").map(([id, path]) => ({ id: `v${id}`, path, fileSha256: fileSha(path), artifactSha256: typeof source[id]?.artifactSha256 === "string" ? source[id].artifactSha256 : null }));
const gates = [
  { id: "collecting-area", status: "blocked", reason: "instrument identity and collecting-area calibration are absent from v443 staging", sourceArtifactSha256: source.v443.artifactSha256 },
  { id: "pixel-solid-angle", status: "blocked", reason: "plate scale and admitted detector geometry are absent; WCS alone is insufficient", sourceArtifactSha256: source.v443.artifactSha256 },
  { id: "exposure", status: "missing", reason: "no exposure-time contract is present in the admitted calibration chain", sourceArtifactSha256: source.v365.artifactSha256 },
  { id: "gain", status: "blocked", reason: "gain is not available from v367 authority or v443 pixel-response input", sourceArtifactSha256: source.v367.artifactSha256 },
  { id: "read-noise", status: "blocked", reason: "read-noise measurement stack is absent from v365/v367", sourceArtifactSha256: source.v367.artifactSha256 },
  { id: "dark-current", status: "blocked", reason: "dark-current temperature/time sweep is absent from v365/v367", sourceArtifactSha256: source.v367.artifactSha256 },
  { id: "background", status: "missing", reason: "blank-field background series is not admitted; no background value is synthesized", sourceArtifactSha256: source.v361.artifactSha256 },
] as const;
const rows = source.v444.rows.map((row: { rayIndex: 12 | 13 | 14 | 15; spinA: number; throughputWeightedPhotonRadiancePerSM2Sr: number }) => ({ rayIndex: row.rayIndex, spinA: row.spinA, throughputWeightedPhotonRadiancePerSM2Sr: row.throughputWeightedPhotonRadiancePerSM2Sr, detectorElectronExpectationApplicable: false, computationalElectronExpectationPerPixel: null, computationalExpectationStatus: "blocked", observedCount: null, observedCountStatus: "unavailable", scienceImagePixel: null, scienceImageStatus: "blocked" }));
const contractUnsigned = { version: "v445-kerr-detector-electron-expectation-preflight-contract-v1", requiredInputs: ["collecting-area", "pixel-solid-angle", "exposure", "gain", "read-noise", "dark-current", "background"], sourcePhotonUnit: "throughput-weighted-photon-radiance-per-square-metre-per-steradian", computationBoundary: "electron expectation requires area * pixel solid angle * exposure * calibrated throughput/gain plus explicit background and noise model", nullPolicy: "missing prerequisites remain null; no placeholder electron values", authorityBoundary: { computationalElectronExpectation: false, detectorCalibrationAuthority: false, observedCounts: false, scienceImage: false, scienceRaster: false, cinematicScienceWriteback: false }, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49", networkAttempted: false, automaticRetryApplied: false };
const contract = { ...contractUnsigned, contractSha256: sha(contractUnsigned) };
const unsigned = {
  version: "v445-kerr-detector-electron-expectation-preflight-inspect-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: "blocked-detector-calibration-unavailable",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  gates,
  rows,
  counts: { photonResponseRows: 4, computationalElectronExpectationRows: 0, observedCountRows: 0, scienceImageRows: 0 },
  qualification: { photonResponseEnvelopeQualified: true, computationalElectronExpectationAvailable: false, detectorCalibrationAuthority: false, observedCountsAvailable: false, scienceImageAvailable: false, scienceRasterAllowed: false, measuredAuthorityGranted: false, runtimePackagingAllowed: false, sciencePayloadMutationAllowed: false, cinematicScienceWritebackForbidden: true, browserQualification: "not-run", denseAuthority: false },
  boundary: { computationalExpectation: "blocked-calibration-inputs", detectorCalibrationAuthority: "unavailable", observedCounts: "unavailable", scienceImage: "blocked", scienceRaster: "blocked", cinematicScienceWriteback: "forbidden" },
  networkAttempted: false,
  automaticRetryApplied: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  contract,
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(`${out}/preflight-contract.json`, contract);
atomic(`${out}/electron-expectation-preflight.json`, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, sourceSha256: artifact.sourceSha256, gateCount: gates.length, blockedGates: gates.filter((gate) => gate.status === "blocked").map((gate) => gate.id), missingGates: gates.filter((gate) => gate.status === "missing").map((gate) => gate.id), photonRows: 4, computationalElectronRows: 0, observedCountRows: 0, scienceImageRows: 0, denseCampaign: source.state.status }, null, 2));
