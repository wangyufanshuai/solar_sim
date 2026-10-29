import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  KERR_MEASURED_DETECTOR_FILE_IDS_V458,
  KERR_MEASURED_DETECTOR_STAGING_ROOT_V458,
  type KerrMeasuredDetectorFileIdV458,
  type KerrMeasuredDetectorObservedFileV458,
} from "./kerrMeasuredDetectorIntakeEnvelopeV458";

export const V458_MAX_FILE_BYTES = 8 * 1024 * 1024;
export const V458_MAX_TOTAL_BYTES = 32 * 1024 * 1024;

const SHA256 = /^[a-f0-9]{64}$/;
const TEXT = new TextEncoder();
type ContentClassV458 =
  | "measured-detector-calibration"
  | "synthetic-validation-fixture";
type CandidateFilesV458 = Partial<
  Readonly<Record<KerrMeasuredDetectorFileIdV458, Uint8Array>>
>;

const FILES = Object.freeze({
  identity: Object.freeze({ fileName: "identity.json", format: "json" as const }),
  "plate-scale": Object.freeze({
    fileName: "plate-scale.csv",
    format: "csv" as const,
  }),
  distortion: Object.freeze({ fileName: "distortion.json", format: "json" as const }),
  psf: Object.freeze({ fileName: "psf.json", format: "json" as const }),
  "pixel-response": Object.freeze({
    fileName: "pixel-response.json",
    format: "json" as const,
  }),
  provenance: Object.freeze({ fileName: "provenance.json", format: "json" as const }),
});

export const KERR_MEASURED_DETECTOR_SCHEMA_PACK_V458 = Object.freeze({
  version: "v458-kerr-measured-detector-schema-pack-v1" as const,
  schemaCount: 6 as const,
  schemas: Object.freeze([
    Object.freeze({
      id: "identity" as const,
      fileName: "identity.json",
      format: "json" as const,
      schemaVersion: "v458-detector-identity-v1",
      requiredFields: Object.freeze([
        "contentClass",
        "instrumentId",
        "detectorId",
        "campaignId",
        "detectorFrame",
        "pixelConvention",
        "widthPixels",
        "heightPixels",
        "sourceSha256",
      ]),
      unitContract: Object.freeze(["detector-native", "FITS-one-based-continuous-pixel-centers"]),
    }),
    Object.freeze({
      id: "plate-scale" as const,
      fileName: "plate-scale.csv",
      format: "csv" as const,
      schemaVersion: "v458-detector-plate-scale-csv-v1",
      requiredFields: Object.freeze([
        "observationId",
        "contentClass",
        "instrumentId",
        "detectorId",
        "campaignId",
        "axis",
        "pixelScaleArcsecPerPixel",
        "uncertaintyArcsecPerPixel",
        "tdbJulianDate",
      ]),
      unitContract: Object.freeze(["arcsec-per-pixel", "TDB-Julian-date"]),
    }),
    Object.freeze({
      id: "distortion" as const,
      fileName: "distortion.json",
      format: "json" as const,
      schemaVersion: "v458-detector-distortion-v1",
      requiredFields: Object.freeze([
        "contentClass",
        "instrumentId",
        "detectorId",
        "campaignId",
        "model",
        "frame",
        "calibrationRows",
        "maxResidualPx",
        "coefficientSha256",
      ]),
      unitContract: Object.freeze(["detector-native", "pixel-residual"]),
    }),
    Object.freeze({
      id: "psf" as const,
      fileName: "psf.json",
      format: "json" as const,
      schemaVersion: "v458-detector-psf-v1",
      requiredFields: Object.freeze([
        "contentClass",
        "instrumentId",
        "detectorId",
        "campaignId",
        "model",
        "band",
        "fwhmArcsec",
        "samplingPixels",
        "normalization",
        "sourceSha256",
      ]),
      unitContract: Object.freeze(["arcsec", "unit-integral"]),
    }),
    Object.freeze({
      id: "pixel-response" as const,
      fileName: "pixel-response.json",
      format: "json" as const,
      schemaVersion: "v458-detector-pixel-response-v1",
      requiredFields: Object.freeze([
        "contentClass",
        "instrumentId",
        "detectorId",
        "campaignId",
        "gainElectronPerAdc",
        "readNoiseElectron",
        "darkCurrentElectronPerSecond",
        "fullWellElectron",
        "adcBits",
        "responseRange",
        "sourceSha256",
      ]),
      unitContract: Object.freeze(["electron-per-ADU", "electron", "electron-per-second"]),
    }),
    Object.freeze({
      id: "provenance" as const,
      fileName: "provenance.json",
      format: "json" as const,
      schemaVersion: "v458-detector-provenance-v1",
      requiredFields: Object.freeze([
        "contentClass",
        "instrumentId",
        "detectorId",
        "campaignId",
        "sources",
        "fileSha256",
        "usageScope",
        "operatorAttestation",
      ]),
      unitContract: Object.freeze(["SHA-256", "HTTPS-source", "license-terms-snapshot"]),
    }),
  ]),
});

