import {
  parseKerrConditionalTemperatureIntervalArtifactV389,
  type KerrConditionalTemperatureIntervalArtifactV389,
} from "./kerrConditionalTemperatureIntervalV389";
import {
  parseKerrPhotonSourceIdentifiabilityArtifactV387,
  type KerrPhotonSourceIdentifiabilityArtifactV387,
} from "./kerrPhotonSourceIdentifiabilityV387";
import { KERR_PLANCK_CONSTANT_J_S_V328 } from "./kerrSciencePhotonBandsV328";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  type KerrTemperatureSystematicsTransferArtifactV390,
} from "./kerrTemperatureSystematicsTransferV390";
import {
  V384_BOLTZMANN_CONSTANT_J_K,
  V384_SPEED_OF_LIGHT_M_S,
} from "./measuredVisiblePhotonObservableV384";

export const KERR_TEMPERATURE_TRUST_REGION_VERSION_V391 =
  "v391-kerr-temperature-curvature-trust-region-v1" as const;
export const V391_INTEGRATION_STEPS = 4_096 as const;
export const V391_NEWTON_ITERATIONS = 18 as const;
export const V391_STRESS_GRID = Object.freeze([
  1e-6,
  3e-6,
  1e-5,
  3e-5,
  1e-4,
  3e-4,
  1e-3,
  3e-3,
  1e-2,
] as const);
export const V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT = 2e-6;
export const V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT = 2e-8;
export const V391_MINIMUM_LINEAR_TRUST_RADIUS = 3e-3;
export const V391_MINIMUM_QUADRATIC_TRUST_RADIUS = 1e-2;
export const V391_ORACLE_RELATIVE_LIMIT = 2e-7;
export const V391_INVERSION_RELATIVE_RESIDUAL_LIMIT = 2e-10;

const SHA256 = /^[a-f0-9]{64}$/;
const BAND_IDS = new Set<KerrThinDiskBandIdV320>([
  "visible",
  "euv",
  "soft-x-ray",
]);

export type KerrTemperatureTrustGridPointV391 = Readonly<{
  logRadius: number;
  maximumLinearAbsoluteLogResidual: number;
  maximumQuadraticAbsoluteLogResidual: number;
  maximumMixedSeparationAbsoluteLogResidual: number;
}>;

export type KerrTemperatureTrustRegionRowV391 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: KerrThinDiskBandIdV320;
  planckLogPhotonSensitivity: number;
  planckLogPhotonSensitivityDerivative: number;
  photonInverseLogCurvature: number;
  hessian: readonly [
    readonly [
      readonly [number, 0, 0],
      readonly [0, 0, 0],
      readonly [0, 0, 0],
    ],
    readonly [
      readonly [0, 0, 0],
      readonly [0, 0, 0],
      readonly [0, 0, 0],
    ],
  ];
  grid: readonly KerrTemperatureTrustGridPointV391[];
  linearTrustRadius: number;
  quadraticTrustRadius: number;
  maximumInversionRelativeResidual: number;
  pythonOracleMaximumRelativeDifference: number;
  stressGridIsPhysicalUncertainty: false;
  physicalSystematicVectorAdmitted: false;
  absoluteScientificInterval: null;
}>;

export type KerrTemperatureTrustRegionComputationV391 = Readonly<{
  rows: readonly Omit<
    KerrTemperatureTrustRegionRowV391,
    "pythonOracleMaximumRelativeDifference"
  >[];
  maxima: Readonly<{
    linearAbsoluteLogResidual: number;
    quadraticAbsoluteLogResidual: number;
    mixedSeparationAbsoluteLogResidual: number;
    inversionRelativeResidual: number;
  }>;
  minima: Readonly<{
    linearTrustRadius: number;
    quadraticTrustRadius: number;
  }>;
}>;

