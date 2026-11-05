import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_HIGH_ENERGY_ACQUISITION_ARTIFACT_VERSION_V427,
  KERR_HIGH_ENERGY_ACQUISITION_PACK_VERSION_V427,
  KERR_V426_ARTIFACT_SHA256_V427,
  KERR_V426_EVIDENCE_SHA256_V427,
  KERR_V426_FILE_SHA256_V427,
  KERR_V426_POINTER_SHA256_V427,
  canonicalShaV427,
  parseKerrHighEnergyResponseAcquisitionArtifactV427,
  validateKerrHighEnergyResponseSubmissionV427,
  type KerrHighEnergyAcquisitionPackFileV427,
  type KerrHighEnergyResponseAcquisitionPackArtifactV427,
  type KerrHighEnergyResponseAcquisitionSubmissionV427,
  type KerrHighEnergyResponseValidatorMetricsV427,
} from "../app/lib/kerrHighEnergyResponseAcquisitionPackV427";

const root = process.cwd();
const outputRoot = "dist/science/kerr-high-energy-response-acquisition-pack-v427";
const paths = {
  v426: "dist/science/kerr-high-energy-response-v426/response-contract.json",
  v426Evidence: "dist/science/orbit-atlas-shadow-v426-evidence.json",
  v426Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v426.json",
  oracle: `${outputRoot}/validator-oracle.json`,
  fixture: `${outputRoot}/validator-fixture.json`,
  artifact: `${outputRoot}/acquisition-pack.json`,
} as const;

const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8")) as Record<string, unknown>;
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const csv = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
function atomicText(path: string, value: string): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value, "utf8");
  renameSync(temporary, target);
}

function maxDifference(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") return Math.abs(left - right);
  if (Array.isArray(left) && Array.isArray(right) && left.length === right.length) return Math.max(0, ...left.map((entry, index) => maxDifference(entry, right[index])));
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    if (keys.length !== Object.keys(rightRecord).length || keys.some((key) => !Object.hasOwn(rightRecord, key))) return Number.POSITIVE_INFINITY;
    return Math.max(0, ...keys.map((key) => maxDifference(leftRecord[key], rightRecord[key])));
  }
  return left === right ? 0 : Number.POSITIVE_INFINITY;
}

const v426 = read(paths.v426);
const v426Evidence = read(paths.v426Evidence);
const v426Pointer = read(paths.v426Pointer);
const oracle = read(paths.oracle) as Readonly<{
  status: string;
  artifactSha256: string;
  fixtureFileSha256: string;
  metrics: KerrHighEnergyResponseValidatorMetricsV427;
  mutationCatalog: readonly string[];
}>;
const fixture = read(paths.fixture) as KerrHighEnergyResponseAcquisitionSubmissionV427;
if (
  fileSha(paths.v426) !== KERR_V426_FILE_SHA256_V427 ||
  v426.artifactSha256 !== KERR_V426_ARTIFACT_SHA256_V427 ||
  fileSha(paths.v426Evidence) !== "51776e08d6394082edbbf7593d13eb8fdd010893a1ed19ccbb8a57b60184b9a2" ||
  v426Evidence.evidenceSha256 !== KERR_V426_EVIDENCE_SHA256_V427 ||
  fileSha(paths.v426Pointer) !== "ebef90d600ea0ffe4546e344112db2a4c46edfc48b468fffb9ba9f886023e369" ||
  v426Pointer.pointerSha256 !== KERR_V426_POINTER_SHA256_V427 ||
  oracle.status !== "qualified-validator-fixture-oracle-nonpublishable-no-measured-authority" ||
  oracle.fixtureFileSha256 !== fileSha(paths.fixture)
) throw new Error("v427-source-lock");

const fixtureValidation = validateKerrHighEnergyResponseSubmissionV427(fixture);
if (
  fixtureValidation.status !== "validated-test-fixture-nonpublishable" ||
  !fixtureValidation.valid ||
  fixtureValidation.measuredAuthorityGranted ||
  fixtureValidation.scienceResponseApplicationAllowed ||
  maxDifference(fixtureValidation.metrics, oracle.metrics) >= 1e-12
) throw new Error(`v427-validator-oracle-difference:${maxDifference(fixtureValidation.metrics, oracle.metrics)}`);

