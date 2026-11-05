import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createKerrConditionalTemperatureIntervalV389,
  parseKerrConditionalTemperatureIntervalArtifactV389,
  V389_ORACLE_RELATIVE_LIMIT,
} from "../app/lib/kerrConditionalTemperatureIntervalV389";
import { parseKerrGeometryConditionedTemperatureArtifactV388 } from "../app/lib/kerrGeometryConditionedTemperatureV388";
import {
  KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328,
  parseKerrSciencePhotonBandViewV328,
} from "../app/lib/kerrSciencePhotonBandsV328";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  parseKerrThinDiskBandImagingViewV320,
} from "../app/lib/kerrThinDiskBandImagingV320";

const root = process.cwd();
const paths = {
  replay:
    "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.json",
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  bands: "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json",
  oracle:
    "dist/science/kerr-conditional-temperature-interval-v389/python-oracle.json",
  csv: "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.csv" as const,
  artifact:
    "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
} as const;

const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const SHA256 = /^[a-f0-9]{64}$/;
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  shaBytes(JSON.stringify(canonicalize(value)));
const bounded = (path: string, maximumBytes: number) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) {
    throw new Error(`v389-input-size:${path}`);
  }
  return readFileSync(target);
};
const atomicText = (path: string, value: string) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));
const dimensionlessDifference = (left: number, right: number) =>
  Math.abs(left - right);

const replay = parseKerrGeometryConditionedTemperatureArtifactV388(
  JSON.parse(bounded(paths.replay, 256 * 1024).toString("utf8")),
);
const photonOuter = JSON.parse(
  bounded(paths.photon, 256 * 1024).toString("utf8"),
);
if (
  photonOuter.version !== "v328-kerr-science-photon-bands-artifact-v1" ||
  photonOuter.artifactSha256 !== KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328
) {
  throw new Error("v389-photon-artifact-identity");
}
const photonView = parseKerrSciencePhotonBandViewV328(photonOuter.view);
const bandOuter = JSON.parse(
  bounded(paths.bands, 256 * 1024).toString("utf8"),
);
if (
  bandOuter.version !== "v320-kerr-thin-disk-fixed-band-artifact-v1" ||
  bandOuter.artifactSha256 !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320
) {
  throw new Error("v389-band-artifact-identity");
}
const bandView = parseKerrThinDiskBandImagingViewV320(bandOuter.view);
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !==
    "v389-kerr-conditional-temperature-interval-python-oracle-v1" ||
  oracle.status !== "qualified-independent-exact-endpoint-interval-oracle" ||
  oracle.source?.v388ReplayArtifactSha256 !== replay.artifactSha256 ||
  oracle.source?.v328PhotonArtifactSha256 !== photonOuter.artifactSha256 ||
  oracle.source?.v320BandArtifactSha256 !== bandOuter.artifactSha256 ||
  oracle.rows?.length !== 12 ||
  oracle.intervalCombination !==
    "worst-case-endpoints-no-independence-proof-no-rss" ||
  oracle.confidenceInterval !== false ||
  oracle.probabilityContentAssigned !== false ||
  oracle.absoluteScientificIntervalQualified !== false ||
  !SHA256.test(oracle.artifactSha256 ?? "")
) {
  throw new Error("v389-oracle-identity");
}

