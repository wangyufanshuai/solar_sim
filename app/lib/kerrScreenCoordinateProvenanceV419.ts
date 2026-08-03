import { createHash } from "node:crypto";

import {
  parseKerrSparsePolarimetricArtifactV418,
  type KerrSparsePolarimetricArtifactV418,
} from "./kerrSparsePolarimetricProductV418";

export const KERR_SCREEN_COORDINATE_VERSION_V419 = "v419-kerr-screen-coordinate-provenance-v1" as const;
export const KERR_SCREEN_COORDINATE_ARTIFACT_VERSION_V419 = "v419-kerr-screen-coordinate-provenance-artifact-v1" as const;
export const KERR_SCREEN_COORDINATE_SUMMARY_VERSION_V419 = "v419-kerr-screen-coordinate-provenance-summary-v1" as const;
export const KERR_SCREEN_COORDINATE_RESPONSE_VERSION_V419 = "v419-kerr-screen-coordinate-provenance-response-v1" as const;
export const KERR_GEOMETRY_EVIDENCE_SHA256_V312 = "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e" as const;
export const KERR_GEOMETRY_FILE_SHA256_V312 = "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91" as const;
export const KERR_POLARIZATION_EVIDENCE_SHA256_V313 = "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f" as const;
export const KERR_POLARIZATION_FILE_SHA256_V313 = "b102cff3adcd9f5c0f4b6e51c9a05e6baaa2516b21d7fa816ed86dbe6f0ec12b" as const;
export const KERR_RAY_PLAN_SHA256_V314 = "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04" as const;
export const KERR_RAY_PLAN_FILE_SHA256_V314 = "a19598c89d98172850fb6faf0b5b00fbe3e369bda409abea7d7b76b431b0906c" as const;
export const KERR_V291_SOURCE_SHA256_V419 = "03b609562dad3efb149976b17fee81b5bbd865ef8ca90d2a9b64eb79a3848884" as const;
export const KERR_V418_ARTIFACT_SHA256_V419 = "89bcfa79f4fcbcbddffcff8779d6b92eba1f7eff0e961834e44e063aae586e81" as const;

type Vector4 = readonly [number, number, number, number];
type Matrix4 = readonly [Vector4, Vector4, Vector4, Vector4];
type RayId = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type RayIndex = 12 | 13 | 14 | 15;

export type KerrScreenCoordinateRowV419 = Readonly<{
  rayIndex: RayIndex;
  rayId: RayId;
  spinA: number;
  alphaM: number;
  betaM: number;
  screenRadiusM: number;
  normalizedScreenDirection: Readonly<{ inward: number; vertical: number; horizontal: number }>;
  constants: Readonly<{ energy: number; angularMomentumZ: number; carterConstant: number }>;
  geometry: Readonly<{ classification: "disk-hit"; emissionRadiusM: number; redshiftFactor: number }>;
  polarization: Readonly<{
    v313WalkerPenroseEvpaDeg: number;
    v418WalkerPenroseEvpaDeg: number;
    crossVersionAxialDifferenceDeg: number;
  }>;
  replay: Readonly<{
    localAlphaResidualM: number;
    localBetaResidualM: number;
    tetradAlphaResidualM: number;
    tetradBetaResidualM: number;
    covectorAlphaResidualM: number;
    covectorBetaResidualM: number;
    nullResidual: number;
    tetradOrthonormalResidual: number;
    energyResidual: number;
    angularMomentumResidual: number;
    carterResidual: number;
  }>;
  pixelCoordinate: Readonly<{
    x: null;
    y: null;
    status: "unavailable";
    reason: "no-approved-raster-WCS-or-pixel-grid";
  }>;
}>;