type Mutable<T> = { -readonly [Property in keyof T]: T[Property] extends readonly (infer Item)[] ? Mutable<Item>[] : T[Property] extends object ? Mutable<T[Property]> : T[Property] };
function mutateFixture(id: string): unknown {
  const value = structuredClone(fixture) as Mutable<KerrHighEnergyResponseAcquisitionSubmissionV427>;
  switch (id) {
    case "duplicate-measurement-id": value.effectiveAreaRows[1] = { ...value.effectiveAreaRows[1], measurementId: value.effectiveAreaRows[0].measurementId }; break;
    case "missing-energy-repeat": value.effectiveAreaRows = value.effectiveAreaRows.slice(0, -1); break;
    case "invalid-modulation": value.modulationRows[0] = { ...value.modulationRows[0], modulationFactor: 1.5 }; break;
    case "redistribution-not-normalized": value.redistributionRows[0] = { ...value.redistributionRows[0], probability: value.redistributionRows[0].probability + 0.1 }; break;
    case "negative-background": value.backgroundRows[0] = { ...value.backgroundRows[0], rateCountsPerS: -1 }; break;
    case "response-covariance-missing-cell": value.responseCovarianceRows = value.responseCovarianceRows.slice(0, -1); break;
    case "response-covariance-asymmetric": value.responseCovarianceRows[1] = { ...value.responseCovarianceRows[1], covariance: value.responseCovarianceRows[1].covariance + 0.01 }; break;
    case "response-covariance-not-psd": value.responseCovarianceRows[0] = { ...value.responseCovarianceRows[0], covariance: -1 }; break;
    case "redistribution-covariance-missing-cell": value.redistributionCovarianceRows = value.redistributionCovarianceRows.slice(0, -1); break;
    case "redistribution-covariance-asymmetric": value.redistributionCovarianceRows[1] = { ...value.redistributionCovarianceRows[1], covariance: value.redistributionCovarianceRows[1].covariance + 0.01 }; break;
    case "redistribution-covariance-simplex-violation": value.redistributionCovarianceRows[0] = { ...value.redistributionCovarianceRows[0], covariance: value.redistributionCovarianceRows[0].covariance + 0.01 }; break;
    case "measured-attestation-mismatch": value.identity = { ...value.identity, sourceKind: "measured-import" }; break;
    default: throw new Error(`v427-unknown-mutation:${id}`);
  }
  return value;
}

const mutationResults = oracle.mutationCatalog.map((id) => ({ id, result: validateKerrHighEnergyResponseSubmissionV427(mutateFixture(id)) }));
const rejectedMutationCount = mutationResults.filter((entry) => !entry.result.valid && entry.result.status === "rejected-invalid-submission").length;
if (oracle.mutationCatalog.length !== 12 || rejectedMutationCount !== oracle.mutationCatalog.length) throw new Error(`v427-mutation-rejection:${rejectedMutationCount}`);

const manifestTemplate = {
  version: "v427-kerr-high-energy-response-acquisition-manifest-template-v1",
  templateOnly: true,
  admissibleAsMeasured: false,
  basedOnV426ArtifactSha256: KERR_V426_ARTIFACT_SHA256_V427,
  identity: { measuredAcquisition: null, architecture: "band-appropriate-energy-resolved-polarimeter", manufacturer: null, model: null, serialOrCampaignId: null, performedAtUtc: null, laboratoryOrArchive: null },
  trueEnergyBins: [],
  detectorChannels: [],
  files: {
    effectiveArea: "effective-area.template.csv",
    modulation: "modulation.template.csv",
    redistribution: "redistribution.template.csv",
    background: "background.template.csv",
    responseCovariance: "response-covariance.template.csv",
    redistributionCovariance: "redistribution-covariance.template.csv",
  },
  acquisition: { requiredRepeatCount: null, deadTimeModel: null, pileupModel: null },
  provenance: { sourceUrl: null, licenseOrTerms: null, processingParametersSha256: null, fileSha256: {}, attestation: null },
  admissionBoundary: "template-is-empty-and-cannot-be-admitted-without-real-measurements-file-shas-and-independent-validation",
};

const templates = {
  "effective-area.template.csv": "measurementId,binId,repeatIndex,effectiveAreaM2,includesQuantumEfficiency,exposureTimeS,detectorTemperatureK,rawArtifactSha256\n",
  "modulation.template.csv": "measurementId,binId,repeatIndex,modulationFactor,polarizationAngleZeroDeg,exposureTimeS,detectorTemperatureK,rawArtifactSha256\n",
  "redistribution.template.csv": "measurementId,trueEnergyBinId,detectorChannelId,repeatIndex,probability,exposureTimeS,detectorTemperatureK,rawArtifactSha256\n",
  "background.template.csv": "measurementId,detectorChannelId,repeatIndex,rateCountsPerS,exposureTimeS,detectorTemperatureK,rawArtifactSha256\n",
  "response-covariance.template.csv": "rowParameterId,columnParameterId,covariance,unitProduct,rawArtifactSha256\n",
  "redistribution-covariance.template.csv": "trueEnergyBinId,rowChannelId,columnChannelId,covariance,rawArtifactSha256\n",
} as const;