export type KerrTemperatureTrustRegionArtifactV391 = Readonly<{
  version: typeof KERR_TEMPERATURE_TRUST_REGION_VERSION_V391;
  generatedAt: string;
  status:
    "curvature-trust-region-qualified-stress-grid-nonphysical-covariance-unavailable";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v389IntervalArtifactSha256: string;
    v387IdentifiabilityArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  rows: readonly KerrTemperatureTrustRegionRowV391[];
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    rowCount: 12;
    stressRadiusCount: 9;
    axisReplayCount: 216;
    mixedCornerReplayCount: 864;
    hessianCoefficientCount: 216;
  }>;
  maxima: Readonly<{
    linearAbsoluteLogResidual: number;
    quadraticAbsoluteLogResidual: number;
    mixedSeparationAbsoluteLogResidual: number;
    inversionRelativeResidual: number;
    pythonOracleRelativeDifference: number;
  }>;
  minima: Readonly<{
    linearTrustRadius: number;
    quadraticTrustRadius: number;
  }>;
  method: Readonly<{
    stressGrid: typeof V391_STRESS_GRID;
    linearAbsoluteLogResidualLimit: typeof V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT;
    quadraticAbsoluteLogResidualLimit: typeof V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT;
    minimumRequiredLinearTrustRadius: typeof V391_MINIMUM_LINEAR_TRUST_RADIUS;
    minimumRequiredQuadraticTrustRadius: typeof V391_MINIMUM_QUADRATIC_TRUST_RADIUS;
    curvature: "analytic-inverse-function-second-derivative";
    replay: "exact-planck-inversion-plus-separable-redshift-and-flux";
    stressGridIsPhysicalUncertainty: false;
    stressGridProbabilityContent: false;
    derivativeFixturePublishableAsMeasurement: false;
  }>;
  qualification: Readonly<{
    analyticCurvatureQualified: true;
    linearTrustRegionQualified: true;
    quadraticTrustRegionQualified: true;
    crossTermSeparationQualified: true;
    physicalSystematicVectorAdmitted: false;
    covarianceProjectionExecuted: false;
    absoluteScientificIntervalQualified: false;
    absoluteTemperatureAuthorityGranted: false;
    measuredAuthorityGranted: false;
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/kerr-temperature-trust-region-v391/trust-region.csv";
    csvFileSha256: string;
    rowCount: 108;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

function spectralMoments(frequencyHz: number, productTemperatureK: number) {
  const exponent =
    (KERR_PLANCK_CONSTANT_J_S_V328 * frequencyHz) /
    (V384_BOLTZMANN_CONSTANT_J_K * productTemperatureK);
  if (exponent > 700) return Object.freeze([0, 0, 0] as const);
  const expNegative = Math.exp(-exponent);
  const oneMinus = 1 - expNegative;
  const photon =
    (2 * frequencyHz ** 2) /
    (V384_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
  const sensitivity = exponent / oneMinus;
  const derivativeX =
    1 / oneMinus -
    (exponent * expNegative) / oneMinus ** 2;
  const sensitivityLogTemperatureDerivative = -exponent * derivativeX;
  return Object.freeze([
    photon,
    photon * sensitivity,
    photon *
      (sensitivity ** 2 + sensitivityLogTemperatureDerivative),
  ] as const);
}

function integrateMoments(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  productTemperatureK: number,
) {
  const width =
    (upperFrequencyHz - lowerFrequencyHz) / V391_INTEGRATION_STEPS;
  const moments = [0, 0, 0];
  for (let index = 0; index <= V391_INTEGRATION_STEPS; index += 1) {
    const frequencyHz = lowerFrequencyHz + index * width;
    const values = spectralMoments(frequencyHz, productTemperatureK);
    const coefficient =
      index === 0 || index === V391_INTEGRATION_STEPS
        ? 1
        : index % 2 === 0
          ? 2
          : 4;
    for (let offset = 0; offset < 3; offset += 1) {
      moments[offset] += coefficient * values[offset];
    }
  }
  for (let offset = 0; offset < 3; offset += 1) {
    moments[offset] *= width / 3;
  }
  const sensitivity = moments[1] / moments[0];
  const sensitivityDerivative =
    moments[2] / moments[0] - sensitivity ** 2;
  if (
    !Number.isFinite(moments[0]) ||
    moments[0] <= 0 ||
    !Number.isFinite(sensitivity) ||
    sensitivity <= 0 ||
    !Number.isFinite(sensitivityDerivative)
  ) {
    throw new Error("v391-planck-moments");
  }
  return Object.freeze({
    photonRadiance: moments[0],
    sensitivity,
    sensitivityDerivative,
  });
}

function invertProductTemperature(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  targetPhotonRadiance: number,
  initialTemperatureK: number,
) {
  let lower = 100;
  let upper = 1e9;
  let temperature = Math.min(upper, Math.max(lower, initialTemperatureK));
  for (let iteration = 0; iteration < V391_NEWTON_ITERATIONS; iteration += 1) {
    const moments = integrateMoments(
      lowerFrequencyHz,
      upperFrequencyHz,
      temperature,
    );
    const iterationResidual =
      Math.abs(moments.photonRadiance - targetPhotonRadiance) /
      targetPhotonRadiance;
    if (
      iterationResidual <
      V391_INVERSION_RELATIVE_RESIDUAL_LIMIT * 0.1
    ) {
      break;
    }
    if (moments.photonRadiance < targetPhotonRadiance) lower = temperature;
    else upper = temperature;
    const logStep =
      (Math.log(targetPhotonRadiance) - Math.log(moments.photonRadiance)) /
      moments.sensitivity;
    const candidate = temperature * Math.exp(logStep);
    if (
      Number.isFinite(candidate) &&
      Math.abs(candidate - temperature) / temperature < 1e-13
    ) {
      break;
    }
    temperature =
      Number.isFinite(candidate) && candidate > lower && candidate < upper
        ? candidate
        : Math.sqrt(lower * upper);
  }
  const replay = integrateMoments(
    lowerFrequencyHz,
    upperFrequencyHz,
    temperature,
  ).photonRadiance;
  const relativeResidual =
    Math.abs(replay - targetPhotonRadiance) / targetPhotonRadiance;
  if (
    !Number.isFinite(relativeResidual) ||
    relativeResidual >= V391_INVERSION_RELATIVE_RESIDUAL_LIMIT
  ) {
    throw new Error(`v391-inversion-residual:${relativeResidual}`);
  }
  return Object.freeze({ temperature, relativeResidual });
}

export function createKerrTemperatureTrustRegionV391(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  intervalValue: KerrConditionalTemperatureIntervalArtifactV389,
  identifiabilityValue: KerrPhotonSourceIdentifiabilityArtifactV387,
): KerrTemperatureTrustRegionComputationV391 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const interval = parseKerrConditionalTemperatureIntervalArtifactV389(
    intervalValue,
  );
  const identifiability = parseKerrPhotonSourceIdentifiabilityArtifactV387(
    identifiabilityValue,
  );
  if (
    transfer.source.v389IntervalArtifactSha256 !== interval.artifactSha256 ||
    transfer.source.v387IdentifiabilityArtifactSha256 !==
      identifiability.artifactSha256 ||
    transfer.source.fullShortAuthoritySha256 !==
      interval.source.fullShortAuthoritySha256
  ) {
    throw new Error("v391-source-identity");
  }
  let maximumLinearResidual = 0;
  let maximumQuadraticResidual = 0;
  let maximumMixedResidual = 0;
  let maximumInversionResidual = 0;
  let minimumLinearTrustRadius = Number.POSITIVE_INFINITY;
  let minimumQuadraticTrustRadius = Number.POSITIVE_INFINITY;
  const rows = transfer.rows.map((transferRow) => {
    const intervalRow = interval.rows.find(
      (row) =>
        row.rayIndex === transferRow.rayIndex &&
        row.bandId === transferRow.bandId,
    );
    const identityRow = identifiability.rows.find(
      (row) =>
        row.rayIndex === transferRow.rayIndex &&
        row.bandId === transferRow.bandId,
    );
    if (!intervalRow || !identityRow) {
      throw new Error(`v391-row:${transferRow.rayIndex}:${transferRow.bandId}`);
    }
    const central = invertProductTemperature(
      identityRow.bandLowerFrequencyHz,
      identityRow.bandUpperFrequencyHz,
      intervalRow.photonCentralPerSM2Sr,
      intervalRow.productTemperatureCentralK,
    );
    const moments = integrateMoments(
      identityRow.bandLowerFrequencyHz,
      identityRow.bandUpperFrequencyHz,
      central.temperature,
    );
    const gain = 1 / moments.sensitivity;
    const curvature =
      -moments.sensitivityDerivative / moments.sensitivity ** 3;
    if (!Number.isFinite(curvature)) throw new Error("v391-curvature");
    let linearTrustRadius = 0;
    let quadraticTrustRadius = 0;
    let rowMaximumInversionResidual = central.relativeResidual;
    const grid = V391_STRESS_GRID.map((radius) => {
      let linearResidual = 0;
      let quadraticResidual = 0;
      const exactBySign = new Map<number, number>();
      for (const sign of [-1, 1] as const) {
        const delta = sign * radius;
        const perturbed = invertProductTemperature(
          identityRow.bandLowerFrequencyHz,
          identityRow.bandUpperFrequencyHz,
          intervalRow.photonCentralPerSM2Sr * Math.exp(delta),
          central.temperature * Math.exp(gain * delta),
        );
        rowMaximumInversionResidual = Math.max(
          rowMaximumInversionResidual,
          perturbed.relativeResidual,
        );
        const exact = Math.log(perturbed.temperature / central.temperature);
        exactBySign.set(sign, exact);
        const linear = gain * delta;
        const quadratic = linear + 0.5 * curvature * delta ** 2;
        linearResidual = Math.max(linearResidual, Math.abs(exact - linear));
        quadraticResidual = Math.max(
          quadraticResidual,
          Math.abs(exact - quadratic),
        );
      }
      let mixedResidual = 0;
      for (const photonSign of [-1, 1] as const) {
        for (const redshiftSign of [-1, 1] as const) {
          for (const fluxSign of [-1, 1] as const) {
            const exactPhoton = exactBySign.get(photonSign);
            if (exactPhoton == null) throw new Error("v391-sign-replay");
            const conditionedExact =
              exactPhoton - redshiftSign * radius;
            const conditionedSeparable =
              exactPhoton + -redshiftSign * radius;
            const sourceExact = 0.25 * fluxSign * radius;
            const sourceSeparable = 0.25 * fluxSign * radius;
            mixedResidual = Math.max(
              mixedResidual,
              Math.abs(conditionedExact - conditionedSeparable),
              Math.abs(sourceExact - sourceSeparable),
            );
          }
        }
      }
      if (linearResidual < V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT) {
        linearTrustRadius = radius;
      }
      if (quadraticResidual < V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT) {
        quadraticTrustRadius = radius;
      }
      maximumLinearResidual = Math.max(
        maximumLinearResidual,
        linearResidual,
      );
      maximumQuadraticResidual = Math.max(
        maximumQuadraticResidual,
        quadraticResidual,
      );
      maximumMixedResidual = Math.max(maximumMixedResidual, mixedResidual);
      return Object.freeze({
        logRadius: radius,
        maximumLinearAbsoluteLogResidual: linearResidual,
        maximumQuadraticAbsoluteLogResidual: quadraticResidual,
        maximumMixedSeparationAbsoluteLogResidual: mixedResidual,
      });
    });
    if (
      linearTrustRadius < V391_MINIMUM_LINEAR_TRUST_RADIUS ||
      quadraticTrustRadius < V391_MINIMUM_QUADRATIC_TRUST_RADIUS
    ) {
      throw new Error(
        `v391-trust-gate:${transferRow.rayIndex}:${transferRow.bandId}:${linearTrustRadius}:${quadraticTrustRadius}`,
      );
    }
    maximumInversionResidual = Math.max(
      maximumInversionResidual,
      rowMaximumInversionResidual,
    );
    minimumLinearTrustRadius = Math.min(
      minimumLinearTrustRadius,
      linearTrustRadius,
    );
    minimumQuadraticTrustRadius = Math.min(
      minimumQuadraticTrustRadius,
      quadraticTrustRadius,
    );
    return Object.freeze({
      rayIndex: transferRow.rayIndex,
      rayId: transferRow.rayId,
      bandId: transferRow.bandId,
      planckLogPhotonSensitivity: moments.sensitivity,
      planckLogPhotonSensitivityDerivative: moments.sensitivityDerivative,
      photonInverseLogCurvature: curvature,
      hessian: Object.freeze([
        Object.freeze([
          Object.freeze([curvature, 0, 0] as const),
          Object.freeze([0, 0, 0] as const),
          Object.freeze([0, 0, 0] as const),
        ] as const),
        Object.freeze([
          Object.freeze([0, 0, 0] as const),
          Object.freeze([0, 0, 0] as const),
          Object.freeze([0, 0, 0] as const),
        ] as const),
      ] as const),
      grid: Object.freeze(grid),
      linearTrustRadius,
      quadraticTrustRadius,
      maximumInversionRelativeResidual: rowMaximumInversionResidual,
      stressGridIsPhysicalUncertainty: false as const,
      physicalSystematicVectorAdmitted: false as const,
      absoluteScientificInterval: null,
    });
  });
  if (rows.length !== 12) throw new Error("v391-row-count");
  return Object.freeze({
    rows: Object.freeze(rows),
    maxima: Object.freeze({
      linearAbsoluteLogResidual: maximumLinearResidual,
      quadraticAbsoluteLogResidual: maximumQuadraticResidual,
      mixedSeparationAbsoluteLogResidual: maximumMixedResidual,
      inversionRelativeResidual: maximumInversionResidual,
    }),
    minima: Object.freeze({
      linearTrustRadius: minimumLinearTrustRadius,
      quadraticTrustRadius: minimumQuadraticTrustRadius,
    }),
  });
}

export function parseKerrTemperatureTrustRegionArtifactV391(
  value: unknown,
): KerrTemperatureTrustRegionArtifactV391 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<KerrTemperatureTrustRegionArtifactV391>)
    : null;
  const rows: readonly KerrTemperatureTrustRegionRowV391[] = Array.isArray(
    source?.rows,
  )
    ? source.rows
    : [];
  const keys = new Set(rows.map((row) => `${row.rayIndex}:${row.bandId}`));
  const maximumLinear = Math.max(
    ...rows.flatMap((row) =>
      row.grid.map((entry) => entry.maximumLinearAbsoluteLogResidual),
    ),
  );
  const maximumQuadratic = Math.max(
    ...rows.flatMap((row) =>
      row.grid.map((entry) => entry.maximumQuadraticAbsoluteLogResidual),
    ),
  );
  const maximumMixed = Math.max(
    ...rows.flatMap((row) =>
      row.grid.map(
        (entry) => entry.maximumMixedSeparationAbsoluteLogResidual,
      ),
    ),
  );
  const maximumInversion = Math.max(
    ...rows.map((row) => row.maximumInversionRelativeResidual),
  );
  const maximumOracle = Math.max(
    ...rows.map((row) => row.pythonOracleMaximumRelativeDifference),
  );
  const minimumLinear = Math.min(...rows.map((row) => row.linearTrustRadius));
  const minimumQuadratic = Math.min(
    ...rows.map((row) => row.quadraticTrustRadius),
  );
  if (
    !source ||
    source.version !== KERR_TEMPERATURE_TRUST_REGION_VERSION_V391 ||
    source.status !==
      "curvature-trust-region-qualified-stress-grid-nonphysical-covariance-unavailable" ||
    !source.source ||
    Object.keys(source.source).length !== 4 ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    rows.length !== 12 ||
    keys.size !== 12 ||
    rows.some(
      (row) =>
        !Number.isInteger(row.rayIndex) ||
        typeof row.rayId !== "string" ||
        !BAND_IDS.has(row.bandId) ||
        !(row.planckLogPhotonSensitivity > 0) ||
        !Number.isFinite(row.planckLogPhotonSensitivityDerivative) ||
        !Number.isFinite(row.photonInverseLogCurvature) ||
        row.hessian.length !== 2 ||
        row.hessian[0][0][0] !== row.photonInverseLogCurvature ||
        row.hessian.flat(2).slice(1).some((entry) => entry !== 0) ||
        row.grid.length !== 9 ||
        row.grid.some(
          (entry, index) =>
            entry.logRadius !== V391_STRESS_GRID[index] ||
            entry.maximumLinearAbsoluteLogResidual < 0 ||
            entry.maximumQuadraticAbsoluteLogResidual < 0 ||
            entry.maximumMixedSeparationAbsoluteLogResidual < 0,
        ) ||
        row.linearTrustRadius < V391_MINIMUM_LINEAR_TRUST_RADIUS ||
        row.quadraticTrustRadius < V391_MINIMUM_QUADRATIC_TRUST_RADIUS ||
        row.maximumInversionRelativeResidual >=
          V391_INVERSION_RELATIVE_RESIDUAL_LIMIT ||
        row.pythonOracleMaximumRelativeDifference >= V391_ORACLE_RELATIVE_LIMIT ||
        row.stressGridIsPhysicalUncertainty !== false ||
        row.physicalSystematicVectorAdmitted !== false ||
        row.absoluteScientificInterval !== null,
    ) ||
    source.counts?.rayCount !== 4 ||
    source.counts.bandCount !== 3 ||
    source.counts.rowCount !== 12 ||
    source.counts.stressRadiusCount !== 9 ||
    source.counts.axisReplayCount !== 216 ||
    source.counts.mixedCornerReplayCount !== 864 ||
    source.counts.hessianCoefficientCount !== 216 ||
    source.maxima?.linearAbsoluteLogResidual !== maximumLinear ||
    source.maxima?.quadraticAbsoluteLogResidual !== maximumQuadratic ||
    source.maxima?.mixedSeparationAbsoluteLogResidual !== maximumMixed ||
    source.maxima?.inversionRelativeResidual !== maximumInversion ||
    source.maxima?.pythonOracleRelativeDifference !== maximumOracle ||
    source.minima?.linearTrustRadius !== minimumLinear ||
    source.minima?.quadraticTrustRadius !== minimumQuadratic ||
    source.method?.curvature !==
      "analytic-inverse-function-second-derivative" ||
    source.method.replay !==
      "exact-planck-inversion-plus-separable-redshift-and-flux" ||
    JSON.stringify(source.method.stressGrid) !== JSON.stringify(V391_STRESS_GRID) ||
    source.method.linearAbsoluteLogResidualLimit !==
      V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT ||
    source.method.quadraticAbsoluteLogResidualLimit !==
      V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT ||
    source.method.minimumRequiredLinearTrustRadius !==
      V391_MINIMUM_LINEAR_TRUST_RADIUS ||
    source.method.minimumRequiredQuadraticTrustRadius !==
      V391_MINIMUM_QUADRATIC_TRUST_RADIUS ||
    source.method.stressGridIsPhysicalUncertainty !== false ||
    source.method.stressGridProbabilityContent !== false ||
    source.method.derivativeFixturePublishableAsMeasurement !== false ||
    source.qualification?.analyticCurvatureQualified !== true ||
    source.qualification.linearTrustRegionQualified !== true ||
    source.qualification.quadraticTrustRegionQualified !== true ||
    source.qualification.crossTermSeparationQualified !== true ||
    source.qualification.physicalSystematicVectorAdmitted !== false ||
    source.qualification.covarianceProjectionExecuted !== false ||
    source.qualification.absoluteScientificIntervalQualified !== false ||
    source.qualification.absoluteTemperatureAuthorityGranted !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.export?.csvPath !==
      "dist/science/kerr-temperature-trust-region-v391/trust-region.csv" ||
    !SHA256.test(source.export?.csvFileSha256 ?? "") ||
    source.export?.rowCount !== 108 ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v391-trust-region-artifact-identity");
  }
  return value as KerrTemperatureTrustRegionArtifactV391;
}
