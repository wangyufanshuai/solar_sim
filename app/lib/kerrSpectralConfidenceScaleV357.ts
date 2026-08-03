import {
  KERR_SPECTRAL_BANDS_V354,
  type KerrSpectralBandV354,
  type KerrSpectralCorrelationResponseArtifactV354,
} from "./kerrSpectralCorrelationResponseV354";
import type { KerrSpectralEigenmodeAuditArtifactV355 } from "./kerrSpectralEigenmodeAuditV355";
import type { KerrSpectralEnvelopeArtifactV356 } from "./kerrSpectralEnvelopeV356";

export const KERR_SPECTRAL_CONFIDENCE_SCALE_VERSION_V357 =
  "v357-kerr-spectral-confidence-scale-audit-v1" as const;
export const KERR_SPECTRAL_CONFIDENCE_LEVELS_V357 = Object.freeze([1, 2, 3] as const);
export type KerrSpectralSigmaV357 = (typeof KERR_SPECTRAL_CONFIDENCE_LEVELS_V357)[number];

export type KerrSpectralConfidenceScaleLevelV357 = Readonly<{
  sigma: KerrSpectralSigmaV357;
  ellipsePointCountPerPair: 48;
  ellipsoidPointCount: 42;
  ellipseMahalanobisTarget: number;
  ellipsoidMahalanobisTarget: number;
  ellipseRadiusMaximumDifference: number;
  ellipsoidRadiusMaximumDifference: number;
  ellipseAreaScale: number;
  ellipseAreaScaleRelativeDifference: number;
  reconstructionInvariantRelativeDifference: number;
}>;

export type KerrSpectralConfidenceScaleRayV357 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  levels: readonly KerrSpectralConfidenceScaleLevelV357[];
  provenance: Readonly<{
    envelopeArtifactSha256: string;
    eigenmodeArtifactSha256: string;
    correlationArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
}>;

