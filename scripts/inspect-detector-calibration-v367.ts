import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseDetectorCalibrationManifestV361 } from "../app/lib/detectorCalibrationAdmissionV361";
import { parseDetectorCalibrationConditioningInputV367 } from "../app/lib/detectorCalibrationAuthorityAdmissionV367";
import { DETECTOR_CALIBRATION_AUTHORITY_INPUTS_V367, parseDetectorCalibrationAuthorityInspectV367 } from "../app/lib/detectorCalibrationAuthorityInspectV367";
import { parseDetectorCalibrationIdentityV365, parseDetectorCalibrationNoiseCsvV365, parseDetectorCalibrationProvenanceV365, parseDetectorCalibrationThroughputCsvV365 } from "../app/lib/detectorCalibrationCompilerV365";

const root = process.cwd();
const output = "dist/science/detector-calibration-v367/inspect.json";
const inputs = [
  { id: "v365-identity", path: "dist/staging/detector-calibration-v365/identity.json", maximumBytes: 64 * 1024 },
  { id: "v365-throughput", path: "dist/staging/detector-calibration-v365/throughput.csv", maximumBytes: 2 * 1024 * 1024 },
  { id: "v365-noise", path: "dist/staging/detector-calibration-v365/noise.csv", maximumBytes: 2 * 1024 * 1024 },
  { id: "v365-provenance", path: "dist/staging/detector-calibration-v365/provenance.json", maximumBytes: 64 * 1024 },
  { id: "v365-compiled-artifact", path: "dist/science/detector-calibration-v365/compiled.json", maximumBytes: 1024 * 1024 },
  { id: "v361-measured-manifest", path: "dist/staging/detector-calibration-v361/manifest.json", maximumBytes: 1024 * 1024 },
  { id: "measured-jacobian-covariance", path: "dist/staging/detector-calibration-v365/jacobian.json", maximumBytes: 2 * 1024 * 1024 },
] as const;
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const bytes = (path: string, maximumBytes: number) => {
  const absolute = resolve(root, path);
  const size = statSync(absolute).size;
  if (size <= 0 || size > maximumBytes) throw new Error(`v367-input-size:${path}`);
  return readFileSync(absolute);
};

const present = inputs.filter((entry) => existsSync(resolve(root, entry.path))).map((entry) => entry.id);
const missing = inputs.filter((entry) => !present.includes(entry.id)).map((entry) => entry.id);
let invalidReason: string | null = null;
if (missing.length === 0) {
  try {
    const identity = parseDetectorCalibrationIdentityV365(JSON.parse(bytes(inputs[0].path, inputs[0].maximumBytes).toString("utf8")));
    parseDetectorCalibrationThroughputCsvV365(bytes(inputs[1].path, inputs[1].maximumBytes).toString("utf8"));
    parseDetectorCalibrationNoiseCsvV365(bytes(inputs[2].path, inputs[2].maximumBytes).toString("utf8"));
    const provenance = parseDetectorCalibrationProvenanceV365(JSON.parse(bytes(inputs[3].path, inputs[3].maximumBytes).toString("utf8")));
    const compiled = JSON.parse(bytes(inputs[4].path, inputs[4].maximumBytes).toString("utf8")) as Record<string, unknown>;
    const manifest = parseDetectorCalibrationManifestV361(JSON.parse(bytes(inputs[5].path, inputs[5].maximumBytes).toString("utf8")));
    const conditioning = parseDetectorCalibrationConditioningInputV367(JSON.parse(bytes(inputs[6].path, inputs[6].maximumBytes).toString("utf8")));
    if (compiled.version !== "v365-measured-detector-calibration-compiler-v1"
      || compiled.status !== "compiled-measured-manifest-awaiting-independent-validation"
      || compiled.sourceKind !== "measured-import"
      || compiled.manifestPublishable !== true
      || compiled.measuredAuthorityGranted !== false
      || compiled.independentScientificValidation !== "pending") throw new Error("v367-compiled-boundary");
    if (identity.instrument.serialOrCampaignId !== manifest.instrument.serialOrCampaignId
      || conditioning.instrumentSerialOrCampaignId !== manifest.instrument.serialOrCampaignId
      || conditioning.manifestCanonicalSha256 !== compiled.manifestCanonicalSha256
      || sha(manifest) !== compiled.manifestCanonicalSha256
      || sha(compiled.manifest) !== compiled.manifestCanonicalSha256) throw new Error("v367-instrument-manifest-identity");
    const fileSha = (entry: typeof inputs[number]) => createHash("sha256").update(bytes(entry.path, entry.maximumBytes)).digest("hex");
    if (provenance.identityFileSha256 !== fileSha(inputs[0]) || provenance.throughputFileSha256 !== fileSha(inputs[1]) || provenance.noiseFileSha256 !== fileSha(inputs[2])) throw new Error("v367-provenance-file-sha");
  } catch (error) {
    invalidReason = error instanceof Error ? error.message.slice(0, 160) : "v367-input-invalid";
  }
}
const status = missing.length > 0 ? "blocked-admission-inputs-unavailable" : invalidReason ? "blocked-admission-inputs-invalid" : "ready-for-explicit-authority-admission";
const unsigned = {
  version: "v367-detector-calibration-authority-inspect-v1" as const,
  generatedAt: new Date().toISOString(),
  status,
  expectedInputs: DETECTOR_CALIBRATION_AUTHORITY_INPUTS_V367,
  presentInputCount: present.length,
  missingInputs: missing,
  invalidReason,
  admissionControllerImplemented: true as const,
  admissionCommand: "npm run atlas -- relativity detector-calibration-v367-admit" as const,
  admissionExecuted: false as const,
  measuredAuthorityGranted: false as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  automaticPromotionAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseDetectorCalibrationAuthorityInspectV367({ ...unsigned, artifactSha256: sha(unsigned) });
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, present: artifact.presentInputCount, missing: artifact.missingInputs, admissionExecuted: artifact.admissionExecuted, authorityGranted: artifact.measuredAuthorityGranted, attemptConsumed: artifact.attemptConsumed }, null, 2));
