import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v332Evidence: "dist/science/orbit-atlas-shadow-v332-evidence.json",
  v332Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v332.json",
  audit: "dist/science/kerr-science-observatory-v333/visual-audit.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v333-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v333.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "auditSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
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

const v332Evidence = read(paths.v332Evidence);
const v332Pointer = read(paths.v332Pointer);
const audit = read(paths.audit);
const state = read(paths.state);
const formal = read(paths.formal);
const checks = audit.checks ?? {};
if (v332Evidence.status !== "instrument-response-boundary-wired-browser-pending-dense-incomplete-0-of-49"
  || v332Pointer.capabilities?.v332InstrumentResponse !== "explicit-area-solid-angle-exposure-throughput-synthetic-fixture"
  || audit.version !== "v333-kerr-science-observatory-visual-audit-v1" || audit.status !== "qualified-static-precision-console-browser-pending"
  || !/^[a-f0-9]{64}$/.test(audit.auditSha256 ?? "") || Object.values(checks).some((value) => value !== true)
  || audit.visualDirection !== "deep-space-precision-instrument" || audit.scienceBoundary !== "telemetry-only-linear-no-grade-no-science-mutation"
  || audit.cinematicBoundary !== "presentation-copy-disjoint" || audit.denseBoundary !== "incomplete-0-of-49-aggregate-unavailable"
  || audit.spectralRail?.join(",") !== "visible,euv,soft-x-ray" || audit.browserQualification !== "not-run"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) throw new Error("v333 visual audit or release boundary mismatch");

const sourcePaths = [
  "scripts/build-kerr-science-observatory-visual-audit-v333.mjs",
  "scripts/build-shadow-candidate-v333.mjs",
  "scripts/verify-shadow-v333-light.mjs",
  "scripts/atlas.mjs",
  "app/components/KerrScienceObservatoryHeaderV333.tsx",
  "app/components/KerrScienceObservatoryHeaderV333.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV333.ts",
  "app/lib/atlasShadowCapabilityPointerV333.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v333-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "science-observatory-visual-v333-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: { v332EvidenceSha256: v332Evidence.evidenceSha256, v332PointerSha256: v332Pointer.pointerSha256, visualAuditSha256: audit.auditSha256, fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null },
  visual: {
    direction: audit.visualDirection,
    singleHeaderRuntimeConsumer: checks.singleHeaderRuntimeConsumer,
    spectralRail: audit.spectralRail,
    authorityBoundaryVisible: checks.authorityBoundaryVisible,
    denseBoundaryVisible: checks.denseBoundaryVisible,
    accessibilitySignals: checks.accessibilitySignals,
    unicodeSemanticsComplete: checks.unicodeSemanticsComplete,
    noMojibake: checks.noMojibake,
  },
  runtime: {
    telemetryOnly: true,
    scienceDisplay: "linear-no-grade",
    cinematicPresentationCopyDisjoint: true,
    noCanvas: checks.noCanvas,
    noNetwork: checks.noNetwork,
    noRandomness: checks.noRandomness,
    noPhysicsMutationSurface: checks.noPhysicsMutationSurface,
    localShadowManualAbOnly: true,
    browserQualification: "not-run",
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "precision-science-observatory-visual-runtime-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v333",
  generatedAt: new Date().toISOString(),
  status: "science-observatory-visual-v333-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v332InstrumentResponse: "explicit-area-solid-angle-exposure-throughput-synthetic-fixture",
    v333VisualDirection: "deep-space-precision-instrument",
    v333ScienceHud: "single-runtime-header-three-band-rail-authority-boundaries",
    v333Utf8Audit: "semantic-codepoints-qualified-no-mojibake",
    v333ScienceCinematicBoundary: "telemetry-only-linear-no-grade-presentation-copy-disjoint",
    v333BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, visualDirection: evidence.visual.direction, checks: Object.keys(checks).length, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