export type KerrSpectralConfidenceScaleArtifactV357 = Readonly<{
  version: typeof KERR_SPECTRAL_CONFIDENCE_SCALE_VERSION_V357;
  generatedAt: string;
  status: "qualified-synthetic-multiscale-envelope-audit";
  source: Readonly<{
    envelopePath: "dist/science/kerr-spectral-envelope-v356/audit.json";
    envelopeFileSha256: string;
    envelopeArtifactSha256: string;
    eigenmodeArtifactSha256: string;
    correlationArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  counts: Readonly<{
    rayCount: 4;
    levelCount: 3;
    ellipseLevelCount: 36;
    ellipsoidLevelCount: 12;
  }>;
  scaleConvention: Readonly<{
    levels: readonly KerrSpectralSigmaV357[];
    radialRule: "boundary-radius-scales-linearly-with-sigma";
    areaRule: "two-dimensional-ellipse-area-scales-with-sigma-squared";
    interpretation: "synthetic-gaussian-scale-convention-not-measured-confidence-or-coverage";
    reconstructionRule: "covariance-reconstruction-is-invariant-after-dividing-by-sigma-squared";
    coordinates: readonly KerrSpectralBandV354[];
  }>;
  rays: readonly KerrSpectralConfidenceScaleRayV357[];
  maxima: Readonly<{
    ellipseRadiusMaximumDifference: number;
    ellipsoidRadiusMaximumDifference: number;
    ellipseAreaScaleRelativeDifference: number;
    reconstructionInvariantRelativeDifference: number;
  }>;
  measuredConfidenceAuthority: "unavailable-synthetic-scale-not-measured-probability-coverage";
  scienceCinematicBoundary: "multiscale-uncertainty-envelope-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
function radius2(point: readonly [number, number], semiMajor: number, semiMinor: number, angleDegrees: number): number {
  const angle = angleDegrees * Math.PI / 180;
  const x = Math.cos(angle) * point[0] + Math.sin(angle) * point[1];
  const y = -Math.sin(angle) * point[0] + Math.cos(angle) * point[1];
  return Math.sqrt((x / semiMajor) ** 2 + (y / semiMinor) ** 2);
}

function radius3(point: readonly [number, number, number], eigenmodes: readonly { eigenvalue: number; vector: readonly [number, number, number] }[]): number {
  const coordinates = eigenmodes.map((mode) => mode.vector[0] * point[0] + mode.vector[1] * point[1] + mode.vector[2] * point[2]);
  return Math.sqrt(coordinates.reduce((sum, coordinate, index) => sum + coordinate ** 2 / modeEigenvalue(eigenmodes[index].eigenvalue), 0));
}

function modeEigenvalue(value: number): number {
  return value;
}

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
}

export function createKerrSpectralConfidenceScaleV357(
  envelope: KerrSpectralEnvelopeArtifactV356,
  eigenmodes: KerrSpectralEigenmodeAuditArtifactV355,
  correlation: KerrSpectralCorrelationResponseArtifactV354,
  source: KerrSpectralConfidenceScaleArtifactV357["source"],
  artifactSha256 = "pending",
): KerrSpectralConfidenceScaleArtifactV357 {
  if (envelope.status !== "qualified-synthetic-provenance-and-reconstructable-envelope-audit" || eigenmodes.status !== "qualified-synthetic-response-eigenmode-and-ellipse-audit" || correlation.status !== "qualified-synthetic-correlated-spectral-response-audit" || envelope.artifactSha256 !== source.envelopeArtifactSha256 || eigenmodes.artifactSha256 !== source.eigenmodeArtifactSha256 || correlation.artifactSha256 !== source.correlationArtifactSha256) throw new Error("v357-source-boundary");
  let maxEllipseRadius = 0;
  let maxEllipsoidRadius = 0;
  let maxArea = 0;
  let maxReconstruction = 0;
  const rays = envelope.rays.map((baseRay): KerrSpectralConfidenceScaleRayV357 => {
    const eigenRay = eigenmodes.rays.find((ray) => ray.rayIndex === baseRay.rayIndex);
    if (!eigenRay) throw new Error("v357-eigen-ray-missing");
    const modes = eigenRay.modes.map((mode) => ({ eigenvalue: mode.eigenvalue, vector: [mode.vectorByBand.visible, mode.vectorByBand.euv, mode.vectorByBand["soft-x-ray"]] as [number, number, number] }));
    const levels = KERR_SPECTRAL_CONFIDENCE_LEVELS_V357.map((sigma): KerrSpectralConfidenceScaleLevelV357 => {
      const ellipseErrors = baseRay.envelope2DByPair.map((ellipse) => {
        const radiusError = Math.max(
          ...ellipse.points.map((point) =>
            Math.abs(
              radius2(point, ellipse.semiMajorOneSigma, ellipse.semiMinorOneSigma, ellipse.positionAngleDegrees) * sigma - sigma,
            ),
          ),
        );
        const scaledArea = Math.PI * (ellipse.semiMajorOneSigma * sigma) * (ellipse.semiMinorOneSigma * sigma);
        return {
          radiusError,
          areaDifference: relativeDifference(scaledArea, ellipse.areaOneSigma * sigma ** 2),
        };
      });
      const ellipsoidRadiusError = Math.max(...baseRay.envelope3D.points.map((point) => Math.abs(radius3(point, modes) * sigma - sigma)));
      const reconstruction = Math.max(baseRay.envelope3D.reconstructionRelativeDifference, ...baseRay.envelope2DByPair.map((ellipse) => ellipse.reconstructionRelativeDifference));
      const level = Object.freeze({ sigma, ellipsePointCountPerPair: 48 as const, ellipsoidPointCount: 42 as const, ellipseMahalanobisTarget: sigma, ellipsoidMahalanobisTarget: sigma, ellipseRadiusMaximumDifference: Math.max(...ellipseErrors.map((entry) => entry.radiusError)), ellipsoidRadiusMaximumDifference: ellipsoidRadiusError, ellipseAreaScale: sigma ** 2, ellipseAreaScaleRelativeDifference: Math.max(...ellipseErrors.map((entry) => entry.areaDifference)), reconstructionInvariantRelativeDifference: reconstruction });
      maxEllipseRadius = Math.max(maxEllipseRadius, level.ellipseRadiusMaximumDifference);
      maxEllipsoidRadius = Math.max(maxEllipsoidRadius, level.ellipsoidRadiusMaximumDifference);
      maxArea = Math.max(maxArea, level.ellipseAreaScaleRelativeDifference);
      maxReconstruction = Math.max(maxReconstruction, level.reconstructionInvariantRelativeDifference);
      return level;
    });
    return Object.freeze({ rayIndex: baseRay.rayIndex, spinA: baseRay.spinA, levels: Object.freeze(levels), provenance: Object.freeze({ envelopeArtifactSha256: source.envelopeArtifactSha256, eigenmodeArtifactSha256: source.eigenmodeArtifactSha256, correlationArtifactSha256: source.correlationArtifactSha256, fullShortAuthoritySha256: source.fullShortAuthoritySha256 }) });
  });
  if (maxEllipseRadius > 1e-12 || maxEllipsoidRadius > 1e-12 || maxArea > 1e-15 || maxReconstruction > 1e-12) throw new Error("v357-scale-gate");
  return Object.freeze({ version: KERR_SPECTRAL_CONFIDENCE_SCALE_VERSION_V357, generatedAt: new Date().toISOString(), status: "qualified-synthetic-multiscale-envelope-audit", source, counts: Object.freeze({ rayCount: 4, levelCount: 3, ellipseLevelCount: 36, ellipsoidLevelCount: 12 } as const), scaleConvention: Object.freeze({ levels: KERR_SPECTRAL_CONFIDENCE_LEVELS_V357, radialRule: "boundary-radius-scales-linearly-with-sigma" as const, areaRule: "two-dimensional-ellipse-area-scales-with-sigma-squared" as const, interpretation: "synthetic-gaussian-scale-convention-not-measured-confidence-or-coverage" as const, reconstructionRule: "covariance-reconstruction-is-invariant-after-dividing-by-sigma-squared" as const, coordinates: KERR_SPECTRAL_BANDS_V354 }), rays: Object.freeze(rays), maxima: Object.freeze({ ellipseRadiusMaximumDifference: maxEllipseRadius, ellipsoidRadiusMaximumDifference: maxEllipsoidRadius, ellipseAreaScaleRelativeDifference: maxArea, reconstructionInvariantRelativeDifference: maxReconstruction }), measuredConfidenceAuthority: "unavailable-synthetic-scale-not-measured-probability-coverage", scienceCinematicBoundary: "multiscale-uncertainty-envelope-never-cinematic-color-input", denseCampaignStatus: "incomplete-0-of-49", denseAggregateSha256: null, browserQualification: "not-run", artifactSha256 });
}

export function parseKerrSpectralConfidenceScaleArtifactV357(value: unknown): KerrSpectralConfidenceScaleArtifactV357 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSpectralConfidenceScaleArtifactV357> : null;
  const rays = source?.rays ?? [];
  if (!source || source.version !== KERR_SPECTRAL_CONFIDENCE_SCALE_VERSION_V357 || source.status !== "qualified-synthetic-multiscale-envelope-audit" || !SHA.test(source.source?.envelopeFileSha256 ?? "") || !SHA.test(source.source?.envelopeArtifactSha256 ?? "") || !SHA.test(source.source?.eigenmodeArtifactSha256 ?? "") || !SHA.test(source.source?.correlationArtifactSha256 ?? "") || !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") || source.counts?.rayCount !== 4 || source.counts.levelCount !== 3 || source.counts.ellipseLevelCount !== 36 || source.counts.ellipsoidLevelCount !== 12 || source.scaleConvention?.interpretation !== "synthetic-gaussian-scale-convention-not-measured-confidence-or-coverage" || source.scaleConvention.radialRule !== "boundary-radius-scales-linearly-with-sigma" || source.scaleConvention.areaRule !== "two-dimensional-ellipse-area-scales-with-sigma-squared" || rays.length !== 4 || rays.some((ray) => ray.levels.length !== 3 || ray.levels.some((level) => ![1, 2, 3].includes(level.sigma) || level.ellipsePointCountPerPair !== 48 || level.ellipsoidPointCount !== 42 || level.ellipseRadiusMaximumDifference > 1e-12 || level.ellipsoidRadiusMaximumDifference > 1e-12 || level.ellipseAreaScaleRelativeDifference > 1e-15 || level.reconstructionInvariantRelativeDifference > 1e-12) || !SHA.test(ray.provenance.envelopeArtifactSha256)) || (source.maxima?.ellipseRadiusMaximumDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || (source.maxima?.ellipsoidRadiusMaximumDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || (source.maxima?.ellipseAreaScaleRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-15 || (source.maxima?.reconstructionInvariantRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || source.measuredConfidenceAuthority !== "unavailable-synthetic-scale-not-measured-probability-coverage" || source.scienceCinematicBoundary !== "multiscale-uncertainty-envelope-never-cinematic-color-input" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v357-confidence-scale-identity");
  return value as KerrSpectralConfidenceScaleArtifactV357;
}
