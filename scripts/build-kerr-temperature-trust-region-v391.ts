import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrConditionalTemperatureIntervalArtifactV389 } from "../app/lib/kerrConditionalTemperatureIntervalV389";
import { parseKerrPhotonSourceIdentifiabilityArtifactV387 } from "../app/lib/kerrPhotonSourceIdentifiabilityV387";
import { parseKerrTemperatureSystematicsTransferArtifactV390 } from "../app/lib/kerrTemperatureSystematicsTransferV390";
import {
  createKerrTemperatureTrustRegionV391,
  parseKerrTemperatureTrustRegionArtifactV391,
  V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT,
  V391_MINIMUM_LINEAR_TRUST_RADIUS,
  V391_MINIMUM_QUADRATIC_TRUST_RADIUS,
  V391_ORACLE_RELATIVE_LIMIT,
  V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT,
  V391_STRESS_GRID,
} from "../app/lib/kerrTemperatureTrustRegionV391";

const root = process.cwd();
const paths = {
  transfer:
    "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  interval:
    "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
  identifiability:
    "dist/science/kerr-photon-source-identifiability-v387/identifiability.json",
  oracle: "dist/science/kerr-temperature-trust-region-v391/python-oracle.json",
  csv: "dist/science/kerr-temperature-trust-region-v391/trust-region.csv" as const,
  artifact:
    "dist/science/kerr-temperature-trust-region-v391/trust-region.json",
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
    throw new Error(`v391-input-size:${path}`);
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

const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
  JSON.parse(bounded(paths.transfer, 128 * 1024).toString("utf8")),
);
const interval = parseKerrConditionalTemperatureIntervalArtifactV389(
  JSON.parse(bounded(paths.interval, 128 * 1024).toString("utf8")),
);
const identifiability = parseKerrPhotonSourceIdentifiabilityArtifactV387(
  JSON.parse(bounded(paths.identifiability, 128 * 1024).toString("utf8")),
);
const oracle = JSON.parse(bounded(paths.oracle, 256 * 1024).toString("utf8"));
if (
  oracle.version !==
    "v391-kerr-temperature-trust-region-python-oracle-v1" ||
  oracle.status !== "qualified-independent-curvature-trust-region-oracle" ||
  oracle.source?.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
  oracle.source?.v389IntervalArtifactSha256 !== interval.artifactSha256 ||
  oracle.source?.v387IdentifiabilityArtifactSha256 !==
    identifiability.artifactSha256 ||
  JSON.stringify(oracle.stressGrid) !== JSON.stringify(V391_STRESS_GRID) ||
  oracle.linearAbsoluteLogResidualLimit !==
    V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT ||
  oracle.quadraticAbsoluteLogResidualLimit !==
    V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT ||
  oracle.minimumRequiredLinearTrustRadius !==
    V391_MINIMUM_LINEAR_TRUST_RADIUS ||
  oracle.minimumRequiredQuadraticTrustRadius !==
    V391_MINIMUM_QUADRATIC_TRUST_RADIUS ||
  oracle.rows?.length !== 12 ||
  oracle.axisReplayCount !== 216 ||
  oracle.mixedCornerReplayCount !== 864 ||
  oracle.minimumLinearTrustRadius < V391_MINIMUM_LINEAR_TRUST_RADIUS ||
  oracle.minimumQuadraticTrustRadius < V391_MINIMUM_QUADRATIC_TRUST_RADIUS ||
  oracle.stressGridIsPhysicalUncertainty !== false ||
  oracle.probabilityContentAssigned !== false ||
  oracle.absoluteScientificIntervalQualified !== false ||
  oracle.networkAttempted !== false ||
  !SHA256.test(oracle.artifactSha256 ?? "")
) {
  throw new Error("v391-oracle-identity");
}

