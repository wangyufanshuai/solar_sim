import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrDetectorCalibrationPlanV363 } from "../app/lib/kerrDetectorCalibrationPlanV363";
import { parseKerrDetectorCalibrationPackV364, validateCalibrationPlanSourceV364, type KerrDetectorCalibrationPackFileV364 } from "../app/lib/kerrDetectorCalibrationPackV364";

const root = process.cwd();
const outputRoot = "dist/science/kerr-detector-calibration-pack-v364";
const planPath = "dist/science/kerr-detector-calibration-plan-v363/plan.json" as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomicText = (path: string, value: string) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, value); renameSync(temporary, target); };
const csv = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;

const plan = parseKerrDetectorCalibrationPlanV363(JSON.parse(bytes(planPath).toString("utf8")));
validateCalibrationPlanSourceV364(plan);
const manifestTemplate = {
  version: "v364-empty-detector-calibration-manifest-template-v1",
  templateOnly: true,
  admissibleAsMeasured: false,
  basedOnPlanArtifactSha256: plan.artifactSha256,
  measuredCalibration: null,
  instrument: { manufacturer: null, model: null, serialOrCampaignId: null },
  calibration: { performedAtUtc: null, laboratoryOrArchive: null, detectorTemperatureK: null, exposureTimeS: null },
  response: { throughputCsv: "throughput.template.csv", requiredBands: ["visible", "euv", "soft-x-ray"], wavelengthUnit: "m", throughputUnit: "dimensionless" },
  noise: { noiseCsv: "noise.template.csv", requiredKinds: ["gain", "bias", "dark", "background"], gainUnit: "electron/adu", readNoiseUnit: "electron/pixel/read", darkCurrentUnit: "electron/pixel/s", backgroundUnit: "electron/pixel/exposure" },
  provenance: { sourceUrl: null, licenseOrTerms: null, rawArtifactSha256: null, normalizedArtifactSha256: null, processingParametersSha256: null },
  admissionBoundary: "must-be-compiled-from-validated-real-measurements-template-cannot-pass-v361",
};
const throughputTemplate = "bandId,wavelengthM,throughput,repeatIndex,detectorTemperatureK,rawArtifactSha256\n";
const noiseTemplate = "acquisitionId,kind,bandId,exposureTimeS,detectorTemperatureK,meanAdu,varianceAduSquared,referenceElectrons,rawArtifactSha256\n";
const acquisitionHeader = "id,phase,label,coversRequirements,constrainsParameters,plannedCount,plannedCountUnit,design,acceptanceEvidence,executionStatus\n";
const acquisitionRows = plan.acquisitionTasks.map((task) => [task.id, task.phase, task.label, task.coversRequirements.join("|"), task.constrainsParameters.join("|"), task.plannedCount, task.plannedCountUnit, task.design, task.acceptanceEvidence, task.executionStatus].map(csv).join(",")).join("\n");
const acquisitionPlan = `${acquisitionHeader}${acquisitionRows}\n`;
const readme = `# Orbit Atlas detector calibration acquisition pack v364\n\nThis pack contains empty templates and the v363 acquisition design. It contains no measured detector values and is not admissible as calibration authority.\n\n- Do not replace nulls with example values.\n- Preserve raw files and SHA-256 sidecars.\n- Record all three throughput bands with repeat indices.\n- Record gain, bias, dark and background frames separately.\n- Numerical conditioning requires a measured Jacobian and observation covariance.\n- Passing table integrity does not grant measured-calibration qualification.\n`;
const generated = [
  { id: "manifest-template", relativePath: "manifest.template.json", mediaType: "application/json", value: `${JSON.stringify(manifestTemplate, null, 2)}\n`, dataRowCount: 0 },
  { id: "throughput-template", relativePath: "throughput.template.csv", mediaType: "text/csv", value: throughputTemplate, dataRowCount: 0 },
  { id: "noise-template", relativePath: "noise.template.csv", mediaType: "text/csv", value: noiseTemplate, dataRowCount: 0 },
  { id: "acquisition-plan", relativePath: "acquisition-plan.csv", mediaType: "text/csv", value: acquisitionPlan, dataRowCount: 9 },
  { id: "readme", relativePath: "README.md", mediaType: "text/markdown", value: readme, dataRowCount: 0 },
] as const;
for (const file of generated) atomicText(`${outputRoot}/${file.relativePath}`, file.value);
const files = Object.freeze(generated.map((file): KerrDetectorCalibrationPackFileV364 => {
  const relative = `${outputRoot}/${file.relativePath}`;
  return Object.freeze({ id: file.id, relativePath: file.relativePath, mediaType: file.mediaType, bytes: bytes(relative).byteLength, sha256: fileSha(relative), dataRowCount: file.dataRowCount, admissibleAsMeasured: false });
}));
const source = { planPath, planCanonicalPayloadSha256: sha(plan), planArtifactSha256: plan.artifactSha256 } as const;
const unsigned = {
  version: "v364-kerr-detector-calibration-acquisition-pack-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "qualified-empty-acquisition-pack-and-validator-measured-data-unavailable" as const,
  source,
  files,
  counts: Object.freeze({ fileCount: 5 as const, emptyMeasurementTemplateCount: 3 as const, acquisitionPlanTaskCount: 9 as const, measuredDataRowCount: 0 as const, validatorParameterCount: 7 as const }),
  templatePolicy: "empty-placeholders-no-example-measurements-no-default-performance-values" as const,
  validatorPolicy: "units-bands-repeats-finite-values-sha-and-counts-fail-closed" as const,
  conditioningStatus: "unavailable-no-measured-jacobian-or-covariance" as const,
  measuredCalibrationAuthority: "blocked-input-unavailable-v361" as const,
  manifestAdmissionStatus: "not-attempted-empty-template-is-inadmissible" as const,
  measuredPerformanceClaimed: false as const,
  taskExecutionStatus: "not-run-plan-only" as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  scienceCinematicBoundary: "calibration-pack-templates-and-validation-never-cinematic-color-input" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  denseAggregateSha256: null,
  browserQualification: "not-run" as const,
  artifactSha256: "pending",
};
const artifact = parseKerrDetectorCalibrationPackV364({ ...unsigned, artifactSha256: sha(unsigned) });
atomicText(`${outputRoot}/pack.json`, `${JSON.stringify(artifact, null, 2)}\n`);
const parsedTemplate = JSON.parse(bytes(`${outputRoot}/manifest.template.json`).toString("utf8"));
const replayUnsigned = {
  version: "v364-kerr-detector-calibration-acquisition-pack-replay-v1",
  generatedAt: new Date().toISOString(),
  status: artifact.status,
  packArtifactSha256: artifact.artifactSha256,
  fileShasMatch: artifact.files.every((file) => fileSha(`${outputRoot}/${file.relativePath}`) === file.sha256),
  emptyTemplates: artifact.files.filter((file) => ["manifest-template", "throughput-template", "noise-template"].includes(file.id)).every((file) => file.dataRowCount === 0),
  manifestTemplateInadmissible: parsedTemplate.templateOnly === true && parsedTemplate.admissibleAsMeasured === false && parsedTemplate.measuredCalibration === null,
  measuredDataRowCount: 0,
  numericalConditioning: artifact.conditioningStatus,
  measuredPerformanceClaimed: false,
  attemptConsumed: false,
  networkAttempted: false,
  denseCampaignStatus: artifact.denseCampaignStatus,
  browserQualification: artifact.browserQualification,
};
const replay = { ...replayUnsigned, artifactSha256: sha(replayUnsigned) };
atomicText(`${outputRoot}/replay.json`, `${JSON.stringify(replay, null, 2)}\n`);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, files: artifact.counts.fileCount, emptyTemplates: artifact.counts.emptyMeasurementTemplateCount, tasks: artifact.counts.acquisitionPlanTaskCount, measuredRows: artifact.counts.measuredDataRowCount, conditioning: artifact.conditioningStatus, measuredAuthority: artifact.measuredCalibrationAuthority, dense: artifact.denseCampaignStatus }, null, 2));
