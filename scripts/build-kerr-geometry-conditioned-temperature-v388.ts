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
  createKerrGeometryConditionedTemperatureV388,
  parseKerrGeometryConditionedTemperatureArtifactV388,
  V388_ORACLE_RELATIVE_LIMIT,
} from "../app/lib/kerrGeometryConditionedTemperatureV388";
import {
  KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328,
  parseKerrSciencePhotonBandViewV328,
} from "../app/lib/kerrSciencePhotonBandsV328";
import { parseKerrPhotonSourceIdentifiabilityArtifactV387 } from "../app/lib/kerrPhotonSourceIdentifiabilityV387";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  parseKerrThinDiskBandImagingViewV320,
} from "../app/lib/kerrThinDiskBandImagingV320";

const root = process.cwd();
const paths = {
  geometry:
    "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
  bands: "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json",
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  identifiability:
    "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
  oracle:
    "dist/science/kerr-geometry-conditioned-temperature-v388/python-oracle.json",
  csv: "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.csv" as const,
  artifact:
    "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.json",
} as const;
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
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
    throw new Error(`v388-input-size:${path}`);
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

const geometry = JSON.parse(
  bounded(paths.geometry, 2 * 1024 * 1024).toString("utf8"),
);
const bandOuter = JSON.parse(bounded(paths.bands, 256 * 1024).toString("utf8"));
if (
  bandOuter.version !== "v320-kerr-thin-disk-fixed-band-artifact-v1" ||
  bandOuter.artifactSha256 !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320
) {
  throw new Error("v388-band-artifact-identity");
}
const bandView = parseKerrThinDiskBandImagingViewV320(bandOuter.view);
const photonOuter = JSON.parse(
  bounded(paths.photon, 256 * 1024).toString("utf8"),
);
if (
  photonOuter.version !== "v328-kerr-science-photon-bands-artifact-v1" ||
  photonOuter.artifactSha256 !==
    KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328
) {
  throw new Error("v388-photon-artifact-identity");
}
const photonView = parseKerrSciencePhotonBandViewV328(photonOuter.view);
const identifiability = parseKerrPhotonSourceIdentifiabilityArtifactV387(
  JSON.parse(bounded(paths.identifiability, 128 * 1024).toString("utf8")),
);
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !==
    "v388-kerr-geometry-conditioned-temperature-python-oracle-v1" ||
  oracle.status !== "qualified-independent-geometry-conditioned-root-oracle" ||
  oracle.source?.v296GeometryEvidenceSha256 !== geometry.evidenceSha256 ||
  oracle.source?.v320BandArtifactSha256 !== bandOuter.artifactSha256 ||
  oracle.source?.v328PhotonArtifactSha256 !== photonOuter.artifactSha256 ||
  oracle.source?.v387IdentifiabilityArtifactSha256 !==
    identifiability.artifactSha256 ||
  oracle.rows?.length !== 12 ||
  oracle.spectralOnlyRank !== 1 ||
  oracle.geometryConditionedRank !== 2 ||
  oracle.combinationPolicy !== "linear-sum-no-independence-proof-no-rss" ||
  oracle.absoluteTemperatureAuthorityGranted !== false ||
  oracle.networkAttempted !== false
) {
  throw new Error("v388-oracle-identity");
}
const computation = createKerrGeometryConditionedTemperatureV388(
  geometry,
  bandView,
  photonView,
  identifiability,
);
let maximumOracleDifference = 0;
const rows = Object.freeze(
  computation.rows.map((row) => {
    const oracleRow = oracle.rows.find(
      (entry: { rayIndex?: unknown; bandId?: unknown }) =>
        entry.rayIndex === row.rayIndex && entry.bandId === row.bandId,
    );
    if (!oracleRow) {
      throw new Error(`v388-oracle-row:${row.rayIndex}:${row.bandId}`);
    }
    const differences = [
      relativeDifference(
        row.inferredProductTemperatureK,
        Number(oracleRow.inferredProductTemperatureK),
      ),
      relativeDifference(
        row.conditionedTemperatureCarterK,
        Number(oracleRow.conditionedTemperatureCarterK),
      ),
      relativeDifference(
        row.conditionedTemperatureKerrSchildK,
        Number(oracleRow.conditionedTemperatureKerrSchildK),
      ),
      relativeDifference(
        row.knownNumericalUpperBoundRelative,
        Number(oracleRow.knownNumericalUpperBoundRelative),
      ),
    ];
    const pythonOracleMaximumRelativeDifference = Math.max(...differences);
    if (pythonOracleMaximumRelativeDifference >= V388_ORACLE_RELATIVE_LIMIT) {
      throw new Error(
        `v388-oracle-difference:${row.rayIndex}:${row.bandId}:${pythonOracleMaximumRelativeDifference}`,
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
  "ray_index,ray_id,band_id,inferred_product_temperature_k,geometry_redshift_carter,geometry_redshift_kerr_schild,conditioned_temperature_carter_k,conditioned_temperature_kerr_schild_k,source_effective_temperature_k,carter_temperature_replay_relative_difference,kerr_schild_temperature_replay_relative_difference,known_numerical_upper_bound_relative,absolute_temperature_uncertainty_relative\n",
  ...rows.map(
    (row) =>
      `${row.rayIndex},${row.rayId},${row.bandId},${row.inferredProductTemperatureK.toExponential(16)},${row.geometryRedshiftCarter.toExponential(16)},${row.geometryRedshiftKerrSchild.toExponential(16)},${row.conditionedTemperatureCarterK.toExponential(16)},${row.conditionedTemperatureKerrSchildK.toExponential(16)},${row.sourceEffectiveTemperatureK.toExponential(16)},${row.carterTemperatureReplayRelativeDifference.toExponential(16)},${row.kerrSchildTemperatureReplayRelativeDifference.toExponential(16)},${row.knownNumericalUpperBoundRelative.toExponential(16)},unavailable\n`,
  ),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 128 * 1024));
const unsigned = {
  version: "v388-kerr-geometry-conditioned-temperature-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "geometry-conditioned-temperature-replay-qualified-absolute-authority-withheld" as const,
  source: Object.freeze({
    v296GeometryEvidenceSha256: geometry.evidenceSha256 as string,
    v320BandArtifactSha256: bandOuter.artifactSha256 as string,
    v328PhotonArtifactSha256: photonOuter.artifactSha256 as string,
    v387IdentifiabilityArtifactSha256: identifiability.artifactSha256,
    fullShortAuthoritySha256: photonView.source.fullShortAuthoritySha256,
  }),
  rows,
  rayAudits: computation.rayAudits,
  counts: Object.freeze({
    rayCount: 4 as const,
    bandCount: 3 as const,
    inversionCount: 12 as const,
    geometryPriorCount: 4 as const,
  }),
  maxima: Object.freeze({
    ...computation.maxima,
    pythonOracleRelativeDifference: maximumOracleDifference,
  }),
  identifiability: Object.freeze({
    spectralOnlyRank: 1 as const,
    geometryConditionedRank: 2 as const,
    independentPrior: "v296-dual-formulation-kerr-redshift" as const,
    recoveredParameter:
      "effective-temperature-under-frozen-page-thorne-planck-model" as const,
    algebra: "ln-T-equals-ln-gT-minus-ln-g" as const,
    degeneracyBrokenComputationally: true as const,
  }),
  uncertainty: Object.freeze({
    combinationPolicy:
      "linear-sum-no-independence-proof-no-rss" as const,
    knownNumericalBudgetQualified: true as const,
    knownNumericalIntervalIsConfidenceInterval: false as const,
    geometryPhysicalModelSystematicAvailable: false as const,
    diskPhysicalModelSystematicAvailable: false as const,
    detectorCalibrationCovarianceAvailable: false as const,
    absoluteTemperatureUncertaintyQualified: false as const,
    numericalPlaceholderUsed: false as const,
  }),
  qualification: Object.freeze({
    conditionalTemperatureReplayQualified: true as const,
    augmentedIdentifiabilityQualified: true as const,
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
const artifact = parseKerrGeometryConditionedTemperatureArtifactV388({
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
      inversions: artifact.counts.inversionCount,
      spectralOnlyRank: artifact.identifiability.spectralOnlyRank,
      geometryConditionedRank:
        artifact.identifiability.geometryConditionedRank,
      maximumTemperatureReplayRelativeDifference:
        artifact.maxima.temperatureReplayRelativeDifference,
      maximumKnownNumericalUpperBoundRelative:
        artifact.maxima.knownNumericalUpperBoundRelative,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      absoluteTemperatureAuthorityGranted:
        artifact.qualification.absoluteTemperatureAuthorityGranted,
    },
    null,
    2,
  ),
);
