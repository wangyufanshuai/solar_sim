import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v330Evidence: "dist/science/orbit-atlas-shadow-v330-evidence.json",
  v330Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v330.json",
  provenance: "dist/science/kerr-science-photon-provenance-v331/provenance-reference.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v331-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v331.json",
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

const v330Evidence = read(paths.v330Evidence);
const v330Pointer = read(paths.v330Pointer);
const artifact = read(paths.provenance);
const provenance = artifact.provenance ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const componentSource = text("app/components/KerrSciencePhotonBandsV328.tsx");
const provenanceSource = text("app/lib/kerrSciencePhotonProvenanceV331.ts");
if (v330Evidence.status !== "science-workbench-v325-v329-evidence-wired-browser-pending-dense-incomplete-0-of-49"
  || v330Pointer.capabilities?.v330WorkbenchAdapter !== "five-versioned-capability-rows"
  || artifact.version !== "v331-kerr-science-photon-provenance-artifact-v1" || !/^[a-f0-9]{64}$/.test(artifact.artifactSha256 ?? "")
  || provenance.version !== "v331-kerr-science-photon-observable-provenance-v1"
  || provenance.counts?.rayCount !== 4 || provenance.counts?.bandMeasurementCount !== 12
  || !Array.isArray(provenance.rows) || provenance.rows.length !== 12
  || provenance.source?.denseAggregateSha256 !== null
  || provenance.units?.photonRadiance !== "photons s^-1 m^-2 sr^-1"
  || provenance.integration !== "fixed-simpson-512-with-256-componentwise-audit"
  || provenance.detectorAssumption !== "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time"
  || provenance.interpretation !== "detector-independent-radiance-not-photon-count-rate"
  || provenance.boundary !== "read-only-derived-twelve-row-photon-provenance-no-raw-ray-buffer-no-screenshot-no-path-host-pid"
  || !/^[a-f0-9]{64}$/.test(provenance.canonicalSha256 ?? "")
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || !componentSource.includes("getKerrSciencePhotonProvenanceV331") || !componentSource.includes("acquireAtlasResource(\"object-url\"") || !componentSource.includes("URL.revokeObjectURL(url)")
  || !componentSource.includes("12-row sanitized photon provenance") || /鈥|宦|谓|螖/.test(componentSource)
  || !provenanceSource.includes("WeakMap") || !provenanceSource.includes("containsForbiddenKey")) throw new Error("v331 dependency, provenance, UTF-8 or lifecycle boundary mismatch");

const sourcePaths = [
  "scripts/build-kerr-science-photon-provenance-v331.ts",
  "scripts/build-shadow-candidate-v331.mjs",
  "scripts/verify-shadow-v331-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrSciencePhotonProvenanceV331.ts",
  "app/lib/kerrSciencePhotonProvenanceV331.test.ts",
  "app/lib/kerrSciencePhotonProvenanceV331.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV331.ts",
  "app/lib/atlasShadowCapabilityPointerV331.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v331-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "photon-provenance-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v330EvidenceSha256: v330Evidence.evidenceSha256,
    v330PointerSha256: v330Pointer.pointerSha256,
    photonProvenanceArtifactSha256: artifact.artifactSha256,
    photonProvenanceCanonicalSha256: provenance.canonicalSha256,
    photonArtifactSha256: provenance.source.photonArtifactSha256,
    fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null,
  },
  provenance: {
    jsonExport: true,
    csvExport: true,
    rayCount: provenance.counts.rayCount,
    bandMeasurementCount: provenance.counts.bandMeasurementCount,
    unit: provenance.units.photonRadiance,
    integration: provenance.integration,
    detectorAssumption: provenance.detectorAssumption,
    interpretation: provenance.interpretation,
    noRawRayBuffer: true,
    noScreenshot: true,
    noAbsolutePath: true,
    noHost: true,
    noPid: true,
    noDetectorThroughputAreaExposure: true,
  },
  runtime: {
    scienceIntentOnly: true,
    cinematicHidden: true,
    onDemandDerivation: true,
    weakSingleFlight: true,
    extraReactState: false,
    objectUrlTracked: true,
    idempotentObjectUrlRelease: true,
    utf8LabelsCorrected: true,
    browserQualification: "not-run",
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "sanitized-photon-provenance-runtime-export-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v331",
  generatedAt: new Date().toISOString(),
  status: "photon-provenance-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v330WorkbenchAdapter: "five-versioned-capability-rows",
    v331PhotonProvenance: "json-csv-sanitized-twelve-detector-independent-rows",
    v331PhotonExportLifecycle: "on-demand-weak-single-flight-object-url-tracked-idempotent",
    v331ScienceBoundary: "no-detector-throughput-area-exposure-no-raw-ray-buffer-host-path-pid",
    v331BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: evidence.provenance.bandMeasurementCount, provenanceSha256: evidence.dependency.photonProvenanceCanonicalSha256, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
