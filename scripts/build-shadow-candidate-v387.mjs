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
  previousEvidence: "dist/science/orbit-atlas-shadow-v386-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v386.json",
  identifiability:
    "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
  csv: "dist/science/kerr-photon-source-identifiability-v387/identifiability.csv",
  oracle:
    "dist/science/kerr-photon-source-identifiability-v387/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v387-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v387.json",
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
const identifiability = read(paths.identifiability);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !==
    previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v386SensitivityKernel !==
    "qualified-4-rays-12-bins-56-coefficients" ||
  identifiability.version !== "v387-kerr-photon-source-identifiability-v1" ||
  identifiability.status !==
    "three-band-identifiability-audit-qualified-source-degeneracy-persists-covariance-unavailable" ||
  sha(identifiability) !== identifiability.artifactSha256 ||
  identifiability.export?.csvFileSha256 !== fileSha(paths.csv) ||
  identifiability.rows?.length !== 12 ||
  identifiability.global?.rank !== 1 ||
  identifiability.global?.singularValues?.[1] !== 0 ||
  identifiability.maxima?.sourceReconstructionRelativeDifference >= 2e-6 ||
  identifiability.maxima?.finiteDifferenceRelativeDifference >= 2e-7 ||
  identifiability.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  identifiability.theorem?.identifiableCombination !== "ln-g-plus-ln-T" ||
  identifiability.theorem?.additionalContinuumBandsBreakDegeneracy !== false ||
  identifiability.covarianceAdmission?.validatorImplemented !== true ||
  identifiability.covarianceAdmission?.jointDimension !== 14 ||
  identifiability.covarianceAdmission?.finiteSymmetricPsdRequired !== true ||
  identifiability.covarianceAdmission?.covariancePackAvailable !== false ||
  identifiability.covarianceAdmission?.admissionStatus !==
    "not-run-input-unavailable" ||
  identifiability.covarianceAdmission?.syntheticFixturePublishable !== false ||
  identifiability.covarianceAdmission?.uncertaintyProjectionAvailable !== false ||
  identifiability.qualification?.identifiabilityAuditQualified !== true ||
  identifiability.qualification?.temperatureRedshiftSeparatelyIdentifiable !== false ||
  identifiability.qualification?.absoluteScientificUncertaintyQualified !== false ||
  identifiability.qualification?.measuredAuthorityGranted !== false ||
  identifiability.qualification?.observedCountsAvailable !== false ||
  identifiability.qualification?.scienceImageAvailable !== false ||
  oracle.status !== "qualified-independent-three-band-rank-oracle" ||
  oracle.globalRank !== 1 ||
  oracle.additionalContinuumBandsBreakDegeneracy !== false ||
  oracle.covariancePackAvailable !== false ||
  oracle.absoluteScientificUncertaintyQualified !== false ||
  existsSync(resolve(root, paths.sourceDossier)) ||
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
  throw new Error("v387-boundary");
}

const sourcePaths = [
  "app/lib/kerrPhotonSourceIdentifiabilityV387.ts",
  "app/lib/kerrPhotonSourceIdentifiabilityV387.test.ts",
  "scripts/run-kerr-photon-source-identifiability-oracle-v387.py",
  "scripts/build-kerr-photon-source-identifiability-v387.ts",
  "app/lib/kerrPhotonSourceIdentifiabilityServerV387.ts",
  "app/lib/kerrPhotonSourceIdentifiabilityServerV387.test.ts",
  "app/api/atlas/relativity-evidence/v387/photon-identifiability/route.ts",
  "app/api/atlas/relativity-evidence/v387/photon-identifiability/route.test.ts",
  "app/components/KerrPhotonIdentifiabilitySurfaceV387.tsx",
  "app/components/KerrPhotonIdentifiabilitySurfaceV387.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV387.ts",
  "app/lib/atlasShadowCapabilityPointerV387.test.ts",
  "scripts/build-shadow-candidate-v387.mjs",
  "scripts/verify-shadow-v387-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v387-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "photon-identifiability-v387-qualified-degeneracy-persists-covariance-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v386EvidenceSha256: previousEvidence.evidenceSha256,
    v386PointerSha256: previousPointer.pointerSha256,
    identifiabilityArtifactSha256: identifiability.artifactSha256,
    identifiabilityFileSha256: fileSha(paths.identifiability),
    identifiabilityCsvFileSha256: identifiability.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v328PhotonArtifactSha256:
      identifiability.source.v328PhotonArtifactSha256,
    v386SensitivityArtifactSha256:
      identifiability.source.v386SensitivityArtifactSha256,
  },
  identifiability: {
    rayCount: identifiability.counts.rayCount,
    bandCount: identifiability.counts.bandCount,
    measurementCount: identifiability.counts.measurementCount,
    sourceParameterCount: identifiability.counts.sourceParameterCount,
    globalRank: identifiability.global.rank,
    globalSingularValues: identifiability.global.singularValues,
    identifiableCombination: identifiability.theorem.identifiableCombination,
    additionalContinuumBandsBreakDegeneracy:
      identifiability.theorem.additionalContinuumBandsBreakDegeneracy,
    requiredDegeneracyBreaker:
      identifiability.theorem.requiredDegeneracyBreaker,
    maximumSourceReconstructionRelativeDifference:
      identifiability.maxima.sourceReconstructionRelativeDifference,
    maximumFiniteDifferenceRelativeDifference:
      identifiability.maxima.finiteDifferenceRelativeDifference,
    maximumPythonOracleRelativeDifference:
      identifiability.maxima.pythonOracleRelativeDifference,
  },
  covarianceBoundary: {
    validatorImplemented: true,
    jointDimension: 14,
    finiteSymmetricPsdRequired: true,
    identityShaRequired: true,
    crossBlockRequiredUnlessIndependenceDocumented: true,
    covariancePackAvailable: false,
    admissionStatus: "not-run-input-unavailable",
    syntheticFixturePublishable: false,
    uncertaintyProjectionAvailable: false,
    absoluteScientificUncertaintyQualified: false,
    measuredAuthorityGranted: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "KerrPhotonIdentifiabilitySurfaceV387",
    endpoint:
      "/api/atlas/relativity-evidence/v387/photon-identifiability",
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
  networkAttempted: false,
  automaticRetryApplied: false,
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
    "identifiability-and-covariance-validator-only-never-covariance-projection-absolute-scientific-uncertainty-measured-authority-image-counts-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v387",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v386SensitivityKernel: "qualified-4-rays-12-bins-56-coefficients",
    v387ThreeBandIdentifiability:
      "qualified-12-measurements-global-rank-1",
    v387ContinuumDegeneracy: "persists-only-ln-g-plus-ln-T",
    v387CovarianceValidator: "implemented-14x14-identity-symmetry-psd",
    v387CovariancePack: "unavailable",
    v387UncertaintyProjection: "unavailable-no-covariance",
    v387AbsoluteScientificUncertainty: "not-qualified",
    v387RuntimeConsumer: "v11-rank-collapse-spectrometer-wired",
    v387PromotionBoundary:
      "identifiability-only-zero-projection-zero-authority-zero-image-zero-counts",
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
      identifiability:
        pointer.capabilities.v387ThreeBandIdentifiability,
      degeneracy: pointer.capabilities.v387ContinuumDegeneracy,
      covarianceValidator:
        pointer.capabilities.v387CovarianceValidator,
      covariancePack: pointer.capabilities.v387CovariancePack,
      projection: pointer.capabilities.v387UncertaintyProjection,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