const computation = createKerrTemperatureTrustRegionV391(
  transfer,
  interval,
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
      throw new Error(`v391-oracle-row:${row.rayIndex}:${row.bandId}`);
    }
    if (
      oracleRow.linearTrustRadius !== row.linearTrustRadius ||
      oracleRow.quadraticTrustRadius !== row.quadraticTrustRadius ||
      oracleRow.grid?.length !== row.grid.length ||
      oracleRow.hessian?.[0]?.[0]?.[0] !==
        oracleRow.photonInverseLogCurvature ||
      oracleRow.hessian.flat(2).slice(1).some((entry: unknown) => entry !== 0)
    ) {
      throw new Error(`v391-oracle-structure:${row.rayIndex}:${row.bandId}`);
    }
    const differences = [
      relativeDifference(
        row.planckLogPhotonSensitivity,
        Number(oracleRow.planckLogPhotonSensitivity),
      ),
      relativeDifference(
        row.planckLogPhotonSensitivityDerivative,
        Number(oracleRow.planckLogPhotonSensitivityDerivative),
      ),
      relativeDifference(
        row.photonInverseLogCurvature,
        Number(oracleRow.photonInverseLogCurvature),
      ),
    ];
    const pythonOracleMaximumRelativeDifference = Math.max(...differences);
    if (
      !Number.isFinite(pythonOracleMaximumRelativeDifference) ||
      pythonOracleMaximumRelativeDifference >= V391_ORACLE_RELATIVE_LIMIT
    ) {
      throw new Error(
        `v391-oracle-difference:${row.rayIndex}:${row.bandId}:${pythonOracleMaximumRelativeDifference}`,
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
  "ray_index,ray_id,band_id,log_radius,planck_log_photon_sensitivity,planck_log_photon_sensitivity_derivative,photon_inverse_log_curvature,maximum_linear_absolute_log_residual,maximum_quadratic_absolute_log_residual,maximum_mixed_separation_absolute_log_residual,linear_trust_radius,quadratic_trust_radius,maximum_inversion_relative_residual,python_oracle_maximum_relative_difference,stress_grid_is_physical_uncertainty,physical_systematic_vector_admitted,absolute_scientific_interval\n",
  ...rows.flatMap((row) =>
    row.grid.map(
      (entry) =>
        `${row.rayIndex},${row.rayId},${row.bandId},${entry.logRadius.toExponential(16)},${row.planckLogPhotonSensitivity.toExponential(16)},${row.planckLogPhotonSensitivityDerivative.toExponential(16)},${row.photonInverseLogCurvature.toExponential(16)},${entry.maximumLinearAbsoluteLogResidual.toExponential(16)},${entry.maximumQuadraticAbsoluteLogResidual.toExponential(16)},${entry.maximumMixedSeparationAbsoluteLogResidual.toExponential(16)},${row.linearTrustRadius.toExponential(16)},${row.quadraticTrustRadius.toExponential(16)},${row.maximumInversionRelativeResidual.toExponential(16)},${row.pythonOracleMaximumRelativeDifference.toExponential(16)},false,false,unavailable\n`,
    ),
  ),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 256 * 1024));
const unsigned = {
  version: "v391-kerr-temperature-curvature-trust-region-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "curvature-trust-region-qualified-stress-grid-nonphysical-covariance-unavailable" as const,
  source: Object.freeze({
    v390TransferArtifactSha256: transfer.artifactSha256,
    v389IntervalArtifactSha256: interval.artifactSha256,
    v387IdentifiabilityArtifactSha256: identifiability.artifactSha256,
    fullShortAuthoritySha256: transfer.source.fullShortAuthoritySha256,
  }),
  rows,
  counts: Object.freeze({
    rayCount: 4 as const,
    bandCount: 3 as const,
    rowCount: 12 as const,
    stressRadiusCount: 9 as const,
    axisReplayCount: 216 as const,
    mixedCornerReplayCount: 864 as const,
    hessianCoefficientCount: 216 as const,
  }),
  maxima: Object.freeze({
    ...computation.maxima,
    pythonOracleRelativeDifference: maximumOracleDifference,
  }),
  minima: computation.minima,
  method: Object.freeze({
    stressGrid: V391_STRESS_GRID,
    linearAbsoluteLogResidualLimit:
      V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT,
    quadraticAbsoluteLogResidualLimit:
      V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT,
    minimumRequiredLinearTrustRadius: V391_MINIMUM_LINEAR_TRUST_RADIUS,
    minimumRequiredQuadraticTrustRadius:
      V391_MINIMUM_QUADRATIC_TRUST_RADIUS,
    curvature: "analytic-inverse-function-second-derivative" as const,
    replay:
      "exact-planck-inversion-plus-separable-redshift-and-flux" as const,
    stressGridIsPhysicalUncertainty: false as const,
    stressGridProbabilityContent: false as const,
    derivativeFixturePublishableAsMeasurement: false as const,
  }),
  qualification: Object.freeze({
    analyticCurvatureQualified: true as const,
    linearTrustRegionQualified: true as const,
    quadraticTrustRegionQualified: true as const,
    crossTermSeparationQualified: true as const,
    physicalSystematicVectorAdmitted: false as const,
    covarianceProjectionExecuted: false as const,
    absoluteScientificIntervalQualified: false as const,
    absoluteTemperatureAuthorityGranted: false as const,
    measuredAuthorityGranted: false as const,
  }),
  export: Object.freeze({
    csvPath: paths.csv,
    csvFileSha256,
    rowCount: 108 as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrTemperatureTrustRegionArtifactV391({
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
      rows: artifact.counts.rowCount,
      axisReplays: artifact.counts.axisReplayCount,
      mixedCornerReplays: artifact.counts.mixedCornerReplayCount,
      maximumLinearAbsoluteLogResidual:
        artifact.maxima.linearAbsoluteLogResidual,
      maximumQuadraticAbsoluteLogResidual:
        artifact.maxima.quadraticAbsoluteLogResidual,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      minimumLinearTrustRadius: artifact.minima.linearTrustRadius,
      minimumQuadraticTrustRadius: artifact.minima.quadraticTrustRadius,
      stressGridIsPhysicalUncertainty:
        artifact.method.stressGridIsPhysicalUncertainty,
      absoluteScientificIntervalQualified:
        artifact.qualification.absoluteScientificIntervalQualified,
    },
    null,
    2,
  ),
);
