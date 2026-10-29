export const OBSERVATION_GEOMETRY_PACK_VERSION_V370 = "v370-observation-geometry-acquisition-pack-v1" as const;
export const OBSERVATION_GEOMETRY_GATES_V370 = Object.freeze({ minimumRepeatCount: 3, maximumRepeatCoefficientOfVariation: 0.005, maximumStandardizedResidual: 5 } as const);
const SHA256 = /^[a-f0-9]{64}$/;

export type ObservationGeometryCollectingAreaRowV370 = Readonly<{ measurementId: string; repeatIndex: number; illuminatedAreaM2: number; obscuredAreaM2: number; effectiveAreaUncertaintyM2: number; rawArtifactSha256: string }>;
export type ObservationGeometryPlateScaleRowV370 = Readonly<{ measurementId: string; repeatIndex: number; referenceAngleArcsec: number; measuredPixelSeparation: number; pixelSeparationUncertainty: number; rawArtifactSha256: string }>;
export type ObservationGeometryValidationV370 = Readonly<{
  version: "v370-observation-geometry-independent-validation-v1";
  status: "qualified-test-fixture-only" | "measured-geometry-validation-qualified" | "validation-failed";
  sourceKind: "test-fixture" | "measured";
  passed: boolean;
  qualificationEligible: boolean;
  derived: Readonly<{ collectingAreaM2: number; pixelScaleArcsecPerPixel: number; pixelSolidAngleSr: number }>;
  metrics: Readonly<{ collectingAreaRepeatCoefficientOfVariation: number; pixelScaleRepeatCoefficientOfVariation: number; maximumStandardizedResidual: number }>;
  failures: readonly string[];
  measuredAuthorityGranted: false;
  admissibleAsMeasured: boolean;
  sciencePayloadMutationAllowed: false;
  cinematicMutationAllowed: false;
  boundary: "geometry-validator-does-not-publish-runtime-geometry-or-grant-detector-authority";
}>;
export type ObservationGeometryPackManifestV370 = Readonly<{ version: typeof OBSERVATION_GEOMETRY_PACK_VERSION_V370; generatedAt: string; status: "empty-acquisition-pack-qualified-templates-only"; files: readonly Readonly<{ id: "identity-template" | "collecting-area-template" | "plate-scale-template" | "provenance-template" | "readme"; path: string; bytes: number; sha256: string; measurementRows: number; admissibleAsMeasured: false }>[]; requirements: readonly ["instrument-identity", "collecting-area-three-repeats", "plate-scale-three-repeats", "traceable-source-license-and-sha"]; gates: typeof OBSERVATION_GEOMETRY_GATES_V370; totalMeasurementRows: 0; validationImplemented: true; testFixtureQualifiedOnly: true; measuredGeometryQualified: false; measuredAuthorityGranted: false; networkAttempted: false; formalProductPointer: "v263"; denseCampaignStatus: "incomplete-0-of-49"; browserQualification: "not-run"; artifactSha256: string }>;

