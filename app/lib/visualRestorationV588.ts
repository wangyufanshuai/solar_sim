export const VISUAL_RESTORATION_VERSION_V588 = "v588-visual-restoration-candidate" as const;
export const VISUAL_RESTORATION_MANIFEST_SHA256_V588 = "c2b5c64568d3a83dcafe32d12a71c9f4fbe5b58dcb8d0e2827164d2754a8611d" as const;
export const VISUAL_RESTORATION_MANIFEST_URL_V588 = "/data/visual-restoration-v588/manifest.json" as const;
export const V588_FORMAL_PRODUCT_POINTER = "v263" as const;

// Read-only governance anchor from the admitted v587 reference artifact. The
// v588 visual lane never parses or writes that payload; Science/Cinematic mode
// switches publish this stable identity only to prove presentation isolation.
export const V588_SCIENTIFIC_PAYLOAD_REFERENCE_SHA256 =
  "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674" as const;

export type VisualRestorationModeV588 = "science" | "cinematic";
export type VisualRestorationVariantV588 = "desktop" | "mobile";
export type HeroBodyIdV588 = "earth" | "jupiter" | "saturn" | "mars";
export type Vec3V588 = readonly [number, number, number];

export type HeroOrbitDefinitionV588 = Readonly<{
  id: HeroBodyIdV588;
  name: string;
  subtitle: string;
  semiMajorAxis: number;
  eccentricity: number;
  inclinationRad: number;
  ascendingNodeRad: number;
  argumentOfPeriapsisRad: number;
  phaseRad: number;
  visualRadius: number;
  axialTiltRad: number;
  rotationRate: number;
  accent: string;
  periodLabel: string;
  assetIds: readonly string[];
}>;

const radians = (degrees: number) => degrees * Math.PI / 180;

export const HERO_ORBITS_V588: readonly HeroOrbitDefinitionV588[] = Object.freeze([
  {
    id: "earth",
    name: "Earth",
    subtitle: "Cloud / ocean / night-light hero",
    semiMajorAxis: 5.0,
    eccentricity: 0.0167,
    inclinationRad: radians(0.0),
    ascendingNodeRad: radians(-11.26),
    argumentOfPeriapsisRad: radians(114.2),
    phaseRad: radians(22),
    visualRadius: 0.46,
    axialTiltRad: radians(23.44),
    rotationRate: 0.055,
    accent: "#78dff2",
    periodLabel: "365.26 d",
    assetIds: [
      "earth-albedo",
      "earth-clouds",
      "earth-cloud-alpha",
      "earth-night",
      "earth-night-mask",
      "earth-roughness",
    ],
  },
  {
    id: "mars",
    name: "Mars",
    subtitle: "Iron oxide / relief hero",
    semiMajorAxis: 7.1,
    eccentricity: 0.0934,
    inclinationRad: radians(1.85),
    ascendingNodeRad: radians(49.56),
    argumentOfPeriapsisRad: radians(286.5),
    phaseRad: radians(146),
    visualRadius: 0.36,
    axialTiltRad: radians(25.19),
    rotationRate: 0.053,
    accent: "#f09a68",
    periodLabel: "686.98 d",
    assetIds: ["mars-albedo", "mars-roughness"],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    subtitle: "Band flow / Great Red Spot hero",
    semiMajorAxis: 10.2,
    eccentricity: 0.0489,
    inclinationRad: radians(1.30),
    ascendingNodeRad: radians(100.46),
    argumentOfPeriapsisRad: radians(273.9),
    phaseRad: radians(252),
    visualRadius: 0.86,
    axialTiltRad: radians(3.13),
    rotationRate: 0.115,
    accent: "#f3c592",
    periodLabel: "11.86 y",
    assetIds: ["jupiter-albedo", "jupiter-band-mask", "jupiter-roughness"],
  },
  {
    id: "saturn",
    name: "Saturn",
    subtitle: "Layered atmosphere / ring-shadow hero",
    semiMajorAxis: 13.8,
    eccentricity: 0.0565,
    inclinationRad: radians(2.49),
    ascendingNodeRad: radians(113.67),
    argumentOfPeriapsisRad: radians(339.4),
    phaseRad: radians(318),
    visualRadius: 0.76,
    axialTiltRad: radians(26.73),
    rotationRate: 0.1,
    accent: "#ead9a4",
    periodLabel: "29.46 y",
    assetIds: [
      "saturn-albedo",
      "saturn-band-mask",
      "saturn-ring-color",
      "saturn-ring-alpha",
      "saturn-roughness",
    ],
  },
] satisfies readonly HeroOrbitDefinitionV588[]);