export type KerrScreenCoordinateViewV419 = Readonly<{
  version: typeof KERR_SCREEN_COORDINATE_VERSION_V419;
  status: "qualified-four-ray-screen-coordinate-provenance-not-a-dense-image";
  source: Readonly<{
    v312GeometryEvidenceSha256: typeof KERR_GEOMETRY_EVIDENCE_SHA256_V312;
    v313PolarizationEvidenceSha256: typeof KERR_POLARIZATION_EVIDENCE_SHA256_V313;
    v314RayPlanSha256: typeof KERR_RAY_PLAN_SHA256_V314;
    v291ObserverProjectionSourceSha256: typeof KERR_V291_SOURCE_SHA256_V419;
    v418DiagnosticArtifactSha256: typeof KERR_V418_ARTIFACT_SHA256_V419;
  }>;
  observer: Readonly<{
    family: "finite-distance-ZAMO";
    radiusM: 30;
    inclinationDeg: 70;
    azimuthDeg: 0;
  }>;
  convention: Readonly<{
    alpha: "minus-R-times-local-phi-over-local-time";
    beta: "R-times-local-theta-over-local-time";
    opticalAxis: "negative-local-radial";
    units: "geometrized-black-hole-mass-M";
    handedness: "alpha-positive-toward-minus-local-phi-beta-positive-toward-plus-local-theta";
  }>;
  counts: Readonly<{ coordinateRowCount: 4; qualifiedCoordinateCount: 4; pixelCoordinateCount: 0; denseRayCount: 0 }>;
  rows: readonly KerrScreenCoordinateRowV419[];
  maxima: Readonly<{
    coordinateReplayResidualM: number;
    nullResidual: number;
    tetradOrthonormalResidual: number;
    constantResidual: number;
    crossVersionAxialEvpaDifferenceDeg: number;
    pythonOracleDifference: number;
  }>;
  thresholds: Readonly<{
    coordinateReplayResidualM: 1e-12;
    nullResidual: 1e-12;
    tetradOrthonormalResidual: 1e-12;
    constantResidual: 1e-12;
    crossVersionAxialEvpaDifferenceDeg: 1e-9;
    pythonOracleDifference: 1e-12;
  }>;
  products: Readonly<{
    json: "available-screen-coordinate-provenance-table";
    csv: "available-screen-coordinate-provenance-table";
    fitsBinaryTable: "available-screen-coordinate-table-not-image-HDU";
    png: "available-sparse-quiver-diagnostic-not-science-image-map";
    fitsImage: "unavailable-sparse-four-ray-and-no-approved-pixel-WCS";
    densePolarimetricImage: "unavailable-campaign-incomplete-0-of-49";
  }>;
  scienceCinematicBoundary: Readonly<{
    science: "screen-coordinate-quiver-from-qualified-authority-rows-only";
    cinematic: "seeded-presentation-may-style-background-only";
    coordinateMutationAllowed: false;
    evpaMutationAllowed: false;
    redshiftMutationAllowed: false;
    classificationMutationAllowed: false;
  }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "four-qualified-screen-coordinates-and-EVPA-vectors-not-a-raster-or-dense-polarimetric-image";
}>;

export type KerrScreenCoordinateArtifactV419 = Readonly<{
  version: typeof KERR_SCREEN_COORDINATE_ARTIFACT_VERSION_V419;
  generatedAt: string;
  status: KerrScreenCoordinateViewV419["status"];
  sourceFiles: Readonly<{
    v312FileSha256: typeof KERR_GEOMETRY_FILE_SHA256_V312;
    v313FileSha256: typeof KERR_POLARIZATION_FILE_SHA256_V313;
    v314PlanFileSha256: typeof KERR_RAY_PLAN_FILE_SHA256_V314;
    v418FileSha256: string;
    pythonOracleFileSha256: string;
  }>;
  pythonOracleArtifactSha256: string;
  view: KerrScreenCoordinateViewV419;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  rasterScienceImageGenerated: false;
  artifactSha256: string;
}>;