const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const cv = (values: readonly number[]) => { const average = mean(values); return Math.sqrt(mean(values.map((value) => (value - average) ** 2))) / Math.max(1e-300, Math.abs(average)); };
function validateCommon(rows: readonly { measurementId: string; repeatIndex: number; rawArtifactSha256: string }[], label: string) { if (rows.length < OBSERVATION_GEOMETRY_GATES_V370.minimumRepeatCount || new Set(rows.map((row) => row.measurementId)).size !== rows.length || !rows.every((row) => row.measurementId.trim().length >= 3 && Number.isInteger(row.repeatIndex) && row.repeatIndex >= 1 && SHA256.test(row.rawArtifactSha256))) throw new Error(`v370-${label}-identity`); }
export function validateObservationGeometryMeasurementsV370(args: Readonly<{ sourceKind: "test-fixture" | "measured"; collectingAreaRows: readonly ObservationGeometryCollectingAreaRowV370[]; plateScaleRows: readonly ObservationGeometryPlateScaleRowV370[] }>): ObservationGeometryValidationV370 {
  validateCommon(args.collectingAreaRows, "area"); validateCommon(args.plateScaleRows, "plate-scale");
  if (!args.collectingAreaRows.every((row) => row.illuminatedAreaM2 > row.obscuredAreaM2 && row.obscuredAreaM2 >= 0 && row.effectiveAreaUncertaintyM2 > 0 && [row.illuminatedAreaM2, row.obscuredAreaM2, row.effectiveAreaUncertaintyM2].every(Number.isFinite))) throw new Error("v370-area-values");
  if (!args.plateScaleRows.every((row) => row.referenceAngleArcsec > 0 && row.measuredPixelSeparation > 0 && row.pixelSeparationUncertainty > 0 && [row.referenceAngleArcsec, row.measuredPixelSeparation, row.pixelSeparationUncertainty].every(Number.isFinite))) throw new Error("v370-plate-scale-values");
  const areas = args.collectingAreaRows.map((row) => row.illuminatedAreaM2 - row.obscuredAreaM2), areaMean = mean(areas);
  const scales = args.plateScaleRows.map((row) => row.referenceAngleArcsec / row.measuredPixelSeparation), scaleMean = mean(scales);
  const areaCv = cv(areas), scaleCv = cv(scales);
  const areaResidual = Math.max(...args.collectingAreaRows.map((row, index) => Math.abs(areas[index] - areaMean) / row.effectiveAreaUncertaintyM2));
  const scaleResidual = Math.max(...args.plateScaleRows.map((row, index) => Math.abs(scales[index] - scaleMean) / (row.referenceAngleArcsec * row.pixelSeparationUncertainty / row.measuredPixelSeparation ** 2)));
  const maximumStandardizedResidual = Math.max(areaResidual, scaleResidual); const failures: string[] = [];
  if (areaCv > OBSERVATION_GEOMETRY_GATES_V370.maximumRepeatCoefficientOfVariation) failures.push("collecting-area-repeatability");
  if (scaleCv > OBSERVATION_GEOMETRY_GATES_V370.maximumRepeatCoefficientOfVariation) failures.push("plate-scale-repeatability");
  if (maximumStandardizedResidual > OBSERVATION_GEOMETRY_GATES_V370.maximumStandardizedResidual) failures.push("standardized-residual");
  const passed = failures.length === 0, qualificationEligible = passed && args.sourceKind === "measured";
  return Object.freeze({ version: "v370-observation-geometry-independent-validation-v1", status: failures.length ? "validation-failed" : args.sourceKind === "measured" ? "measured-geometry-validation-qualified" : "qualified-test-fixture-only", sourceKind: args.sourceKind, passed, qualificationEligible, derived: Object.freeze({ collectingAreaM2: areaMean, pixelScaleArcsecPerPixel: scaleMean, pixelSolidAngleSr: (scaleMean * Math.PI / (180 * 3600)) ** 2 }), metrics: Object.freeze({ collectingAreaRepeatCoefficientOfVariation: areaCv, pixelScaleRepeatCoefficientOfVariation: scaleCv, maximumStandardizedResidual }), failures: Object.freeze(failures), measuredAuthorityGranted: false, admissibleAsMeasured: qualificationEligible, sciencePayloadMutationAllowed: false, cinematicMutationAllowed: false, boundary: "geometry-validator-does-not-publish-runtime-geometry-or-grant-detector-authority" });
}

export function parseObservationGeometryPackManifestV370(value: unknown): ObservationGeometryPackManifestV370 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<ObservationGeometryPackManifestV370> : null; if (!source || source.version !== OBSERVATION_GEOMETRY_PACK_VERSION_V370 || source.status !== "empty-acquisition-pack-qualified-templates-only" || source.files?.length !== 5 || source.files.some((file) => !SHA256.test(file.sha256) || file.bytes <= 0 || file.measurementRows !== 0 || file.admissibleAsMeasured !== false) || source.requirements?.join("|") !== "instrument-identity|collecting-area-three-repeats|plate-scale-three-repeats|traceable-source-license-and-sha" || source.totalMeasurementRows !== 0 || source.validationImplemented !== true || source.testFixtureQualifiedOnly !== true || source.measuredGeometryQualified !== false || source.measuredAuthorityGranted !== false || source.networkAttempted !== false || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run" || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v370-pack-identity"); return value as ObservationGeometryPackManifestV370; }