export const HERO_ORBIT_BY_ID_V588 = Object.freeze(
  Object.fromEntries(HERO_ORBITS_V588.map((orbit) => [orbit.id, orbit])) as Record<HeroBodyIdV588, HeroOrbitDefinitionV588>,
);

export const FEATURED_CONSTELLATION_CODES_V588 = Object.freeze([
  "Ori",
  "UMa",
  "Cas",
  "Cyg",
  "Lyr",
  "Aql",
  "Sco",
  "Sgr",
  "Tau",
  "Gem",
  "Leo",
  "And",
] as const);

function rotateOrbitPlaneV588(
  vector: Vec3V588,
  orbit: Pick<HeroOrbitDefinitionV588, "inclinationRad" | "ascendingNodeRad">,
): Vec3V588 {
  const [x, y, z] = vector;
  const cosI = Math.cos(orbit.inclinationRad);
  const sinI = Math.sin(orbit.inclinationRad);
  const inclinedY = y * cosI - z * sinI;
  const inclinedZ = y * sinI + z * cosI;
  const cosNode = Math.cos(orbit.ascendingNodeRad);
  const sinNode = Math.sin(orbit.ascendingNodeRad);
  return [
    x * cosNode + inclinedZ * sinNode,
    inclinedY,
    -x * sinNode + inclinedZ * cosNode,
  ];
}

export function orbitPointV588(
  orbit: HeroOrbitDefinitionV588,
  trueAnomalyRad: number,
): Vec3V588 {
  const p = orbit.semiMajorAxis * (1 - orbit.eccentricity ** 2);
  const radius = p / (1 + orbit.eccentricity * Math.cos(trueAnomalyRad));
  const argument = trueAnomalyRad + orbit.argumentOfPeriapsisRad;
  return rotateOrbitPlaneV588(
    [radius * Math.cos(argument), 0, radius * Math.sin(argument)],
    orbit,
  );
}

export function orbitTangentV588(
  orbit: HeroOrbitDefinitionV588,
  trueAnomalyRad: number,
): Vec3V588 {
  const p = orbit.semiMajorAxis * (1 - orbit.eccentricity ** 2);
  const denominator = 1 + orbit.eccentricity * Math.cos(trueAnomalyRad);
  const radius = p / denominator;
  const radialDerivative = p * orbit.eccentricity * Math.sin(trueAnomalyRad) / denominator ** 2;
  const argument = trueAnomalyRad + orbit.argumentOfPeriapsisRad;
  const local: Vec3V588 = [
    radialDerivative * Math.cos(argument) - radius * Math.sin(argument),
    0,
    radialDerivative * Math.sin(argument) + radius * Math.cos(argument),
  ];
  const rotated = rotateOrbitPlaneV588(local, orbit);
  const length = Math.hypot(...rotated) || 1;
  return [rotated[0] / length, rotated[1] / length, rotated[2] / length];
}

export function orbitPathV588(
  orbit: HeroOrbitDefinitionV588,
  samples = 384,
): readonly Vec3V588[] {
  return Array.from({ length: samples + 1 }, (_, index) =>
    orbitPointV588(orbit, index / samples * Math.PI * 2));
}

export type PredictedOrbitV588 = Readonly<{
  points: readonly Vec3V588[];
  bound: boolean;
  eccentricity: number;
  semiMajorAxis: number | null;
  velocityScale: number;
}>;

