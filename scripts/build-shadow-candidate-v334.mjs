import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v333Evidence: "dist/science/orbit-atlas-shadow-v333-evidence.json",
  v333Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v333.json",
  audit: "dist/science/atlas-visual-runtime-matrix-v334/matrix-audit.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v334-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v334.json",
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

const v333Evidence = read(paths.v333Evidence);
const v333Pointer = read(paths.v333Pointer);
const audit = read(paths.audit);
const state = read(paths.state);
const formal = read(paths.formal);
if (v333Evidence.status !== "science-observatory-visual-v333-wired-browser-pending-dense-incomplete-0-of-49"
  || v333Pointer.capabilities?.v333VisualDirection !== "deep-space-precision-instrument"
  || audit.version !== "v334-atlas-visual-runtime-matrix-audit-v1" || audit.status !== "qualified-static-v5-v6-eight-group-runtime-consumption-browser-pending"
  || !/^[a-f0-9]{64}$/.test(audit.auditSha256 ?? "") || audit.rows?.length !== 16 || audit.groups?.length !== 8
  || Object.values(audit.checks ?? {}).some((value) => value !== true) || audit.browserQualification !== "not-run"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) throw new Error("v334 runtime matrix or release boundary mismatch");

const sourcePaths = [
  "scripts/build-visual-runtime-matrix-v334.mjs",
  "scripts/build-shadow-candidate-v334.mjs",
  "scripts/verify-shadow-v334-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/atlasVisualRuntimeMatrixV334.ts",
  "app/lib/atlasVisualRuntimeMatrixV334.test.ts",
  "app/lib/atlasShadowCapabilityPointerV334.ts",
  "app/lib/atlasShadowCapabilityPointerV334.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v334-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "visual-runtime-matrix-v334-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: { v333EvidenceSha256: v333Evidence.evidenceSha256, v333PointerSha256: v333Pointer.pointerSha256, runtimeMatrixAuditSha256: audit.auditSha256, fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null },
  runtimeMatrix: {
    profiles: audit.profiles,
    groups: audit.groups,
    rowCount: audit.rows.length,
    allGroupsCovered: audit.checks.allGroupsHaveV5AndV6,
    allRuntimeHooksPresent: audit.checks.allRuntimeHooksPresent,
    allGroupMarkersPresent: audit.checks.allGroupMarkersPresent,
    allTokenReadsPresent: audit.checks.allTokenReadsPresent,
    scienceFieldsEquivalent: true,
    cinematicFieldsDistinct: true,
    resolverReferenceStable: true,
  },
  visualBoundary: { science: "linear-no-grade-no-science-mutation", cinematic: "presentation-fields-distinct-seeded-only", localShadow: "manual-v5-v6-ab-only-default-legacy-v9" },
  runtime: { selectorAllocations: "resolved-profile-reference-stable", browserQualification: "not-run", heavyQualification: "not-run" },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "v5-v6-eight-group-runtime-consumption-matrix-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v334",
  generatedAt: new Date().toISOString(),
  status: "visual-runtime-matrix-v334-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v333VisualDirection: "deep-space-precision-instrument",
    v334RuntimeMatrix: "v5-v6-eight-groups-sixteen-consumption-rows",
    v334ScienceEquivalence: "fields-equivalent-linear-no-grade-no-science-mutation",
    v334CinematicDistinctness: "presentation-fields-distinct-seeded-only",
    v334ResolverStability: "resolved-reference-stable-no-profile-default-promotion",
    v334BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rowCount: evidence.runtimeMatrix.rowCount, groups: evidence.runtimeMatrix.groups, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
