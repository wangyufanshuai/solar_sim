import {
  KERR_SPECTRAL_BANDS_V354,
  type KerrSpectralBandV354,
  type KerrSpectralCorrelationResponseArtifactV354,
} from "./kerrSpectralCorrelationResponseV354";

export const KERR_SPECTRAL_EIGENMODE_AUDIT_VERSION_V355 =
  "v355-kerr-spectral-response-eigenmode-audit-v1" as const;

export type KerrSpectralResponseEigenmodeV355 = Readonly<{
  modeIndex: 0 | 1 | 2;
  eigenvalue: number;
  standardDeviation: number;
  varianceFraction: number;
  vectorByBand: Readonly<Record<KerrSpectralBandV354, number>>;
}>;

export type KerrSpectralResponseEllipseV355 = Readonly<{
  bandPair: readonly [KerrSpectralBandV354, KerrSpectralBandV354];
  covariance: readonly (readonly number[])[];
  correlation: number;
  semiMajorOneSigma: number;
  semiMinorOneSigma: number;
  positionAngleDegrees: number;
  areaOneSigma: number;
}>;

export type KerrSpectralEigenmodeRayV355 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  modes: readonly KerrSpectralResponseEigenmodeV355[];
  ellipses: readonly KerrSpectralResponseEllipseV355[];
  trace: number;
  determinant: number;
  conditionNumber: number;
  orthonormalityDeviation: number;
  reconstructionRelativeDifference: number;
  eigenResidualRelativeDifference: number;
  traceConservationRelativeDifference: number;
  provenance: Readonly<{
    spectralCorrelationArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
}>;

export type KerrSpectralEigenmodeAuditArtifactV355 = Readonly<{
  version: typeof KERR_SPECTRAL_EIGENMODE_AUDIT_VERSION_V355;
  generatedAt: string;
  status: "qualified-synthetic-response-eigenmode-and-ellipse-audit";
  source: Readonly<{
    spectralCorrelationPath: "dist/science/kerr-spectral-correlation-response-v354/audit.json";
    spectralCorrelationFileSha256: string;
    spectralCorrelationArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    eigenmodeCount: 12;
    ellipseCount: 12;
  }>;
  decomposition: Readonly<{
    solver: "deterministic-symmetric-jacobi-3x3-float64";
    ordering: "descending-eigenvalue-canonical-largest-component-positive";
    interpretation: "synthetic-response-covariance-principal-axes-not-measured-instrument-modes";
    covariancePolicy: "decomposition-of-v354-explicit-synthetic-covariance-no-new-independence-claim";
    bandOrder: readonly KerrSpectralBandV354[];
  }>;
  rays: readonly KerrSpectralEigenmodeRayV355[];
  maxima: Readonly<{
    orthonormalityDeviation: number;
    reconstructionRelativeDifference: number;
    eigenResidualRelativeDifference: number;
    traceConservationRelativeDifference: number;
    conditionNumber: number;
    ellipseAreaOneSigma: number;
  }>;
  fullMeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured";
  scienceCinematicBoundary: "spectral-eigenmodes-and-ellipses-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

type EigenPair = Readonly<{ value: number; vector: readonly number[] }>;

const SHA = /^[a-f0-9]{64}$/;
const RAYS = Object.freeze([12, 13, 14, 15] as const);
const PAIRS = Object.freeze([
  Object.freeze([0, 1] as const),
  Object.freeze([0, 2] as const),
  Object.freeze([1, 2] as const),
]);

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
}

function frobeniusNorm(matrix: readonly (readonly number[])[]): number {
  return Math.sqrt(matrix.reduce(
    (sum, row) => sum + row.reduce((rowSum, value) => rowSum + value * value, 0),
    0,
  ));
}