export type KerrScreenCoordinateSummaryV419 = Readonly<{
  version: typeof KERR_SCREEN_COORDINATE_SUMMARY_VERSION_V419;
  status: KerrScreenCoordinateViewV419["status"];
  artifactSha256: string;
  observer: KerrScreenCoordinateViewV419["observer"];
  rows: readonly Readonly<{
    rayIndex: RayIndex;
    rayId: RayId;
    spinA: number;
    alphaM: number;
    betaM: number;
    authorityEvpaDeg: number;
    redshiftFactor: number;
    pixelCoordinateStatus: "unavailable";
  }>[];
  maxima: KerrScreenCoordinateViewV419["maxima"];
  products: KerrScreenCoordinateViewV419["products"];
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-four-row-screen-coordinate-summary-no-matrices-or-trajectories-in-react-state";
}>;

export type KerrScreenCoordinateResponseV419 = Readonly<{
  version: typeof KERR_SCREEN_COORDINATE_RESPONSE_VERSION_V419;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrScreenCoordinateSummaryV419 | null;
}>;

type PlanRay = Readonly<{ rayIndex: number; rayId: string; stratum: string; alphaM: number; betaM: number; spinA: number; expectedFamily: string }>;
type Plan = Readonly<{ version: string; planSha256: string; rayCount: number; shardCount: number; authority: Record<string, string>; rays: readonly PlanRay[] }>;
type GeometryExecution = Readonly<{ rayId: string; spin: number; formulation: string; toleranceClass: string; branch: string; classification: string; diskRadiusM: number; redshift: number; polarizationSeed: Readonly<{ energy: number; angularMomentumZ: number; carterConstant: number }> | null }>;
type Geometry = Readonly<{ version: string; status: string; evidenceSha256: string; authorityInputs: Record<string, string>; executions: readonly GeometryExecution[] }>;
type PolarizationPayload = Readonly<{ rayId: string; spin: number; toleranceClass: string; branch: string; walkerPenroseEvpaDeg: number; applicability: string; passed: boolean }>;
type Polarization = Readonly<{ version: string; status: string; evidenceSha256: string; geometryEvidenceSha256: string; payloads: readonly PolarizationPayload[] }>;
type PythonOracle = Readonly<{ version: string; status: string; rows: readonly Readonly<{ rayIndex: number; alphaM: number; betaM: number; energy: number; angularMomentumZ: number; carterConstant: number; coordinateReplayResidualM: number; nullResidual: number; tetradResidual: number }>[]; artifactSha256: string }>;

const SHA = /^[a-f0-9]{64}$/;
const INDICES = [12, 13, 14, 15] as const;
const IDS = ["disk-00", "disk-01", "disk-02", "disk-03"] as const;
const transient = new Set(["generatedAt", "artifactSha256"]);
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}
export const canonicalShaV419 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const abs = (left: number, right: number) => Math.abs(left - right);
const axial = (left: number, right: number) => {
  const difference = Math.abs(left - right) % 180;
  return Math.min(difference, 180 - difference);
};
const multiply = (matrix: Matrix4, vector: Vector4): Vector4 => matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0)) as unknown as Vector4;

function metricAndTetrad(spin: number) {
  const radius = 30;
  const theta = 70 * Math.PI / 180;
  const sine = Math.sin(theta);
  const cosine = Math.cos(theta);
  const sigma = radius ** 2 + spin ** 2 * cosine ** 2;
  const delta = radius ** 2 - 2 * radius + spin ** 2;
  const area = (radius ** 2 + spin ** 2) ** 2 - spin ** 2 * delta * sine ** 2;
  const lapse = Math.sqrt(sigma * delta / area);
  const omega = 2 * spin * radius / area;
  const gPhiPhi = area * sine ** 2 / sigma;
  const metric: Matrix4 = [
    [-(1 - 2 * radius / sigma), 0, 0, -2 * spin * radius * sine ** 2 / sigma],
    [0, sigma / delta, 0, 0],
    [0, 0, sigma, 0],
    [-2 * spin * radius * sine ** 2 / sigma, 0, 0, gPhiPhi],
  ];
  const tetrad: Matrix4 = [
    [1 / lapse, 0, 0, 0],
    [0, Math.sqrt(delta / sigma), 0, 0],
    [0, 0, 1 / Math.sqrt(sigma), 0],
    [omega / lapse, 0, 0, 1 / Math.sqrt(gPhiPhi)],
  ];
  return { metric, tetrad, lapse, omega, gPhiPhi, sigma, delta, sine, cosine };
}

