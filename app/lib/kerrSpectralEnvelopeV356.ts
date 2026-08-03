import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  KERR_SPECTRAL_BANDS_V354,
  type KerrSpectralBandV354,
  type KerrSpectralCorrelationResponseArtifactV354,
} from "./kerrSpectralCorrelationResponseV354";
import type {
  KerrSpectralEigenmodeAuditArtifactV355,
  KerrSpectralResponseEllipseV355,
} from "./kerrSpectralEigenmodeAuditV355";

export const KERR_SPECTRAL_ENVELOPE_VERSION_V356 =
  "v356-kerr-spectral-provenance-envelope-v1" as const;

type Point2 = readonly [number, number];
type Point3 = readonly [number, number, number];

export type KerrSpectralEnvelopeRayV356 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  confidenceLevelSigma: 1;
  envelope2DByPair: readonly Readonly<{
    bandPair: readonly [KerrSpectralBandV354, KerrSpectralBandV354];
    points: readonly Point2[];
    axisProbes: readonly Point2[];
    reconstructionRelativeDifference: number;
    maximumMahalanobisRadiusDifference: number;
    semiMajorOneSigma: number;
    semiMinorOneSigma: number;
    positionAngleDegrees: number;
    areaOneSigma: number;
  }>[];
  envelope3D: Readonly<{
    points: readonly Point3[];
    axisProbes: readonly Point3[];
    reconstructionRelativeDifference: number;
    maximumMahalanobisRadiusDifference: number;
  }>;
  provenance: Readonly<{
    eigenmodeArtifactSha256: string;
    correlationArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
}>;

export type KerrSpectralEnvelopeArtifactV356 = Readonly<{
  version: typeof KERR_SPECTRAL_ENVELOPE_VERSION_V356;
  generatedAt: string;
  status: "qualified-synthetic-provenance-and-reconstructable-envelope-audit";
  source: Readonly<{
    eigenmodePath: "dist/science/kerr-spectral-eigenmode-audit-v355/audit.json";
    eigenmodeFileSha256: string;
    eigenmodeArtifactSha256: string;
    correlationArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    envelope2DCount: 12;
    envelope2DPointCount: 576;
    envelope3DPointCount: 168;
    axisProbe2DCount: 48;
    axisProbe3DCount: 24;
  }>;
  geometry: Readonly<{
    confidenceLevelSigma: 1;
    pointsPerEllipse: 48;
    pointsPerEllipsoid: 42;
    axisProbePolicy: "symmetric-principal-axis-probes-weighted-reconstruction";
    reconstructionPolicy: "axis-probe-covariance-reconstruction-no-sampling-fit";
    coordinates: readonly KerrSpectralBandV354[];
  }>;
  rays: readonly KerrSpectralEnvelopeRayV356[];
  exports: Readonly<{
    jsonSha256: string;
    csvSha256: string;
    jsonByteLength: number;
    csvByteLength: number;
    absolutePathsExcluded: true;
    generatedAtExcluded: true;
    pidExcluded: true;
    fits: "unavailable-browser-free-offline-product-not-generated";
    png: "unavailable-browser-free-offline-product-not-generated";
  }>;
  maxima: Readonly<{
    reconstructionRelativeDifference: number;
    maximumMahalanobisRadiusDifference: number;
    ellipseAreaOneSigma: number;
  }>;
  fullMeasuredEnvelopeAuthority: "unavailable-input-covariance-is-synthetic-not-measured";
  scienceCinematicBoundary: "provenance-and-uncertainty-envelopes-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export type KerrSpectralEnvelopeExportRowV356 = Readonly<{
  kind: "eigenmode" | "ellipse" | "envelope3d";
  rayIndex: number;
  spinA: number;
  index: number;
  bandOrPair: string;
  value1: number;
  value2: number;
  value3: number;
  value4: number;
  value5: number;
}>;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SHA = /^[a-f0-9]{64}$/;

function covarianceFromAxisProbes3D(probes: readonly Point3[]): number[][] {
  return Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, column) =>
      probes.reduce((sum, point) => sum + point[row] * point[column], 0) / 2,
    ),
  );
}

function covarianceFromAxisProbes2D(probes: readonly Point2[]): number[][] {
  return Array.from({ length: 2 }, (_, row) =>
    Array.from({ length: 2 }, (_, column) =>
      probes.reduce((sum, point) => sum + point[row] * point[column], 0) / 2,
    ),
  );
}

function covarianceDifference(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  const numerator = Math.sqrt(left.reduce(
    (sum, row, rowIndex) => sum + row.reduce(
      (rowSum, value, columnIndex) => rowSum + (value - right[rowIndex][columnIndex]) ** 2,
      0,
    ),
    0,
  ));
  const denominator = Math.max(
    1e-300,
    Math.sqrt(left.reduce((sum, row) => sum + row.reduce((rowSum, value) => rowSum + value ** 2, 0), 0)),
  );
  return numerator / denominator;
}