function determinant3(matrix: readonly (readonly number[])[]): number {
  const [a, b, c] = matrix[0];
  const [d, e, f] = matrix[1];
  const [g, h, i] = matrix[2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

function canonicalizeVector(vector: readonly number[]): number[] {
  let pivot = 0;
  for (let index = 1; index < vector.length; index += 1) {
    if (Math.abs(vector[index]) > Math.abs(vector[pivot])) pivot = index;
  }
  const sign = vector[pivot] < 0 ? -1 : 1;
  return vector.map((value) => value * sign);
}

function symmetricEigen3(matrix: readonly (readonly number[])[]): readonly EigenPair[] {
  const values = matrix.map((row) => [...row]);
  const vectors = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let iteration = 0; iteration < 64; iteration += 1) {
    let pivotRow = 0;
    let pivotColumn = 1;
    let maximum = Math.abs(values[0][1]);
    for (const [row, column] of PAIRS) {
      const candidate = Math.abs(values[row][column]);
      if (candidate > maximum) {
        maximum = candidate;
        pivotRow = row;
        pivotColumn = column;
      }
    }
    if (maximum < 1e-18) break;
    const app = values[pivotRow][pivotRow];
    const aqq = values[pivotColumn][pivotColumn];
    const apq = values[pivotRow][pivotColumn];
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let index = 0; index < 3; index += 1) {
      if (index === pivotRow || index === pivotColumn) continue;
      const aip = values[index][pivotRow];
      const aiq = values[index][pivotColumn];
      values[index][pivotRow] = cosine * aip - sine * aiq;
      values[pivotRow][index] = values[index][pivotRow];
      values[index][pivotColumn] = sine * aip + cosine * aiq;
      values[pivotColumn][index] = values[index][pivotColumn];
    }
    values[pivotRow][pivotRow] =
      cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
    values[pivotColumn][pivotColumn] =
      sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
    values[pivotRow][pivotColumn] = 0;
    values[pivotColumn][pivotRow] = 0;
    for (let row = 0; row < 3; row += 1) {
      const vip = vectors[row][pivotRow];
      const viq = vectors[row][pivotColumn];
      vectors[row][pivotRow] = cosine * vip - sine * viq;
      vectors[row][pivotColumn] = sine * vip + cosine * viq;
    }
  }
  return [0, 1, 2]
    .map((index) => ({
      value: values[index][index],
      vector: canonicalizeVector(vectors.map((row) => row[index])),
    }))
    .sort((left, right) => right.value - left.value);
}

function orthonormalityDeviation(pairs: readonly EigenPair[]): number {
  let maximum = 0;
  for (let left = 0; left < 3; left += 1) {
    for (let right = 0; right < 3; right += 1) {
      const dot = pairs[left].vector.reduce(
        (sum, value, index) => sum + value * pairs[right].vector[index],
        0,
      );
      maximum = Math.max(maximum, Math.abs(dot - (left === right ? 1 : 0)));
    }
  }
  return maximum;
}

function reconstruct(pairs: readonly EigenPair[]): number[][] {
  return Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, column) =>
      pairs.reduce(
        (sum, pair) => sum + pair.value * pair.vector[row] * pair.vector[column],
        0,
      ),
    ),
  );
}

function matrixRelativeDifference(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  const difference = left.map((row, rowIndex) =>
    row.map((value, columnIndex) => value - right[rowIndex][columnIndex]),
  );
  return frobeniusNorm(difference) / Math.max(1e-300, frobeniusNorm(left), frobeniusNorm(right));
}

function eigenResidual(matrix: readonly (readonly number[])[], pair: EigenPair): number {
  const residual = matrix.map((row, rowIndex) =>
    row.reduce((sum, value, column) => sum + value * pair.vector[column], 0) -
      pair.value * pair.vector[rowIndex],
  );
  const norm = Math.sqrt(residual.reduce((sum, value) => sum + value * value, 0));
  return norm / Math.max(1e-300, frobeniusNorm(matrix), Math.abs(pair.value));
}

function ellipse(
  covariance: readonly (readonly number[])[],
  left: number,
  right: number,
): KerrSpectralResponseEllipseV355 {
  const a = covariance[left][left];
  const b = covariance[left][right];
  const d = covariance[right][right];
  const discriminant = Math.sqrt((a - d) ** 2 + 4 * b * b);
  const majorVariance = (a + d + discriminant) / 2;
  const minorVariance = (a + d - discriminant) / 2;
  const determinant = a * d - b * b;
  if (!(minorVariance > 0) || !(determinant > 0)) throw new Error("v355-ellipse-not-positive-definite");
  return Object.freeze({
    bandPair: Object.freeze([
      KERR_SPECTRAL_BANDS_V354[left],
      KERR_SPECTRAL_BANDS_V354[right],
    ]) as readonly [KerrSpectralBandV354, KerrSpectralBandV354],
    covariance: Object.freeze([
      Object.freeze([a, b]),
      Object.freeze([b, d]),
    ]),
    correlation: b / Math.sqrt(a * d),
    semiMajorOneSigma: Math.sqrt(majorVariance),
    semiMinorOneSigma: Math.sqrt(minorVariance),
    positionAngleDegrees: 0.5 * Math.atan2(2 * b, a - d) * 180 / Math.PI,
    areaOneSigma: Math.PI * Math.sqrt(determinant),
  });
}