function invert4(matrix: Matrix4): Matrix4 {
  const augmented = matrix.map((row, i) => [...row, ...[0, 1, 2, 3].map((j) => i === j ? 1 : 0)]);
  for (let pivot = 0; pivot < 4; pivot += 1) {
    let best = pivot;
    for (let row = pivot + 1; row < 4; row += 1) if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[best][pivot])) best = row;
    [augmented[pivot], augmented[best]] = [augmented[best], augmented[pivot]];
    const scale = augmented[pivot][pivot];
    if (Math.abs(scale) < 1e-20) throw new Error("v419-singular-matrix");
    augmented[pivot] = augmented[pivot].map((value) => value / scale);
    for (let row = 0; row < 4; row += 1) if (row !== pivot) {
      const factor = augmented[row][pivot];
      augmented[row] = augmented[row].map((value, column) => value - factor * augmented[pivot][column]);
    }
  }
  return augmented.map((row) => row.slice(4)) as unknown as Matrix4;
}

function recoverLocal(momentum: Vector4, basis: ReturnType<typeof metricAndTetrad>): Vector4 {
  const time = momentum[0] * basis.lapse;
  return [
    time,
    momentum[1] / Math.sqrt(basis.delta / basis.sigma),
    momentum[2] * Math.sqrt(basis.sigma),
    (momentum[3] - basis.omega / basis.lapse * time) * Math.sqrt(basis.gPhiPhi),
  ];
}

function coordinate(local: Vector4) {
  return { alphaM: -30 * local[3] / local[0], betaM: 30 * local[2] / local[0] };
}

function project(alphaM: number, betaM: number, spin: number) {
  const horizontal = alphaM / 30;
  const vertical = betaM / 30;
  const transverse = horizontal ** 2 + vertical ** 2;
  if (!(transverse < 0.95)) throw new Error("v419-observer-cone");
  const local: Vector4 = [1, -Math.sqrt(1 - transverse), vertical, -horizontal];
  const basis = metricAndTetrad(spin);
  const momentum = multiply(basis.tetrad, local);
  const covector = multiply(basis.metric, momentum);
  const recoveredTetrad = recoverLocal(momentum, basis);
  const recoveredCovector = recoverLocal(multiply(invert4(basis.metric), covector), basis);
  const direct = coordinate(local);
  const tetrad = coordinate(recoveredTetrad);
  const covectorCoordinate = coordinate(recoveredCovector);
  const energy = -covector[0];
  const angularMomentumZ = covector[3];
  const pTheta = covector[2];
  const carterConstant = pTheta ** 2 + basis.cosine ** 2 * (angularMomentumZ ** 2 / basis.sine ** 2 - spin ** 2 * energy ** 2);
  const nullResidual = Math.abs(momentum.reduce((sum, value, index) => sum + value * covector[index], 0));
  const gram = [0, 1, 2, 3].flatMap((left) => [0, 1, 2, 3].map((right) => {
    const columnLeft = basis.tetrad.map((row) => row[left]) as unknown as Vector4;
    const columnRight = basis.tetrad.map((row) => row[right]) as unknown as Vector4;
    const value = columnLeft.reduce((sum, entry, row) => sum + entry * basis.metric[row].reduce((inner, metric, column) => inner + metric * columnRight[column], 0), 0);
    return Math.abs(value - (left === right ? (left === 0 ? -1 : 1) : 0));
  }));
  return { local, direct, tetrad, covectorCoordinate, energy, angularMomentumZ, carterConstant, nullResidual, tetradResidual: Math.max(...gram) };
}

