/**
 * Orbit Atlas v201 research-only relativity contracts.
 *
 * This module is deliberately independent from SolarSystemIntegrator,
 * Worker physics and the frozen legacy-eih-1pn path.  It contains units,
 * frame transforms, uncertainty policy and small closed-form observables used
 * by the offline evidence builders.  It is not a runtime promotion switch.
 */

export const RELATIVITY_RESEARCH_V9_VERSION =
  "v201-relativity-research-contract-v9" as const;

export type RelativityResearchKernelIdV9 =
  | "legacy-eih-1pn"
  | "barycentric-eih-1pn-v9"
  | "barycentric-eih-1pn-j2-v9"
  | "barycentric-eih-1pn-2pn-v9"
  | "barycentric-eih-1pn-2pn-lt-v9";

export type RelativityResearchModeV9 =
  | "newton"
  | "legacy-eih-1pn"
  | "full-eih-1pn"
  | "full-eih-1pn-j2"
  | "full-eih-1pn-2pn"
  | "full-eih-1pn-2pn-lt";

export type RelativityEffectModeV9 = "none" | "j2" | "2pn" | "lense-thirring";

export type RelativityReferenceFrameV9 =
  | "ICRF-J2000-barycentric"
  | "J2000-ecliptic-sun-centered";

export type RelativityTimeScaleV9 = "TDB";

export type RelativityVector3V9 = readonly [number, number, number];

export type RelativityStateVectorV9 = {
  positionKm: RelativityVector3V9;
  velocityKmPerDay: RelativityVector3V9;
  frame: RelativityReferenceFrameV9;
  timeScale: RelativityTimeScaleV9;
};

export type RelativityRegressionMetricV9 = "position" | "velocity";

export type RelativityRegressionAttributionV9 =
  | "frame-time-transform"
  | "initial-state-quantization"
  | "missing-force-term"
  | "solver-implementation"
  | "reference-model-incompleteness"
  | "cross-solver-regression-confirmed"
  | "unresolved";

export type RelativityRegressionRowV9 = {
  checkpoint: string;
  offsetDays: number;
  bodyId: string;
  metric: RelativityRegressionMetricV9;
  legacyResidual: number;
  candidateResidual: number;
  delta: number;
  uncertainty: number;
  jointUncertainty: number;
  attribution: RelativityRegressionAttributionV9;
  resolved: boolean;
};

export type RelativityObservableReportV9 = {
  version: typeof RELATIVITY_RESEARCH_V9_VERSION;
  frame: "ICRF-J2000-barycentric";
  timeScale: "TDB";
  shapiroDelaySeconds: number;
  schwarzschildDeflectionRad: number;
  gravitationalRedshift: number;
  perihelionAdvanceRadPerOrbit: number;
  lenseThirringNodalRateRadPerSecond: number;
  boundary: "observable-only-no-nbody-state-mutation";
};

export type RelativityScienceAssetV9 = {
  id: "de440s.bsp" | "naif0012.tls" | "gm_de440.tpc" | "pck00011.tpc" | "codes_300ast_20100725.bsp" | "codes_300ast_20100725.tf";
  relativePath: string;
  sha256: string;
  sourceUrl: string;
  license: "NASA-NAIF-public-domain";
};

export const RELATIVITY_SCIENCE_ASSETS_V9: readonly RelativityScienceAssetV9[] = [
  {
    id: "de440s.bsp",
    relativePath: "tools/science-cache/naif-v201/de440s.bsp",
    sha256: "c1c7fe eab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2".replace(/\s/g, ""),
    sourceUrl: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440s.bsp",
    license: "NASA-NAIF-public-domain",
  },
  {
    id: "naif0012.tls",
    relativePath: "tools/science-cache/naif-v201/naif0012.tls",
    sha256: "678e32bdb5a744117a467cd9601cd6b373f0e9bc9bbde1371d5eee39600a039b",
    sourceUrl: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls",
    license: "NASA-NAIF-public-domain",
  },
  {
    id: "gm_de440.tpc",
    relativePath: "tools/science-cache/naif-v201/gm_de440.tpc",
    sha256: "924d df4fb9e ad9fe8a1aa55780bcabde40b09d00065d58226e24b68d8092f140".replace(/\s/g, ""),
    sourceUrl: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/gm_de440.tpc",
    license: "NASA-NAIF-public-domain",
  },
  {
    id: "codes_300ast_20100725.bsp",
    relativePath: "tools/science-cache/naif-v201/codes_300ast_20100725.bsp",
    sha256: "7bb92faaadac29ec0b62aa96041a37c92ae24b9a5460de03d3fcaa2f63fe51f0",
    sourceUrl: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/asteroids/codes_300ast_20100725.bsp",
    license: "NASA-NAIF-public-domain",
  },
  {
    id: "codes_300ast_20100725.tf",
    relativePath: "tools/science-cache/naif-v201/codes_300ast_20100725.tf",
    sha256: "15ee3b1731817774672725ccc226b249eb9ca5aa5d0a6a7805c91e5f57497f40",
    sourceUrl: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/asteroids/codes_300ast_20100725.tf",
    license: "NASA-NAIF-public-domain",
  },
  {
    id: "pck00011.tpc",
    relativePath: "tools/science-cache/naif-v201/pck00011.tpc",
    sha256: "3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1",
    sourceUrl: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc",
    license: "NASA-NAIF-public-domain",
  },
] as const;

