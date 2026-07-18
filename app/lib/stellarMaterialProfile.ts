export type StellarMaterialProfile = {
  color: string;
  coreColor: string;
  coronaColor: string;
  spectralLabel: string;
  colorTemperatureK: number;
  coreIntensity: number;
  haloScale: number;
  diffractionScale: number;
  twinkleSeed: number;
};

export type StellarMaterialInput = {
  colorBpRp?: number | null;
  mag?: number | null;
  parallaxMas?: number | null;
  fallbackColor?: string | null;
  id?: string | null;
};

export function stellarMaterialProfile(input: StellarMaterialInput): StellarMaterialProfile {
  const bpRp = finiteOr(input.colorBpRp, colorToApproxBpRp(input.fallbackColor) ?? 0.65);
  const mag = finiteOr(input.mag, 2.8);
  const parallaxMas = finiteOr(input.parallaxMas, 8);
  const colorTemperatureK = bpRpToTemperatureK(bpRp);
  const color = kelvinToHex(colorTemperatureK, input.fallbackColor ?? "#dbeafe");
  const apparent = Math.max(0, Math.min(1, 1 - (mag + 1.8) / 9.8));
  const distancePc = 1000 / Math.max(0.001, parallaxMas);
  const proximity = Math.max(0, Math.min(1, 1 - distancePc / 220));
  const warmth = Math.max(0, Math.min(1, (bpRp - 0.55) / 2.4));
  const coolness = Math.max(0, Math.min(1, (0.35 - bpRp) / 0.9));
  const coreIntensity = round3(0.58 + apparent * 0.58 + proximity * 0.1);
  const haloScale = round3(1.08 + apparent * 1.28 + warmth * 0.32 + coolness * 0.18);
  const diffractionScale = round3(0.72 + apparent * 0.66 + Math.abs(bpRp - 0.72) * 0.08);
  return {
    color,
    coreColor: mixHex(color, "#ffffff", 0.34 + coolness * 0.16),
    coronaColor: mixHex(color, warmth > 0.55 ? "#ffb36b" : "#9fd7ff", 0.22),
    spectralLabel: spectralLabelForBpRp(bpRp),
    colorTemperatureK,
    coreIntensity,
    haloScale,
    diffractionScale,
    twinkleSeed: deterministicSeed(input.id ?? `${bpRp}:${mag}:${parallaxMas}`),
  };
}

export function bpRpToTemperatureK(bpRp: number): number {
  const t = Math.max(-0.45, Math.min(3.4, bpRp));
  const kelvin = 4600 * (1 / (0.92 * t + 1.7) + 1 / (0.92 * t + 0.62));
  return Math.round(Math.max(2800, Math.min(12500, kelvin)));
}

export function spectralLabelForBpRp(bpRp: number): string {
  if (bpRp < -0.1) return "B/A hot blue-white";
  if (bpRp < 0.35) return "A/F white";
  if (bpRp < 0.85) return "F/G sunlike";
  if (bpRp < 1.55) return "G/K warm";
  return "K/M amber-red";
}

function finiteOr(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function colorToApproxBpRp(color: string | null | undefined): number | null {
  if (!color?.startsWith("#") || color.length < 7) return null;
  const r = Number.parseInt(color.slice(1, 3), 16) / 255;
  const g = Number.parseInt(color.slice(3, 5), 16) / 255;
  const b = Number.parseInt(color.slice(5, 7), 16) / 255;
  if (![r, g, b].every(Number.isFinite)) return null;
  return Math.max(-0.25, Math.min(2.4, (r - b) * 1.55 + (1 - g) * 0.35 + 0.45));
}

function kelvinToHex(kelvin: number, fallback: string): string {
  const temp = kelvin / 100;
  const red = temp <= 66 ? 255 : clamp255(329.698727446 * Math.pow(temp - 60, -0.1332047592));
  const green = temp <= 66
    ? clamp255(99.4708025861 * Math.log(temp) - 161.1195681661)
    : clamp255(288.1221695283 * Math.pow(temp - 60, -0.0755148492));
  const blue = temp >= 66 ? 255 : temp <= 19 ? 0 : clamp255(138.5177312231 * Math.log(temp - 10) - 305.0447927307);
  if (![red, green, blue].every(Number.isFinite)) return fallback;
  return rgbToHex(red, green, blue);
}

function mixHex(a: string, b: string, t: number): string {
  const ac = parseHex(a);
  const bc = parseHex(b);
  const u = Math.max(0, Math.min(1, t));
  return rgbToHex(
    ac[0] * (1 - u) + bc[0] * u,
    ac[1] * (1 - u) + bc[1] * u,
    ac[2] * (1 - u) + bc[2] * u,
  );
}

function parseHex(hex: string): [number, number, number] {
  if (!hex.startsWith("#") || hex.length < 7) return [210, 226, 255];
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => clamp255(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function deterministicSeed(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
