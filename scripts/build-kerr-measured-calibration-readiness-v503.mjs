import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  provenance:
    "dist/science/kerr-measured-detector-provenance-v464/provenance-observatory.json",
  response: "dist/science/kerr-detector-response-v465/response-contract.json",
  admission:
    "dist/science/kerr-topology-detector-admission-v501/admission-bridge.json",
  output:
    "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
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
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(part, target);
};

const intake = read(paths.intake);
const provenance = read(paths.provenance);
const response = read(paths.response);
const admission = read(paths.admission);
if (
  intake.version !== "v458-kerr-measured-detector-intake-artifact-v1" ||
  sha(intake) !== intake.artifactSha256 ||
  intake.inspect.readyFileCount !== 0 ||
  intake.inspect.missingFileIds.length !== 6 ||
  intake.schemaPack.schemaCount !== 6 ||
  provenance.version !== "v464-kerr-measured-detector-provenance-observatory-artifact-v1" ||
  sha(provenance) !== provenance.artifactSha256 ||
  provenance.admission.reason !== "measured-files-missing" ||
  response.version !== "v465-kerr-detector-response-contract-artifact-v1" ||
  sha(response) !== response.artifactSha256 ||
  response.boundary.productionResponseExecutable !== false ||
  admission.version !== "v501-kerr-topology-detector-admission-artifact-v1" ||
  sha(admission) !== admission.artifactSha256 ||
  admission.audit.passedGateCount !== 3 ||
  admission.audit.blockingGateCount !== 8 ||
  admission.decision.admitted !== false
) {
  throw new Error("v503-upstream-boundary");
}

const files = intake.schemaPack.schemas.map((schema) => {
  const observed = intake.inspect.files.find((file) => file.id === schema.id);
  if (!observed || observed.status !== "missing" || observed.bytes !== 0) {
    throw new Error(`v503-unexpected-file-state:${schema.id}`);
  }
  return {
    id: schema.id,
    fileName: schema.fileName,
    format: schema.format,
    schemaVersion: schema.schemaVersion,
    requiredFields: schema.requiredFields,
    unitContract: schema.unitContract,
    status: "missing",
    bytes: 0,
    sha256: null,
    provenanceLink:
      schema.id === "provenance"
        ? "self-provenance-record"
        : `provenance.fileSha256.${schema.id}`,
  };
});
const checklist = [
  {
    id: "topology-authority-chain",
    passed: true,
    evidence: `v501:${admission.source.v500IntegrationSha256}`,
    requiredForAuthority: true,
  },
  {
    id: "detector-schema-pack",
    passed: true,
    evidence: `v458:${intake.schemaPack.schemaPackSha256}`,
    requiredForAuthority: true,
  },
  {
    id: "synthetic-production-firewall",
    passed: true,
    evidence: "v458:synthetic-control-authority=false",
    requiredForAuthority: true,
  },
  {
    id: "measured-file-inventory",
    passed: false,
    evidence: "v458:ready=0/6",
    requiredForAuthority: true,
  },
  {
    id: "cross-file-identity",
    passed: false,
    evidence: "requires shared instrumentId/detectorId/campaignId",
    requiredForAuthority: true,
  },
  {
    id: "five-input-sha-linkage",
    passed: false,
    evidence: "requires provenance.fileSha256 for identity/plate-scale/distortion/psf/pixel-response",
    requiredForAuthority: true,
  },
  {
    id: "source-license-snapshot",
    passed: false,
    evidence: "requires HTTPS source URL, terms URL, license and source SHA",
    requiredForAuthority: true,
  },
  {
    id: "independent-validation",
    passed: false,
    evidence: "v464:independentValidationQualified=false",
    requiredForAuthority: true,
  },
  {
    id: "explicit-authority-grant",
    passed: false,
    evidence: "v464:authorityGranted=false",
    requiredForAuthority: true,
  },
  {
    id: "blind-validation",
    passed: false,
    evidence: "v459:measured-authority-unavailable",
    requiredForAuthority: true,
  },
  {
    id: "production-response",
    passed: false,
    evidence: "v465:productionResponseExecutable=false",
    requiredForAuthority: true,
  },
];
const passedGateCount = checklist.filter((gate) => gate.passed).length;
const sourcePaths = [
  paths.intake,
  paths.provenance,
  paths.response,
  paths.admission,
  "app/lib/kerrMeasuredCalibrationReadinessV503.ts",
  "app/lib/kerrMeasuredCalibrationReadinessV503.test.ts",
  "app/lib/kerrMeasuredCalibrationReadinessServerV503.ts",
  "app/lib/kerrMeasuredCalibrationReadinessServerV503.test.ts",
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/api/atlas/relativity-evidence/v503/detector-calibration-readiness/route.ts",
  "app/api/atlas/relativity-evidence/v503/detector-calibration-readiness/route.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV503.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV503.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV503.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV503.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-kerr-measured-calibration-readiness-v503.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v503-kerr-measured-calibration-readiness-artifact-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "readiness-protocol-qualified-measured-calibration-pack-missing",
  source: {
    v458ArtifactSha256: intake.artifactSha256,
    v464ArtifactSha256: provenance.artifactSha256,
    v465ArtifactSha256: response.artifactSha256,
    v501ArtifactSha256: admission.artifactSha256,
  },
  contract: {
    stagingRoot: intake.contract.stagingRoot,
    requiredFileCount: 6,
    readyFileCount: 0,
    maximumFileBytes: intake.contract.maximumFileBytes,
    maximumTotalBytes: intake.contract.maximumTotalBytes,
    crossFileIdentityRequired: true,
    provenanceShaForFiveInputsRequired: true,
    licenseSnapshotRequired: true,
    independentValidationRequired: true,
    explicitAuthorityGrantRequired: true,
    blindValidationRequired: true,
    productionResponseRequired: true,
  },
  files,
  checklist,
  decision: {
    admitted: false,
    reason: "measured-files-missing",
    readyFileCount: 0,
    missingFileCount: 6,
    passedGateCount,
    blockingGateCount: checklist.length - passedGateCount,
    nextAction: "provide-six-measured-files-with-provenance",
  },
  outputs: {
    detectorResponse: "unavailable",
    observedCounts: "unavailable",
    observedIntensity: "unavailable",
    scienceRaster: "unavailable",
    fitsProducts: 0,
    pngProducts: 0,
  },
  boundary: {
    stagingInspectedByV503: false,
    networkAttempted: false,
    missingFilesGenerated: false,
    syntheticAuthorityAllowed: false,
    runtimePackagingAllowed: false,
    sciencePayloadMutationAllowed: false,
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  formalProductPointer: "v263",
  formalDefaultKernel: "legacy-eih-1pn",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      files: "0/6",
      passedGates: passedGateCount,
      blockingGates: checklist.length - passedGateCount,
      stagingInspected: false,
      networkAttempted: false,
      detectorResponse: "unavailable",
      scienceRaster: "unavailable",
    },
    null,
    2,
  ),
);