const DEG_TO_RAD = Math.PI / 180;
const J2000_OBLIQUITY_RAD = 23.439291111 * DEG_TO_RAD;
const AU_KM = 149_597_870.7;
const DAY_SECONDS = 86_400;
const C_KM_PER_SECOND = 299_792.458;

export const RELATIVITY_RESEARCH_CONSTANTS_V9 = {
  AU_KM,
  DAY_SECONDS,
  C_KM_PER_SECOND,
  J2000_OBLIQUITY_RAD,
} as const;

/** Convert a J2000 ecliptic vector to ICRF/J2000 equatorial coordinates. */
export function eclipticToIcrfJ2000V9(
  vector: RelativityVector3V9,
): RelativityVector3V9 {
  const [x, y, z] = vector;
  const c = Math.cos(J2000_OBLIQUITY_RAD);
  const s = Math.sin(J2000_OBLIQUITY_RAD);
  return [x, c * y - s * z, s * y + c * z];
}

/** The inverse of {@link eclipticToIcrfJ2000V9}. */
export function icrfJ2000ToEclipticV9(
  vector: RelativityVector3V9,
): RelativityVector3V9 {
  const [x, y, z] = vector;
  const c = Math.cos(J2000_OBLIQUITY_RAD);
  const s = Math.sin(J2000_OBLIQUITY_RAD);
  return [x, c * y + s * z, -s * y + c * z];
}

/** Convert a sun-centered geometric Horizons state to barycentric ICRF. */
export function horizonsSunCenteredEclipticToBarycentricIcrfV9(
  state: RelativityStateVectorV9,
  sunBarycentric: Pick<RelativityStateVectorV9, "positionKm" | "velocityKmPerDay">,
): RelativityStateVectorV9 {
  if (state.frame !== "J2000-ecliptic-sun-centered") {
    throw new RangeError("Expected a sun-centered J2000 ecliptic state");
  }
  const position = eclipticToIcrfJ2000V9(state.positionKm);
  const velocity = eclipticToIcrfJ2000V9(state.velocityKmPerDay);
  return {
    positionKm: [
      position[0] + sunBarycentric.positionKm[0],
      position[1] + sunBarycentric.positionKm[1],
      position[2] + sunBarycentric.positionKm[2],
    ],
    velocityKmPerDay: [
      velocity[0] + sunBarycentric.velocityKmPerDay[0],
      velocity[1] + sunBarycentric.velocityKmPerDay[1],
      velocity[2] + sunBarycentric.velocityKmPerDay[2],
    ],
    frame: "ICRF-J2000-barycentric",
    timeScale: "TDB",
  };
}

export function computeJointUncertaintyV9(
  dop853Uncertainty: number,
  ias15Uncertainty: number,
  referenceUncertainty: number,
): number {
  const values = [dop853Uncertainty, ias15Uncertainty, referenceUncertainty];
  if (!values.every((value) => Number.isFinite(value) && value >= 0)) {
    throw new RangeError("Joint uncertainty terms must be finite and non-negative");
  }
  return dop853Uncertainty + ias15Uncertainty + referenceUncertainty;
}

export function classifyRelativityRegressionV9(args: {
  delta: number;
  uncertainty: number;
  jointUncertainty: number;
  solverAgreement: boolean;
  provenanceReady: boolean;
  candidateEffectEvidence: boolean;
  referenceDegradationConfirmed?: boolean;
}): { attribution: RelativityRegressionAttributionV9; resolved: boolean } {
  const { delta, uncertainty, jointUncertainty } = args;
  if (!args.provenanceReady) {
    return { attribution: "unresolved", resolved: false };
  }
  if (Math.abs(delta) <= Math.max(uncertainty, jointUncertainty)) {
    return { attribution: "unresolved", resolved: false };
  }
  if (!args.solverAgreement) {
    return { attribution: "solver-implementation", resolved: true };
  }
  if (!args.candidateEffectEvidence) {
    return { attribution: "reference-model-incompleteness", resolved: true };
  }
  if (args.referenceDegradationConfirmed === true) {
    return { attribution: "cross-solver-regression-confirmed", resolved: true };
  }
  return { attribution: "missing-force-term", resolved: true };
}

