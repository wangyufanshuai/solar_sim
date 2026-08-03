import { createHash } from "node:crypto";

import {
  parseKerrScreenCoordinateArtifactV419,
  type KerrScreenCoordinateArtifactV419,
} from "./kerrScreenCoordinateProvenanceV419";

export const KERR_OBSERVER_WCS_VERSION_V420 = "v420-kerr-observer-plane-linear-WCS-v1" as const;
export const KERR_OBSERVER_WCS_ARTIFACT_VERSION_V420 = "v420-kerr-observer-plane-WCS-artifact-v1" as const;
export const KERR_OBSERVER_WCS_SUMMARY_VERSION_V420 = "v420-kerr-observer-plane-WCS-summary-v1" as const;
export const KERR_OBSERVER_WCS_RESPONSE_VERSION_V420 = "v420-kerr-observer-plane-WCS-response-v1" as const;
export const KERR_V419_ARTIFACT_SHA256_V420 = "cbaafe2390f4df7f1437cb3dffa632fb3d5feb55cd6ff16f5fb2972cc08d43df" as const;
export const KERR_V419_FILE_SHA256_V420 = "adaebc0d0500c1b856dd8875a6f9edccf9ebd3ca07867d2cd3fdba76007d28aa" as const;
export const KERR_V314_PLAN_SHA256_V420 = "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04" as const;
export const KERR_V314_PLAN_FILE_SHA256_V420 = "a19598c89d98172850fb6faf0b5b00fbe3e369bda409abea7d7b76b431b0906c" as const;

type RayIndex = 12 | 13 | 14 | 15;
type RayId = "disk-00" | "disk-01" | "disk-02" | "disk-03";
export type KerrObserverWcsSourceRowV420 = Readonly<{
  rayIndex: RayIndex;
  rayId: RayId;
  spinA: number;
  alphaM: number;
  betaM: number;
  continuousPixelX: number;
  continuousPixelY: number;
  worldRoundtripAlphaResidualM: number;
  worldRoundtripBetaResidualM: number;
  authorityEvpaDeg: number;
  redshiftFactor: number;
  classification: "disk-hit";
  sampleSemantics: "continuous-source-coordinate-no-pixel-value";
  intensity: null;
  stokes: null;
  interpolationAllowed: false;
}>;

export type KerrObserverPlaneWcsViewV420 = Readonly<{
  version: typeof KERR_OBSERVER_WCS_VERSION_V420;
  status: "qualified-linear-observer-plane-WCS-and-four-source-catalog-no-raster-values";
  source: Readonly<{
    v314RayPlanSha256: typeof KERR_V314_PLAN_SHA256_V420;
    v419ScreenCoordinateArtifactSha256: typeof KERR_V419_ARTIFACT_SHA256_V420;
  }>;
  worldSupport: Readonly<{
    sourceStratum: "uniform-field";
    sourceRayCount: 1681;
    alphaSampleCount: 41;
    betaSampleCount: 41;
    alphaMinM: -22;
    alphaMaxM: 22;
    betaMinM: -16;
    betaMaxM: 16;
  }>;
  wcs: Readonly<{
    name: "KERR-FINITE-ZAMO-LINEAR-384";
    axes: 2;
    width: 384;
    height: 384;
    pixelConvention: "FITS-one-based-continuous-pixel-centers";
    ctype1: "LINEAR";
    ctype2: "LINEAR";
    cname1: "KERR_ALPHA";
    cname2: "KERR_BETA";
    crpix1: 192.5;
    crpix2: 192.5;
    crval1M: 0;
    crval2M: 0;
    cdelt1MPerPixel: number;
    cdelt2MPerPixel: number;
    physicalUnit: "geometrized-GM-over-c-squared";
    pixelXDirection: "increasing-alpha";
    pixelYDirection: "increasing-beta";
  }>;
  catalog: Readonly<{
    rowCount: 4;
    rows: readonly KerrObserverWcsSourceRowV420[];
    coordinateAuthority: "v419-qualified-screen-coordinates";
    interpolationPolicy: "prohibited-no-raster-reconstruction-from-four-rays";
  }>;
  maxima: Readonly<{
    tsWorldPixelWorldRoundtripResidualM: number;
    edgeWorldResidualM: number;
    pythonAstropyPixelDifference: number;
    pythonAstropyWorldRoundtripResidualM: number;
  }>;
  thresholds: Readonly<{
    tsWorldPixelWorldRoundtripResidualM: 1e-12;
    edgeWorldResidualM: 1e-12;
    pythonAstropyPixelDifference: 1e-10;
    pythonAstropyWorldRoundtripResidualM: 1e-12;
  }>;
  products: Readonly<{
    json: "available-WCS-and-sparse-source-catalog";
    csv: "available-sparse-source-catalog";
    fitsBinaryTable: "available-primary-WCS-header-plus-source-table-no-image-data";
    png: "available-coordinate-grid-diagnostic-not-raster-science-image";
    fitsImage: "unavailable-no-raster-science-values";
    polarimetricRaster: "unavailable-dense-campaign-incomplete-0-of-49";
  }>;
  scienceCinematicBoundary: Readonly<{
    science: "WCS-grid-and-source-vectors-from-immutable-authority";
    cinematic: "may-style-grid-background-only-with-fixed-seed";
    coordinateMutationAllowed: false;
    evpaMutationAllowed: false;
    intensitySynthesisAllowed: false;
    interpolationAllowed: false;
  }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "qualified-coordinate-WCS-and-four-row-source-catalog-with-no-image-pixel-values";
}>;

