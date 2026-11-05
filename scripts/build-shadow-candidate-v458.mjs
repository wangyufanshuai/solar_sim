import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v457-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v457.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  contract: "dist/science/kerr-measured-detector-intake-v458/intake-contract.json",
  schema: "dist/science/kerr-measured-detector-intake-v458/schema-pack.json",
  gate: "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v458-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v458.json",
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
const intake = read(paths.intake);
const gate = read(paths.gate);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v457-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v457" ||
  intake.version !== "v458-kerr-measured-detector-intake-artifact-v1" ||
  intake.status !==
    "intake-protocol-qualified-staging-missing-measured-authority-blocked" ||
  intake.contract?.requiredFileCount !== 6 ||
  intake.schemaPack?.schemaCount !== 6 ||
  intake.validator?.qualified !== true ||
  intake.validator?.acceptedSyntheticControlCount !== 1 ||
  intake.validator?.syntheticControlAuthorityGranted !== false ||
  intake.validator?.rejectedAdversarialFixtureCount !== 11 ||
  intake.inspect?.stagingRootPresent !== false ||
  intake.inspect?.readyFileCount !== 0 ||
  intake.inspect?.missingFileIds?.length !== 6 ||
  intake.productionAdmission?.measuredDetectorAuthorityGranted !== false ||
  intake.productionAdmission?.runtimeProjectionAllowed !== false ||
  intake.productionAdmission?.scienceRasterAllowed !== false ||
  intake.boundary?.fitsWriteAllowed !== false ||
  intake.boundary?.pngWriteAllowed !== false ||
  intake.boundary?.sciencePayloadMutationAllowed !== false ||
  gate.decisions?.promotionAllowed !== false ||
  gate.decisions?.fitsWriteAllowed !== false ||
  gate.decisions?.pngWriteAllowed !== false ||
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
  throw new Error("v458-evidence-boundary");
}

const sourcePaths = [
  paths.intake,
  paths.contract,
  paths.schema,
  paths.previousEvidence,
  paths.previousPointer,
  paths.gate,
  paths.dense,
  "app/lib/kerrMeasuredDetectorIntakeEnvelopeV458.ts",
  "app/lib/kerrMeasuredDetectorIntakeValidatorV458.ts",
  "app/lib/kerrMeasuredDetectorIntakeServerV458.ts",
  "app/lib/kerrMeasuredDetectorIntakeClientV458.ts",
  "app/components/KerrMeasuredDetectorDataAirlockV458.tsx",
  "app/api/atlas/relativity-evidence/v458/measured-detector-intake/route.ts",
  "app/local-shadow-v458/page.tsx",
  "scripts/build-kerr-measured-detector-intake-v458.ts",
  "scripts/build-shadow-candidate-v458.mjs",
  "scripts/verify-shadow-v458-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v458-measured-detector-intake-protocol-qualified-production-staging-0-of-6-blocked-science-product-promotion-remains-closed";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v458-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v457EvidenceSha256: previousEvidence.evidenceSha256,
    v457PointerSha256: previousPointer.pointerSha256,
    v457EvidenceFileSha256: fileSha(paths.previousEvidence),
    v457PointerFileSha256: fileSha(paths.previousPointer),
    v458ArtifactSha256: intake.artifactSha256,
    v458ArtifactFileSha256: fileSha(paths.intake),
    v458SchemaPackSha256: intake.schemaPack.schemaPackSha256,
    v457PromotionGateSha256: gate.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  measuredDetectorIntake: {
    status: intake.status,
    requiredFileCount: 6,
    readyFileCount: 0,
    missingFileIds: intake.inspect.missingFileIds,
    schemaCount: 6,
    crossFileIdentityRequired: true,
    provenanceShaForFiveInputsRequired: true,
    licenseSnapshotRequired: true,
    independentValidationRequired: true,
    explicitAuthorityGrantRequired: true,
  },
  validator: {
    qualified: true,
    acceptedSyntheticControlCount: 1,
    syntheticControlAuthorityGranted: false,
    rejectedAdversarialFixtureCount: 11,
    adversarialFixtures: intake.validator.adversarialFixtures,
  },
  authorityBoundary: {
    measuredInputInventory: "blocked-0-of-6",
    measuredDetectorAuthority: "not-granted",
    runtimeProjection: "blocked",
    scienceRaster: "blocked",
    scienceProductPromotion: "blocked-fail-closed",
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    syntheticMayGrantAuthority: false,
    sciencePayloadMutationAllowed: false,
  },
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v458/page.tsx",
    component: "KerrMeasuredDetectorDataAirlockV458",
    boundedSummaryBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    exports: ["inspect", "contract", "schema"],
    canvasCreated: false,
    runtimeStagingRequestAllowed: false,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    schemaPack: "qualified",
    boundedValidator: "qualified",
    syntheticProductionFirewall: "qualified",
    measuredDetectorIntake: "blocked-0-of-6",
    independentDetectorValidation: "not-run",
    explicitMeasuredAuthorityGrant: "not-granted",
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
  boundary:
    "v458-intake-protocol-only-no-measured-data-authority-runtime-projection-science-image-or-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: canonicalSha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v458",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v457PromotionGate: "blocked-fail-closed",
    v458SchemaPack: "qualified-six-input-contracts",
    v458BoundedValidator: "qualified-eleven-adversarial-rejections",
    v458SyntheticProductionFirewall: "qualified-authority-false",
    v458ProductionStaging: "blocked-0-of-6",
    v458CrossFileIdentity: "blocked-no-production-inputs",
    v458ProvenanceShaLinkage: "blocked-no-production-inputs",
    v458LicenseBoundary: "blocked-no-production-inputs",
    v458IndependentValidation: "not-run",
    v458MeasuredDetectorAuthority: "not-granted",
    v458RuntimeProjection: "blocked",
    v458ScienceRaster: "blocked",
    v458BrowserQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
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
      artifactSha256: intake.artifactSha256,
      schemaPackSha256: intake.schemaPack.schemaPackSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      productionStaging: "0/6",
      syntheticControlAuthority: false,
      adversarialFixturesRejected: 11,
      measuredDetectorAuthority: "not-granted",
      promotionAllowed: false,
      denseCampaign: dense.status,
    },
    null,
    2,
  ),
);
