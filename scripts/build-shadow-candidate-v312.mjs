import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v296: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
  v297: "dist/science/kerr-reference-v297/polarization-short-gate.json",
  v298State: "dist/science/kerr-campaign-v298r1/campaign-state.json",
  v311: "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json",
  v312: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  v312Negative: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate-negative.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v312-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v312.json",
};

const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomicJson = (path, value) => {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const temporary = `${absolute}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, absolute);
};

const v296 = readJson(paths.v296);
const v297 = readJson(paths.v297);
const v298State = readJson(paths.v298State);
const v311 = readJson(paths.v311);
const v312 = readJson(paths.v312);
const v312Negative = readJson(paths.v312Negative);
const formal = readJson(paths.formal);

if (v296.evidenceSha256 !== "76d2d4d3b803104ba477da627c428ed51d7b62b9691d2dc81e53f1e5bb8e81f7" || v296.geometryRedshiftQualified !== true) throw new Error("v296 authority lock mismatch");
if (v297.evidenceSha256 !== "a3ac11de0ad8dc48c742507f8aee169c53a3c983cb7a38fbf41eb580b4d58854" || v297.qualified !== true) throw new Error("v297 authority lock mismatch");
if (v311.truthAuditSha256 !== "b6a2e8b91b62e4b73a2e7f713c294388767b72763cda02358514958a66edd31a" || v311.status !== "failed-tolerance-ladder-degenerate") throw new Error("v311 negative truth lock mismatch");
if (v298State.status !== "incomplete-1-of-49" || v298State.completedShardCount !== 1 || v298State.nextShardIndex !== 1 || v298State.aggregateAvailable !== false) throw new Error("quarantined v298r1 state drift");
if (formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) throw new Error("formal v263 pointer drift");
if (v312.version !== "v312-kerr-corrected-tolerance-short-gate-v1" || v312.status !== "corrected-authority-qualified"
  || v312.correctedAuthorityQualified !== true || v312.geometryRedshiftQualified !== true || v312.toleranceConvergenceQualified !== true
  || v312.fullKerrAuthorityQualified !== false || v312.executionCount !== 128 || v312.criticalBracketCount !== 40
  || v312.toleranceConvergence?.strictSolverLadderPairCount !== 64 || v312.toleranceConvergence?.expectedStrictSolverLadderPairCount !== 64
  || v312.toleranceConvergence?.convergenceObservableCount !== 256 || v312.toleranceConvergence?.distinctConvergenceObservableCount <= 0
  || v312.resource?.qualified !== true || v312.resource?.peakRssGiB <= 0 || v312.resource?.peakRssGiB >= 2
  || v312.release?.formalProductPointer !== "v263" || v312.release?.denseShardExecuted !== false || v312.release?.correctedDenseCampaignCreated !== false
  || v312.evidenceSha256 !== "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e"
  || fileSha(paths.v312) !== "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91") throw new Error("v312 corrected authority validation failed");
if (v312Negative.status !== "corrected-authority-failed" || v312Negative.evidenceSha256 !== "e35cf4f6abe9328e1bd11e4e9d30490bca82b6e1cf86b0cc8172310654226f17"
  || fileSha(paths.v312Negative) !== "98a7417de20d25ab31b59f6bba8df71c40733eeb5245fd773f0f2365f785aec1"
  || v312.priorNegativeEvidence?.evidenceSha256 !== v312Negative.evidenceSha256) throw new Error("v312 negative evidence preservation failed");

const sourcePaths = [
  "scripts/run-kerr-authority-v312.py",
  "scripts/test-kerr-authority-v312.py",
  "scripts/verify-shadow-v312-light.mjs",
  "scripts/build-shadow-candidate-v312.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrAuthorityV312.ts",
  "app/lib/kerrAuthorityV312.test.ts",
  "app/components/KerrCorrectedAuthorityWorkbenchV312.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/kerrDenseShardTruthV311.ts",
  "app/lib/atlasShadowCapabilityPointerV312.ts",
  "app/lib/atlasShadowCapabilityPointerV312.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v312-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "corrected-geometry-tolerance-qualified-polarization-requalification-pending",
  authority: {
    v296: { path: paths.v296, evidenceSha256: v296.evidenceSha256, role: "historical-geometry-redshift-qualified-tolerance-convergence-withdrawn" },
    v297: { path: paths.v297, evidenceSha256: v297.evidenceSha256, role: "historical-polarization-qualified-under-v296-geometry-not-v312-promoted" },
    v311: { path: paths.v311, truthAuditSha256: v311.truthAuditSha256, status: v311.status },
    v312: { path: paths.v312, fileSha256: fileSha(paths.v312), evidenceSha256: v312.evidenceSha256, status: v312.status },
    v312Negative: { path: paths.v312Negative, fileSha256: fileSha(paths.v312Negative), evidenceSha256: v312Negative.evidenceSha256, status: v312Negative.status, preserved: true },
    sourceManifest,
    sourceSha256: canonicalSha(sourceManifest),
  },
  solverLadder: {
    releaseRtol: v312.tolerancePolicy.releaseSolverTolerance,
    internalRtol: v312.tolerancePolicy.internalSolverTolerance,
    strictPairCount: v312.toleranceConvergence.strictSolverLadderPairCount,
    expectedPairCount: v312.toleranceConvergence.expectedStrictSolverLadderPairCount,
    distinctObservableCount: v312.toleranceConvergence.distinctConvergenceObservableCount,
    observableCount: v312.toleranceConvergence.convergenceObservableCount,
    thresholdRelaxation: "not-applied",
  },
  campaign: {
    historicalNamespace: "kerr-campaign-v298r1",
    historicalStatus: "quarantined-1-of-49-tolerance-ladder-degenerate",
    statePath: paths.v298State,
    stateFileSha256: fileSha(paths.v298State),
    campaignStateMutationApplied: false,
    nextShardAttempted: false,
    aggregateEligible: false,
    correctedNamespace: null,
    correctedCampaignStatus: "not-created-awaiting-v312-polarization-requalification-and-user-authorization",
  },
  runtime: {
    scienceAuthorityAccepted: "v312-geometry-tolerance-only",
    polarizationAcceptedForV312: false,
    denseAuthorityAccepted: false,
    localShadowDefaultApplied: false,
    browserQualification: "not-run",
  },
  science: { defaultKernel: "legacy-eih-1pn", workerPhysicsMutation: "not-applied", legacyKerrMutation: "not-applied", historicalShaMutation: "not-applied" },
  release: { formalProductPointer: "v263", formalProductPointerPath: paths.formal, formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, publicDeploymentBlocked: true },
  boundary: "local-shadow-only-corrected-short-geometry-no-polarization-promotion-no-dense-continuation-no-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: canonicalSha(evidenceUnsigned) };
atomicJson(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v312",
  generatedAt: new Date().toISOString(),
  status: "corrected-geometry-qualified-polarization-and-dense-pending",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v296: "geometry-redshift-qualified-historical",
    v296ToleranceConvergence: "withdrawn-same-effective-solver-tolerance",
    v297: "historical-polarization-qualified-not-v312-promoted",
    v298r1: "quarantined-1-of-49-tolerance-ladder-degenerate",
    v311: "negative-truth-evidence-qualified",
    v312GeometryTolerance: "corrected-authority-qualified",
    v312Polarization: "requalification-pending",
    correctedDenseCampaign: "not-created",
    browserQualification: "not-run",
    visualV5V6: "manual-local-shadow-only-not-default",
  },
  continuation: "requalify-polarization-against-v312-then-create-new-dense-namespace-only-with-explicit-shard-authorization",
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomicJson(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, formalProductPointer: pointer.formalProductPointer, correctedDenseCampaign: pointer.capabilities.correctedDenseCampaign }, null, 2));