function finitePositive(value: number, name: string): number {
  if (!(Number.isFinite(value) && value > 0)) throw new RangeError(`${name} must be positive`);
  return value;
}

/** First-order Schwarzschild light deflection, in radians. */
export function schwarzschildDeflectionRadV9(gmKm3PerS2: number, impactParameterKm: number): number {
  return (4 * finitePositive(gmKm3PerS2, "GM")) /
    (finitePositive(impactParameterKm, "impact parameter") * C_KM_PER_SECOND ** 2);
}

/** Coordinate-time Shapiro delay for a superior-conjunction link. */
export function shapiroDelaySecondsV9(
  gmKm3PerS2: number,
  emitterDistanceKm: number,
  receiverDistanceKm: number,
  separationKm: number,
): number {
  const gm = finitePositive(gmKm3PerS2, "GM");
  const emitter = finitePositive(emitterDistanceKm, "emitter distance");
  const receiver = finitePositive(receiverDistanceKm, "receiver distance");
  const separation = finitePositive(separationKm, "separation");
  const argument = (emitter + receiver + separation) / (emitter + receiver - separation);
  if (!(argument > 1)) throw new RangeError("Shapiro geometry must have a positive logarithm");
  return (2 * gm / C_KM_PER_SECOND ** 3) * Math.log(argument);
}

/** Gravitational redshift z = 1/sqrt(1 - 2GM/(rc²)) - 1. */
export function gravitationalRedshiftV9(gmKm3PerS2: number, radiusKm: number): number {
  const compactness = (2 * finitePositive(gmKm3PerS2, "GM")) /
    (finitePositive(radiusKm, "radius") * C_KM_PER_SECOND ** 2);
  if (!(compactness >= 0 && compactness < 1)) throw new RangeError("Radius must be outside Schwarzschild horizon");
  return 1 / Math.sqrt(1 - compactness) - 1;
}

/** 1PN perihelion advance for a test body on a Keplerian orbit. */
export function perihelionAdvanceRadPerOrbitV9(
  gmKm3PerS2: number,
  semiMajorAxisKm: number,
  eccentricity: number,
): number {
  const gm = finitePositive(gmKm3PerS2, "GM");
  const a = finitePositive(semiMajorAxisKm, "semi-major axis");
  if (!(eccentricity >= 0 && eccentricity < 1)) throw new RangeError("Eccentricity must be in [0, 1)");
  return (6 * Math.PI * gm) /
    (a * (1 - eccentricity * eccentricity) * C_KM_PER_SECOND ** 2);
}

/** Lense–Thirring nodal precession rate for a circular orbit. */
export function lenseThirringNodalRateRadPerSecondV9(
  angularMomentumKgM2PerSecond: number,
  semiMajorAxisKm: number,
  eccentricity: number,
): number {
  const spin = finitePositive(Math.abs(angularMomentumKgM2PerSecond), "angular momentum");
  const a = finitePositive(semiMajorAxisKm, "semi-major axis") * 1000;
  if (!(eccentricity >= 0 && eccentricity < 1)) throw new RangeError("Eccentricity must be in [0, 1)");
  const G = 6.67430e-11;
  const c = 299_792_458;
  return (2 * G * spin) /
    (c * c * a ** 3 * (1 - eccentricity * eccentricity) ** 1.5);
}

export function createRelativityObservableReportV9(args: {
  solarGmKm3PerS2: number;
  impactParameterKm: number;
  emitterDistanceKm: number;
  receiverDistanceKm: number;
  linkSeparationKm: number;
  radiusKm: number;
  semiMajorAxisKm: number;
  eccentricity: number;
  solarSpinAngularMomentumKgM2PerSecond: number;
}): RelativityObservableReportV9 {
  return {
    version: RELATIVITY_RESEARCH_V9_VERSION,
    frame: "ICRF-J2000-barycentric",
    timeScale: "TDB",
    shapiroDelaySeconds: shapiroDelaySecondsV9(
      args.solarGmKm3PerS2,
      args.emitterDistanceKm,
      args.receiverDistanceKm,
      args.linkSeparationKm,
    ),
    schwarzschildDeflectionRad: schwarzschildDeflectionRadV9(
      args.solarGmKm3PerS2,
      args.impactParameterKm,
    ),
    gravitationalRedshift: gravitationalRedshiftV9(args.solarGmKm3PerS2, args.radiusKm),
    perihelionAdvanceRadPerOrbit: perihelionAdvanceRadPerOrbitV9(
      args.solarGmKm3PerS2,
      args.semiMajorAxisKm,
      args.eccentricity,
    ),
    lenseThirringNodalRateRadPerSecond: lenseThirringNodalRateRadPerSecondV9(
      args.solarSpinAngularMomentumKgM2PerSecond,
      args.semiMajorAxisKm,
      args.eccentricity,
    ),
    boundary: "observable-only-no-nbody-state-mutation",
  };
}
