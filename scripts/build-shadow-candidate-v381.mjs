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
  previousEvidence: "dist/science/orbit-atlas-shadow-v380-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v380.json",
  readiness:
    "dist/science/measured-authority-readiness-v379/readiness.json",
  audit: "dist/science/measured-authority-identity-v381/audit.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v381-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v381.json",
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
const readiness = read(paths.readiness);
const audit = read(paths.audit);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !==
    previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v380AdversarialCampaign !==
    "qualified-12-of-12-fail-closed" ||
  readiness.artifactSha256 !== audit.legacyModel?.readinessArtifactSha256 ||
  readiness.schemaContractQualifiedCount !== 7 ||
  readiness.presentInputCount !== 0 ||
  audit.version !== "v381-measured-authority-identity-audit-v1" ||
  audit.status !==
    "identity-model-corrected-three-band-lanes-ready-inputs-0-of-3" ||
  sha(audit) !== audit.artifactSha256 ||
  audit.legacyModel?.scientificFusionEligibility !==
    "withdrawn-single-instrument-three-band-identity-not-demonstrated" ||
  audit.legacyModel?.historicalArtifactsMutated !== false ||
  audit.correctedModel?.bandLaneCount !== 3 ||
  audit.correctedModel?.qualifiedBandLaneCount !== 0 ||
  audit.correctedModel?.sameBandInstrumentIdentityRequired !== true ||
  audit.correctedModel?.crossBandInstrumentIdentityRequired !== false ||
  audit.correctedModel?.observedCountsAvailable !== false ||
  audit.lanes?.length !== 3 ||
  audit.authorityPromotionAllowed !== false ||
  audit.syntheticFallbackUsed !== false ||
  audit.sciencePayloadMutationAllowed !== false ||
  audit.cinematicConsumerAllowed !== false ||
  audit.attemptConsumed !== false ||
  audit.networkAttempted !== false ||
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
  throw new Error("v381-boundary");
}

const sourcePaths = [
  "app/lib/measuredAuthorityBandIdentityV381.ts",
  "app/lib/measuredAuthorityBandIdentityV381.test.ts",
  "app/lib/measuredAuthorityIdentityAuditV381.ts",
  "app/lib/measuredAuthorityIdentityAuditV381.test.ts",
  "app/lib/measuredAuthorityIdentityServerV381.ts",
  "app/lib/measuredAuthorityIdentityServerV381.test.ts",
  "app/api/atlas/relativity-evidence/v381/measured-authority-identity/route.ts",
  "app/api/atlas/relativity-evidence/v381/measured-authority-identity/route.test.ts",
  "app/components/MeasuredAuthorityIdentitySurfaceV381.tsx",
  "app/components/MeasuredAuthorityIdentitySurfaceV381.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV381.ts",
  "app/lib/atlasShadowCapabilityPointerV381.test.ts",
  "scripts/build-measured-authority-identity-v381.ts",
  "scripts/build-shadow-candidate-v381.mjs",
  "scripts/verify-shadow-v381-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v381-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "measured-authority-identity-v381-corrected-per-band-inputs-0-of-3-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v380EvidenceSha256: previousEvidence.evidenceSha256,
    v380PointerSha256: previousPointer.pointerSha256,
    readinessArtifactSha256: readiness.artifactSha256,
    auditArtifactSha256: audit.artifactSha256,
    auditFileSha256: fileSha(paths.audit),
  },
  correction: {
    historicalStructuralContractsQualified: "7/7",
    historicalMeasuredInputs: "0/7",
    legacyScientificFusionEligibility:
      audit.legacyModel.scientificFusionEligibility,
    historicalArtifactsMutated: false,
    correctedAuthorityUnit: audit.correctedModel.authorityUnit,
    bandLaneCount: 3,
    qualifiedBandLaneCount: 0,
    sameBandInstrumentIdentityRequired: true,
    crossBandInstrumentIdentityRequired: false,
    lanes: audit.lanes.map((lane) => ({
      bandId: lane.bandId,
      lowerFrequencyHz: lane.lowerFrequencyHz,
      upperFrequencyHz: lane.upperFrequencyHz,
      detectorAuthorityPresent: lane.detectorAuthorityPresent,
      geometryAuthorityPresent: lane.geometryAuthorityPresent,
      status: lane.status,
    })),
    nextRequiredInput: audit.nextRequiredInput,
  },
  boundary: {
    authorityGranted: false,
    authorityPromotionAllowed: false,
    v375EnvelopeAvailable: false,
    v376ScienceImageAvailable: false,
    observedCountsAvailable: false,
    syntheticFallbackUsed: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "MeasuredAuthorityIdentitySurfaceV381",
    endpoint:
      "/api/atlas/relativity-evidence/v381/measured-authority-identity",
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
  attemptConsumed: false,
  networkAttempted: false,
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
    "per-band-identity-model-only-no-measured-authority-expectation-image-observed-counts-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v381",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v379HistoricalStructuralContracts: "qualified-7-of-7",
    v379HistoricalMeasuredInputs: "missing-0-of-7-present",
    v380AdversarialCampaign: "qualified-12-of-12-fail-closed",
    v381LegacyScientificFusion:
      "withdrawn-single-instrument-three-band-identity-not-demonstrated",
    v381PerBandIdentityModel:
      "qualified-three-lanes-independent-instrument-identities",
    v381MeasuredBandAuthorities: "missing-0-of-3-present",
    v381NextRequiredInput:
      "one-traceable-measured-detector-and-geometry-pair-for-one-band",
    v381RuntimeConsumer: "v11-spectral-authority-patch-bay-wired",
    v381PromotionBoundary: "zero-authority-zero-image-zero-observed-counts",
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
      legacyScientificFusion:
        pointer.capabilities.v381LegacyScientificFusion,
      perBandIdentityModel: pointer.capabilities.v381PerBandIdentityModel,
      measuredBandAuthorities:
        pointer.capabilities.v381MeasuredBandAuthorities,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
