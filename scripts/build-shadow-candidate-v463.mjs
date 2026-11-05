import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v462-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v462.json",
  admission: "dist/science/kerr-science-payload-admission-v463/payload-admission.json",
  v462Join: "dist/science/kerr-scientific-measurement-join-v462/measurement-join.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v463-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v463.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const admission = read(paths.admission);
const v462Join = read(paths.v462Join);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousEvidence.version !== "orbit-atlas-shadow-v462-evidence-v1"
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v462"
  || admission.version !== "v463-kerr-science-payload-admission-artifact-v1"
  || admission.status !== "payload-admission-protocol-qualified-join-blocked"
  || admission.admission?.status !== "blocked"
  || admission.admission?.sciencePayloadAllowed !== false
  || admission.payload?.rowCount !== 0
  || admission.inspect?.committed !== false
  || v462Join.join?.joinAllowed !== false
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v463-evidence-boundary");

const sourcePaths = [
  paths.admission,
  paths.v462Join,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/kerrSciencePayloadAdmissionV463.ts",
  "app/lib/kerrSciencePayloadAdmissionServerV463.ts",
  "app/lib/kerrSciencePayloadAdmissionClientV463.ts",
  "app/components/KerrSciencePayloadAdmissionV463.tsx",
  "app/api/atlas/relativity-evidence/v463/science-payload-admission/route.ts",
  "app/local-shadow-v463/page.tsx",
  "scripts/build-kerr-science-payload-admission-v463.ts",
  "scripts/build-shadow-candidate-v463.mjs",
  "scripts/verify-shadow-v463-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v463-payload-admission-protocol-qualified-join-blocked";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v463-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v462EvidenceSha256: previousEvidence.evidenceSha256,
    v462PointerSha256: previousPointer.pointerSha256,
    v462JoinArtifactSha256: admission.source.measurementJoinArtifactSha256,
    v462JoinFileSha256: admission.source.measurementJoinFileSha256,
    v463AdmissionArtifactSha256: admission.artifactSha256,
    v463AdmissionFileSha256: fileSha(paths.admission),
    v314StateSha256: dense.stateSha256,
  },
  admission: {
    protocol: "qualified",
    sourceShaQualified: admission.admission.sourceShaQualified,
    completeMeasurementJoin: admission.admission.completeMeasurementJoin,
    detectorAuthorityReady: admission.admission.detectorAuthorityReady,
    residualLedgerClosed: admission.admission.residualLedgerClosed,
    status: admission.admission.status,
    reason: admission.admission.reason,
    sciencePayloadAllowed: false,
    productionPayloadRows: 0,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    cinematicScienceWritebackAllowed: false,
    authorityGranted: false,
  },
  schema: admission.schema,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v463/page.tsx",
    component: "KerrSciencePayloadAdmissionV463",
    boundedSummaryBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    canvasCreated: false,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    payloadAdmissionProtocol: "qualified",
    sciencePayload: "blocked-join-incomplete",
    detectorAuthority: "not-granted",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    runNextAuthorized: dense.runNextAuthorized,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundary: "v463-admission-only-no-science-payload-pixels-fits-png-or-cinematic-writeback",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: canonicalSha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v463",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v462AtomicJoin: "qualified",
    v463PayloadAdmissionProtocol: "qualified-join-blocked",
    v463SciencePayload: "blocked-join-incomplete",
    v463ProductionPayloadRows: 0,
    v463Authority: "not-granted",
    v463FitsPngWrite: "forbidden",
    v463CinematicScienceWriteback: "forbidden",
    v463BrowserQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: { promotionAllowed: false, sciencePayloadAllowed: false, fitsWriteAllowed: false, pngWriteAllowed: false, localShadowDefaultApplied: false },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, artifactSha256: admission.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, productionPayloadRows: 0, sciencePayloadAllowed: false, authorityGranted: false, denseCampaign: "0/49", browser: "not-run" }, null, 2));