const computation = createKerrConditionalTemperatureIntervalV389(
  replay,
  photonView,
  bandView,
);
let maximumOracleDifference = 0;
const rows = Object.freeze(
  computation.rows.map((row) => {
    const oracleRow = oracle.rows.find(
      (entry: { rayIndex?: unknown; bandId?: unknown }) =>
        entry.rayIndex === row.rayIndex && entry.bandId === row.bandId,
    );
    if (!oracleRow) {
      throw new Error(`v389-oracle-row:${row.rayIndex}:${row.bandId}`);
    }
    const differences = [
      dimensionlessDifference(
        row.photonRelativeRadius,
        Number(oracleRow.photonRelativeRadius),
      ),
      relativeDifference(
        row.productTemperatureCentralK,
        Number(oracleRow.productTemperatureCentralK),
      ),
      relativeDifference(
        row.productTemperatureIntervalK.lower,
        Number(oracleRow.productTemperatureIntervalK?.lower),
      ),
      relativeDifference(
        row.productTemperatureIntervalK.upper,
        Number(oracleRow.productTemperatureIntervalK?.upper),
      ),
      relativeDifference(
        row.geometryRedshiftInterval.lower,
        Number(oracleRow.geometryRedshiftInterval?.lower),
      ),
      relativeDifference(
        row.geometryRedshiftInterval.upper,
        Number(oracleRow.geometryRedshiftInterval?.upper),
      ),
      relativeDifference(
        row.conditionedTemperatureNumericalIntervalK.lower,
        Number(oracleRow.conditionedTemperatureNumericalIntervalK?.lower),
      ),
      relativeDifference(
        row.conditionedTemperatureNumericalIntervalK.upper,
        Number(oracleRow.conditionedTemperatureNumericalIntervalK?.upper),
      ),
      dimensionlessDifference(
        row.conditionedTemperatureNumericalRelativeRadius,
        Number(oracleRow.conditionedTemperatureNumericalRelativeRadius),
      ),
      relativeDifference(
        row.sourceModelTemperatureIntervalK.lower,
        Number(oracleRow.sourceModelTemperatureIntervalK?.lower),
      ),
      relativeDifference(
        row.sourceModelTemperatureIntervalK.upper,
        Number(oracleRow.sourceModelTemperatureIntervalK?.upper),
      ),
      dimensionlessDifference(
        row.sourceModelTemperatureRelativeRadius,
        Number(oracleRow.sourceModelTemperatureRelativeRadius),
      ),
    ];
    if (
      oracleRow.numericalAndSourceModelIntervalsOverlap !==
      row.numericalAndSourceModelIntervalsOverlap
    ) {
      throw new Error(`v389-oracle-overlap:${row.rayIndex}:${row.bandId}`);
    }
    const pythonOracleMaximumRelativeDifference = Math.max(...differences);
    if (
      !Number.isFinite(pythonOracleMaximumRelativeDifference) ||
      pythonOracleMaximumRelativeDifference >= V389_ORACLE_RELATIVE_LIMIT
    ) {
      throw new Error(
        `v389-oracle-difference:${row.rayIndex}:${row.bandId}:${pythonOracleMaximumRelativeDifference}`,
      );
    }
    maximumOracleDifference = Math.max(
      maximumOracleDifference,
      pythonOracleMaximumRelativeDifference,
    );
    return Object.freeze({ ...row, pythonOracleMaximumRelativeDifference });
  }),
);

const csv = [
  "ray_index,ray_id,band_id,photon_central_per_s_m2_sr,photon_relative_radius,photon_lower_per_s_m2_sr,photon_upper_per_s_m2_sr,product_temperature_central_k,product_temperature_lower_k,product_temperature_upper_k,geometry_redshift_lower,geometry_redshift_upper,conditioned_temperature_central_k,conditioned_temperature_numerical_lower_k,conditioned_temperature_numerical_upper_k,conditioned_temperature_numerical_relative_radius,source_model_temperature_central_k,page_thorne_flux_relative_radius,source_model_temperature_lower_k,source_model_temperature_upper_k,source_model_temperature_relative_radius,numerical_source_intervals_overlap,python_oracle_maximum_relative_difference,absolute_temperature_interval\n",
  ...rows.map(
    (row) =>
      `${row.rayIndex},${row.rayId},${row.bandId},${row.photonCentralPerSM2Sr.toExponential(16)},${row.photonRelativeRadius.toExponential(16)},${row.photonIntervalPerSM2Sr.lower.toExponential(16)},${row.photonIntervalPerSM2Sr.upper.toExponential(16)},${row.productTemperatureCentralK.toExponential(16)},${row.productTemperatureIntervalK.lower.toExponential(16)},${row.productTemperatureIntervalK.upper.toExponential(16)},${row.geometryRedshiftInterval.lower.toExponential(16)},${row.geometryRedshiftInterval.upper.toExponential(16)},${row.conditionedTemperatureCentralK.toExponential(16)},${row.conditionedTemperatureNumericalIntervalK.lower.toExponential(16)},${row.conditionedTemperatureNumericalIntervalK.upper.toExponential(16)},${row.conditionedTemperatureNumericalRelativeRadius.toExponential(16)},${row.sourceModelTemperatureCentralK.toExponential(16)},${row.pageThorneFluxRelativeRadius.toExponential(16)},${row.sourceModelTemperatureIntervalK.lower.toExponential(16)},${row.sourceModelTemperatureIntervalK.upper.toExponential(16)},${row.sourceModelTemperatureRelativeRadius.toExponential(16)},${row.numericalAndSourceModelIntervalsOverlap},${row.pythonOracleMaximumRelativeDifference.toExponential(16)},unavailable\n`,
  ),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 128 * 1024));
