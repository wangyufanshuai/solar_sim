import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v324Evidence: "dist/science/orbit-atlas-shadow-v324-evidence.json",
  v324Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v324.json",
  uncertainty: "dist/science/kerr-science-band-uncertainty-v325/componentwise-envelope.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v325-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v325.json",
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

const v324Evidence = read(paths.v324Evidence);
const v324Pointer = read(paths.v324Pointer);
const artifact = read(paths.uncertainty);
const view = artifact.view ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const hudSource = text("app/components/KerrScienceBandHudV322.tsx");
const componentSource = text("app/components/KerrScienceBandUncertaintyV325.tsx");
if (v324Evidence.status !== "science-profile-equivalent-browser-pending-dense-incomplete-0-of-49"
  || v324Pointer.capabilities?.v324ScienceProfileAB !== "science-equivalent-cinematic-distinct"
  || artifact.artifactSha256 !== "b48bb7fe1f71b5cf6735a0bba4062acd5acedc1e5aad509be3e227415ec90bcb"
  || view.status !== "qualified-componentwise-audit-envelope"
  || view.counts?.applicableDiskRayCount !== 4 || view.counts?.bandMeasurementCount !== 12 || view.counts?.unavailableRayCount !== 12
  || view.maxima?.conservativeLinearRelativeEnvelope >= 5e-6
  || view.combinationPolicy !== "linear-sum-without-independence-claim-no-rss"
  || view.interpretation !== "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval"
  || view.source?.denseAggregateSha256 !== null
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || !hudSource.includes("KerrScienceBandUncertaintyV325")
  || !componentSource.includes("mode !== \"science\"") || !componentSource.includes("not a statistical CI") || componentSource.includes("Math.random")) {
  throw new Error("v325 dependency, uncertainty or runtime boundary mismatch");
}

const sourcePaths = [
  "scripts/build-kerr-science-band-uncertainty-v325.ts",
  "scripts/build-shadow-candidate-v325.mjs",
  "scripts/verify-shadow-v325-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandUncertaintyV325.ts",
  "app/lib/kerrScienceBandUncertaintyV325.test.ts",
  "app/lib/kerrScienceBandUncertaintyV325.generated.test.ts",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceBandUncertaintyV325.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV325.ts",
  "app/lib/atlasShadowCapabilityPointerV325.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v325-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "componentwise-uncertainty-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v324EvidenceSha256: v324Evidence.evidenceSha256,
    v324PointerSha256: v324Pointer.pointerSha256,
    uncertaintyArtifactSha256: artifact.artifactSha256,
    fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null,
  },
  science: {
    applicableDiskRayCount: view.counts.applicableDiskRayCount,
    bandMeasurementCount: view.counts.bandMeasurementCount,
    unavailableRayCount: view.counts.unavailableRayCount,
    maxima: view.maxima,
    combinationPolicy: view.combinationPolicy,
    interpretation: view.interpretation,
    sourceBandArtifactSha256: view.source.bandArtifactSha256,
    denseAggregateAccepted: false,
  },
  runtime: {
    hudWired: true,
    scienceIntentOnly: true,
    cinematicHidden: true,
    boundedArtifactClient: "v321-fixed-band-shared-reference-counted-cache",
    largeRayArraysInReactState: false,
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
  boundary: "componentwise-audit-envelope-runtime-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v325",
  generatedAt: new Date().toISOString(),
  status: "componentwise-uncertainty-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v324ScienceProfileAB: "science-equivalent-cinematic-distinct",
    v325ScienceUncertainty: "four-rays-twelve-bands-linear-sum-no-rss",
    v325Interpretation: "deterministic-audit-envelope-not-statistical-confidence-interval",
    v325RuntimeBoundary: "science-intent-only-cinematic-hidden",
    v325BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, bandMeasurementCount: evidence.science.bandMeasurementCount, maximumRelativeEnvelope: evidence.science.maxima.conservativeLinearRelativeEnvelope, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
