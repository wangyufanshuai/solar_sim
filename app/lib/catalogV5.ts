import type { StellarDataTier } from "./atlasReleaseProgram";

export const CATALOG_V5_VERSION = "v135-million-star-sqlite-atlas" as const;
export const CATALOG_V5_TARGET = 1_000_000;

export type CatalogObjectV5 = {
  id: string;
  objectType: "star" | "exoplanet-host";
  displayName: string;
  designation: string;
  aliases: readonly string[];
  raDeg: number;
  decDeg: number;
  gaiaSourceId: string | null;
  magG: number | null;
  bpRp: number | null;
  parallaxMas: number | null;
  teffK: number | null;
  logg: number | null;
  radiusSolar: number | null;
  spectralType: string | null;
  dataTier: StellarDataTier;
  exoplanetSystemId: string | null;
  provenance: readonly string[];
};

export function inferStellarDataTier(input: Pick<CatalogObjectV5, "teffK" | "logg" | "radiusSolar" | "bpRp" | "spectralType">): StellarDataTier {
  if (input.teffK != null && input.logg != null && input.radiusSolar != null) return "parameter-rich";
  if (input.teffK != null || input.bpRp != null || input.spectralType) return "photometric-derived";
  return "catalog-basic";
}

export function normalizeCatalogFtsQuery(query: string): string {
  return query.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\u3400-\u9fff]+/g, " ").trim().toLocaleLowerCase();
}
