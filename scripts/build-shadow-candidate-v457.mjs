import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v456-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v456.json",
  gate: "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
  v451: "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v457-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v457.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const gate = read(paths.gate);
const v451 = read(paths.v451);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v456-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v456" ||
  gate.version !== "v457-science-product-promotion-gate-v1" ||
  gate.status !==
    "blocked-science-product-promotion-structure-qualified-value-authority-missing" ||
  gate.gates?.length !== 10 ||
  gate.counts?.qualifiedCount !== 2 ||
  gate.counts?.blockerCount !== 8 ||
  gate.counts?.measuredDetectorReady !== 0 ||
  gate.counts?.denseShardsCompleted !== 0 ||
  gate.decisions?.promotionAllowed !== false ||
  gate.decisions?.fitsWriteAllowed !== false ||
  gate.decisions?.pngWriteAllowed !== false ||
  gate.decisions?.localShadowDefaultApplied !== false ||
  gate.visualProfile?.profileId !== "science-cinematic-v7-v457" ||
  gate.visualProfile?.scienceLinearDisplay !== true ||
  gate.visualProfile?.scienceBloomDisabled !== true ||
  gate.visualProfile?.scienceGradeDisabled !== true ||
  gate.visualProfile?.scientificFieldMutation !== false ||
  gate.visualProfile?.defaultApplied !== false ||
  gate.boundary?.scienceProductAuthority !== false ||
  gate.boundary?.fitsHduEmitted !== false ||
  gate.boundary?.pngEmitted !== false ||
  v451.status !== "blocked-v443-detector-inputs-missing" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v457-evidence-boundary");
}

const sourcePaths = [
  paths.gate,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v451,
  paths.dense,
  "app/lib/atlasScienceCinematicV7V457.ts",
  "app/lib/scienceProductPromotionGateV457.ts",
  "app/lib/scienceProductPromotionServerV457.ts",
  "app/lib/scienceProductPromotionClientV457.ts",
  "app/components/ScienceProductQualificationConsoleV457.tsx",
  "app/api/atlas/relativity-evidence/v457/science-product-gate/route.ts",
  "app/local-shadow-v457/page.tsx",
  "scripts/build-kerr-science-product-promotion-gate-v457.ts",
  "scripts/build-shadow-candidate-v457.mjs",
  "scripts/verify-shadow-v457-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v457-promotion-gate-fail-closed-fits-structure-qualified-detector-and-dense-blocked-science-cinematic-v7-implemented-heavy-qualification-not-run";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v457-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v456EvidenceSha256: previousEvidence.evidenceSha256,
    v456PointerSha256: previousPointer.pointerSha256,
    v456EvidenceFileSha256: fileSha(paths.previousEvidence),
    v456PointerFileSha256: fileSha(paths.previousPointer),
    v457GateArtifactSha256: gate.artifactSha256,
    v457GateFileSha256: fileSha(paths.gate),
    v451ArtifactSha256: v451.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  promotionGate: {
    gateCount: gate.counts.gateCount,
    qualifiedCount: gate.counts.qualifiedCount,
    blockerCount: gate.counts.blockerCount,
    gates: gate.gates,
    promotionAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  scienceCinematicV7: {
    ...gate.visualProfile,
    runtimeSelectorConnected: true,
    manualToggleOnly: true,
  },
  authorityBoundary: {
    fitsHeader: "qualified",
    provenanceGraph: "qualified",
    measuredDetectorInputs: "blocked-0-of-6",
    detectorPixelValues: "blocked",
    denseAggregate: "incomplete-0-of-49",
    selectionBias: "unquantified",
    scienceProductAuthority: "not-granted",
    scienceAndCinematicSeparated: true,
  },
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v457/page.tsx",
    component: "ScienceProductQualificationConsoleV457",
    boundedSummaryBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    canvasCreated: false,
    sciencePayloadMutation: false,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    fitsHeader: "qualified",
    provenanceGraph: "qualified",
    measuredDetectorInputs: "blocked",
    detectorPixelValues: "blocked",
    denseAggregate: "incomplete",
    selectionBias: "unquantified",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
    scienceCinematicV7: "qualified-static",
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
  boundary:
    "v457-fail-closed-promotion-gate-only-no-science-product-fits-png-default-or-public-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: canonicalSha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v457",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v456SparseCoordinateEnvelope: "qualified-coordinate-only",
    v457FitsHeader: "qualified",
    v457ProvenanceGraph: "qualified",
    v457MeasuredDetectorInputs: "blocked-0-of-6",
    v457DetectorPixelValues: "blocked",
    v457DenseAggregate: "incomplete-0-of-49",
    v457SelectionBias: "unquantified",
    v457BrowserQualification: "not-run",
    v457VisualMatrix: "not-run",
    v457Soak: "not-run",
    v457RtxWebGpu: "not-run",
    v457ScienceProductPromotion: "blocked-fail-closed",
    v457ScienceCinematicV7: "implemented-awaiting-browser-qualification",
  },
  promotion: {
    promotionAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    blockerIds: gate.decisions.blockerIds,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = {
  ...pointerUnsigned,
  pointerSha256: canonicalSha(pointerUnsigned),
};
atomic(paths.pointer, pointer);

console.log(
  JSON.stringify(
    {
      status,
      artifactSha256: gate.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      qualifiedCount: gate.counts.qualifiedCount,
      blockerCount: gate.counts.blockerCount,
      promotionAllowed: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
      profile: "science-cinematic-v7-v457",
      denseCampaign: dense.status,
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