export function createKerrSpectralEigenmodeAuditV355(
  correlation: KerrSpectralCorrelationResponseArtifactV354,
  source: KerrSpectralEigenmodeAuditArtifactV355["source"],
  artifactSha256 = "pending",
): KerrSpectralEigenmodeAuditArtifactV355 {
  if (
    correlation.status !== "qualified-synthetic-correlated-spectral-response-audit" ||
    correlation.artifactSha256 !== source.spectralCorrelationArtifactSha256 ||
    correlation.denseAggregateSha256 !== null
  ) {
    throw new Error("v355-source-boundary");
  }

  let maxOrthonormality = 0;
  let maxReconstruction = 0;
  let maxResidual = 0;
  let maxTrace = 0;
  let maxCondition = 0;
  let maxEllipseArea = 0;
  const rays = correlation.rays.map((ray): KerrSpectralEigenmodeRayV355 => {
    const covariance = ray.responseRelativeCovariance;
    const pairs = symmetricEigen3(covariance);
    const trace = covariance[0][0] + covariance[1][1] + covariance[2][2];
    if (!(pairs[2].value > 0) || !(trace > 0)) throw new Error("v355-eigenvalue-not-positive");
    const modes = pairs.map((pair, index): KerrSpectralResponseEigenmodeV355 => Object.freeze({
      modeIndex: index as 0 | 1 | 2,
      eigenvalue: pair.value,
      standardDeviation: Math.sqrt(pair.value),
      varianceFraction: pair.value / trace,
      vectorByBand: Object.freeze({
        visible: pair.vector[0],
        euv: pair.vector[1],
        "soft-x-ray": pair.vector[2],
      }),
    }));
    const ellipses = PAIRS.map(([left, right]) => ellipse(covariance, left, right));
    const orthonormality = orthonormalityDeviation(pairs);
    const reconstruction = matrixRelativeDifference(covariance, reconstruct(pairs));
    const residual = Math.max(...pairs.map((pair) => eigenResidual(covariance, pair)));
    const traceDifference = relativeDifference(trace, pairs.reduce((sum, pair) => sum + pair.value, 0));
    const conditionNumber = pairs[0].value / pairs[2].value;
    maxOrthonormality = Math.max(maxOrthonormality, orthonormality);
    maxReconstruction = Math.max(maxReconstruction, reconstruction);
    maxResidual = Math.max(maxResidual, residual);
    maxTrace = Math.max(maxTrace, traceDifference);
    maxCondition = Math.max(maxCondition, conditionNumber);
    maxEllipseArea = Math.max(maxEllipseArea, ...ellipses.map((entry) => entry.areaOneSigma));
    return Object.freeze({
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      modes: Object.freeze(modes),
      ellipses: Object.freeze(ellipses),
      trace,
      determinant: determinant3(covariance),
      conditionNumber,
      orthonormalityDeviation: orthonormality,
      reconstructionRelativeDifference: reconstruction,
      eigenResidualRelativeDifference: residual,
      traceConservationRelativeDifference: traceDifference,
      provenance: Object.freeze({
        spectralCorrelationArtifactSha256: source.spectralCorrelationArtifactSha256,
        fullShortAuthoritySha256: source.fullShortAuthoritySha256,
      }),
    });
  });

  if (
    maxOrthonormality > 1e-12 ||
    maxReconstruction > 1e-12 ||
    maxResidual > 1e-12 ||
    maxTrace > 1e-12
  ) {
    throw new Error("v355-eigendecomposition-gate");
  }

  return Object.freeze({
    version: KERR_SPECTRAL_EIGENMODE_AUDIT_VERSION_V355,
    generatedAt: new Date().toISOString(),
    status: "qualified-synthetic-response-eigenmode-and-ellipse-audit",
    source,
    counts: Object.freeze({ rayCount: 4, bandCount: 3, eigenmodeCount: 12, ellipseCount: 12 } as const),
    decomposition: Object.freeze({
      solver: "deterministic-symmetric-jacobi-3x3-float64",
      ordering: "descending-eigenvalue-canonical-largest-component-positive",
      interpretation: "synthetic-response-covariance-principal-axes-not-measured-instrument-modes",
      covariancePolicy: "decomposition-of-v354-explicit-synthetic-covariance-no-new-independence-claim",
      bandOrder: KERR_SPECTRAL_BANDS_V354,
    }),
    rays: Object.freeze(rays),
    maxima: Object.freeze({
      orthonormalityDeviation: maxOrthonormality,
      reconstructionRelativeDifference: maxReconstruction,
      eigenResidualRelativeDifference: maxResidual,
      traceConservationRelativeDifference: maxTrace,
      conditionNumber: maxCondition,
      ellipseAreaOneSigma: maxEllipseArea,
    }),
    fullMeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured",
    scienceCinematicBoundary: "spectral-eigenmodes-and-ellipses-never-cinematic-color-input",
    denseCampaignStatus: "incomplete-0-of-49",
    denseAggregateSha256: null,
    browserQualification: "not-run",
    artifactSha256,
  });
}

