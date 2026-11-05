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
  createKerrPhotonSourceIdentifiabilityV387,
  parseKerrPhotonSourceIdentifiabilityArtifactV387,
  V387_ORACLE_RELATIVE_LIMIT,
} from "../app/lib/kerrPhotonSourceIdentifiabilityV387";
import {
  KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328,
  parseKerrSciencePhotonBandViewV328,
} from "../app/lib/kerrSciencePhotonBandsV328";
import { parseMeasuredVisiblePhotonSensitivityArtifactV386 } from "../app/lib/measuredVisiblePhotonSensitivityV386";

const root = process.cwd();
const paths = {
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  sensitivity:
    "dist/science/measured-visible-photon-sensitivity-v386/sensitivity.json",
  oracle:
    "dist/science/kerr-photon-source-identifiability-v387/python-oracle.json",
  csv: "dist/science/kerr-photon-source-identifiability-v387/identifiability.csv" as const,
  artifact:
    "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
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
    throw new Error(`v387-input-size:${path}`);
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

const photonOuter = JSON.parse(
  bounded(paths.photon, 256 * 1024).toString("utf8"),
);
if (
  photonOuter.version !== "v328-kerr-science-photon-bands-artifact-v1" ||
  photonOuter.artifactSha256 !==
    KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328
) {
  throw new Error("v387-photon-artifact-identity");
}
const photonView = parseKerrSciencePhotonBandViewV328(photonOuter.view);
const sensitivity = parseMeasuredVisiblePhotonSensitivityArtifactV386(
  JSON.parse(bounded(paths.sensitivity, 128 * 1024).toString("utf8")),
);
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !==
    "v387-kerr-photon-source-identifiability-python-oracle-v1" ||
  oracle.status !== "qualified-independent-three-band-rank-oracle" ||
  oracle.source?.v328PhotonArtifactSha256 !== photonOuter.artifactSha256 ||
  oracle.source?.v328FullShortAuthoritySha256 !==
    photonView.source.fullShortAuthoritySha256 ||
  oracle.rows?.length !== 12 ||
  oracle.globalRank !== 1 ||
  oracle.globalSingularValues?.[1] !== 0 ||
  oracle.identifiableCombination !== "ln-g-plus-ln-T" ||
  oracle.additionalContinuumBandsBreakDegeneracy !== false ||
  oracle.covariancePackAvailable !== false ||
  oracle.absoluteScientificUncertaintyQualified !== false ||
  oracle.networkAttempted !== false
) {
  throw new Error("v387-oracle-identity");
}
const computation = createKerrPhotonSourceIdentifiabilityV387(photonView);
let maximumOracleDifference = 0;
const rows = Object.freeze(
  computation.rows.map((row) => {
    const oracleRow = oracle.rows.find(
      (entry: { rayIndex?: unknown; bandId?: unknown }) =>
        entry.rayIndex === row.rayIndex && entry.bandId === row.bandId,
    );
    if (!oracleRow) {
      throw new Error(`v387-oracle-row:${row.rayIndex}:${row.bandId}`);
    }
    const differences = [
      relativeDifference(
        row.reconstructedPhotonRadiancePerSM2Sr,
        Number(oracleRow.reconstructedPhotonRadiancePerSM2Sr),
      ),
      relativeDifference(
        row.logTemperatureSensitivity,
        Number(oracleRow.logTemperatureSensitivity),
      ),
      relativeDifference(
        row.logRedshiftSensitivity,
        Number(oracleRow.logRedshiftSensitivity),
      ),
      relativeDifference(
        row.temperatureFiniteDifferenceLogSensitivity,
        Number(oracleRow.temperatureFiniteDifferenceLogSensitivity),
      ),
      relativeDifference(
        row.redshiftFiniteDifferenceLogSensitivity,
        Number(oracleRow.redshiftFiniteDifferenceLogSensitivity),
      ),
    ];
    const pythonOracleMaximumRelativeDifference = Math.max(...differences);
    if (pythonOracleMaximumRelativeDifference >= V387_ORACLE_RELATIVE_LIMIT) {
      throw new Error(
        `v387-oracle-difference:${row.rayIndex}:${row.bandId}:${pythonOracleMaximumRelativeDifference}`,
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
  "ray_index,band_id,lower_frequency_hz,upper_frequency_hz,source_photon_radiance_per_s_m2_sr,reconstructed_photon_radiance_per_s_m2_sr,source_reconstruction_relative_difference,log_temperature_sensitivity,log_redshift_sensitivity,temperature_fd_sensitivity,redshift_fd_sensitivity,python_oracle_maximum_relative_difference\n",
  ...rows.map(
    (row) =>
      `${row.rayIndex},${row.bandId},${row.bandLowerFrequencyHz.toExponential(16)},${row.bandUpperFrequencyHz.toExponential(16)},${row.sourcePhotonRadiancePerSM2Sr.toExponential(16)},${row.reconstructedPhotonRadiancePerSM2Sr.toExponential(16)},${row.sourceReconstructionRelativeDifference.toExponential(16)},${row.logTemperatureSensitivity.toExponential(16)},${row.logRedshiftSensitivity.toExponential(16)},${row.temperatureFiniteDifferenceLogSensitivity.toExponential(16)},${row.redshiftFiniteDifferenceLogSensitivity.toExponential(16)},${row.pythonOracleMaximumRelativeDifference.toExponential(16)}\n`,
  ),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 128 * 1024));
const inverseSqrtTwo = 1 / Math.sqrt(2);
const unsigned = {
  version: "v387-kerr-photon-source-identifiability-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "three-band-identifiability-audit-qualified-source-degeneracy-persists-covariance-unavailable" as const,
  source: Object.freeze({
    v328PhotonArtifactSha256: photonOuter.artifactSha256 as string,
    v328FullShortAuthoritySha256:
      photonView.source.fullShortAuthoritySha256,
    v386SensitivityArtifactSha256: sensitivity.artifactSha256,
  }),
  rows,
  rayAudits: computation.rayAudits,
  global: computation.global,
  counts: Object.freeze({
    rayCount: 4 as const,
    bandCount: 3 as const,
    measurementCount: 12 as const,
    sourceParameterCount: 2 as const,
  }),
  maxima: Object.freeze({
    ...computation.maxima,
    pythonOracleRelativeDifference: maximumOracleDifference,
  }),
  theorem: Object.freeze({
    model: "liouville-invariant-redshifted-planck-radiance" as const,
    identity:
      "g-cubed-times-Bnu-nu-over-g-T-equals-Bnu-nu-gT" as const,
    identifiableCombination: "ln-g-plus-ln-T" as const,
    nullDirection: Object.freeze([
      inverseSqrtTwo,
      -inverseSqrtTwo,
    ] as const),
    additionalContinuumBandsBreakDegeneracy: false as const,
    requiredDegeneracyBreaker: Object.freeze([
      "independent-redshift-prior",
      "independent-temperature-prior",
      "rest-frame-spectral-feature-or-non-planck-model",
    ] as const),
  }),
  covarianceAdmission: Object.freeze({
    validatorImplemented: true as const,
    jointDimension: 14 as const,
    throughputShape: Object.freeze([12, 12] as const),
    sourceShape: Object.freeze([2, 2] as const),
    crossShape: Object.freeze([12, 2] as const),
    identityShaRequired: true as const,
    finiteSymmetricPsdRequired: true as const,
    crossBlockRequiredUnlessIndependenceDocumented: true as const,
    covariancePackAvailable: false as const,
    admissionStatus: "not-run-input-unavailable" as const,
    syntheticFixturePublishable: false as const,
    uncertaintyProjectionAvailable: false as const,
  }),
  qualification: Object.freeze({
    identifiabilityAuditQualified: true as const,
    temperatureRedshiftSeparatelyIdentifiable: false as const,
    absoluteScientificUncertaintyQualified: false as const,
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
const artifact = parseKerrPhotonSourceIdentifiabilityArtifactV387({
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
      measurements: artifact.counts.measurementCount,
      bands: artifact.counts.bandCount,
      globalRank: artifact.global.rank,
      maximumSourceReconstructionRelativeDifference:
        artifact.maxima.sourceReconstructionRelativeDifference,
      maximumFiniteDifferenceRelativeDifference:
        artifact.maxima.finiteDifferenceRelativeDifference,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      additionalContinuumBandsBreakDegeneracy:
        artifact.theorem.additionalContinuumBandsBreakDegeneracy,
      covarianceAdmission: artifact.covarianceAdmission.admissionStatus,
    },
    null,
    2,
  ),
);
