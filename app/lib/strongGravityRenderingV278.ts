/**
 * v278 strong-gravity presentation boundary.
 *
 * Scientific pixels are immutable products of the corrected v277 ray
 * reference.  Cinematic presentation may decorate those pixels, but it may
 * not change capture/disk classification or measured transfer quantities.
 */

export const STRONG_GRAVITY_RENDERING_V278_VERSION = "v278-strong-gravity-rendering-boundary" as const;

export type StrongGravityRenderModeV278 = "science" | "cinematic";

export type KerrSciencePixelPayloadV278 = {
  version: typeof STRONG_GRAVITY_RENDERING_V278_VERSION;
  mode: "science";
  width: number;
  height: number;
  rayEvidenceSha256: string;
  status: Uint8Array;
  emissionRadiusM: Float64Array;
  redshiftFactor: Float64Array;
  imageOrder: Int16Array;
  evpaDeg: Float64Array;
  intensity: Float64Array;
  boundary: "v277-corrected-kerr-test-particle-analytic-thin-disk-not-grmhd";
};

export type StrongGravityRenderBoundaryV278 = {
  version: typeof STRONG_GRAVITY_RENDERING_V278_VERSION;
  scienceMode: {
    randomNoise: false;
    bloom: false;
    displayTransform: "fixed-linear-srgb";
    source: "immutable-v277-ray-payload";
  };
  cinematicMode: {
    mayDecorate: true;
    mayChangeScientificClassification: false;
    noise: "seeded-only";
  };
  diskModel: "novikov-thorne-page-thorne-thin-optically-thick-profile";
  boundary: "test-particle-analytic-thin-disk-not-grmhd";
};

export const STRONG_GRAVITY_RENDER_BOUNDARY_V278: StrongGravityRenderBoundaryV278 = {
  version: STRONG_GRAVITY_RENDERING_V278_VERSION,
  scienceMode: {
    randomNoise: false,
    bloom: false,
    displayTransform: "fixed-linear-srgb",
    source: "immutable-v277-ray-payload",
  },
  cinematicMode: {
    mayDecorate: true,
    mayChangeScientificClassification: false,
    noise: "seeded-only",
  },
  diskModel: "novikov-thorne-page-thorne-thin-optically-thick-profile",
  boundary: "test-particle-analytic-thin-disk-not-grmhd",
};

export function kerrIscoRadiusV278(spinA: number): number {
  const a = Math.max(-0.998, Math.min(0.998, spinA));
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const sign = a >= 0 ? 1 : -1;
  return 3 + z2 - sign * Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
}

function circularOrbitV278(spinA: number, radiusM: number): { energy: number; angularMomentum: number; omega: number } {
  const a = spinA;
  const sqrtR = Math.sqrt(radiusM);
  const denominator = radiusM ** 0.75 * Math.sqrt(Math.max(1e-18, radiusM ** 1.5 - 3 * sqrtR + 2 * a));
  return {
    energy: (radiusM ** 1.5 - 2 * sqrtR + a) / denominator,
    angularMomentum: (radiusM * radiusM - 2 * a * sqrtR + a * a) / denominator,
    omega: 1 / (radiusM ** 1.5 + a),
  };
}

/** Page–Thorne flux integral in dimensionless G=M=c=1 units. */
export function novikovThorneFluxV278(args: {
  spinA: number;
  radiusM: number;
  accretionRate?: number;
  integrationSteps?: number;
}): number {
  const inner = kerrIscoRadiusV278(args.spinA);
  const r = Math.max(inner * (1 + 1e-9), args.radiusM);
  if (!(Number.isFinite(args.radiusM) && args.radiusM > inner * (1 + 1e-8))) return 0;
  const steps = Math.max(16, Math.min(512, Math.floor(args.integrationSteps ?? 128)));
  const h = (r - inner) / steps;
  const integrand = (radius: number): number => {
    const orbit = circularOrbitV278(args.spinA, Math.max(inner * (1 + 1e-8), radius));
    const dr = Math.max(1e-5, radius * 1e-5);
    const before = circularOrbitV278(args.spinA, Math.max(inner * (1 + 1e-8), radius - dr)).angularMomentum;
    const after = circularOrbitV278(args.spinA, radius + dr).angularMomentum;
    return (orbit.energy - orbit.omega * orbit.angularMomentum) * (after - before) / (2 * dr);
  };
  let integral = 0;
  for (let index = 0; index <= steps; index += 1) {
    const x = inner + index * h;
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4;
    integral += weight * integrand(x);
  }
  integral *= h / 3;
  const orbit = circularOrbitV278(args.spinA, r);
  const dOmega = -1.5 * Math.sqrt(r) / (r ** 1.5 + args.spinA) ** 2;
  const denominator = Math.max(1e-18, (orbit.energy - orbit.omega * orbit.angularMomentum) ** 2);
  return Math.max(0, (3 * (args.accretionRate ?? 1)) / (8 * Math.PI * r ** 3) * (-dOmega) * integral / denominator);
}

export function planckRadianceV278(temperatureK: number, frequencyHz: number): number {
  const h = 6.62607015e-34;
  const c = 299792458;
  const k = 1.380649e-23;
  const temperature = Math.max(1, temperatureK);
  const frequency = Math.max(0, frequencyHz);
  if (frequency === 0) return 0;
  const exponent = Math.min(700, h * frequency / (k * temperature));
  return (2 * h * frequency ** 3 / (c * c)) / Math.max(1e-300, Math.expm1(exponent));
}

export function liouvilleIntensityInvariantV278(intensity: number, frequencyHz: number): number {
  return intensity / Math.max(1e-300, frequencyHz ** 3);
}

export function validateSciencePixelPayloadV278(payload: KerrSciencePixelPayloadV278): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  const length = payload.width * payload.height;
  if (payload.version !== STRONG_GRAVITY_RENDERING_V278_VERSION || payload.mode !== "science") failures.push("identity");
  if (!Number.isSafeInteger(payload.width) || !Number.isSafeInteger(payload.height) || length < 1) failures.push("dimensions");
  if (!/^[a-f0-9]{64}$/.test(payload.rayEvidenceSha256)) failures.push("ray-evidence-sha");
  if (payload.status.length !== length || payload.emissionRadiusM.length !== length || payload.redshiftFactor.length !== length
    || payload.imageOrder.length !== length || payload.evpaDeg.length !== length || payload.intensity.length !== length) failures.push("buffer-length");
  for (const buffer of [payload.emissionRadiusM, payload.redshiftFactor, payload.evpaDeg, payload.intensity]) {
    for (const value of buffer) if (!Number.isFinite(value)) { failures.push("non-finite-science-value"); break; }
  }
  if (payload.boundary !== "v277-corrected-kerr-test-particle-analytic-thin-disk-not-grmhd") failures.push("boundary");
  return { passed: failures.length === 0, failures };
}