const unsigned = {
  version: "v389-kerr-conditional-temperature-exact-interval-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "conditional-temperature-exact-interval-qualified-physical-systematics-unavailable" as const,
  source: Object.freeze({
    v388ReplayArtifactSha256: replay.artifactSha256,
    v328PhotonArtifactSha256: photonOuter.artifactSha256 as string,
    v320BandArtifactSha256: bandOuter.artifactSha256 as string,
    fullShortAuthoritySha256: replay.source.fullShortAuthoritySha256,
  }),
  rows,
  counts: Object.freeze({
    rayCount: 4 as const,
    bandCount: 3 as const,
    intervalCount: 12 as const,
    overlapCount: computation.overlapCount,
  }),
  maxima: Object.freeze({
    ...computation.maxima,
    pythonOracleRelativeDifference: maximumOracleDifference,
  }),
  algorithms: Object.freeze({
    photonToProductTemperature:
      "monotonic-bisection-on-planck-photon-integral" as const,
    geometryConditioning:
      "exact-positive-interval-division-gT-over-g" as const,
    pageThorneTemperature:
      "exact-fourth-root-map-from-positive-flux-interval" as const,
    intervalCombination:
      "worst-case-endpoints-no-independence-proof-no-rss" as const,
    deterministicReplay: true as const,
  }),
  intervalSemantics: Object.freeze({
    knownNumericalIntervalQualified: true as const,
    sourceModelNumericalIntervalQualified: true as const,
    confidenceInterval: false as const,
    probabilityContentAssigned: false as const,
    detectorCalibrationCovarianceAvailable: false as const,
    geometryPhysicalSystematicAvailable: false as const,
    nonPlanckSpectralSystematicAvailable: false as const,
    absoluteScientificIntervalQualified: false as const,
    numericalPlaceholderUsed: false as const,
  }),
  qualification: Object.freeze({
    exactNonlinearPropagationQualified: true as const,
    conditionalTemperatureReplayQualified: true as const,
    absoluteTemperatureAuthorityGranted: false as const,
    measuredAuthorityGranted: false as const,
    observedCountsAvailable: false as const,
    scienceImageAvailable: false as const,
  }),
  export: Object.freeze({
    csvPath: paths.csv,
    csvFileSha256,
    rowCount: 12 as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrConditionalTemperatureIntervalArtifactV389({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      csvFileSha256: artifact.export.csvFileSha256,
      intervalCount: artifact.counts.intervalCount,
      overlapCount: artifact.counts.overlapCount,
      maximumConditionedTemperatureNumericalRelativeRadius:
        artifact.maxima.conditionedTemperatureNumericalRelativeRadius,
      maximumSourceModelTemperatureRelativeRadius:
        artifact.maxima.sourceModelTemperatureRelativeRadius,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      confidenceInterval: artifact.intervalSemantics.confidenceInterval,
      absoluteScientificIntervalQualified:
        artifact.intervalSemantics.absoluteScientificIntervalQualified,
    },
    null,
    2,
  ),
);