const tasks = [
  ["HX-01", "identity", "Record instrument, campaign, UTC and laboratory identity", "identity-and-measured-attestation", "not-run"],
  ["HX-02", "grid", "Declare contiguous true-energy bins and detector channels", "energy-and-channel-grid", "not-run"],
  ["HX-03", "effective-area", "Acquire repeated effective-area measurements with QE declaration", "effective-area", "not-run"],
  ["HX-04", "polarimetry", "Acquire repeated modulation factor and angle-zero measurements", "modulation-and-angle-zero", "not-run"],
  ["HX-05", "redistribution", "Acquire complete true-energy by detector-channel response", "redistribution-matrix", "not-run"],
  ["HX-06", "background", "Acquire repeated detector-channel background measurements", "background", "not-run"],
  ["HX-07", "covariance", "Estimate full response-parameter covariance", "response-covariance", "not-run"],
  ["HX-08", "simplex", "Estimate per-energy redistribution simplex covariance", "redistribution-covariance", "not-run"],
  ["HX-09", "event-loss", "Document dead-time model and raw validation artifacts", "dead-time", "not-run"],
  ["HX-10", "event-loss", "Document pileup model and raw validation artifacts", "pileup", "not-run"],
  ["HX-11", "provenance", "Freeze raw files, processing parameters, terms and SHA-256", "provenance", "not-run"],
  ["HX-12", "validation", "Run independent scientific validation after structural admission", "independent-validation", "not-run"],
] as const;
const acquisitionPlan = `taskId,phase,instruction,constrains,executionStatus\n${tasks.map((row) => row.map(csv).join(",")).join("\n")}\n`;
const readme = `# Orbit Atlas high-energy response acquisition pack v427

This bundle is an empty hand-off package for an experimental XUV/X-ray energy-resolved polarimeter response campaign. It contains no measured detector values and grants no response, detector-count, image or scientific authority.

## Rules

- Keep every measurement CSV empty until real acquisition begins; never insert example performance values.
- Use globally unique measurement IDs and at least two repeats for every required bin/channel combination.
- Preserve exposure time, detector temperature and raw-artifact SHA-256 on every measurement row.
- Provide a complete row-stochastic redistribution matrix for every repeat.
- Provide a complete symmetric positive-semidefinite 24 x 24 response covariance.
- Provide one symmetric positive-semidefinite 6 x 6 redistribution covariance per energy bin; every covariance row must sum to zero.
- Declare dead-time and pileup models; preserve raw artifacts, processing parameters, source terms and attestation.
- Structural validator success never grants measured-response authority. Independent scientific validation remains mandatory.

The included validator fixture is outside the acquisition ZIP, is explicitly nonpublishable and may never enter a Science payload.
`;