export function createKerrScreenCoordinateViewV419(planValue: unknown, geometryValue: unknown, polarizationValue: unknown, v418Value: unknown, oracleValue: unknown): KerrScreenCoordinateViewV419 {
  const plan = planValue as Plan;
  const geometry = geometryValue as Geometry;
  const polarization = polarizationValue as Polarization;
  const v418: KerrSparsePolarimetricArtifactV418 = parseKerrSparsePolarimetricArtifactV418(v418Value);
  const oracle = oracleValue as PythonOracle;
  if (plan.version !== "v314-kerr-corrected-dense-ray-plan-v1" || plan.planSha256 !== KERR_RAY_PLAN_SHA256_V314 || plan.rayCount !== 3097 || plan.shardCount !== 49 || plan.authority.geometryCanonicalSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V312 || plan.authority.geometryFileSha256 !== KERR_GEOMETRY_FILE_SHA256_V312 || plan.authority.polarizationCanonicalSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V313 || plan.authority.polarizationFileSha256 !== KERR_POLARIZATION_FILE_SHA256_V313) throw new Error("v419-plan-authority-lock");
  if (geometry.version !== "v312-kerr-corrected-tolerance-short-gate-v1" || geometry.status !== "corrected-authority-qualified" || geometry.evidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V312 || geometry.authorityInputs.v291SourceSha256 !== KERR_V291_SOURCE_SHA256_V419) throw new Error("v419-geometry-authority-lock");
  if (polarization.version !== "v313-kerr-disk-polarization-requalification-v1" || polarization.status !== "full-kerr-short-authority-qualified" || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V313 || polarization.geometryEvidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V312) throw new Error("v419-polarization-authority-lock");
  if (v418.artifactSha256 !== KERR_V418_ARTIFACT_SHA256_V419 || oracle.version !== "v419-kerr-screen-coordinate-python-oracle-v1" || oracle.status !== "qualified-independent-screen-coordinate-replay" || !SHA.test(oracle.artifactSha256) || oracle.rows?.length !== 4) throw new Error("v419-cross-source-lock");
  let pythonOracleDifference = 0;
  const rows = INDICES.map((rayIndex, offset): KerrScreenCoordinateRowV419 => {
    const rayId = IDS[offset];
    const planRay = plan.rays.find((row) => row.rayIndex === rayIndex && row.rayId === rayId);
    const geometryRow = geometry.executions.find((row) => row.rayId === rayId && row.toleranceClass === "release" && row.branch === "A" && row.formulation.startsWith("carter-mino"));
    const polarizationRow = polarization.payloads.find((row) => row.rayId === rayId && row.toleranceClass === "release" && row.branch === "A");
    const v418Row = v418.view.rows.find((row) => row.rayIndex === rayIndex && row.rayId === rayId);
    const oracleRow = oracle.rows.find((row) => row.rayIndex === rayIndex);
    if (!planRay || planRay.stratum !== "canonical" || planRay.expectedFamily !== "disk-hit" || !geometryRow?.polarizationSeed || geometryRow.classification !== "disk-hit" || !polarizationRow?.passed || polarizationRow.applicability !== "applicable-disk-hit" || !v418Row || !oracleRow || planRay.spinA !== geometryRow.spin || planRay.spinA !== polarizationRow.spin || planRay.spinA !== v418Row.spinA) throw new Error(`v419-ray-identity:${rayId}`);
    const replay = project(planRay.alphaM, planRay.betaM, planRay.spinA);
    const constantResiduals = [abs(replay.energy, geometryRow.polarizationSeed.energy), abs(replay.angularMomentumZ, geometryRow.polarizationSeed.angularMomentumZ), abs(replay.carterConstant, geometryRow.polarizationSeed.carterConstant)];
    const localResiduals = [abs(replay.direct.alphaM, planRay.alphaM), abs(replay.direct.betaM, planRay.betaM)];
    const tetradResiduals = [abs(replay.tetrad.alphaM, planRay.alphaM), abs(replay.tetrad.betaM, planRay.betaM)];
    const covectorResiduals = [abs(replay.covectorCoordinate.alphaM, planRay.alphaM), abs(replay.covectorCoordinate.betaM, planRay.betaM)];
    const oracleDifferences = [abs(replay.energy, oracleRow.energy), abs(replay.angularMomentumZ, oracleRow.angularMomentumZ), abs(replay.carterConstant, oracleRow.carterConstant), abs(planRay.alphaM, oracleRow.alphaM), abs(planRay.betaM, oracleRow.betaM), abs(Math.max(...localResiduals, ...tetradResiduals, ...covectorResiduals), oracleRow.coordinateReplayResidualM), abs(replay.nullResidual, oracleRow.nullResidual), abs(replay.tetradResidual, oracleRow.tetradResidual)];
    pythonOracleDifference = Math.max(pythonOracleDifference, ...oracleDifferences);
    return Object.freeze({
      rayIndex, rayId, spinA: planRay.spinA, alphaM: planRay.alphaM, betaM: planRay.betaM,
      screenRadiusM: Math.hypot(planRay.alphaM, planRay.betaM),
      normalizedScreenDirection: Object.freeze({ inward: replay.local[1], vertical: replay.local[2], horizontal: replay.local[3] }),
      constants: Object.freeze({ energy: replay.energy, angularMomentumZ: replay.angularMomentumZ, carterConstant: replay.carterConstant }),
      geometry: Object.freeze({ classification: "disk-hit", emissionRadiusM: geometryRow.diskRadiusM, redshiftFactor: geometryRow.redshift }),
      polarization: Object.freeze({ v313WalkerPenroseEvpaDeg: polarizationRow.walkerPenroseEvpaDeg, v418WalkerPenroseEvpaDeg: v418Row.authorityPolarization.walkerPenroseEvpaDeg, crossVersionAxialDifferenceDeg: axial(polarizationRow.walkerPenroseEvpaDeg, v418Row.authorityPolarization.walkerPenroseEvpaDeg) }),
      replay: Object.freeze({ localAlphaResidualM: localResiduals[0], localBetaResidualM: localResiduals[1], tetradAlphaResidualM: tetradResiduals[0], tetradBetaResidualM: tetradResiduals[1], covectorAlphaResidualM: covectorResiduals[0], covectorBetaResidualM: covectorResiduals[1], nullResidual: replay.nullResidual, tetradOrthonormalResidual: replay.tetradResidual, energyResidual: constantResiduals[0], angularMomentumResidual: constantResiduals[1], carterResidual: constantResiduals[2] }),
      pixelCoordinate: Object.freeze({ x: null, y: null, status: "unavailable", reason: "no-approved-raster-WCS-or-pixel-grid" }),
    });
  });
  const maxima = Object.freeze({
    coordinateReplayResidualM: Math.max(...rows.flatMap((row) => [row.replay.localAlphaResidualM, row.replay.localBetaResidualM, row.replay.tetradAlphaResidualM, row.replay.tetradBetaResidualM, row.replay.covectorAlphaResidualM, row.replay.covectorBetaResidualM])),
    nullResidual: Math.max(...rows.map((row) => row.replay.nullResidual)),
    tetradOrthonormalResidual: Math.max(...rows.map((row) => row.replay.tetradOrthonormalResidual)),
    constantResidual: Math.max(...rows.flatMap((row) => [row.replay.energyResidual, row.replay.angularMomentumResidual, row.replay.carterResidual])),
    crossVersionAxialEvpaDifferenceDeg: Math.max(...rows.map((row) => row.polarization.crossVersionAxialDifferenceDeg)),
    pythonOracleDifference,
  });
  if (maxima.coordinateReplayResidualM >= 1e-12 || maxima.nullResidual >= 1e-12 || maxima.tetradOrthonormalResidual >= 1e-12 || maxima.constantResidual >= 1e-12 || maxima.crossVersionAxialEvpaDifferenceDeg >= 1e-9 || maxima.pythonOracleDifference >= 1e-12) throw new Error(`v419-gate:${JSON.stringify(maxima)}`);
  return Object.freeze({
    version: KERR_SCREEN_COORDINATE_VERSION_V419,
    status: "qualified-four-ray-screen-coordinate-provenance-not-a-dense-image",
    source: Object.freeze({ v312GeometryEvidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V312, v313PolarizationEvidenceSha256: KERR_POLARIZATION_EVIDENCE_SHA256_V313, v314RayPlanSha256: KERR_RAY_PLAN_SHA256_V314, v291ObserverProjectionSourceSha256: KERR_V291_SOURCE_SHA256_V419, v418DiagnosticArtifactSha256: KERR_V418_ARTIFACT_SHA256_V419 }),
    observer: Object.freeze({ family: "finite-distance-ZAMO", radiusM: 30, inclinationDeg: 70, azimuthDeg: 0 }),
    convention: Object.freeze({ alpha: "minus-R-times-local-phi-over-local-time", beta: "R-times-local-theta-over-local-time", opticalAxis: "negative-local-radial", units: "geometrized-black-hole-mass-M", handedness: "alpha-positive-toward-minus-local-phi-beta-positive-toward-plus-local-theta" }),
    counts: Object.freeze({ coordinateRowCount: 4, qualifiedCoordinateCount: 4, pixelCoordinateCount: 0, denseRayCount: 0 }),
    rows: Object.freeze(rows), maxima,
    thresholds: Object.freeze({ coordinateReplayResidualM: 1e-12, nullResidual: 1e-12, tetradOrthonormalResidual: 1e-12, constantResidual: 1e-12, crossVersionAxialEvpaDifferenceDeg: 1e-9, pythonOracleDifference: 1e-12 }),
    products: Object.freeze({ json: "available-screen-coordinate-provenance-table", csv: "available-screen-coordinate-provenance-table", fitsBinaryTable: "available-screen-coordinate-table-not-image-HDU", png: "available-sparse-quiver-diagnostic-not-science-image-map", fitsImage: "unavailable-sparse-four-ray-and-no-approved-pixel-WCS", densePolarimetricImage: "unavailable-campaign-incomplete-0-of-49" }),
    scienceCinematicBoundary: Object.freeze({ science: "screen-coordinate-quiver-from-qualified-authority-rows-only", cinematic: "seeded-presentation-may-style-background-only", coordinateMutationAllowed: false, evpaMutationAllowed: false, redshiftMutationAllowed: false, classificationMutationAllowed: false }),
    denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run",
    boundary: "four-qualified-screen-coordinates-and-EVPA-vectors-not-a-raster-or-dense-polarimetric-image",
  });
}

