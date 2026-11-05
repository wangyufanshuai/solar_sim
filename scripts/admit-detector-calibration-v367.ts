import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseDetectorCalibrationManifestV361 } from "../app/lib/detectorCalibrationAdmissionV361";
import { evaluateDetectorCalibrationAuthorityV367, parseDetectorCalibrationConditioningInputV367 } from "../app/lib/detectorCalibrationAuthorityAdmissionV367";
import { compileDetectorCalibrationV365, parseDetectorCalibrationIdentityV365, parseDetectorCalibrationNoiseCsvV365, parseDetectorCalibrationProvenanceV365, parseDetectorCalibrationThroughputCsvV365, type DetectorCalibrationCompilationResultV365 } from "../app/lib/detectorCalibrationCompilerV365";
import { validateDetectorCalibrationIndependentlyV366 } from "../app/lib/detectorCalibrationValidationV366";

const root = process.cwd();
const paths = {
  identity: "dist/staging/detector-calibration-v365/identity.json",
  throughput: "dist/staging/detector-calibration-v365/throughput.csv",
  noise: "dist/staging/detector-calibration-v365/noise.csv",
  provenance: "dist/staging/detector-calibration-v365/provenance.json",
  compiled: "dist/science/detector-calibration-v365/compiled.json",
  manifest: "dist/staging/detector-calibration-v361/manifest.json",
  conditioning: "dist/staging/detector-calibration-v365/jacobian.json",
  validation: "dist/science/detector-calibration-v367/validation.json",
  admission: "dist/science/detector-calibration-v367/admission.json",
  authorityPointer: "dist/release/orbit-atlas-detector-calibration-authority-v367.json",
} as const;
const read = (path: string) => readFileSync(resolve(root, path));
const fileSha = (path: string) => createHash("sha256").update(read(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const identity = parseDetectorCalibrationIdentityV365(JSON.parse(read(paths.identity).toString("utf8")));
const throughputRows = parseDetectorCalibrationThroughputCsvV365(read(paths.throughput).toString("utf8"));
const noiseRows = parseDetectorCalibrationNoiseCsvV365(read(paths.noise).toString("utf8"));
const provenance = parseDetectorCalibrationProvenanceV365(JSON.parse(read(paths.provenance).toString("utf8")));
const manifest = parseDetectorCalibrationManifestV361(JSON.parse(read(paths.manifest).toString("utf8")));
const conditioning = parseDetectorCalibrationConditioningInputV367(JSON.parse(read(paths.conditioning).toString("utf8")));
const compiled = JSON.parse(read(paths.compiled).toString("utf8")) as DetectorCalibrationCompilationResultV365;
if (compiled.version !== "v365-measured-detector-calibration-compiler-v1"
  || compiled.status !== "compiled-measured-manifest-awaiting-independent-validation"
  || compiled.sourceKind !== "measured-import"
  || compiled.manifestPublishable !== true
  || compiled.measuredAuthorityGranted !== false
  || compiled.independentScientificValidation !== "pending") throw new Error("v367-compiled-artifact-boundary");

const conditioningInput = { jacobian: conditioning.jacobian, observationVariance: conditioning.observationVariance };
const recomputed = compileDetectorCalibrationV365({
  identity,
  provenance,
  throughputRows,
  noiseRows,
  sourceKind: "measured-import",
  sourceFileSha256: { identity: fileSha(paths.identity), throughput: fileSha(paths.throughput), noise: fileSha(paths.noise) },
  conditioningInput,
});
const manifestCanonicalSha256 = sha(manifest);
if (compiled.manifestCanonicalSha256 !== manifestCanonicalSha256
  || recomputed.manifestCanonicalSha256 !== manifestCanonicalSha256
  || sha(compiled.manifest) !== manifestCanonicalSha256
  || sha(recomputed.manifest) !== manifestCanonicalSha256
  || conditioning.manifestCanonicalSha256 !== manifestCanonicalSha256
  || identity.instrument.serialOrCampaignId !== manifest.instrument.serialOrCampaignId
  || conditioning.instrumentSerialOrCampaignId !== manifest.instrument.serialOrCampaignId) throw new Error("v367-manifest-recompute-identity");

const validation = validateDetectorCalibrationIndependentlyV366({
  manifest,
  throughputRows,
  noiseRows,
  sourceKind: "measured-import",
  compilerStatus: compiled.status,
  conditioningInput,
});
const validationUnsigned = { version: "v367-independent-validation-envelope-v1", generatedAt: new Date().toISOString(), manifestCanonicalSha256, validation, compilerArtifactSha256: fileSha(paths.compiled), conditioningArtifactSha256: fileSha(paths.conditioning), networkAttempted: false, sciencePayloadMutationAllowed: false, cinematicMutationAllowed: false };
const validationDocument = { ...validationUnsigned, artifactSha256: sha(validationUnsigned) };
const suspicious = [identity.instrument.manufacturer, identity.instrument.model, identity.instrument.serialOrCampaignId, identity.calibration.laboratoryOrArchive, identity.attestation.operatorOrArchive, provenance.sourceUrl, provenance.licenseOrTerms].join(" ").toLowerCase();
const decision = evaluateDetectorCalibrationAuthorityV367({
  compilation: compiled,
  validation,
  validationManifestCanonicalSha256: manifestCanonicalSha256,
  conditioning,
  compiledArtifactSha256: fileSha(paths.compiled),
  validationArtifactSha256: validationDocument.artifactSha256,
  measuredManifestFileSha256: fileSha(paths.manifest),
  conditioningFileSha256: fileSha(paths.conditioning),
  declaredTestFixture: /example\.invalid|test[- ]?fixture|synthetic example|fixture-only/.test(suspicious),
});
const admissionUnsigned = { version: "v367-detector-calibration-authority-envelope-v1", generatedAt: new Date().toISOString(), status: decision.status, decision, validationArtifactSha256: validationDocument.artifactSha256, attemptConsumed: true, networkAttempted: false, automaticPromotionApplied: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run" };
const admission = { ...admissionUnsigned, artifactSha256: sha(admissionUnsigned) };
atomic(paths.validation, validationDocument);
atomic(paths.admission, admission);
if (decision.authorityGranted) {
  const authorityPointerUnsigned = { version: "v367-detector-calibration-authority-pointer-v1", status: "qualified-measured-authority-local-shadow-only", authorityGranted: true, admissionArtifactSha256: admission.artifactSha256, validationArtifactSha256: validationDocument.artifactSha256, manifestFileSha256: fileSha(paths.manifest), manifestCanonicalSha256, instrumentSerialOrCampaignId: manifest.instrument.serialOrCampaignId, localShadowOnly: true, productPromotionAllowed: false, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49" };
  atomic(paths.authorityPointer, { ...authorityPointerUnsigned, pointerSha256: sha(authorityPointerUnsigned) });
}
console.log(JSON.stringify({ status: admission.status, artifactSha256: admission.artifactSha256, validationArtifactSha256: validationDocument.artifactSha256, authorityGranted: decision.authorityGranted, reasons: decision.reasons, formalProductPointer: admission.formalProductPointer }, null, 2));
if (!decision.authorityGranted) throw new Error(`v367-admission-failed:${decision.status}`);