export type KerrObserverPlaneWcsArtifactV420 = Readonly<{
  version: typeof KERR_OBSERVER_WCS_ARTIFACT_VERSION_V420;
  generatedAt: string;
  status: KerrObserverPlaneWcsViewV420["status"];
  sourceFiles: Readonly<{ v314PlanFileSha256: typeof KERR_V314_PLAN_FILE_SHA256_V420; v419FileSha256: typeof KERR_V419_FILE_SHA256_V420; pythonOracleFileSha256: string }>;
  pythonOracleArtifactSha256: string;
  view: KerrObserverPlaneWcsViewV420;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  rasterScienceImageGenerated: false;
  artifactSha256: string;
}>;

export type KerrObserverPlaneWcsSummaryV420 = Readonly<{
  version: typeof KERR_OBSERVER_WCS_SUMMARY_VERSION_V420;
  status: KerrObserverPlaneWcsViewV420["status"];
  artifactSha256: string;
  worldSupport: KerrObserverPlaneWcsViewV420["worldSupport"];
  wcs: KerrObserverPlaneWcsViewV420["wcs"];
  rows: readonly KerrObserverWcsSourceRowV420[];
  maxima: KerrObserverPlaneWcsViewV420["maxima"];
  products: KerrObserverPlaneWcsViewV420["products"];
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-WCS-and-four-source-summary-no-raster-array-in-react-state";
}>;
export type KerrObserverPlaneWcsResponseV420 = Readonly<{ version: typeof KERR_OBSERVER_WCS_RESPONSE_VERSION_V420; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrObserverPlaneWcsSummaryV420 | null }>;

type PlanRay = Readonly<{ rayIndex: number; stratum: string; alphaM: number; betaM: number }>;
type Plan = Readonly<{ version: string; planSha256: string; rays: readonly PlanRay[]; strata: Record<string, number> }>;
type PythonOracle = Readonly<{ version: string; status: string; source: Readonly<{ v314RayPlanSha256: string; v419ArtifactSha256: string }>; wcs: Readonly<{ crpix1: number; crpix2: number; cdelt1MPerPixel: number; cdelt2MPerPixel: number }>; rows: readonly Readonly<{ rayIndex: number; continuousPixelX: number; continuousPixelY: number; worldRoundtripResidualM: number }>[]; maxima: Readonly<{ worldRoundtripResidualM: number; edgeWorldResidualM: number }>; artifactSha256: string }>;
const SHA = /^[a-f0-9]{64}$/;
const transient = new Set(["generatedAt", "artifactSha256"]);
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}
export const canonicalShaV420 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const WIDTH = 384;
const HEIGHT = 384;
const CRPIX1 = 192.5;
const CRPIX2 = 192.5;
const CDELT1 = 44 / WIDTH;
const CDELT2 = 32 / HEIGHT;
const worldToPixel = (alphaM: number, betaM: number) => ({ x: alphaM / CDELT1 + CRPIX1, y: betaM / CDELT2 + CRPIX2 });
const pixelToWorld = (x: number, y: number) => ({ alphaM: (x - CRPIX1) * CDELT1, betaM: (y - CRPIX2) * CDELT2 });

