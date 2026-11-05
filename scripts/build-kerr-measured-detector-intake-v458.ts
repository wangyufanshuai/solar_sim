import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrMeasuredDetectorIntakePayloadV458,
  KERR_MEASURED_DETECTOR_INTAKE_ARTIFACT_VERSION_V458,
  KERR_MEASURED_DETECTOR_STAGING_ROOT_V458,
  parseKerrMeasuredDetectorIntakeArtifactV458,
} from "../app/lib/kerrMeasuredDetectorIntakeEnvelopeV458";
import {
  createKerrMeasuredDetectorAdversarialFixturesV458,
  createKerrMeasuredDetectorSyntheticControlV458,
  inspectKerrMeasuredDetectorStagingV458,
  KERR_MEASURED_DETECTOR_SCHEMA_PACK_V458,
  resolveV458StagingRoot,
  V458_MAX_FILE_BYTES,
  V458_MAX_TOTAL_BYTES,
  validateKerrMeasuredDetectorCandidateV458,
} from "../app/lib/kerrMeasuredDetectorIntakeValidatorV458";

const root = process.cwd();
const paths = {
  v451: "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
  v457: "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  outputRoot: "dist/science/kerr-measured-detector-intake-v458",
};
const read = (path: string) =>
  JSON.parse(readFileSync(resolve(root, path), "utf8"));
const canonicalSha = (value: unknown): string =>
  createHash("sha256")
    .update(canonicalKerrMeasuredDetectorIntakePayloadV458(value))
    .digest("hex");
const atomic = (path: string, value: unknown): void => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v451 = read(paths.v451);
const v457 = read(paths.v457);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  v451.version !== "v451-kerr-detector-input-admission-artifact-v1" ||
  v451.detector?.readyFileCount !== 0 ||
  v451.qualification?.measuredDetectorAuthorityGranted !== false ||
  v457.version !== "v457-science-product-promotion-gate-v1" ||
  v457.decisions?.promotionAllowed !== false ||
  v457.decisions?.fitsWriteAllowed !== false ||
  v457.decisions?.pngWriteAllowed !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v458-source-boundary");
}

const schemaPackUnsigned = KERR_MEASURED_DETECTOR_SCHEMA_PACK_V458;
const schemaPack = {
  ...schemaPackUnsigned,
  schemaPackSha256: canonicalSha(schemaPackUnsigned),
};
const control = validateKerrMeasuredDetectorCandidateV458(
  createKerrMeasuredDetectorSyntheticControlV458(),
);
if (
  control.status !== "validation-only" ||
  control.readyFileCount !== 6 ||
  control.measuredDetectorAuthorityGranted !== false ||
  control.runtimeProjectionAllowed !== false ||
  control.scienceRasterAllowed !== false
) {
  throw new Error("v458-synthetic-control-firewall");
}
const adversarialFixtures = createKerrMeasuredDetectorAdversarialFixturesV458().map(
  (fixture) => {
    const observed = validateKerrMeasuredDetectorCandidateV458(fixture.candidate);
    const observedReason = observed.files
      .flatMap((file) => file.reasons)
      .find((reason) => reason === fixture.expectedReason);
    if (!observedReason || observed.status === "validation-only") {
      throw new Error(`v458-adversarial-fixture:${fixture.id}`);
    }
    return Object.freeze({
      id: fixture.id,
      expectedReason: fixture.expectedReason,
      observedReason,
      rejected: true as const,
    });
  },
);
const inspect = inspectKerrMeasuredDetectorStagingV458(resolveV458StagingRoot(root));
if (
  inspect.stagingRootPresent !== false ||
  inspect.status !== "blocked-inputs-missing" ||
  inspect.readyFileCount !== 0 ||
  inspect.missingFileIds.length !== 6
) {
  throw new Error("v458-current-staging-boundary");
}
const contract = {
  stagingRoot: KERR_MEASURED_DETECTOR_STAGING_ROOT_V458,
  requiredFileCount: 6 as const,
  maximumFileBytes: V458_MAX_FILE_BYTES,
  maximumTotalBytes: V458_MAX_TOTAL_BYTES,
  contentClasses: [
    "measured-detector-calibration",
    "synthetic-validation-fixture",
  ] as const,
  crossFileIdentityRequired: true as const,
  provenanceShaForFiveInputsRequired: true as const,
  licenseSnapshotRequired: true as const,
  independentValidationRequired: true as const,
  explicitAuthorityGrantRequired: true as const,
  atomicPublicationRequired: true as const,
};
const unsigned = {
  version: KERR_MEASURED_DETECTOR_INTAKE_ARTIFACT_VERSION_V458,
  generatedAt: "2026-07-30T00:00:00Z",
  status:
    "intake-protocol-qualified-staging-missing-measured-authority-blocked" as const,
  source: {
    v451ArtifactSha256: v451.artifactSha256,
    v457GateArtifactSha256: v457.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  contract,
  schemaPack,
  validator: {
    qualified: true as const,
    acceptedSyntheticControlCount: 1 as const,
    syntheticControlAuthorityGranted: false as const,
    rejectedAdversarialFixtureCount: 11 as const,
    adversarialFixtures,
  },
  inspect: {
    stagingRootPresent: false as const,
    files: inspect.files,
    readyFileCount: 0 as const,
    missingFileIds: inspect.missingFileIds,
    invalidFileIds: inspect.invalidFileIds,
    candidateReadyForIndependentValidation: false as const,
    attemptConsumed: false as const,
  },
  productionAdmission: {
    contentClass: "unavailable" as const,
    measuredInputInventoryQualified: false as const,
    crossFileIdentityQualified: false as const,
    provenanceShaLinkageQualified: false as const,
    licenseBoundaryQualified: false as const,
    independentValidationQualified: false as const,
    explicitAuthorityGrant: false as const,
    measuredDetectorAuthorityGranted: false as const,
    runtimeProjectionAllowed: false as const,
    scienceRasterAllowed: false as const,
  },
  qualification: {
    schemaPackQualified: true as const,
    boundedValidatorQualified: true as const,
    syntheticProductionFirewallQualified: true as const,
    measuredDetectorIntakeQualified: false as const,
    browserQualification: "not-run" as const,
  },
  boundary: {
    templatesPersistedAsMeasuredData: false as const,
    syntheticFixtureMayGrantAuthority: false as const,
    stagingDataPackagedAtRuntime: false as const,
    fitsWriteAllowed: false as const,
    pngWriteAllowed: false as const,
    sciencePayloadMutationAllowed: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
};
const artifact = parseKerrMeasuredDetectorIntakeArtifactV458({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(`${paths.outputRoot}/intake-contract.json`, contract);
atomic(`${paths.outputRoot}/schema-pack.json`, schemaPack);
atomic(`${paths.outputRoot}/intake-inspect.json`, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      schemaPackSha256: artifact.schemaPack.schemaPackSha256,
      readyFileCount: artifact.inspect.readyFileCount,
      requiredFileCount: artifact.contract.requiredFileCount,
      missingFileIds: artifact.inspect.missingFileIds,
      syntheticControl: "validation-only-authority-false",
      adversarialFixtures: artifact.validator.rejectedAdversarialFixtureCount,
      measuredDetectorAuthorityGranted: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
    },
    null,
    2,
  ),
);
