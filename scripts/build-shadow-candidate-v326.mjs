import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v325Evidence: "dist/science/orbit-atlas-shadow-v325-evidence.json",
  v325Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v325.json",
  provenance: "dist/science/kerr-science-band-uncertainty-v326/provenance-reference.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v326-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v326.json",
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

const v325Evidence = read(paths.v325Evidence);
const v325Pointer = read(paths.v325Pointer);
const artifact = read(paths.provenance);
const provenance = artifact.provenance ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const componentSource = text("app/components/KerrScienceBandUncertaintyV325.tsx");
const provenanceSource = text("app/lib/kerrScienceBandUncertaintyProvenanceV326.ts");
if (v325Evidence.status !== "componentwise-uncertainty-wired-browser-pending-dense-incomplete-0-of-49"
  || v325Pointer.capabilities?.v325ScienceUncertainty !== "four-rays-twelve-bands-linear-sum-no-rss"
  || artifact.artifactSha256 !== "a342616303cac0acce8a87ae8803fe06ea21780c2a41ef5ea19521952a3f057d"
  || provenance.version !== "v326-kerr-science-band-uncertainty-provenance-v1"
  || provenance.counts?.rayCount !== 4 || provenance.counts?.bandMeasurementCount !== 12
  || !Array.isArray(provenance.rows) || provenance.rows.length !== 12
  || provenance.source?.denseAggregateSha256 !== null
  || provenance.combinationPolicy !== "linear-sum-without-independence-claim-no-rss"
  || provenance.boundary !== "read-only-derived-twelve-row-provenance-no-raw-ray-buffer-no-screenshot-no-path-or-host"
  || !/^[a-f0-9]{64}$/.test(provenance.canonicalSha256 ?? "")
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || !componentSource.includes("acquireAtlasResource(\"object-url\"")
  || !componentSource.includes("URL.revokeObjectURL(url)")
  || !componentSource.includes("12-row sanitized provenance")
  || !provenanceSource.includes("containsForbiddenKey")) throw new Error("v326 dependency, provenance or lifecycle boundary mismatch");

const sourcePaths = [
  "scripts/build-kerr-science-uncertainty-provenance-v326.ts",
  "scripts/build-shadow-candidate-v326.mjs",
  "scripts/verify-shadow-v326-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.ts",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.test.ts",
  "app/lib/kerrScienceBandUncertaintyProvenanceV326.generated.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/lib/atlasShadowCapabilityPointerV326.ts",
  "app/lib/atlasShadowCapabilityPointerV326.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v326-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "uncertainty-provenance-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v325EvidenceSha256: v325Evidence.evidenceSha256,
    v325PointerSha256: v325Pointer.pointerSha256,
    provenanceArtifactSha256: artifact.artifactSha256,
    provenanceCanonicalSha256: provenance.canonicalSha256,
    fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null,
  },
  provenance: {
    jsonExport: true,
    csvExport: true,
    rayCount: provenance.counts.rayCount,
    bandMeasurementCount: provenance.counts.bandMeasurementCount,
    noRawRayBuffer: true,
    noScreenshot: true,
    noAbsolutePath: true,
    noHost: true,
    noPid: true,
    combinationPolicy: provenance.combinationPolicy,
    interpretation: provenance.interpretation,
  },
  runtime: {
    scienceIntentOnly: true,
    cinematicHidden: true,
    objectUrlTracked: true,
    idempotentObjectUrlRelease: true,
    browserQualification: "not-run",
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
    stateSha256: state.stateSha256,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "sanitized-uncertainty-provenance-runtime-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v326",
  generatedAt: new Date().toISOString(),
  status: "uncertainty-provenance-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v325ScienceUncertainty: "four-rays-twelve-bands-linear-sum-no-rss",
    v326UncertaintyProvenance: "json-csv-sanitized-twelve-derived-rows",
    v326ObjectUrlLifecycle: "tracked-idempotent",
    v326ScienceBoundary: "no-raw-ray-buffer-no-screenshot-no-path-or-host",
    v326BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: evidence.provenance.bandMeasurementCount, provenanceSha256: evidence.dependency.provenanceCanonicalSha256, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