function inverseMahalanobis2(point: Point2, covariance: readonly (readonly number[])[]): number {
  const determinant = covariance[0][0] * covariance[1][1] - covariance[0][1] ** 2;
  const x = point[0];
  const y = point[1];
  return (
    covariance[1][1] * x * x - 2 * covariance[0][1] * x * y + covariance[0][0] * y * y
  ) / determinant;
}

function inverseMahalanobis3(point: Point3, covariance: readonly (readonly number[])[], eigenmodes: readonly { eigenvalue: number; vector: Point3 }[]): number {
  const coordinates = eigenmodes.map((mode) =>
    mode.vector[0] * point[0] + mode.vector[1] * point[1] + mode.vector[2] * point[2],
  );
  return coordinates.reduce((sum, coordinate, index) => sum + coordinate ** 2 / eigenmodes[index].eigenvalue, 0);
}

function ellipsePoints(ellipse: KerrSpectralResponseEllipseV355): readonly Point2[] {
  const angle = ellipse.positionAngleDegrees * Math.PI / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return Object.freeze(Array.from({ length: 48 }, (_, index) => {
    const theta = 2 * Math.PI * index / 48;
    const x = ellipse.semiMajorOneSigma * Math.cos(theta);
    const y = ellipse.semiMinorOneSigma * Math.sin(theta);
    return Object.freeze([cosine * x - sine * y, sine * x + cosine * y] as const);
  }));
}

function ellipseAxisProbes(ellipse: KerrSpectralResponseEllipseV355): readonly Point2[] {
  const angle = ellipse.positionAngleDegrees * Math.PI / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const major: Point2 = [cosine * ellipse.semiMajorOneSigma, sine * ellipse.semiMajorOneSigma];
  const minor: Point2 = [-sine * ellipse.semiMinorOneSigma, cosine * ellipse.semiMinorOneSigma];
  return Object.freeze([major, [-major[0], -major[1]], minor, [-minor[0], -minor[1]]]);
}

function ellipsoidPoints(ray: KerrSpectralEigenmodeAuditArtifactV355["rays"][number]): readonly Point3[] {
  return Object.freeze(Array.from({ length: 42 }, (_, index) => {
    const z = 1 - 2 * (index + 0.5) / 42;
    const radius = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = GOLDEN_ANGLE * index;
    const unit = [radius * Math.cos(theta), radius * Math.sin(theta), z];
    const point = ray.modes.reduce((sum, mode, modeIndex) => {
      const scale = Math.sqrt(mode.eigenvalue) * unit[modeIndex];
      return [sum[0] + scale * mode.vectorByBand.visible, sum[1] + scale * mode.vectorByBand.euv, sum[2] + scale * mode.vectorByBand["soft-x-ray"]];
    }, [0, 0, 0]);
    return Object.freeze([point[0], point[1], point[2]] as Point3);
  }));
}

function ellipsoidAxisProbes(ray: KerrSpectralEigenmodeAuditArtifactV355["rays"][number]): readonly Point3[] {
  return Object.freeze(ray.modes.flatMap((mode) => {
    const scale = Math.sqrt(mode.eigenvalue);
    const point: Point3 = [scale * mode.vectorByBand.visible, scale * mode.vectorByBand.euv, scale * mode.vectorByBand["soft-x-ray"]];
    return [point, [-point[0], -point[1], -point[2]] as const];
  }));
}

function sanitizeRows(artifact: KerrSpectralEnvelopeArtifactV356): readonly KerrSpectralEnvelopeExportRowV356[] {
  const rows: KerrSpectralEnvelopeExportRowV356[] = [];
  for (const ray of artifact.rays) {
    const sourceRay = ray;
    sourceRay.envelope2DByPair.forEach((ellipse, index) => rows.push({
      kind: "ellipse",
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      index,
      bandOrPair: ellipse.bandPair.join("/"),
      value1: ellipse.semiMajorOneSigma,
      value2: ellipse.semiMinorOneSigma,
      value3: ellipse.positionAngleDegrees,
      value4: ellipse.areaOneSigma,
      value5: ellipse.reconstructionRelativeDifference,
    }));
    sourceRay.envelope3D.points.forEach((point, index) => rows.push({
      kind: "envelope3d",
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      index,
      bandOrPair: "visible/euv/soft-x-ray",
      value1: point[0],
      value2: point[1],
      value3: point[2],
      value4: 0,
      value5: 0,
    }));
  }
  return Object.freeze(rows);
}

