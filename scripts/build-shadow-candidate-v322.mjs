import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v321Evidence: "dist/science/orbit-atlas-shadow-v321-evidence.json",
  v321Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v321.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v322-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v322.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
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

const v321Evidence = read(paths.v321Evidence);
const v321Pointer = read(paths.v321Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
if (v321Evidence.status !== "runtime-fixed-band-science-raster-static-qualified-browser-pending-dense-incomplete-0-of-49"
  || v321Pointer.capabilities?.v321ScienceRaster !== "runtime-wired-v320-fixed-band-four-rays"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) throw new Error("v322 dependency or boundary mismatch");

const hudSource = text("app/components/KerrScienceBandHudV322.tsx");
const headerSource = text("app/components/KerrScienceObservatoryHeaderV333.tsx");
const hudModelSource = text("app/lib/kerrScienceBandHudV322.ts");
const panelSource = text("app/components/KerrBlackHolePanel.tsx");
const profileSource = text("app/lib/atlasVisualProfileV299.ts");
if (!headerSource.includes("CPU float64 authority") || !headerSource.includes("deep-space-precision-instrument")
  || !hudSource.includes("data-kerr-science-band-hud-v322") || hudSource.includes("fetch(") || headerSource.includes("fetch(")
  || !hudModelSource.includes("measurement-hud-read-only-telemetry-no-science-mutation")
  || !hudModelSource.includes("mode === \"cinematic\" ? \"hidden-cinematic\"")
  || !hudModelSource.includes("fixed-physical-reference-no-data-adaptive-rescale")
  || !panelSource.includes("<KerrScienceBandHudV322 profile={resolvedVisualProfile} mode=\"science\" />")
  || !profileSource.includes("strongGravityV5") || !profileSource.includes("strongGravityV6")) throw new Error("v322 HUD/profile contract mismatch");

const sourcePaths = [
  "scripts/build-shadow-candidate-v322.mjs",
  "scripts/verify-shadow-v322-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandHudV322.ts",
  "app/lib/kerrScienceBandHudV322.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/components/KerrScienceObservatoryHeaderV333.tsx",
  "app/components/KerrScienceObservatoryHeaderV333.test.ts",
  "app/components/KerrBlackHolePanel.tsx",
  "app/lib/atlasVisualProfileV299.ts",
  "app/lib/atlasStrongGravityTelemetryV309.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV322.ts",
  "app/lib/atlasShadowCapabilityPointerV322.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v322-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "hud-runtime-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: { v321EvidenceSha256: v321Evidence.evidenceSha256, v321PointerSha256: v321Pointer.pointerSha256, fullShortAuthoritySha256: v321Evidence.dependency.fullShortAuthoritySha256 },
  runtime: {
    profileTokenSources: ["v5", "v6"],
    displayTransform: "linear-no-grade",
    diskRayCount: 4,
    bandCount: 3,
    saturationCount: 0,
    payloadUnchanged: true,
    bandViewUnchanged: true,
    cinematicBufferShared: false,
    normalization: "fixed-physical-reference-no-data-adaptive-rescale",
    hudVersion: "v322-kerr-science-band-hud-v1",
    hudBoundary: "measurement-hud-read-only-telemetry-no-science-mutation",
    browserQualification: "not-run",
  },
  display: { science: "fixed-linear-telemetry-only-no-raster-mutation", cinematic: "hud-hidden-and-separate-presentation-buffer", localShadow: "v5-v6-manual-ab-only" },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "telemetry-only-science-hud-runtime-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v322",
  generatedAt: new Date().toISOString(),
  status: "hud-runtime-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v321ScienceRaster: "runtime-wired-v320-fixed-band-four-rays",
    v322ScienceHud: "telemetry-only-fixed-band-hud-wired",
    v322ProfileConsumers: "v5-and-v6-manual-local-shadow-ab",
    v322ScienceBoundary: "linear-no-grade-read-only-no-cinematic-sharing",
    v322BrowserGate: "authored-not-run",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, profileTokenSources: evidence.runtime.profileTokenSources, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
