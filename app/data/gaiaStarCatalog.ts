/**
 * Gaia DR3 star catalog data interface.
 *
 * Stores the brightest 5000 stars within 200 parsecs of the Sun.
 * Catalog JSON is loaded from `public/data/gaia-dr3-bright-5000.json`.
 *
 * Coordinate conversion: RA/Dec/Parallax -> galactic (l, b, d) -> XYZ in parsecs.
 * Color from BP-RP color index mapped to blackbody RGB.
 */

// ── Types ────────────────────────────────────────────────────────────

export type GaiaStarRecord = {
  /** Gaia DR3 source identifier. */
  sourceId: string;
  /** Right ascension in degrees (ICRS, J2016.0). */
  raDeg: number;
  /** Declination in degrees (ICRS, J2016.0). */
  decDeg: number;
  /** Parallax in milli-arcseconds. */
  parallaxMas: number;
  /** G-band apparent magnitude. */
  magG: number;
  /** BP - RP color index. */
  colorBpRp: number;
};

export type GaiaDr3CatalogRow = {
  source_id: string;
  ra: number;
  dec: number;
  parallax: number;
  phot_g_mean_mag: number;
  bp_rp: number;
  parallax_over_error: number;
  ruwe: number;
};

export type GaiaCatalogSource = "gaia-dr3" | "placeholder";

export type GaiaStarCatalogData = {
  stars: GaiaStarRecord[];
  /** Pre-allocated capacity. */
  capacity: number;
  /** Actual loaded count. */
  count: number;
};

export const GAIA_DR3_CATALOG_URL = atlasPublicAssetUrl("data/gaia-dr3-bright-5000.json");
export const GAIA_V105_SELECTION_POLICY = "deterministic-bright-near-color-spread-sky-binned" as const;

// ── Catalog lifecycle ────────────────────────────────────────────────

export function createEmptyGaiaCatalog(capacity: number): GaiaStarCatalogData {
  return { stars: [], capacity, count: 0 };
}

/**
 * Parse a Gaia DR3 JSON dump into the catalog structure.
 * Accepts the v13 Gaia DR3 snake_case export plus the older internal
 * GaiaStarRecord shape for local fixtures.
 */
export function loadGaiaCatalogFromJson(json: string): GaiaStarCatalogData {
  const raw = JSON.parse(json) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Gaia catalog JSON must be an array");
  }
  const stars = raw.map((row, index) => {
    if (isGaiaDr3CatalogRow(row)) return gaiaDr3RowToStarRecord(row);
    if (isGaiaStarRecord(row)) return row;
    throw new Error(`Invalid Gaia catalog row at index ${index}`);
  });
  if (stars.length === 0) {
    throw new Error("Gaia catalog must not be empty");
  }
  return { stars, capacity: stars.length, count: stars.length };
}

export function gaiaDr3RowToStarRecord(row: GaiaDr3CatalogRow): GaiaStarRecord {
  return {
    sourceId: String(row.source_id),
    raDeg: row.ra,
    decDeg: row.dec,
    parallaxMas: row.parallax,
    magG: row.phot_g_mean_mag,
    colorBpRp: row.bp_rp,
  };
}

export function isGaiaDr3CatalogRow(row: unknown): row is GaiaDr3CatalogRow {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    (typeof r.source_id === "string" || typeof r.source_id === "number") &&
    finiteNumber(r.ra) &&
    finiteNumber(r.dec) &&
    finiteNumber(r.parallax) &&
    finiteNumber(r.phot_g_mean_mag) &&
    finiteNumber(r.bp_rp) &&
    finiteNumber(r.parallax_over_error) &&
    finiteNumber(r.ruwe) &&
    r.parallax > 5 &&
    r.parallax_over_error >= 10 &&
    r.ruwe < 1.4
  );
}

function isGaiaStarRecord(row: unknown): row is GaiaStarRecord {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.sourceId === "string" &&
    finiteNumber(r.raDeg) &&
    finiteNumber(r.decDeg) &&
    finiteNumber(r.parallaxMas) &&
    finiteNumber(r.magG) &&
    finiteNumber(r.colorBpRp)
  );
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// ── Coordinate conversion ────────────────────────────────────────────

/**
 * Convert ICRS (RA, Dec, parallax) to galactic XYZ in parsecs.
 * Uses the standard IAU 1958 galactic coordinate system.
 * X points to galactic center, Y points in direction of galactic rotation, Z points to NGP.
 */