function exportJson(artifact: KerrSpectralEnvelopeArtifactV356): string {
  const rows = sanitizeRows(artifact);
  return JSON.stringify({
    version: artifact.version,
    status: artifact.status,
    sourceArtifactSha256: artifact.source.eigenmodeArtifactSha256,
    rows,
    boundary: artifact.fullMeasuredEnvelopeAuthority,
    denseCampaignStatus: artifact.denseCampaignStatus,
  });
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportCsv(artifact: KerrSpectralEnvelopeArtifactV356): string {
  const headers = ["kind", "rayIndex", "spinA", "index", "bandOrPair", "value1", "value2", "value3", "value4", "value5"];
  return [
    headers.join(","),
    ...sanitizeRows(artifact).map((row) => [row.kind, row.rayIndex, row.spinA, row.index, row.bandOrPair, row.value1, row.value2, row.value3, row.value4, row.value5].map(csvCell).join(",")),
  ].join("\n");
}

export function serializeKerrSpectralEnvelopeJsonV356(artifact: KerrSpectralEnvelopeArtifactV356): string {
  return exportJson(artifact);
}

export function serializeKerrSpectralEnvelopeCsvV356(artifact: KerrSpectralEnvelopeArtifactV356): string {
  return exportCsv(artifact);
}

export function createKerrSpectralEnvelopeV356(
  eigenmodes: KerrSpectralEigenmodeAuditArtifactV355,
  correlation: KerrSpectralCorrelationResponseArtifactV354,
  source: KerrSpectralEnvelopeArtifactV356["source"],
  artifactSha256 = "pending",
): KerrSpectralEnvelopeArtifactV356 {
  if (
    eigenmodes.status !== "qualified-synthetic-response-eigenmode-and-ellipse-audit" ||
    correlation.status !== "qualified-synthetic-correlated-spectral-response-audit" ||
    eigenmodes.artifactSha256 !== source.eigenmodeArtifactSha256 ||
    correlation.artifactSha256 !== source.correlationArtifactSha256
  ) throw new Error("v356-source-boundary");
  const rays = eigenmodes.rays.map((ray) => {
    const envelope2DByPair = ray.ellipses.map((ellipse) => {
      const points = ellipsePoints(ellipse);
      const axisProbes = ellipseAxisProbes(ellipse);
      const covariance = ellipse.covariance;
      const reconstructed = covarianceFromAxisProbes2D(axisProbes);
      return Object.freeze({
        bandPair: ellipse.bandPair,
        points,
        axisProbes,
        reconstructionRelativeDifference: covarianceDifference(covariance, reconstructed),
        maximumMahalanobisRadiusDifference: Math.max(...points.map((point) => Math.abs(inverseMahalanobis2(point, covariance) - 1))),
        semiMajorOneSigma: ellipse.semiMajorOneSigma,
        semiMinorOneSigma: ellipse.semiMinorOneSigma,
        positionAngleDegrees: ellipse.positionAngleDegrees,
        areaOneSigma: ellipse.areaOneSigma,
      });
    });
    const points3D = ellipsoidPoints(ray);
    const axisProbes3D = ellipsoidAxisProbes(ray);
    const eigenmodeVectors = ray.modes.map((mode) => ({
      eigenvalue: mode.eigenvalue,
      vector: [mode.vectorByBand.visible, mode.vectorByBand.euv, mode.vectorByBand["soft-x-ray"]] as Point3,
    }));
    const reconstructed3D = covarianceFromAxisProbes3D(axisProbes3D);
    const covariance3D = eigenmodeVectors.reduce((matrix, mode) => matrix.map((row, rowIndex) => row.map((value, columnIndex) => value + mode.eigenvalue * mode.vector[rowIndex] * mode.vector[columnIndex])), Array.from({ length: 3 }, () => Array<number>(3).fill(0)));
    return Object.freeze({
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      confidenceLevelSigma: 1 as const,
      envelope2DByPair: Object.freeze(envelope2DByPair),
      envelope3D: Object.freeze({
        points: points3D,
        axisProbes: axisProbes3D,
        reconstructionRelativeDifference: covarianceDifference(covariance3D, reconstructed3D),
        maximumMahalanobisRadiusDifference: Math.max(...points3D.map((point) => Math.abs(inverseMahalanobis3(point, covariance3D, eigenmodeVectors) - 1))),
      }),
      provenance: Object.freeze({
        eigenmodeArtifactSha256: source.eigenmodeArtifactSha256,
        correlationArtifactSha256: source.correlationArtifactSha256,
        fullShortAuthoritySha256: source.fullShortAuthoritySha256,
      }),
    });
  });
  const provisional = {
    version: KERR_SPECTRAL_ENVELOPE_VERSION_V356,
    generatedAt: new Date().toISOString(),
    status: "qualified-synthetic-provenance-and-reconstructable-envelope-audit" as const,
    source,
    counts: Object.freeze({ rayCount: 4, bandCount: 3, envelope2DCount: 12, envelope2DPointCount: 576, envelope3DPointCount: 168, axisProbe2DCount: 48, axisProbe3DCount: 24 } as const),
    geometry: Object.freeze({ confidenceLevelSigma: 1 as const, pointsPerEllipse: 48 as const, pointsPerEllipsoid: 42 as const, axisProbePolicy: "symmetric-principal-axis-probes-weighted-reconstruction" as const, reconstructionPolicy: "axis-probe-covariance-reconstruction-no-sampling-fit" as const, coordinates: KERR_SPECTRAL_BANDS_V354 }),
    rays: Object.freeze(rays),
    exports: { jsonSha256: "pending", csvSha256: "pending", jsonByteLength: 0, csvByteLength: 0, absolutePathsExcluded: true as const, generatedAtExcluded: true as const, pidExcluded: true as const, fits: "unavailable-browser-free-offline-product-not-generated" as const, png: "unavailable-browser-free-offline-product-not-generated" as const },
    maxima: { reconstructionRelativeDifference: Math.max(...rays.flatMap((ray) => [ray.envelope3D.reconstructionRelativeDifference, ...ray.envelope2DByPair.map((ellipse) => ellipse.reconstructionRelativeDifference)])), maximumMahalanobisRadiusDifference: Math.max(...rays.flatMap((ray) => [ray.envelope3D.maximumMahalanobisRadiusDifference, ...ray.envelope2DByPair.map((ellipse) => ellipse.maximumMahalanobisRadiusDifference)])), ellipseAreaOneSigma: Math.max(...rays.flatMap((ray) => ray.envelope2DByPair.map((ellipse) => ellipse.areaOneSigma))) },
    fullMeasuredEnvelopeAuthority: "unavailable-input-covariance-is-synthetic-not-measured" as const,
    scienceCinematicBoundary: "provenance-and-uncertainty-envelopes-never-cinematic-color-input" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    denseAggregateSha256: null,
    browserQualification: "not-run" as const,
    artifactSha256,
  };
  const json = exportJson(provisional as KerrSpectralEnvelopeArtifactV356);
  const csv = exportCsv(provisional as KerrSpectralEnvelopeArtifactV356);
  return Object.freeze({
    ...provisional,
    exports: Object.freeze({ ...provisional.exports, jsonSha256: awaitlessSha(json), csvSha256: awaitlessSha(csv), jsonByteLength: new TextEncoder().encode(json).byteLength, csvByteLength: new TextEncoder().encode(csv).byteLength }),
  }) as KerrSpectralEnvelopeArtifactV356;
}

function awaitlessSha(value: string): string {
  return sha256Utf8HexV566(value);
}

export function parseKerrSpectralEnvelopeArtifactV356(value: unknown): KerrSpectralEnvelopeArtifactV356 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSpectralEnvelopeArtifactV356> : null;
  const rays = source?.rays ?? [];
  if (!source || source.version !== KERR_SPECTRAL_ENVELOPE_VERSION_V356 || source.status !== "qualified-synthetic-provenance-and-reconstructable-envelope-audit" || !SHA.test(source.source?.eigenmodeFileSha256 ?? "") || !SHA.test(source.source?.eigenmodeArtifactSha256 ?? "") || !SHA.test(source.source?.correlationArtifactSha256 ?? "") || !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") || source.counts?.rayCount !== 4 || source.counts.envelope2DCount !== 12 || source.counts.envelope3DPointCount !== 168 || source.geometry?.pointsPerEllipse !== 48 || source.geometry.pointsPerEllipsoid !== 42 || rays.length !== 4 || rays.some((ray) => ray.envelope2DByPair.length !== 3 || ray.envelope3D.points.length !== 42 || ray.envelope3D.axisProbes.length !== 6 || ray.envelope2DByPair.some((ellipse) => ellipse.points.length !== 48 || ellipse.axisProbes.length !== 4 || ellipse.reconstructionRelativeDifference > 1e-12 || ellipse.maximumMahalanobisRadiusDifference > 1e-12) || ray.envelope3D.reconstructionRelativeDifference > 1e-12 || ray.envelope3D.maximumMahalanobisRadiusDifference > 1e-12 || !SHA.test(ray.provenance.eigenmodeArtifactSha256)) || (source.maxima?.reconstructionRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || (source.maxima?.maximumMahalanobisRadiusDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || source.exports?.absolutePathsExcluded !== true || source.exports.generatedAtExcluded !== true || source.exports.pidExcluded !== true || source.fullMeasuredEnvelopeAuthority !== "unavailable-input-covariance-is-synthetic-not-measured" || source.scienceCinematicBoundary !== "provenance-and-uncertainty-envelopes-never-cinematic-color-input" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v356-envelope-artifact-identity");
  return value as KerrSpectralEnvelopeArtifactV356;
}