export function parseKerrScreenCoordinateArtifactV419(value: unknown): KerrScreenCoordinateArtifactV419 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScreenCoordinateArtifactV419> : null;
  if (!source || source.version !== KERR_SCREEN_COORDINATE_ARTIFACT_VERSION_V419 || source.status !== "qualified-four-ray-screen-coordinate-provenance-not-a-dense-image" || source.sourceFiles?.v312FileSha256 !== KERR_GEOMETRY_FILE_SHA256_V312 || source.sourceFiles.v313FileSha256 !== KERR_POLARIZATION_FILE_SHA256_V313 || source.sourceFiles.v314PlanFileSha256 !== KERR_RAY_PLAN_FILE_SHA256_V314 || !SHA.test(source.sourceFiles.v418FileSha256 ?? "") || !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") || !SHA.test(source.pythonOracleArtifactSha256 ?? "") || source.view?.counts.coordinateRowCount !== 4 || source.view.counts.qualifiedCoordinateCount !== 4 || source.view.counts.pixelCoordinateCount !== 0 || source.view.rows?.length !== 4 || source.view.rows.some((row) => row.pixelCoordinate.x !== null || row.pixelCoordinate.y !== null) || source.view.products.fitsImage !== "unavailable-sparse-four-ray-and-no-approved-pixel-WCS" || source.view.products.densePolarimetricImage !== "unavailable-campaign-incomplete-0-of-49" || source.view.scienceCinematicBoundary.coordinateMutationAllowed !== false || source.view.denseCampaignStatus !== "incomplete-0-of-49" || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.rasterScienceImageGenerated !== false || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v419-artifact-identity");
  return value as KerrScreenCoordinateArtifactV419;
}