export type KerrMeasuredDetectorValidationV458 = Readonly<{
  status:
    | "blocked-inputs-missing"
    | "blocked-inputs-invalid"
    | "validation-only"
    | "candidate-ready-for-independent-validation";
  files: readonly KerrMeasuredDetectorObservedFileV458[];
  readyFileCount: number;
  missingFileIds: readonly KerrMeasuredDetectorFileIdV458[];
  invalidFileIds: readonly KerrMeasuredDetectorFileIdV458[];
  contentClass: ContentClassV458 | "unavailable";
  crossFileIdentityQualified: boolean;
  provenanceShaLinkageQualified: boolean;
  licenseBoundaryQualified: boolean;
  candidateReadyForIndependentValidation: boolean;
  measuredDetectorAuthorityGranted: false;
  runtimeProjectionAllowed: false;
  scienceRasterAllowed: false;
}>;

const digest = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const parseJson = (bytes: Uint8Array): Record<string, unknown> | null => {
  try {
    return object(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
};
const encodeJson = (value: unknown): Uint8Array =>
  TEXT.encode(`${JSON.stringify(value, null, 2)}\n`);
const ids = (value: Record<string, unknown> | null): string =>
  value
    ? `${value.instrumentId}:${value.detectorId}:${value.campaignId}`
    : "invalid";
const validContentClass = (value: unknown): value is ContentClassV458 =>
  value === "measured-detector-calibration" ||
  value === "synthetic-validation-fixture";

function inspectIdentity(value: Record<string, unknown> | null): string[] {
  if (
    !value ||
    value.version !== "v458-detector-identity-v1" ||
    !validContentClass(value.contentClass) ||
    ![value.instrumentId, value.detectorId, value.campaignId].every(
      (entry) => typeof entry === "string" && entry.length >= 3,
    ) ||
    value.detectorFrame !== "detector-native" ||
    value.pixelConvention !== "FITS-one-based-continuous-pixel-centers" ||
    !Number.isInteger(value.widthPixels) ||
    Number(value.widthPixels) <= 0 ||
    !Number.isInteger(value.heightPixels) ||
    Number(value.heightPixels) <= 0 ||
    !SHA256.test(String(value.sourceSha256 ?? ""))
  ) {
    return ["identity-schema-invalid"];
  }
  return [];
}

function inspectPlateScale(
  bytes: Uint8Array,
  identity: Record<string, unknown> | null,
): string[] {
  const rows = new TextDecoder()
    .decode(bytes)
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
  const header =
    "observationId,contentClass,instrumentId,detectorId,campaignId,axis,pixelScaleArcsecPerPixel,uncertaintyArcsecPerPixel,tdbJulianDate";
  if (rows.length < 7 || rows[0]?.join(",") !== header) {
    return ["plate-scale-header-or-row-count-invalid"];
  }
  const reasons: string[] = [];
  const axisValues = new Map<string, number[]>();
  for (const row of rows.slice(1)) {
    const [observationId, contentClass, instrumentId, detectorId, campaignId, axis, scale, uncertainty, tdb] = row;
    const scaleValue = Number(scale);
    const uncertaintyValue = Number(uncertainty);
    const tdbValue = Number(tdb);
    if (
      !observationId ||
      contentClass !== identity?.contentClass ||
      `${instrumentId}:${detectorId}:${campaignId}` !== ids(identity) ||
      !["x", "y"].includes(axis) ||
      !finite(scaleValue) ||
      scaleValue <= 0 ||
      !finite(uncertaintyValue) ||
      uncertaintyValue < 0 ||
      !finite(tdbValue) ||
      tdbValue < 2_400_000
    ) {
      reasons.push("plate-scale-row-invalid");
      continue;
    }
    axisValues.set(axis, [...(axisValues.get(axis) ?? []), scaleValue]);
  }
  for (const axis of ["x", "y"]) {
    const values = axisValues.get(axis) ?? [];
    if (values.length < 3) reasons.push(`plate-scale-${axis}-needs-three-repeats`);
    if (values.length >= 3) {
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const cv =
        Math.sqrt(
          values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
            values.length,
        ) / mean;
      if (!finite(cv) || cv > 0.005) {
        reasons.push(`plate-scale-${axis}-repeat-cv-over-0.005`);
      }
    }
  }
  return [...new Set(reasons)];
}

function sharedIdentityReasons(
  value: Record<string, unknown> | null,
  identity: Record<string, unknown> | null,
  version: string,
): string[] {
  if (!value || value.version !== version) return [`${version}-schema-invalid`];
  if (
    value.contentClass !== identity?.contentClass ||
    ids(value) !== ids(identity)
  ) {
    return ["cross-file-identity-mismatch"];
  }
  return [];
}

function inspectDistortion(
  value: Record<string, unknown> | null,
  identity: Record<string, unknown> | null,
): string[] {
  const reasons = sharedIdentityReasons(
    value,
    identity,
    "v458-detector-distortion-v1",
  );
  if (reasons.length) return reasons;
  if (
    !["sip-2d", "polynomial-2d"].includes(String(value?.model)) ||
    value?.frame !== "detector-native" ||
    !Number.isInteger(value?.calibrationRows) ||
    Number(value?.calibrationRows) <= 0 ||
    !finite(value?.maxResidualPx) ||
    Number(value?.maxResidualPx) < 0 ||
    !SHA256.test(String(value?.coefficientSha256 ?? ""))
  ) {
    return ["distortion-model-or-unit-invalid"];
  }
  return [];
}

function inspectPsf(
  value: Record<string, unknown> | null,
  identity: Record<string, unknown> | null,
): string[] {
  const reasons = sharedIdentityReasons(value, identity, "v458-detector-psf-v1");
  if (reasons.length) return reasons;
  if (
    !["empirical-2d", "moffat"].includes(String(value?.model)) ||
    typeof value?.band !== "string" ||
    !finite(value?.fwhmArcsec) ||
    Number(value?.fwhmArcsec) <= 0 ||
    !finite(value?.samplingPixels) ||
    Number(value?.samplingPixels) < 2 ||
    value?.normalization !== "unit-integral" ||
    !SHA256.test(String(value?.sourceSha256 ?? ""))
  ) {
    return ["psf-model-normalization-or-unit-invalid"];
  }
  return [];
}

function inspectPixelResponse(
  value: Record<string, unknown> | null,
  identity: Record<string, unknown> | null,
): string[] {
  const reasons = sharedIdentityReasons(
    value,
    identity,
    "v458-detector-pixel-response-v1",
  );
  if (reasons.length) return reasons;
  const range = Array.isArray(value?.responseRange) ? value.responseRange : [];
  if (
    !finite(value?.gainElectronPerAdc) ||
    Number(value?.gainElectronPerAdc) <= 0 ||
    !finite(value?.readNoiseElectron) ||
    Number(value?.readNoiseElectron) < 0 ||
    !finite(value?.darkCurrentElectronPerSecond) ||
    Number(value?.darkCurrentElectronPerSecond) < 0 ||
    !finite(value?.fullWellElectron) ||
    Number(value?.fullWellElectron) <= 0 ||
    !Number.isInteger(value?.adcBits) ||
    Number(value?.adcBits) < 8 ||
    range.length !== 2 ||
    !finite(range[0]) ||
    !finite(range[1]) ||
    Number(range[0]) < 0 ||
    Number(range[1]) <= Number(range[0]) ||
    !SHA256.test(String(value?.sourceSha256 ?? ""))
  ) {
    return ["pixel-response-range-or-unit-invalid"];
  }
  return [];
}

function inspectProvenance(
  value: Record<string, unknown> | null,
  identity: Record<string, unknown> | null,
  hashes: Partial<Record<KerrMeasuredDetectorFileIdV458, string>>,
): string[] {
  const reasons = sharedIdentityReasons(
    value,
    identity,
    "v458-detector-provenance-v1",
  );
  if (reasons.length) return reasons;
  const sources = Array.isArray(value?.sources) ? value.sources : [];
  const fileSha = object(value?.fileSha256);
  if (
    sources.length < 1 ||
    value?.usageScope !== "local-shadow-research-only" ||
    value?.runtimePackagingAllowed !== false ||
    value?.publicDeploymentAllowed !== false ||
    typeof value?.operatorAttestation !== "boolean"
  ) {
    reasons.push("provenance-license-boundary-invalid");
  }
  for (const source of sources) {
    const entry = object(source);
    if (
      !entry ||
      typeof entry.title !== "string" ||
      !String(entry.url ?? "").startsWith("https://") ||
      typeof entry.license !== "string" ||
      !String(entry.termsUrl ?? "").startsWith("https://") ||
      !SHA256.test(String(entry.sha256 ?? ""))
    ) {
      reasons.push("provenance-source-license-record-invalid");
    }
  }
  for (const id of KERR_MEASURED_DETECTOR_FILE_IDS_V458.filter(
    (entry) => entry !== "provenance",
  )) {
    if (!SHA256.test(String(fileSha?.[id] ?? "")) || fileSha?.[id] !== hashes[id]) {
      reasons.push(`provenance-file-sha-mismatch-${id}`);
    }
  }
  return [...new Set(reasons)];
}

export function validateKerrMeasuredDetectorCandidateV458(
  candidate: CandidateFilesV458,
): KerrMeasuredDetectorValidationV458 {
  const files: KerrMeasuredDetectorObservedFileV458[] = [];
  let totalBytes = 0;
  const hashes: Partial<Record<KerrMeasuredDetectorFileIdV458, string>> = {};
  for (const id of KERR_MEASURED_DETECTOR_FILE_IDS_V458) {
    const bytes = candidate[id];
    if (!bytes) {
      files.push({
        id,
        ...FILES[id],
        status: "missing",
        bytes: 0,
        sha256: null,
        reasons: ["required-file-missing"],
      });
      continue;
    }
    totalBytes += bytes.byteLength;
    hashes[id] = digest(bytes);
    const sizeReasons =
      bytes.byteLength <= 0 || bytes.byteLength > V458_MAX_FILE_BYTES
        ? ["file-size-boundary-invalid"]
        : [];
    files.push({
      id,
      ...FILES[id],
      status: sizeReasons.length ? "invalid" : "ready",
      bytes: bytes.byteLength,
      sha256: hashes[id] ?? null,
      reasons: sizeReasons,
    });
  }
  if (totalBytes > V458_MAX_TOTAL_BYTES) {
    for (const file of files) {
      if (file.status !== "missing") {
        (file.reasons as string[]).push("total-size-boundary-invalid");
      }
    }
  }
  const identity = candidate.identity ? parseJson(candidate.identity) : null;
  const checks: Partial<Record<KerrMeasuredDetectorFileIdV458, string[]>> = {
    identity: candidate.identity ? inspectIdentity(identity) : [],
    "plate-scale": candidate["plate-scale"]
      ? inspectPlateScale(candidate["plate-scale"], identity)
      : [],
    distortion: candidate.distortion
      ? inspectDistortion(parseJson(candidate.distortion), identity)
      : [],
    psf: candidate.psf ? inspectPsf(parseJson(candidate.psf), identity) : [],
    "pixel-response": candidate["pixel-response"]
      ? inspectPixelResponse(parseJson(candidate["pixel-response"]), identity)
      : [],
    provenance: candidate.provenance
      ? inspectProvenance(parseJson(candidate.provenance), identity, hashes)
      : [],
  };
  const normalizedFiles = files.map((file) => {
    const reasons = [...file.reasons, ...(checks[file.id] ?? [])];
    return Object.freeze({
      ...file,
      status:
        file.status === "missing"
          ? ("missing" as const)
          : reasons.length
            ? ("invalid" as const)
            : ("ready" as const),
      reasons: Object.freeze([...new Set(reasons)]),
    });
  });
  const missingFileIds = normalizedFiles
    .filter((file) => file.status === "missing")
    .map((file) => file.id);
  const invalidFileIds = normalizedFiles
    .filter((file) => file.status === "invalid")
    .map((file) => file.id);
  const contentClass = validContentClass(identity?.contentClass)
    ? identity.contentClass
    : "unavailable";
  const crossFileIdentityQualified =
    missingFileIds.length === 0 &&
    !normalizedFiles.some((file) =>
      file.reasons.some(
        (reason) =>
          reason === "cross-file-identity-mismatch" ||
          reason === "plate-scale-row-invalid",
      ),
    );
  const provenanceShaLinkageQualified =
    missingFileIds.length === 0 &&
    !normalizedFiles.some((file) =>
      file.reasons.some((reason) => reason.startsWith("provenance-file-sha-mismatch")),
    );
  const licenseBoundaryQualified =
    missingFileIds.length === 0 &&
    !normalizedFiles.some((file) =>
      file.reasons.some((reason) => reason.includes("license")),
    );
  const structurallyReady =
    missingFileIds.length === 0 && invalidFileIds.length === 0;
  const status = missingFileIds.length
    ? "blocked-inputs-missing"
    : invalidFileIds.length
      ? "blocked-inputs-invalid"
      : contentClass === "synthetic-validation-fixture"
        ? "validation-only"
        : "candidate-ready-for-independent-validation";
  return Object.freeze({
    status,
    files: Object.freeze(normalizedFiles),
    readyFileCount: normalizedFiles.filter((file) => file.status === "ready").length,
    missingFileIds: Object.freeze(missingFileIds),
    invalidFileIds: Object.freeze(invalidFileIds),
    contentClass,
    crossFileIdentityQualified,
    provenanceShaLinkageQualified,
    licenseBoundaryQualified,
    candidateReadyForIndependentValidation:
      structurallyReady && contentClass === "measured-detector-calibration",
    measuredDetectorAuthorityGranted: false,
    runtimeProjectionAllowed: false,
    scienceRasterAllowed: false,
  });
}

export function inspectKerrMeasuredDetectorStagingV458(
  stagingRoot: string,
): KerrMeasuredDetectorValidationV458 & { stagingRootPresent: boolean } {
  if (!existsSync(stagingRoot) || !statSync(stagingRoot).isDirectory()) {
    return Object.freeze({
      ...validateKerrMeasuredDetectorCandidateV458({}),
      stagingRootPresent: false,
    });
  }
  const candidate: Partial<Record<KerrMeasuredDetectorFileIdV458, Uint8Array>> = {};
  for (const id of KERR_MEASURED_DETECTOR_FILE_IDS_V458) {
    const path = resolve(stagingRoot, FILES[id].fileName);
    if (existsSync(path) && statSync(path).isFile()) candidate[id] = readFileSync(path);
  }
  return Object.freeze({
    ...validateKerrMeasuredDetectorCandidateV458(candidate),
    stagingRootPresent: true,
  });
}

export function createKerrMeasuredDetectorSyntheticControlV458(): Readonly<
  Record<KerrMeasuredDetectorFileIdV458, Uint8Array>
> {
  const shared = {
    contentClass: "synthetic-validation-fixture" as const,
    instrumentId: "synthetic-instrument",
    detectorId: "synthetic-detector",
    campaignId: "synthetic-campaign",
  };
  const candidate: Partial<Record<KerrMeasuredDetectorFileIdV458, Uint8Array>> = {
    identity: encodeJson({
      version: "v458-detector-identity-v1",
      ...shared,
      detectorFrame: "detector-native",
      pixelConvention: "FITS-one-based-continuous-pixel-centers",
      widthPixels: 384,
      heightPixels: 384,
      sourceSha256: "1".repeat(64),
    }),
    "plate-scale": TEXT.encode(
      [
        "observationId,contentClass,instrumentId,detectorId,campaignId,axis,pixelScaleArcsecPerPixel,uncertaintyArcsecPerPixel,tdbJulianDate",
        ...["x", "y"].flatMap((axis) =>
          [1, 2, 3].map(
            (repeat) =>
              `${axis}-${repeat},${shared.contentClass},${shared.instrumentId},${shared.detectorId},${shared.campaignId},${axis},0.120${repeat},0.0001,2461250.${repeat}`,
          ),
        ),
      ].join("\n") + "\n",
    ),
    distortion: encodeJson({
      version: "v458-detector-distortion-v1",
      ...shared,
      model: "sip-2d",
      frame: "detector-native",
      calibrationRows: 12,
      maxResidualPx: 0.02,
      coefficientSha256: "2".repeat(64),
    }),
    psf: encodeJson({
      version: "v458-detector-psf-v1",
      ...shared,
      model: "moffat",
      band: "synthetic-visible",
      fwhmArcsec: 0.8,
      samplingPixels: 4,
      normalization: "unit-integral",
      sourceSha256: "3".repeat(64),
    }),
    "pixel-response": encodeJson({
      version: "v458-detector-pixel-response-v1",
      ...shared,
      gainElectronPerAdc: 1.5,
      readNoiseElectron: 3,
      darkCurrentElectronPerSecond: 0.01,
      fullWellElectron: 50_000,
      adcBits: 16,
      responseRange: [0.9, 1.1],
      sourceSha256: "4".repeat(64),
    }),
  };
  const fileSha256 = Object.fromEntries(
    KERR_MEASURED_DETECTOR_FILE_IDS_V458.filter((id) => id !== "provenance").map(
      (id) => [id, digest(candidate[id]!)],
    ),
  );
  candidate.provenance = encodeJson({
    version: "v458-detector-provenance-v1",
    ...shared,
    sources: [
      {
        title: "Synthetic validator control only",
        url: "https://example.invalid/v458-control",
        license: "validation-only-no-data-authority",
        termsUrl: "https://example.invalid/v458-control/terms",
        sha256: "5".repeat(64),
      },
    ],
    fileSha256,
    usageScope: "local-shadow-research-only",
    runtimePackagingAllowed: false,
    publicDeploymentAllowed: false,
    operatorAttestation: false,
  });
  return Object.freeze(candidate as Record<KerrMeasuredDetectorFileIdV458, Uint8Array>);
}

const cloneCandidate = (
  source: Readonly<Record<KerrMeasuredDetectorFileIdV458, Uint8Array>>,
): Record<KerrMeasuredDetectorFileIdV458, Uint8Array> =>
  Object.fromEntries(
    Object.entries(source).map(([id, bytes]) => [id, new Uint8Array(bytes)]),
  ) as Record<KerrMeasuredDetectorFileIdV458, Uint8Array>;
const mutateJson = (
  candidate: Record<KerrMeasuredDetectorFileIdV458, Uint8Array>,
  id: Exclude<KerrMeasuredDetectorFileIdV458, "plate-scale">,
  mutate: (value: Record<string, unknown>) => void,
) => {
  const value = parseJson(candidate[id])!;
  mutate(value);
  candidate[id] = encodeJson(value);
};

export function createKerrMeasuredDetectorAdversarialFixturesV458() {
  const control = createKerrMeasuredDetectorSyntheticControlV458();
  const fixture = (
    id: string,
    expectedReason: string,
    mutate: (candidate: Record<KerrMeasuredDetectorFileIdV458, Uint8Array>) => void,
  ) => {
    const candidate = cloneCandidate(control);
    mutate(candidate);
    return Object.freeze({ id, expectedReason, candidate });
  };
  return Object.freeze([
    fixture("missing-identity", "required-file-missing", (candidate) => {
      delete (candidate as Partial<typeof candidate>).identity;
    }),
    fixture("invalid-identity-json", "identity-schema-invalid", (candidate) => {
      candidate.identity = TEXT.encode("{");
    }),
    fixture("content-class-mismatch", "cross-file-identity-mismatch", (candidate) => {
      mutateJson(candidate, "distortion", (value) => {
        value.contentClass = "measured-detector-calibration";
      });
    }),
    fixture("instrument-mismatch", "cross-file-identity-mismatch", (candidate) => {
      mutateJson(candidate, "psf", (value) => {
        value.instrumentId = "wrong-instrument";
      });
    }),
    fixture("plate-header", "plate-scale-header-or-row-count-invalid", (candidate) => {
      candidate["plate-scale"] = TEXT.encode("wrong,header\n");
    }),
    fixture("plate-repeat-cv", "plate-scale-x-repeat-cv-over-0.005", (candidate) => {
      const text = new TextDecoder().decode(candidate["plate-scale"]);
      candidate["plate-scale"] = TEXT.encode(text.replace(",x,0.1203,", ",x,0.5000,"));
    }),
    fixture("psf-normalization", "psf-model-normalization-or-unit-invalid", (candidate) => {
      mutateJson(candidate, "psf", (value) => {
        value.normalization = "peak-one";
      });
    }),
    fixture("pixel-range", "pixel-response-range-or-unit-invalid", (candidate) => {
      mutateJson(candidate, "pixel-response", (value) => {
        value.responseRange = [1, 0];
      });
    }),
    fixture("license-boundary", "provenance-license-boundary-invalid", (candidate) => {
      mutateJson(candidate, "provenance", (value) => {
        value.runtimePackagingAllowed = true;
      });
    }),
    fixture("license-source", "provenance-source-license-record-invalid", (candidate) => {
      mutateJson(candidate, "provenance", (value) => {
        (value.sources as Record<string, unknown>[])[0].termsUrl = "";
      });
    }),
    fixture("file-sha-link", "provenance-file-sha-mismatch-psf", (candidate) => {
      mutateJson(candidate, "provenance", (value) => {
        (value.fileSha256 as Record<string, unknown>).psf = "0".repeat(64);
      });
    }),
  ]);
}

export function resolveV458StagingRoot(root = process.cwd()): string {
  return resolve(root, KERR_MEASURED_DETECTOR_STAGING_ROOT_V458);
}
