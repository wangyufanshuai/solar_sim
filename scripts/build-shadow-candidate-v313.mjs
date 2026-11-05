import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const path = {
  geometry: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  polarization: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  legacyCampaign: "dist/science/kerr-campaign-v298r1/campaign-state.json",
  v311: "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  envelope: "dist/science/kerr-reference-v313/portable-envelope.json",
  evidence: "dist/science/orbit-atlas-shadow-v313-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v313.json",
};
const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const fileSha = (relative) => createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const geometry = read(path.geometry);
const polarization = read(path.polarization);
const legacyCampaign = read(path.legacyCampaign);
const v311 = read(path.v311);
const formal = read(path.formal);
if (geometry.evidenceSha256 !== "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e"
  || fileSha(path.geometry) !== "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91"
  || geometry.correctedAuthorityQualified !== true || geometry.toleranceConvergence?.strictSolverLadderPairCount !== 64) throw new Error("v312 geometry lock mismatch");
if (polarization.evidenceSha256 !== "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f"
  || fileSha(path.polarization) !== "b102cff3adcd9f5c0f4b6e51c9a05e6baaa2516b21d7fa816ed86dbe6f0ec12b"
  || polarization.qualified !== true || polarization.fullKerrShortAuthorityQualified !== true
  || polarization.geometryEvidenceSha256 !== geometry.evidenceSha256 || polarization.applicableExecutionCount !== 16) throw new Error("v313 polarization lock mismatch");
if (v311.status !== "failed-tolerance-ladder-degenerate" || legacyCampaign.status !== "incomplete-1-of-49" || legacyCampaign.completedShardCount !== 1 || legacyCampaign.aggregateAvailable !== false) throw new Error("legacy campaign quarantine drift");
if (formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) throw new Error("formal v263 pointer drift");

const sourcePaths = [
  "scripts/run-kerr-authority-v312.py",
  "scripts/run-kerr-polarization-v313.py",
  "scripts/test-kerr-polarization-v313.py",
  "scripts/verify-shadow-v313-light.mjs",
  "scripts/build-shadow-candidate-v313.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrAuthorityV312.ts",
  "app/lib/kerrAuthorityV313.ts",
  "app/lib/kerrAuthorityV313.test.ts",
  "app/components/KerrCorrectedAuthorityWorkbenchV312.tsx",
  "app/components/KerrPolarizationRequalificationWorkbenchV313.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/atlasShadowCapabilityPointerV313.ts",
  "app/lib/atlasShadowCapabilityPointerV313.test.ts",
];
const sourceManifest = sourcePaths.map((source) => ({ path: source, sha256: fileSha(source) }));
const envelopeUnsigned = {
  version: "v313-full-kerr-short-authority-envelope-v1",
  generatedAt: new Date().toISOString(),
  status: "full-kerr-short-authority-qualified",
  geometry: {
    version: "v312",
    evidenceSha256: geometry.evidenceSha256,
    fileSha256: fileSha(path.geometry),
    executionCount: geometry.executionCount,
    strictSolverLadderPairCount: geometry.toleranceConvergence.strictSolverLadderPairCount,
    convergenceObservableCount: geometry.toleranceConvergence.convergenceObservableCount,
    distinctConvergenceObservableCount: geometry.toleranceConvergence.distinctConvergenceObservableCount,
    releaseSolverTolerance: geometry.tolerancePolicy.releaseSolverTolerance,
    internalSolverTolerance: geometry.tolerancePolicy.internalSolverTolerance,
    thresholds: geometry.thresholds,
  },
  polarization: {
    version: "v313",
    evidenceSha256: polarization.evidenceSha256,
    fileSha256: fileSha(path.polarization),
    applicableExecutionCount: polarization.applicableExecutionCount,
    captureEscapeNotApplicableCount: polarization.captureEscapeNotApplicableCount,
    thresholds: polarization.thresholds,
    gates: polarization.gates,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  science: { defaultKernel: "legacy-eih-1pn", geometryFormulations: ["carter-mino-dop853-constraint-stabilized-v312", "cartesian-kerr-schild-hamiltonian-dop853-v312"], polarizationFormulations: ["standard-complex-kerr-walker-penrose", "independent-cartesian-kerr-schild-hamiltonian-dop853"], workerPhysicsMutation: "not-applied", legacyKerrMutation: "not-applied" },
  release: { formalProductPointer: "v263", formalProductPointerAdvanced: false, denseCampaignCreated: false, denseShardExecuted: false, browserQualificationRun: false },
  boundary: "portable-full-short-authority-no-dense-transfer-map-no-runtime-physics-authority",
};
const envelope = { ...envelopeUnsigned, evidenceSha256: sha(envelopeUnsigned) };
atomic(path.envelope, envelope);

const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v313-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "full-kerr-short-authority-qualified-corrected-dense-not-created",
  authority: { envelope: { path: path.envelope, fileSha256: fileSha(path.envelope), evidenceSha256: envelope.evidenceSha256 }, geometry: { path: path.geometry, evidenceSha256: geometry.evidenceSha256 }, polarization: { path: path.polarization, evidenceSha256: polarization.evidenceSha256 } },
  historicalCampaign: { namespace: "kerr-campaign-v298r1", status: "quarantined-1-of-49-tolerance-ladder-degenerate", stateSha256: legacyCampaign.stateSha256, truthAuditSha256: v311.truthAuditSha256, aggregateEligible: false, stateMutationApplied: false, nextShardAttempted: false },
  correctedCampaign: { namespace: null, status: "not-created-awaiting-explicit-authorization", completedShardCount: 0, plannedShardCount: 49, aggregateEligible: false },
  runtime: { scienceAuthority: "v312-v313-full-short-sparse", denseAuthorityAccepted: false, gpuAuthority: "cpu-only", localShadowDefaultApplied: false, browserQualification: "not-run" },
  science: envelope.science,
  release: { formalProductPointer: "v263", formalProductPointerPath: path.formal, formalProductPointerSha256: fileSha(path.formal), formalProductPointerAdvanced: false, publicDeploymentBlocked: true },
  boundary: "local-shadow-only-full-short-authority-corrected-dense-uninitialized-no-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(path.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v313",
  generatedAt: new Date().toISOString(),
  status: "full-kerr-short-authority-qualified-corrected-dense-not-created",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v311: "negative-truth-evidence-qualified",
    v312GeometryTolerance: "corrected-authority-qualified",
    v313Polarization: "qualified-against-v312",
    fullKerrShortAuthority: "qualified-v312-v313-envelope",
    historicalV298r1: "quarantined-1-of-49-tolerance-ladder-degenerate",
    correctedDenseCampaign: "not-created",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
    visualV5V6: "manual-local-shadow-only-not-default",
  },
  continuation: "initialize-new-corrected-dense-namespace-then-require-explicit-authorization-per-shard-series",
  evidence: { path: path.evidence, fileSha256: fileSha(path.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(path.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, envelopeSha256: envelope.evidenceSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, formalProductPointer: pointer.formalProductPointer, correctedDenseCampaign: pointer.capabilities.correctedDenseCampaign }, null, 2));