export function createKerrScreenCoordinateSummaryV419(value: unknown): KerrScreenCoordinateSummaryV419 {
  const artifact = parseKerrScreenCoordinateArtifactV419(value);
  return Object.freeze({ version: KERR_SCREEN_COORDINATE_SUMMARY_VERSION_V419, status: artifact.status, artifactSha256: artifact.artifactSha256, observer: artifact.view.observer, rows: Object.freeze(artifact.view.rows.map((row) => Object.freeze({ rayIndex: row.rayIndex, rayId: row.rayId, spinA: row.spinA, alphaM: row.alphaM, betaM: row.betaM, authorityEvpaDeg: row.polarization.v313WalkerPenroseEvpaDeg, redshiftFactor: row.geometry.redshiftFactor, pixelCoordinateStatus: row.pixelCoordinate.status }))), maxima: artifact.view.maxima, products: artifact.view.products, denseCampaignStatus: "incomplete-0-of-49", fullArtifactAvailable: true, boundary: "bounded-four-row-screen-coordinate-summary-no-matrices-or-trajectories-in-react-state" });
}

export function parseKerrScreenCoordinateSummaryV419(value: unknown): KerrScreenCoordinateSummaryV419 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScreenCoordinateSummaryV419> : null;
  if (!source || source.version !== KERR_SCREEN_COORDINATE_SUMMARY_VERSION_V419 || !SHA.test(source.artifactSha256 ?? "") || source.rows?.length !== 4 || source.rows.some((row) => row.pixelCoordinateStatus !== "unavailable") || source.denseCampaignStatus !== "incomplete-0-of-49" || source.boundary !== "bounded-four-row-screen-coordinate-summary-no-matrices-or-trajectories-in-react-state") throw new Error("v419-summary-identity");
  return value as KerrScreenCoordinateSummaryV419;
}

