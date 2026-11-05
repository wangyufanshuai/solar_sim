import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v331Evidence: "dist/science/orbit-atlas-shadow-v331-evidence.json",
  v331Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v331.json",
  response: "dist/science/kerr-science-instrument-response-v332/response-reference.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v332-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v332.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const v331Evidence = read(paths.v331Evidence);
const v331Pointer = read(paths.v331Pointer);
const artifact = read(paths.response);
const response = artifact.response ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const responseSource = text("app/lib/kerrScienceInstrumentResponseV332.ts");
const componentSource = text("app/components/KerrSciencePhotonBandsV328.tsx");
if (v331Evidence.status !== "photon-provenance-wired-browser-pending-dense-incomplete-0-of-49"
  || v331Pointer.capabilities?.v331PhotonProvenance !== "json-csv-sanitized-twelve-detector-independent-rows"
  || artifact.version !== "v332-kerr-science-instrument-response-artifact-v1" || !/^[a-f0-9]{64}$/.test(artifact.artifactSha256 ?? "")
  || response.version !== "v332-kerr-synthetic-reference-instrument-response-v1" || response.status !== "qualified-synthetic-reference-instrument-operator"
  || response.model?.modelId !== "synthetic-reference-photon-counter-v332" || response.model?.status !== "synthetic-audit-fixture-not-calibrated-observatory"
  || response.model?.stochasticNoise !== "disabled" || response.model?.collectingAreaM2 !== 0.75 || response.model?.exposureTimeS !== 120
  || response.counts?.rayCount !== 4 || response.counts?.bandMeasurementCount !== 12 || !Array.isArray(response.rows) || response.rows.length !== 12
  || response.source?.denseAggregateSha256 !== null
  || response.interpretation !== "deterministic-expectation-under-explicit-synthetic-instrument-not-measured-counts"
  || response.scienceCinematicBoundary !== "instrument-response-never-cinematic-color-input"
  || response.boundary !== "detector-independent-v331-preserved-explicit-area-solid-angle-exposure-throughput-layer"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || !responseSource.includes("explicit-area-solid-angle-exposure-throughput-layer") || !responseSource.includes("stochasticNoise: \"disabled\"")
  || !componentSource.includes("createKerrScienceInstrumentResponseV332") || !componentSource.includes("deterministic expectation only")) throw new Error("v332 response or boundary mismatch");

const sourcePaths = [
  "scripts/build-kerr-science-instrument-response-v332.ts",
  "scripts/build-shadow-candidate-v332.mjs",
  "scripts/verify-shadow-v332-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceInstrumentResponseV332.ts",
  "app/lib/kerrScienceInstrumentResponseV332.test.ts",
  "app/lib/kerrScienceInstrumentResponseV332.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV332.ts",
  "app/lib/atlasShadowCapabilityPointerV332.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v332-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "instrument-response-boundary-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v331EvidenceSha256: v331Evidence.evidenceSha256,
    v331PointerSha256: v331Pointer.pointerSha256,
    instrumentResponseArtifactSha256: artifact.artifactSha256,
    photonProvenanceCanonicalSha256: response.source?.photonProvenanceCanonicalSha256 ?? null,
    fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null,
  },
  instrument: {
    modelId: response.model.modelId,
    modelStatus: response.model.status,
    collectingAreaM2: response.model.collectingAreaM2,
    exposureTimeS: response.model.exposureTimeS,
    pixelSolidAngleSr: response.model.pixelSolidAngleSr,
    throughputBands: ["visible", "euv", "soft-x-ray"],
    stochasticNoise: response.model.stochasticNoise,
    detectorEffects: response.model.detectorEffects,
    rowCount: response.rows.length,
    maximumQuadratureRelativeDifference: response.maxima.quadratureRelativeDifference,
    noRealInstrumentCalibrationClaim: true,
  },
  scienceBoundary: {
    detectorIndependentV331Preserved: true,
    responseNeverCinematicColorInput: true,
    deterministicExpectationNotMeasuredCounts: true,
    denseAggregateAccepted: false,
    browserQualification: "not-run",
  },
  runtime: {
    scienceIntentOnly: true,
    cinematicHidden: true,
    responseDerivation: "bounded-useMemo-over-existing-v328-view-no-network-no-new-canvas",
    browserQualification: "not-run",
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "explicit-synthetic-instrument-response-science-only-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v332",
  generatedAt: new Date().toISOString(),
  status: "instrument-response-boundary-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v331PhotonProvenance: "json-csv-sanitized-twelve-detector-independent-rows",
    v332InstrumentResponse: "explicit-area-solid-angle-exposure-throughput-synthetic-fixture",
    v332NoNoiseClaim: "deterministic-expectation-no-read-noise-dark-current-dead-time-psf-pileup",
    v332ScienceBoundary: "response-never-cinematic-color-input-no-real-instrument-calibration",
    v332BrowserGate: "authored-not-run",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, modelId: response.model.modelId, rows: response.rows.length, maxQuadrature: response.maxima.quadratureRelativeDifference, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