export function createKerrObserverPlaneWcsViewV420(planValue: unknown, v419Value: unknown, oracleValue: unknown): KerrObserverPlaneWcsViewV420 {
  const plan = planValue as Plan;
  const v419: KerrScreenCoordinateArtifactV419 = parseKerrScreenCoordinateArtifactV419(v419Value);
  const oracle = oracleValue as PythonOracle;
  if (plan.version !== "v314-kerr-corrected-dense-ray-plan-v1" || plan.planSha256 !== KERR_V314_PLAN_SHA256_V420 || plan.strata?.uniformField !== 1681 || v419.artifactSha256 !== KERR_V419_ARTIFACT_SHA256_V420) throw new Error("v420-authority-lock");
  const uniform = plan.rays.filter((row) => row.stratum === "uniform-field");
  const alpha = [...new Set(uniform.map((row) => row.alphaM))].sort((a, b) => a - b);
  const beta = [...new Set(uniform.map((row) => row.betaM))].sort((a, b) => a - b);
  if (uniform.length !== 1681 || alpha.length !== 41 || beta.length !== 41 || alpha[0] !== -22 || alpha.at(-1) !== 22 || beta[0] !== -16 || beta.at(-1) !== 16) throw new Error("v420-world-support");
  if (oracle.version !== "v420-kerr-observer-plane-astropy-WCS-oracle-v1" || oracle.status !== "qualified-independent-astropy-linear-WCS-roundtrip" || oracle.source.v314RayPlanSha256 !== KERR_V314_PLAN_SHA256_V420 || oracle.source.v419ArtifactSha256 !== KERR_V419_ARTIFACT_SHA256_V420 || !SHA.test(oracle.artifactSha256) || oracle.rows?.length !== 4) throw new Error("v420-oracle-lock");
  let tsRoundtrip = 0;
  let pythonPixelDifference = 0;
  const rows = v419.view.rows.map((source): KerrObserverWcsSourceRowV420 => {
    const pixel = worldToPixel(source.alphaM, source.betaM);
    const world = pixelToWorld(pixel.x, pixel.y);
    const oracleRow = oracle.rows.find((row) => row.rayIndex === source.rayIndex);
    if (!oracleRow) throw new Error(`v420-oracle-row:${source.rayIndex}`);
    const alphaResidual = Math.abs(world.alphaM - source.alphaM);
    const betaResidual = Math.abs(world.betaM - source.betaM);
    tsRoundtrip = Math.max(tsRoundtrip, alphaResidual, betaResidual);
    pythonPixelDifference = Math.max(pythonPixelDifference, Math.abs(pixel.x - oracleRow.continuousPixelX), Math.abs(pixel.y - oracleRow.continuousPixelY));
    return Object.freeze({ rayIndex: source.rayIndex, rayId: source.rayId, spinA: source.spinA, alphaM: source.alphaM, betaM: source.betaM, continuousPixelX: pixel.x, continuousPixelY: pixel.y, worldRoundtripAlphaResidualM: alphaResidual, worldRoundtripBetaResidualM: betaResidual, authorityEvpaDeg: source.polarization.v313WalkerPenroseEvpaDeg, redshiftFactor: source.geometry.redshiftFactor, classification: "disk-hit", sampleSemantics: "continuous-source-coordinate-no-pixel-value", intensity: null, stokes: null, interpolationAllowed: false });
  });
  const edgeWorldResidualM = Math.max(
    Math.abs(pixelToWorld(0.5, 0.5).alphaM + 22),
    Math.abs(pixelToWorld(0.5, 0.5).betaM + 16),
    Math.abs(pixelToWorld(384.5, 384.5).alphaM - 22),
    Math.abs(pixelToWorld(384.5, 384.5).betaM - 16),
  );
  const maxima = Object.freeze({ tsWorldPixelWorldRoundtripResidualM: tsRoundtrip, edgeWorldResidualM, pythonAstropyPixelDifference: pythonPixelDifference, pythonAstropyWorldRoundtripResidualM: oracle.maxima.worldRoundtripResidualM });
  if (maxima.tsWorldPixelWorldRoundtripResidualM >= 1e-12 || maxima.edgeWorldResidualM >= 1e-12 || maxima.pythonAstropyPixelDifference >= 1e-10 || maxima.pythonAstropyWorldRoundtripResidualM >= 1e-12 || oracle.maxima.edgeWorldResidualM >= 1e-12) throw new Error(`v420-WCS-gate:${JSON.stringify(maxima)}`);
  return Object.freeze({
    version: KERR_OBSERVER_WCS_VERSION_V420,
    status: "qualified-linear-observer-plane-WCS-and-four-source-catalog-no-raster-values",
    source: Object.freeze({ v314RayPlanSha256: KERR_V314_PLAN_SHA256_V420, v419ScreenCoordinateArtifactSha256: KERR_V419_ARTIFACT_SHA256_V420 }),
    worldSupport: Object.freeze({ sourceStratum: "uniform-field", sourceRayCount: 1681, alphaSampleCount: 41, betaSampleCount: 41, alphaMinM: -22, alphaMaxM: 22, betaMinM: -16, betaMaxM: 16 }),
    wcs: Object.freeze({ name: "KERR-FINITE-ZAMO-LINEAR-384", axes: 2, width: 384, height: 384, pixelConvention: "FITS-one-based-continuous-pixel-centers", ctype1: "LINEAR", ctype2: "LINEAR", cname1: "KERR_ALPHA", cname2: "KERR_BETA", crpix1: CRPIX1, crpix2: CRPIX2, crval1M: 0, crval2M: 0, cdelt1MPerPixel: CDELT1, cdelt2MPerPixel: CDELT2, physicalUnit: "geometrized-GM-over-c-squared", pixelXDirection: "increasing-alpha", pixelYDirection: "increasing-beta" }),
    catalog: Object.freeze({ rowCount: 4, rows: Object.freeze(rows), coordinateAuthority: "v419-qualified-screen-coordinates", interpolationPolicy: "prohibited-no-raster-reconstruction-from-four-rays" }),
    maxima,
    thresholds: Object.freeze({ tsWorldPixelWorldRoundtripResidualM: 1e-12, edgeWorldResidualM: 1e-12, pythonAstropyPixelDifference: 1e-10, pythonAstropyWorldRoundtripResidualM: 1e-12 }),
    products: Object.freeze({ json: "available-WCS-and-sparse-source-catalog", csv: "available-sparse-source-catalog", fitsBinaryTable: "available-primary-WCS-header-plus-source-table-no-image-data", png: "available-coordinate-grid-diagnostic-not-raster-science-image", fitsImage: "unavailable-no-raster-science-values", polarimetricRaster: "unavailable-dense-campaign-incomplete-0-of-49" }),
    scienceCinematicBoundary: Object.freeze({ science: "WCS-grid-and-source-vectors-from-immutable-authority", cinematic: "may-style-grid-background-only-with-fixed-seed", coordinateMutationAllowed: false, evpaMutationAllowed: false, intensitySynthesisAllowed: false, interpolationAllowed: false }),
    denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run",
    boundary: "qualified-coordinate-WCS-and-four-row-source-catalog-with-no-image-pixel-values",
  });
}

