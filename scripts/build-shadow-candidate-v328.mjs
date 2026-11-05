import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v327Evidence: "dist/science/orbit-atlas-shadow-v327-evidence.json",
  v327Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v327.json",
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v328-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v328.json",
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

const v327Evidence = read(paths.v327Evidence);
const v327Pointer = read(paths.v327Pointer);
const artifact = read(paths.photon);
const view = artifact.view ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const hudSource = text("app/components/KerrScienceBandHudV322.tsx");
const componentSource = text("app/components/KerrSciencePhotonBandsV328.tsx");
const modelSource = text("app/lib/kerrSciencePhotonBandsV328.ts");
if (v327Evidence.status !== "science-cinematic-ab-wired-browser-pending-dense-incomplete-0-of-49"
  || v327Pointer.capabilities?.v327ScienceCinematicAB !== "four-ray-science-v5-v6-deterministic-swatches"
  || artifact.artifactSha256 !== "16a8d7ff382203a24ee4565101b8fb5580e046af99f47612269f66655bb8a91e"
  || view.status !== "qualified-fixed-band-photon-radiance"
  || view.counts?.applicableDiskRayCount !== 4 || view.counts?.bandMeasurementCount !== 12 || view.counts?.unavailableRayCount !== 12
  || view.maxima?.photonQuadratureRelativeDifference >= 2e-6
  || view.integration !== "fixed-simpson-512-with-256-componentwise-audit"
  || view.detectorAssumption !== "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time"
  || view.source?.denseAggregateSha256 !== null
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || !hudSource.includes("KerrSciencePhotonBandsV328")
  || !componentSource.includes("not detector count rate") || componentSource.includes("<canvas") || componentSource.includes("Math.random")
  || !modelSource.includes("KERR_PLANCK_CONSTANT_J_S_V328") || !modelSource.includes("observedSpectralRadiance / (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz)")) throw new Error("v328 dependency, photon or runtime boundary mismatch");

const sourcePaths = [
  "scripts/build-kerr-science-photon-bands-v328.ts",
  "scripts/build-shadow-candidate-v328.mjs",
  "scripts/verify-shadow-v328-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrSciencePhotonBandsV328.ts",
  "app/lib/kerrSciencePhotonBandsV328.test.ts",
  "app/lib/kerrSciencePhotonBandsV328.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV328.ts",
  "app/lib/atlasShadowCapabilityPointerV328.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v328-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "photon-observables-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: { v327EvidenceSha256: v327Evidence.evidenceSha256, v327PointerSha256: v327Pointer.pointerSha256, photonArtifactSha256: artifact.artifactSha256, fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null },
  science: {
    applicableDiskRayCount: view.counts.applicableDiskRayCount,
    bandMeasurementCount: view.counts.bandMeasurementCount,
    unavailableRayCount: view.counts.unavailableRayCount,
    maximumQuadratureRelativeDifference: view.maxima.photonQuadratureRelativeDifference,
    minimumPhotonRadiancePerSM2Sr: view.minima.photonRadiancePerSM2Sr,
    maximumPhotonRadiancePerSM2Sr: view.maxima.photonRadiancePerSM2Sr,
    planckConstantJS: view.constants.planckConstantJS,
    units: view.units,
    integration: view.integration,
    detectorAssumption: view.detectorAssumption,
    denseAggregateAccepted: false,
  },
  runtime: { hudWired: true, scienceIntentOnly: true, cinematicHidden: true, photonValuesUsedAsCinematicColor: false, extraCanvasCreated: false, browserQualification: "not-run" },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "detector-independent-photon-observables-runtime-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v328",
  generatedAt: new Date().toISOString(),
  status: "photon-observables-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v327ScienceCinematicAB: "four-ray-science-v5-v6-deterministic-swatches",
    v328PhotonObservables: "four-rays-twelve-fixed-band-photon-radiances",
    v328Quadrature: "fixed-simpson-512-with-256-componentwise-audit",
    v328DetectorBoundary: "per-unit-area-solid-angle-not-detector-count-rate",
    v328BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, measurements: evidence.science.bandMeasurementCount, maximumQuadrature: evidence.science.maximumQuadratureRelativeDifference, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
