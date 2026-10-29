export const ATLAS_ONLINE_CATALOG_QUERY_VERSION = "v259-structured-gaia-query-v1" as const;
export const ATLAS_ONLINE_CATALOG_MAX_RESULTS = 2_000;
export const ATLAS_ONLINE_CATALOG_MAX_CONE_DEG = 2;
export const ATLAS_ONLINE_CATALOG_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

export type AtlasOnlineCatalogQueryV259 =
  | { kind: "source-id"; sourceId: string }
  | { kind: "cone"; raDeg: number; decDeg: number; radiusDeg: number; limit: number };

export function parseAtlasOnlineCatalogQueryV259(value: unknown): AtlasOnlineCatalogQueryV259 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Catalog query body must be an object");
  const input = value as Record<string, unknown>;
  if (input.kind === "source-id") {
    const sourceId = String(input.sourceId ?? "").trim();
    if (!/^\d{8,19}$/.test(sourceId)) throw new Error("Gaia source id must contain 8-19 digits");
    return { kind: "source-id", sourceId };
  }
  if (input.kind === "cone") {
    const raDeg = Number(input.raDeg);
    const decDeg = Number(input.decDeg);
    const radiusDeg = Number(input.radiusDeg);
    const limit = input.limit === undefined ? 200 : Number(input.limit);
    if (!Number.isFinite(raDeg) || raDeg < 0 || raDeg >= 360) throw new Error("Cone RA must be in [0, 360)");
    if (!Number.isFinite(decDeg) || decDeg < -90 || decDeg > 90) throw new Error("Cone declination must be in [-90, 90]");
    if (!Number.isFinite(radiusDeg) || radiusDeg <= 0 || radiusDeg > ATLAS_ONLINE_CATALOG_MAX_CONE_DEG) throw new Error("Cone radius must be in (0, 2] degrees");
    if (!Number.isInteger(limit) || limit <= 0 || limit > ATLAS_ONLINE_CATALOG_MAX_RESULTS) throw new Error("Cone result limit must be in [1, 2000]");
    return { kind: "cone", raDeg, decDeg, radiusDeg, limit };
  }
  throw new Error("Catalog query kind must be source-id or cone");
}

const COLUMNS = [
  "source_id", "ra", "dec", "parallax", "parallax_error", "pmra", "pmdec",
  "radial_velocity", "phot_g_mean_mag", "bp_rp", "ruwe", "visibility_periods_used",
] as const;

export function buildAtlasOnlineCatalogAdqlV259(query: AtlasOnlineCatalogQueryV259): string {
  const limit = query.kind === "source-id" ? 1 : query.limit;
  const where = query.kind === "source-id"
    ? `source_id = ${query.sourceId}`
    : `1 = CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${query.raDeg}, ${query.decDeg}, ${query.radiusDeg}))`;
  return `SELECT TOP ${limit} ${COLUMNS.join(",")} FROM gaiadr3.gaia_source WHERE ${where} ORDER BY source_id`;
}

export function parseSimpleCsvV259(csv: string): Record<string, string | null>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]!;
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(value);
      value = "";
      if (row.some((entry) => entry.length > 0)) rows.push(row);
      row = [];
    } else value += character;
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows.map((entries) => Object.fromEntries(
    header.map((key, index) => [key, entries[index]?.trim() ? entries[index]!.trim() : null]),
  ));
}