export function gaiaStarToGalacticPc(star: GaiaStarRecord): [number, number, number] {
  const ra = (star.raDeg * Math.PI) / 180;
  const dec = (star.decDeg * Math.PI) / 180;
  const distPc = 1000 / Math.max(star.parallaxMas, 0.001);

  // ICRS to galactic rotation constants (ESA 1997)
  const raGalPole = (192.8595 * Math.PI) / 180;
  const decGalPole = (27.1284 * Math.PI) / 180;
  const lonAscNode = (32.932 * Math.PI) / 180;

  // Galactic longitude and latitude
  const sinB =
    Math.sin(dec) * Math.sin(decGalPole) +
    Math.cos(dec) * Math.cos(decGalPole) * Math.cos(ra - raGalPole);
  const b = Math.asin(Math.max(-1, Math.min(1, sinB)));

  const cosB = Math.cos(b);
  const yNum =
    Math.cos(dec) * Math.sin(ra - raGalPole);
  const yDen =
    Math.cos(decGalPole) * Math.cos(dec) * Math.cos(ra - raGalPole) -
    Math.sin(decGalPole) * Math.sin(dec);
  let l = Math.atan2(yNum, yDen) + lonAscNode;
  if (l < 0) l += 2 * Math.PI;
  if (l >= 2 * Math.PI) l -= 2 * Math.PI;

  // Galactic (l, b) -> XYZ
  const x = distPc * cosB * Math.cos(l);
  const y = distPc * cosB * Math.sin(l);
  const z = distPc * Math.sin(b);

  return [x, y, z];
}

// ── Brightness / color conversion ────────────────────────────────────

/**
 * Convert apparent G magnitude + distance to relative luminosity.
 * Uses M_G = G + 5 - 5*log10(d_pc), then L/L_sun ~ 10^(-0.4*(M_G - M_sun)).
 * M_sun in G-band ~ 4.67.
 */
export function gaiaMagToLuminosity(magG: number, distancePc: number): number {
  const absMag = magG + 5 - 5 * Math.log10(Math.max(distancePc, 0.01));
  const M_SUN_G = 4.67;
  return Math.pow(10, -0.4 * (absMag - M_SUN_G));
}

/**
 * Map BP-RP color index to approximate RGB.
 * Uses a simple polynomial fit to the blackbody color sequence.
 */
export function gaiaColorToRgb(colorBpRp: number): [number, number, number] {
  // Approximate mapping: BP-RP < -0.2 -> hot blue, 0.0 -> white, 1.0 -> yellow, 2.0 -> orange-red
  const t = Math.max(-0.5, Math.min(4.0, colorBpRp));

  // R channel
  const r = Math.min(1.0, Math.max(0.0,
    t < 0.0 ? 0.7 + 0.3 * (1 + t) :
    t < 0.5 ? 1.0 :
    t < 2.0 ? 1.0 :
    1.0
  ));

  // G channel
  const g = Math.min(1.0, Math.max(0.0,
    t < -0.2 ? 0.7 + 0.3 * (1 + (t + 0.2) / 0.3) :
    t < 0.5 ? 0.95 - 0.1 * t :
    t < 2.0 ? 0.9 - 0.25 * (t - 0.5) :
    0.5 - 0.1 * (t - 2.0)
  ));

  // B channel
  const b = Math.min(1.0, Math.max(0.0,
    t < -0.2 ? 1.0 :
    t < 0.5 ? 1.0 - 0.5 * (t + 0.2) / 0.7 :
    t < 2.0 ? 0.5 - 0.35 * (t - 0.5) / 1.5 :
    0.15 - 0.05 * (t - 2.0)
  ));

  return [r, g, b];
}