function acceleration(position: Vec3V588): Vec3V588 {
  const radius = Math.hypot(...position);
  const scale = -1 / Math.max(1e-9, radius ** 3);
  return [position[0] * scale, position[1] * scale, position[2] * scale];
}

/**
 * Deterministic two-body velocity-Verlet preview. This is an interaction
 * forecast for the v588 visual candidate and never replaces Atlas authority.
 */
export function predictedOrbitV588(
  orbit: HeroOrbitDefinitionV588,
  velocityScale: number,
  samples = 512,
): PredictedOrbitV588 {
  const clampedScale = Math.max(0.65, Math.min(1.5, velocityScale));
  let position = [...orbitPointV588(orbit, orbit.phaseRad)] as [number, number, number];
  const tangent = orbitTangentV588(orbit, orbit.phaseRad);
  const radius = Math.hypot(...position);
  const referenceSpeed = Math.sqrt(Math.max(0, 2 / radius - 1 / orbit.semiMajorAxis));
  let velocity: [number, number, number] = [
    tangent[0] * referenceSpeed * clampedScale,
    tangent[1] * referenceSpeed * clampedScale,
    tangent[2] * referenceSpeed * clampedScale,
  ];
  const specificEnergy = 0.5 * Math.hypot(...velocity) ** 2 - 1 / radius;
  const angularMomentum: Vec3V588 = [
    position[1] * velocity[2] - position[2] * velocity[1],
    position[2] * velocity[0] - position[0] * velocity[2],
    position[0] * velocity[1] - position[1] * velocity[0],
  ];
  const h2 = angularMomentum[0] ** 2 + angularMomentum[1] ** 2 + angularMomentum[2] ** 2;
  const eccentricity = Math.sqrt(Math.max(0, 1 + 2 * specificEnergy * h2));
  const bound = specificEnergy < 0;
  const semiMajorAxis = bound ? -1 / (2 * specificEnergy) : null;
  const referencePeriod = 2 * Math.PI * Math.sqrt(orbit.semiMajorAxis ** 3);
  const duration = bound && semiMajorAxis !== null
    ? Math.min(referencePeriod * 1.45, 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3) * 1.05)
    : referencePeriod * 0.62;
  const dt = duration / Math.max(1, samples);
  const points: Vec3V588[] = [[...position]];
  let currentAcceleration = acceleration(position);
  for (let index = 0; index < samples; index += 1) {
    const nextPosition: [number, number, number] = [
      position[0] + velocity[0] * dt + 0.5 * currentAcceleration[0] * dt ** 2,
      position[1] + velocity[1] * dt + 0.5 * currentAcceleration[1] * dt ** 2,
      position[2] + velocity[2] * dt + 0.5 * currentAcceleration[2] * dt ** 2,
    ];
    const nextAcceleration = acceleration(nextPosition);
    velocity = [
      velocity[0] + 0.5 * (currentAcceleration[0] + nextAcceleration[0]) * dt,
      velocity[1] + 0.5 * (currentAcceleration[1] + nextAcceleration[1]) * dt,
      velocity[2] + 0.5 * (currentAcceleration[2] + nextAcceleration[2]) * dt,
    ];
    position = nextPosition;
    currentAcceleration = nextAcceleration;
    points.push([...position]);
    if (Math.hypot(...position) > 42) break;
  }
  return { points, bound, eccentricity, semiMajorAxis, velocityScale: clampedScale };
}

export function orbitLandmarksV588(orbit: HeroOrbitDefinitionV588) {
  return Object.freeze({
    periapsis: orbitPointV588(orbit, 0),
    apoapsis: orbitPointV588(orbit, Math.PI),
    ascendingNode: orbitPointV588(orbit, -orbit.argumentOfPeriapsisRad),
    descendingNode: orbitPointV588(orbit, Math.PI - orbit.argumentOfPeriapsisRad),
  });
}

export function heroAssetLoadPolicyV588(
  variant: VisualRestorationVariantV588,
  selected: boolean,
): "ktx2-first" | "verified-fallback-only" {
  return variant === "desktop" && selected ? "ktx2-first" : "verified-fallback-only";
}