export function parseKerrScreenCoordinateResponseV419(value: unknown): KerrScreenCoordinateResponseV419 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScreenCoordinateResponseV419> : null;
  if (!source || source.version !== KERR_SCREEN_COORDINATE_RESPONSE_VERSION_V419) throw new Error("v419-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) return Object.freeze({ ...source, summary: parseKerrScreenCoordinateSummaryV419(source.summary) }) as KerrScreenCoordinateResponseV419;
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrScreenCoordinateResponseV419;
  throw new Error("v419-response-identity");
}

const csvCell = (value: string | number | null) => value === null ? "" : String(value);
export function serializeKerrScreenCoordinateCsvV419(view: KerrScreenCoordinateViewV419): string {
  const header = ["ray_index", "ray_id", "spin_a", "alpha_M", "beta_M", "screen_radius_M", "classification", "emission_radius_M", "redshift_factor", "authority_evpa_deg", "energy", "angular_momentum_z", "carter_constant", "coordinate_replay_residual_M", "pixel_x", "pixel_y", "pixel_coordinate_status"];
  const rows = view.rows.map((row) => [row.rayIndex, row.rayId, row.spinA, row.alphaM, row.betaM, row.screenRadiusM, row.geometry.classification, row.geometry.emissionRadiusM, row.geometry.redshiftFactor, row.polarization.v313WalkerPenroseEvpaDeg, row.constants.energy, row.constants.angularMomentumZ, row.constants.carterConstant, Math.max(row.replay.localAlphaResidualM, row.replay.localBetaResidualM, row.replay.tetradAlphaResidualM, row.replay.tetradBetaResidualM, row.replay.covectorAlphaResidualM, row.replay.covectorBetaResidualM), null, null, row.pixelCoordinate.status]);
  return `${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}