function validMatrix(matrix: readonly (readonly number[])[], size: number): boolean {
  return matrix.length === size && matrix.every((row) => row.length === size && row.every(Number.isFinite));
}

export function parseKerrSpectralEigenmodeAuditArtifactV355(
  value: unknown,
): KerrSpectralEigenmodeAuditArtifactV355 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrSpectralEigenmodeAuditArtifactV355>
    : null;
  const rays = source?.rays ?? [];
  if (
    !source ||
    source.version !== KERR_SPECTRAL_EIGENMODE_AUDIT_VERSION_V355 ||
    source.status !== "qualified-synthetic-response-eigenmode-and-ellipse-audit" ||
    !SHA.test(source.source?.spectralCorrelationFileSha256 ?? "") ||
    !SHA.test(source.source?.spectralCorrelationArtifactSha256 ?? "") ||
    !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") ||
    source.counts?.rayCount !== 4 ||
    source.counts.bandCount !== 3 ||
    source.counts.eigenmodeCount !== 12 ||
    source.counts.ellipseCount !== 12 ||
    source.decomposition?.solver !== "deterministic-symmetric-jacobi-3x3-float64" ||
    source.decomposition.covariancePolicy !== "decomposition-of-v354-explicit-synthetic-covariance-no-new-independence-claim" ||
    rays.length !== 4 ||
    rays.some((ray) =>
      !RAYS.includes(ray.rayIndex) ||
      ray.modes.length !== 3 ||
      ray.ellipses.length !== 3 ||
      ray.modes.some((mode) =>
        !(mode.eigenvalue > 0) ||
        !(mode.standardDeviation > 0) ||
        !(mode.varianceFraction > 0) ||
        !Object.values(mode.vectorByBand).every(Number.isFinite)
      ) ||
      ray.ellipses.some((entry) =>
        !validMatrix(entry.covariance, 2) ||
        !(entry.semiMajorOneSigma >= entry.semiMinorOneSigma) ||
        !(entry.semiMinorOneSigma > 0) ||
        !(entry.areaOneSigma > 0)
      ) ||
      ray.orthonormalityDeviation > 1e-12 ||
      ray.reconstructionRelativeDifference > 1e-12 ||
      ray.eigenResidualRelativeDifference > 1e-12 ||
      ray.traceConservationRelativeDifference > 1e-12 ||
      !SHA.test(ray.provenance.spectralCorrelationArtifactSha256)
    ) ||
    (source.maxima?.orthonormalityDeviation ?? Number.POSITIVE_INFINITY) > 1e-12 ||
    (source.maxima?.reconstructionRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 ||
    (source.maxima?.eigenResidualRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 ||
    (source.maxima?.traceConservationRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 ||
    source.fullMeasuredEigenmodeAuthority !== "unavailable-input-covariance-is-synthetic-not-measured" ||
    source.scienceCinematicBoundary !== "spectral-eigenmodes-and-ellipses-never-cinematic-color-input" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.denseAggregateSha256 !== null ||
    source.browserQualification !== "not-run" ||
    !SHA.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v355-spectral-eigenmode-artifact-identity");
  }
  return value as KerrSpectralEigenmodeAuditArtifactV355;
}
