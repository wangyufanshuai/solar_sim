import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v381-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v381.json",
  forensic: "dist/science/measured-visible-source-v382r1/forensic.json",
  raw: "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml",
  negative:
    "dist/staging/measured-authority-v382-visible/attempt-1-negative.json",
  checkpoint: "dist/staging/measured-authority-v382-visible/checkpoint.json",
  dossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v382r1-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v382r1.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(
              ([key]) =>
                ![
                  "generatedAt",
                  "fetchedAt",
                  "artifactSha256",
                  "evidenceSha256",
                  "pointerSha256",
                ].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const forensic = read(paths.forensic);
const negative = read(paths.negative);
const checkpoint = read(paths.checkpoint);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !==
    previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v381PerBandIdentityModel !==
    "qualified-three-lanes-independent-instrument-identities" ||
  forensic.version !== "v382r1-visible-source-offline-forensic-v1" ||
  forensic.status !==
    "parser-corrected-offline-source-qualified-1-of-7-attempt-1-failed-no-retry" ||
  sha(forensic) !== forensic.artifactSha256 ||
  forensic.progress?.qualifiedSourceCount !== 1 ||
  forensic.progress?.plannedSourceCount !== 7 ||
  forensic.progress?.sourceDossierAvailable !== false ||
  forensic.progress?.resumeRequiresExplicitAuthorization !== true ||
  forensic.authorityGranted !== false ||
  forensic.observedCountsAvailable !== false ||
  forensic.runtimePackagingAllowed !== false ||
  forensic.recoveredSource?.sha256 !== fileSha(paths.raw) ||
  negative.status !== "attempt-1-failed-no-automatic-retry" ||
  negative.reason !== "v382-votable-provenance" ||
  negative.attemptConsumed !== true ||
  negative.networkAttempted !== true ||
  negative.automaticRetryApplied !== false ||
  checkpoint.status !== "attempt-1-failed-no-automatic-retry" ||
  existsSync(resolve(root, paths.dossier)) ||
  existsSync(resolve(root, paths.envelope)) ||
  existsSync(resolve(root, paths.imageJson)) ||
  existsSync(resolve(root, paths.imageCsv)) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.eihOnePnMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v382r1-boundary");
}

const sourcePaths = [
  "app/lib/measuredVisibleSourceDossierV382.ts",
  "app/lib/measuredVisibleSourceDossierV382.test.ts",
  "scripts/fetch-measured-visible-source-v382.ts",
  "app/lib/measuredVisibleSourceForensicV382R1.ts",
  "app/lib/measuredVisibleSourceForensicV382R1.test.ts",
  "scripts/build-measured-visible-source-forensic-v382r1.ts",
  "app/lib/measuredVisibleSourceForensicServerV382R1.ts",
  "app/lib/measuredVisibleSourceForensicServerV382R1.test.ts",
  "app/api/atlas/relativity-evidence/v382/visible-source-forensic/route.ts",
  "app/api/atlas/relativity-evidence/v382/visible-source-forensic/route.test.ts",
  "app/components/MeasuredVisibleSourceForensicSurfaceV382R1.tsx",
  "app/components/MeasuredVisibleSourceForensicSurfaceV382R1.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV382R1.ts",
  "app/lib/atlasShadowCapabilityPointerV382R1.test.ts",
  "scripts/build-shadow-candidate-v382r1.mjs",
  "scripts/verify-shadow-v382r1-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v382r1-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "visible-source-v382r1-parser-corrected-offline-1-of-7-attempt1-failed-no-retry-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v381EvidenceSha256: previousEvidence.evidenceSha256,
    v381PointerSha256: previousPointer.pointerSha256,
    forensicArtifactSha256: forensic.artifactSha256,
    forensicFileSha256: fileSha(paths.forensic),
    recoveredRawSha256: forensic.recoveredSource.sha256,
    attempt1NegativeFileSha256: fileSha(paths.negative),
  },
  sourceRecovery: {
    candidate: "HST/WFC3_UVIS1.F350LP",
    recoveredSourceId: forensic.recoveredSource.id,
    profileRows: forensic.recoveredSource.profile.rowCount,
    wavelengthMinimumAngstrom:
      forensic.recoveredSource.profile.wavelengthMinimumAngstrom,
    wavelengthMaximumAngstrom:
      forensic.recoveredSource.profile.wavelengthMaximumAngstrom,
    visibleCoverage400To700Nm:
      forensic.recoveredSource.profile.visibleCoverage400To700Nm,
    measuredQeStatementPresent:
      forensic.recoveredSource.profile.measuredQeStatementPresent,
    laboratoryFilterThroughputStatementPresent:
      forensic.recoveredSource.profile
        .laboratoryFilterThroughputStatementPresent,
    calibrationReport2020Present:
      forensic.recoveredSource.profile.calibrationReport2020Present,
    calibrationReport2021Present:
      forensic.recoveredSource.profile.calibrationReport2021Present,
    qualifiedSourceCount: 1,
    plannedSourceCount: 7,
    remainingSourceCount: 6,
    sourceDossierAvailable: false,
  },
  failureAndCorrection: {
    attempt1Status: negative.status,
    attempt1Reason: negative.reason,
    historicalNegativeEvidencePreserved: true,
    parserCorrectionCause: forensic.correction.cause,
    parserRegressionTestAdded: true,
    sourceRevalidatedOffline: true,
    networkAttemptedDuringCorrection: false,
    automaticRetryApplied: false,
    resumeRequiresExplicitAuthorization: true,
  },
  boundary: {
    authorityGranted: false,
    measuredBandAuthorityCount: 0,
    v375EnvelopeAvailable: false,
    v376ScienceImageAvailable: false,
    observedCountsAvailable: false,
    runtimePackagingAllowed: false,
    syntheticFallbackUsed: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "MeasuredVisibleSourceForensicSurfaceV382R1",
    endpoint:
      "/api/atlas/relativity-evidence/v382/visible-source-forensic",
    responseMaximumBytes: 128 * 1024,
    noStore: true,
    localShadowOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
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
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  releaseBoundary:
    "partial-staging-source-forensic-only-never-measured-authority-expectation-image-observed-counts-runtime-package-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v382r1",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v381PerBandIdentityModel:
      "qualified-three-lanes-independent-instrument-identities",
    v382Attempt1: "failed-parser-provenance-no-automatic-retry",
    v382r1ParserCorrection: "qualified-apostrophe-regression-covered",
    v382r1RecoveredSource: "qualified-svo-f350lp-offline-1-of-7",
    v382r1SourceDossier: "incomplete-1-of-7",
    v382r1VisibleMeasuredAuthority: "unavailable-0-of-1-visible-lane",
    v382r1MeasuredBandAuthorities: "missing-0-of-3-present",
    v382r1RuntimeConsumer: "v11-source-tape-forensic-wired",
    v382r1PromotionBoundary: "zero-authority-zero-image-zero-observed-counts",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = {
  ...pointerUnsigned,
  pointerSha256: sha(pointerUnsigned),
};
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status: pointer.status,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      recoveredSource: pointer.capabilities.v382r1RecoveredSource,
      dossier: pointer.capabilities.v382r1SourceDossier,
      measuredAuthority: pointer.capabilities.v382r1VisibleMeasuredAuthority,
      retry: "not-applied",
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