export function rankGaiaStarsForOverlay(
  stars: readonly GaiaStarRecord[],
  maxInstances: number,
): GaiaStarRecord[] {
  if (maxInstances <= 0) return [];
  const ranked = stars
    .map((star, index) => ({
      star,
      index,
      score: gaiaOverlaySelectionScore(star, index),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked.slice(0, maxInstances).map((entry) => entry.star);
}

export function gaiaOverlaySelectionScore(star: GaiaStarRecord, index = 0): number {
  const distancePc = 1000 / Math.max(star.parallaxMas, 0.001);
  const apparentBrightness = Math.max(0, 8.25 - star.magG) / 8.25;
  const proximity = Math.max(0, 1 - distancePc / 200);
  const colorSpread = Math.min(1, Math.abs(star.colorBpRp - 0.75) / 2.4);
  const skyBin = deterministicSkyBin(star.raDeg, star.decDeg);
  const skySpread = ((skyBin * 1103515245 + 12345 + index * 2654435761) >>> 0) / 0xffffffff;
  return apparentBrightness * 0.56 + proximity * 0.26 + colorSpread * 0.11 + skySpread * 0.07;
}

export function gaiaOverlayVisualBrightness(star: GaiaStarRecord): number {
  const distPc = 1000 / Math.max(star.parallaxMas, 0.001);
  const lum = gaiaMagToLuminosity(star.magG, distPc);
  const apparent = Math.max(0, 1 - (star.magG + 1.5) / 9.5);
  const luminosityCurve = Math.log10(Math.max(lum, 0.0005));
  const brightness = 0.18 + apparent * 0.62 + Math.max(-0.18, Math.min(0.34, luminosityCurve * 0.12));
  return Math.max(0.12, Math.min(1.0, brightness));
}

export function gaiaOverlayColorToRgb(colorBpRp: number): [number, number, number] {
  const [r, g, b] = gaiaColorToRgb(colorBpRp);
  const warmBias = Math.max(0, Math.min(1, (colorBpRp - 0.7) / 2.1));
  const coolBias = Math.max(0, Math.min(1, (0.25 - colorBpRp) / 0.9));
  return [
    Math.min(1, r * (1.03 + warmBias * 0.1)),
    Math.min(1, g * (1.01 + warmBias * 0.03 + coolBias * 0.02)),
    Math.min(1, b * (1.02 + coolBias * 0.14)),
  ];
}

function deterministicSkyBin(raDeg: number, decDeg: number): number {
  const raBin = Math.floor((((raDeg % 360) + 360) % 360) / 15);
  const decBin = Math.floor((Math.max(-90, Math.min(90, decDeg)) + 90) / 15);
  return raBin + decBin * 24;
}

// ── Placeholder data generator ───────────────────────────────────────

/**
 * Generate a small placeholder catalog for testing.
 * Returns stars distributed in a sphere around the Sun.
 */
export function generatePlaceholderCatalog(count: number): GaiaStarCatalogData {
  const stars: GaiaStarRecord[] = [];
  // A few well-known bright stars with approximate Gaia DR3 values
  const brightStars: GaiaStarRecord[] = [
    { sourceId: "Sirius", raDeg: 101.29, decDeg: -16.72, parallaxMas: 374.5, magG: -1.46, colorBpRp: 0.0 },
    { sourceId: "Canopus", raDeg: 95.99, decDeg: -52.70, parallaxMas: 10.6, magG: -0.74, colorBpRp: 0.45 },
    { sourceId: "Arcturus", raDeg: 213.92, decDeg: 19.18, parallaxMas: 88.8, magG: -0.05, colorBpRp: 1.23 },
    { sourceId: "Vega", raDeg: 279.23, decDeg: 38.78, parallaxMas: 130.2, magG: 0.03, colorBpRp: 0.0 },
    { sourceId: "Capella", raDeg: 79.17, decDeg: 46.0, parallaxMas: 76.3, magG: 0.08, colorBpRp: 0.83 },
    { sourceId: "Rigel", raDeg: 78.63, decDeg: -8.2, parallaxMas: 3.8, magG: 0.13, colorBpRp: -0.03 },
    { sourceId: "Procyon", raDeg: 114.83, decDeg: 5.22, parallaxMas: 285.9, magG: 0.34, colorBpRp: 0.42 },
    { sourceId: "Betelgeuse", raDeg: 88.79, decDeg: 7.41, parallaxMas: 4.5, magG: 0.42, colorBpRp: 2.35 },
    { sourceId: "Altair", raDeg: 297.7, decDeg: 8.87, parallaxMas: 194.4, magG: 0.76, colorBpRp: 0.22 },
    { sourceId: "Aldebaran", raDeg: 68.98, decDeg: 16.51, parallaxMas: 48.9, magG: 0.86, colorBpRp: 1.54 },
    { sourceId: "Spica", raDeg: 201.3, decDeg: -11.16, parallaxMas: 13.1, magG: 0.97, colorBpRp: -0.24 },
    { sourceId: "Antares", raDeg: 247.35, decDeg: -26.43, parallaxMas: 5.4, magG: 1.06, colorBpRp: 1.83 },
    { sourceId: "Pollux", raDeg: 116.33, decDeg: 28.03, parallaxMas: 96.5, magG: 1.14, colorBpRp: 1.0 },
    { sourceId: "Fomalhaut", raDeg: 344.41, decDeg: -29.62, parallaxMas: 129.8, magG: 1.16, colorBpRp: 0.15 },
    { sourceId: "Deneb", raDeg: 310.36, decDeg: 45.28, parallaxMas: 2.3, magG: 1.25, colorBpRp: 0.09 },
  ];
  stars.push(...brightStars);

  // Fill remaining with a deterministic nearby-star sequence.
  for (let i = stars.length; i < count; i++) {
    const u1 = deterministicUnit(i, 17);
    const u2 = deterministicUnit(i, 43);
    const u3 = deterministicUnit(i, 71);
    const u4 = deterministicUnit(i, 101);
    const distPc = 5 + u1 * 195; // 5-200 pc
    const parallaxMas = 1000 / distPc;
    const raDeg = u2 * 360;
    const sinDec = 2 * u3 - 1;
    const decDeg = Math.asin(sinDec) * 180 / Math.PI;
    const colorBpRp = -0.5 + u4 * 4.5;
    const magG = 1.5 + deterministicUnit(i, 131) * 6.5;
    stars.push({
      sourceId: `placeholder_${i}`,
      raDeg, decDeg, parallaxMas, magG, colorBpRp,
    });
  }

  return { stars, capacity: count, count };
}

function deterministicUnit(index: number, salt: number): number {
  let value = (index + 1) * 1664525 + salt * 1013904223;
  value ^= value >>> 16;
  value = Math.imul(value, 2246822519);
  value ^= value >>> 13;
  return ((value >>> 0) % 1000000) / 1000000;
}
import { atlasPublicAssetUrl } from "../lib/atlasDeliveryProfile";