const generated = [
  { id: "manifest-template", relativePath: "manifest.template.json", mediaType: "application/json", value: `${JSON.stringify(manifestTemplate, null, 2)}\n`, dataRowCount: 0, measurementTemplate: true },
  ...Object.entries(templates).map(([relativePath, value]) => ({ id: relativePath.replace(".template.csv", "-template"), relativePath, mediaType: "text/csv", value, dataRowCount: 0, measurementTemplate: true })),
  { id: "acquisition-plan", relativePath: "acquisition-plan.csv", mediaType: "text/csv", value: acquisitionPlan, dataRowCount: tasks.length, measurementTemplate: false },
  { id: "readme", relativePath: "README.md", mediaType: "text/markdown", value: readme, dataRowCount: 0, measurementTemplate: false },
] as const;
if (generated.length !== 9 || generated.filter((entry) => entry.measurementTemplate).length !== 7 || generated.filter((entry) => entry.measurementTemplate).some((entry) => entry.dataRowCount !== 0)) throw new Error("v427-empty-template-boundary");
for (const file of generated) atomicText(`${outputRoot}/${file.relativePath}`, file.value);
const files = Object.freeze(generated.map((file): KerrHighEnergyAcquisitionPackFileV427 => {
  const relative = `${outputRoot}/${file.relativePath}`;
  return Object.freeze({ id: file.id, relativePath: file.relativePath, mediaType: file.mediaType, bytes: bytes(relative).byteLength, sha256: fileSha(relative), dataRowCount: file.dataRowCount, measurementTemplate: file.measurementTemplate, admissibleAsMeasured: false });
}));
const validatorFixtureDataRowCount = fixtureValidation.metrics.effectiveAreaRowCount + fixtureValidation.metrics.modulationRowCount + fixtureValidation.metrics.redistributionRowCount + fixtureValidation.metrics.backgroundRowCount + fixtureValidation.metrics.responseCovarianceRowCount + fixtureValidation.metrics.redistributionCovarianceRowCount;
const generatedAt = String(v426.generatedAt);
const unsigned = {
  version: KERR_HIGH_ENERGY_ACQUISITION_ARTIFACT_VERSION_V427,
  generatedAt,
  status: "qualified-empty-response-acquisition-pack-and-validator-measured-authority-unavailable" as const,
  sourceFiles: Object.freeze({ v426ArtifactFileSha256: KERR_V426_FILE_SHA256_V427, v426EvidenceFileSha256: fileSha(paths.v426Evidence), v426PointerFileSha256: fileSha(paths.v426Pointer), pythonOracleFileSha256: fileSha(paths.oracle) }),
  pythonOracleArtifactSha256: oracle.artifactSha256,
  view: Object.freeze({
    version: KERR_HIGH_ENERGY_ACQUISITION_PACK_VERSION_V427,
    status: "qualified-empty-response-acquisition-pack-and-validator-measured-authority-unavailable" as const,
    source: Object.freeze({ v426ArtifactSha256: KERR_V426_ARTIFACT_SHA256_V427, v426EvidenceSha256: KERR_V426_EVIDENCE_SHA256_V427, v426PointerSha256: KERR_V426_POINTER_SHA256_V427 }),
    files,
    counts: Object.freeze({ packFileCount: 9 as const, measurementTemplateCount: 7 as const, measurementTemplateDataRowCount: 0 as const, acquisitionPlanTaskCount: tasks.length, validatorFixtureDataRowCount, measuredSubmissionCount: 0 as const, measuredDataRowCount: 0 as const, scienceResponseApplicationCount: 0 as const }),
    validator: Object.freeze({ schemaQualified: true as const, independentFixtureQualified: true as const, fixtureStatus: "validated-test-fixture-nonpublishable" as const, fixtureMetrics: fixtureValidation.metrics, invalidFixtureMutationCount: oracle.mutationCatalog.length, invalidFixtureRejectionCount: rejectedMutationCount, measuredSubmissionStatus: "unavailable-zero-measured-rows" as const }),
    products: Object.freeze({ deterministicZip: "available-empty-measurement-templates-only" as const, acquisitionPlanFits: "available-plan-table-no-measured-response" as const, architecturePng: "available-workflow-diagram-not-detector-image" as const, validatorFixture: "available-nonpublishable-validator-test-only" as const, measuredResponse: "unavailable" as const }),
    authorityBoundary: Object.freeze({ packSchemaAuthorityGranted: true as const, validatorAuthorityGranted: true as const, fixturePerformanceAuthorityGranted: false as const, measuredResponseAuthorityGranted: false as const, scienceProjectionAuthorityGranted: false as const, detectorAuthorityGranted: false as const, pixelRasterAuthorityGranted: false as const, denseAuthorityGranted: false as const, unavailableIsNotZero: true as const }),
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
    boundary: "empty-acquisition-templates-and-validator-only-no-measured-response-science-projection-detector-counts-pixel-raster-or-dense-authority" as const,
  }),
  deterministicReplay: true as const,
  networkAttempted: false as const,
  denseShardExecuted: false as const,
  measuredSubmissionPresent: false as const,
  measuredDataRowCount: 0 as const,
  scienceResponseApplicationCount: 0 as const,
  artifactSha256: "pending",
};
const artifact = parseKerrHighEnergyResponseAcquisitionArtifactV427({ ...unsigned, artifactSha256: canonicalShaV427(unsigned) }) as KerrHighEnergyResponseAcquisitionPackArtifactV427;
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, files: artifact.view.counts.packFileCount, emptyMeasurementTemplates: artifact.view.counts.measurementTemplateCount, measuredRows: artifact.view.counts.measuredDataRowCount, fixtureRows: artifact.view.counts.validatorFixtureDataRowCount, rejectedMutations: rejectedMutationCount }, null, 2));
