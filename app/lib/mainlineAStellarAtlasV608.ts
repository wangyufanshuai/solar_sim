import type { StarMetadataV607WithArtDirection } from "./celestialObjectContractV607";

export type StellarAtlasFamily = "all" | "cool" | "warm" | "hot" | "flattened";
export type StellarAtlasScale = "normalized" | "shared-radius";
export type StellarAtlasOrder = "catalog" | "temperature" | "radius";

export const STELLAR_ATLAS_FAMILIES: readonly { id: StellarAtlasFamily; label: string }[] = [
  { id: "all", label: "全部恒星" },
  { id: "cool", label: "冷色温 · 橙红" },
  { id: "warm", label: "中间色温 · 暖白" },
  { id: "hot", label: "高色温 · 蓝白" },
  { id: "flattened", label: "旋转扁率" },
];

export function stellarAtlasColor(temperature: number): string {
  if (!Number.isFinite(temperature)) return "#a8afbb";
  if (temperature < 4500) return "#ffb079";
  if (temperature < 7500) return "#ffecd0";
  if (temperature < 12000) return "#e8f0ff";
  return "#a8ccff";
}

export function matchesStellarAtlasFamily(star: StarMetadataV607WithArtDirection, family: StellarAtlasFamily): boolean {
  const profile = star.artDirection;
  switch (family) {
    case "cool": return profile.colorTemperatureK < 4500;
    case "warm": return profile.colorTemperatureK >= 4500 && profile.colorTemperatureK < 7500;
    case "hot": return profile.colorTemperatureK >= 7500;
    case "flattened": return profile.equatorialPolarRadiusRatio > 1.05;
    default: return true;
  }
}

export function selectStellarAtlasStars(
  stars: readonly StarMetadataV607WithArtDirection[],
  options: { family: StellarAtlasFamily; search: string; order: StellarAtlasOrder },
): StarMetadataV607WithArtDirection[] {
  const query = options.search.trim().toLocaleLowerCase();
  const filtered = stars.filter((star) => matchesStellarAtlasFamily(star, options.family)
    && (!query || [star.id, star.displayName, star.narrative.summaryCn, star.science.spectralType]
      .join(" ").toLocaleLowerCase().includes(query)));
  if (options.order === "catalog") return filtered;
  const key = options.order === "temperature" ? "colorTemperatureK" : "radiusSolar";
  return filtered.sort((a, b) => a.artDirection[key] - b.artDirection[key] || a.id.localeCompare(b.id));
}

/** Linear radius comparison; subpixel stars remain subpixel and get a pointer label. */
export function stellarAtlasGeometry(
  star: StarMetadataV607WithArtDirection,
  scale: StellarAtlasScale,
  referenceRadius: number,
): { rx: number; ry: number; subpixel: boolean } {
  const radius = star.artDirection.radiusSolar;
  const ratio = star.artDirection.equatorialPolarRadiusRatio;
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(ratio) || ratio < 1) {
    return { rx: 0, ry: 0, subpixel: true };
  }
  const rx = scale === "normalized" ? 34
    : Number.isFinite(referenceRadius) && referenceRadius > 0 ? 34 * radius / referenceRadius : 0;
  return { rx, ry: rx / ratio, subpixel: rx < 1 };
}

export function stellarAtlasReferenceRadius(stars: readonly StarMetadataV607WithArtDirection[]): number {
  return stars.reduce((maximum, star) => Math.max(maximum, Number.isFinite(star.artDirection.radiusSolar) ? star.artDirection.radiusSolar : 0), 0);
}

/** Preserve component identity through the existing named-star focus controller. */
export function stellarAtlasFocusTarget(star: StarMetadataV607WithArtDirection) {
  const { raDeg, decDeg } = star.science;
  if (raDeg === undefined || decDeg === undefined || !Number.isFinite(raDeg) || !Number.isFinite(decDeg)) {
    throw new Error(`Missing stellar focus coordinates: ${star.id}`);
  }
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  const direction: [number, number, number] = [Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)];
  return { direction, catalogId: `stellar-hero:${star.id}` };
}