export function parseKerrObserverPlaneWcsArtifactV420(value: unknown): KerrObserverPlaneWcsArtifactV420 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrObserverPlaneWcsArtifactV420> : null;
  if (!source || source.version !== KERR_OBSERVER_WCS_ARTIFACT_VERSION_V420 || source.status !== "qualified-linear-observer-plane-WCS-and-four-source-catalog-no-raster-values" || source.sourceFiles?.v314PlanFileSha256 !== KERR_V314_PLAN_FILE_SHA256_V420 || source.sourceFiles.v419FileSha256 !== KERR_V419_FILE_SHA256_V420 || !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") || !SHA.test(source.pythonOracleArtifactSha256 ?? "") || source.view?.wcs.width !== 384 || source.view.wcs.height !== 384 || source.view.catalog.rowCount !== 4 || source.view.catalog.rows?.length !== 4 || source.view.catalog.rows.some((row) => row.intensity !== null || row.stokes !== null || row.interpolationAllowed !== false) || source.view.products.fitsImage !== "unavailable-no-raster-science-values" || source.view.products.polarimetricRaster !== "unavailable-dense-campaign-incomplete-0-of-49" || source.view.scienceCinematicBoundary.intensitySynthesisAllowed !== false || source.view.denseCampaignStatus !== "incomplete-0-of-49" || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.rasterScienceImageGenerated !== false || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v420-artifact-identity");
  return value as KerrObserverPlaneWcsArtifactV420;
}
export function createKerrObserverPlaneWcsSummaryV420(value: unknown): KerrObserverPlaneWcsSummaryV420 {
  const artifact = parseKerrObserverPlaneWcsArtifactV420(value);
  return Object.freeze({ version: KERR_OBSERVER_WCS_SUMMARY_VERSION_V420, status: artifact.status, artifactSha256: artifact.artifactSha256, worldSupport: artifact.view.worldSupport, wcs: artifact.view.wcs, rows: artifact.view.catalog.rows, maxima: artifact.view.maxima, products: artifact.view.products, denseCampaignStatus: "incomplete-0-of-49", fullArtifactAvailable: true, boundary: "bounded-WCS-and-four-source-summary-no-raster-array-in-react-state" });
}
export function parseKerrObserverPlaneWcsSummaryV420(value: unknown): KerrObserverPlaneWcsSummaryV420 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrObserverPlaneWcsSummaryV420> : null;
  if (!source || source.version !== KERR_OBSERVER_WCS_SUMMARY_VERSION_V420 || !SHA.test(source.artifactSha256 ?? "") || source.wcs?.width !== 384 || source.rows?.length !== 4 || source.rows.some((row) => row.intensity !== null || row.stokes !== null) || source.products?.fitsImage !== "unavailable-no-raster-science-values" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.boundary !== "bounded-WCS-and-four-source-summary-no-raster-array-in-react-state") throw new Error("v420-summary-identity");
  return value as KerrObserverPlaneWcsSummaryV420;
}
export function parseKerrObserverPlaneWcsResponseV420(value: unknown): KerrObserverPlaneWcsResponseV420 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrObserverPlaneWcsResponseV420> : null;
  if (!source || source.version !== KERR_OBSERVER_WCS_RESPONSE_VERSION_V420) throw new Error("v420-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) return Object.freeze({ ...source, summary: parseKerrObserverPlaneWcsSummaryV420(source.summary) }) as KerrObserverPlaneWcsResponseV420;
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrObserverPlaneWcsResponseV420;
  throw new Error("v420-response-identity");
}
export function serializeKerrObserverPlaneWcsCsvV420(view: KerrObserverPlaneWcsViewV420): string {
  const header = ["ray_index", "ray_id", "spin_a", "alpha_M", "beta_M", "continuous_pixel_x_fits1", "continuous_pixel_y_fits1", "authority_evpa_deg", "redshift_factor", "classification", "intensity", "stokes", "interpolation_allowed"];
  const rows = view.catalog.rows.map((row) => [row.rayIndex, row.rayId, row.spinA, row.alphaM, row.betaM, row.continuousPixelX, row.continuousPixelY, row.authorityEvpaDeg, row.redshiftFactor, row.classification, "", "", row.interpolationAllowed]);
  return `${[header, ...rows].map((row) => row.join(",")).join("\n")}\n`;
}
