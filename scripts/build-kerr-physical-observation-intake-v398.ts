import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createKerrPhysicalObservationIntakeAdversarialFixturesV398,
  createKerrPhysicalObservationIntakeControlV398,
  parseKerrPhysicalObservationIntakeArtifactV398,
  validateKerrPhysicalObservationIntakeV398,
  V398_MAX_FILE_BYTES,
  V398_MAX_PACK_BYTES,
  V398_MAX_TOTAL_BYTES,
  V398_STAGING_ROOT,
} from "../app/lib/kerrPhysicalObservationIntakeV398";
import { parseKerrCovarianceSourceAdmissionArtifactV393 } from "../app/lib/kerrCovarianceSourceDossierV393";
import { parseKerrTemperatureSystematicsTransferArtifactV390 } from "../app/lib/kerrTemperatureSystematicsTransferV390";

const root = process.cwd();
const paths = {
  transfer: "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  sourceAdmission: "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
  constraint: "dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json",
  admission: "dist/science/kerr-physical-observation-admission-v397/observation-admission.json",
  v397Evidence: "dist/science/orbit-atlas-shadow-v397-evidence.json",
  stagingManifest: `${V398_STAGING_ROOT}/manifest.json`,
  artifact: "dist/science/kerr-physical-observation-intake-v398/intake-inspect.json",
};
const bytes = (path: string, maximum: number) => { const target = resolve(root, path); const metadata = statSync(target); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error(`v398-input-size:${path}`); return readFileSync(target); };
const read = (path: string, maximum = 128 * 1024) => JSON.parse(bytes(path, maximum).toString("utf8"));
const shaBytes = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => shaBytes(JSON.stringify(canonicalize(value)));
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(read(paths.transfer));
const sourceAdmission = parseKerrCovarianceSourceAdmissionArtifactV393(read(paths.sourceAdmission));
const constraint = read(paths.constraint) as { artifactSha256?: string; source?: { fullShortAuthoritySha256?: string } };
const admission = read(paths.admission) as { artifactSha256?: string; status?: string };
const v397Evidence = read(paths.v397Evidence) as { evidenceSha256?: string };
if (typeof constraint.artifactSha256 !== "string" || typeof constraint.source?.fullShortAuthoritySha256 !== "string" || typeof admission.artifactSha256 !== "string" || admission.status !== "observation-admission-contract-qualified-physical-pack-unavailable" || typeof v397Evidence.evidenceSha256 !== "string") throw new Error("v398-dependency-identity");
const v396Sha256 = constraint.artifactSha256;
const v397Sha256 = admission.artifactSha256;
const control = createKerrPhysicalObservationIntakeControlV398(transfer, sourceAdmission, v397Sha256, v396Sha256);
const controlValidation = validateKerrPhysicalObservationIntakeV398(control.manifest, control.observedFiles, control.pack, transfer, sourceAdmission, v397Sha256, v396Sha256);
if (controlValidation.status !== "admitted-validation-only" || controlValidation.compileAllowed !== false || controlValidation.publicationAllowed !== false || controlValidation.checkedFileCount !== 13) throw new Error("v398-control-validation");
const fixtures = createKerrPhysicalObservationIntakeAdversarialFixturesV398(transfer, sourceAdmission, v397Sha256, v396Sha256).map((fixture) => { const result = validateKerrPhysicalObservationIntakeV398(fixture.manifest, fixture.observedFiles, fixture.pack, transfer, sourceAdmission, v397Sha256, v396Sha256); if (result.status !== "rejected" || !result.rejectionReasons.includes(fixture.expectedReason)) throw new Error(`v398-attack:${fixture.id}`); return Object.freeze({ id: fixture.id, expectedReason: fixture.expectedReason, observedReason: fixture.expectedReason, rejected: true as const }); });
const stagingManifestPresent = existsSync(resolve(root, paths.stagingManifest));
if (stagingManifestPresent) throw new Error("v398-staging-present-explicit-compile-required");
const unsigned = {
  version: "v398-kerr-physical-observation-intake-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "local-intake-compiler-qualified-physical-staging-unavailable-compile-not-run" as const,
  source: Object.freeze({ v397AdmissionArtifactSha256: v397Sha256, v397EvidenceSha256: v397Evidence.evidenceSha256, fullShortAuthoritySha256: constraint.source.fullShortAuthoritySha256 }),
  schema: Object.freeze({ stagingRoot: V398_STAGING_ROOT, expectedFileCount: 13 as const, requiredPackCount: 1 as const, requiredSourceDataCount: 3 as const, requiredSourceProvenanceCount: 3 as const, requiredLicenseSnapshotCount: 3 as const, requiredCrossEvidenceCount: 3 as const, maximumPackBytes: V398_MAX_PACK_BYTES, maximumFileBytes: V398_MAX_FILE_BYTES, maximumTotalBytes: V398_MAX_TOTAL_BYTES, pathTraversalForbidden: true as const, absolutePathForbidden: true as const, atomicPublicationRequired: true as const }),
  validator: Object.freeze({ qualified: true as const, acceptedControlFixtureCount: 1 as const, rejectedAdversarialFixtureCount: 10 as const, adversarialFixtures: Object.freeze(fixtures) }),
  inspect: Object.freeze({ stagingManifestPresent: false as const, presentFileCount: 0 as const, expectedFileCount: 13 as const, compileExecuted: false as const, candidatePublished: false as const, attemptConsumed: false as const }),
  productionAdmission: Object.freeze({ physicalIntakeManifestAvailable: false as const, physicalObservationPackAvailable: false as const, allSourceFilesVerified: false as const, allLicenseSnapshotsVerified: false as const, allCrossEvidenceVerified: false as const, physicalPackCompiled: false as const, physicalPackPublished: false as const, measuredAuthorityGranted: false as const }),
  qualification: Object.freeze({ intakeManifestContractQualified: true as const, boundedFileVerifierQualified: true as const, atomicCompilerImplemented: true as const, physicalObservationIntakeQualified: false as const, measuredAuthorityGranted: false as const }),
  compileCommand: "npm run atlas -- relativity measurement-authority-v398-compile" as const,
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrPhysicalObservationIntakeArtifactV398({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
atomic(paths.artifact, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, expectedFiles: artifact.schema.expectedFileCount, stagingManifestPresent: false, compileExecuted: false, candidatePublished: false, measuredAuthorityGranted: false }, null, 2));
