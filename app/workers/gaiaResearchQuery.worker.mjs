import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parentPort } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";

const G_EDGES = [-5, 6, 9, 12, 15, 17, 19, 22];
const COLOR_EDGES = [-2, 0, 0.8, 1.5, 2.5, 6];
const QUALITY_IDS = { gold: 0, silver: 1, limited: 2 };
const QUALITY_NAMES = ["gold", "silver", "limited"];
const POPULATION_IDS = { "v7-presentation": 0, "v7-gaia-id": 1 };
const PROJECT_ROOT = process.env.ATLAS_PROJECT_ROOT?.trim() || process.cwd();
const MANIFEST_PATH = resolve(PROJECT_ROOT, "dist/gaia-research-v271/gaia-research-v271.manifest.json");

let database = null;
let manifest = null;

function number(value) {
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
}

function binRange(valueMin, valueMax, edges) {
  const first = edges.indexOf(valueMin);
  const last = edges.indexOf(valueMax);
  if (first < 0 || last <= first) throw new Error("non-canonical-bin-range");
  return [first, last - 1];
}

function queryParts(filters) {
  const [gFirst, gLast] = binRange(filters.gMin, filters.gMax, G_EDGES);
  const [colorFirst, colorLast] = binRange(filters.bpRpMin, filters.bpRpMax, COLOR_EDGES);
  const qualities = filters.qualityTiers.map((tier) => QUALITY_IDS[tier]);
  const clauses = [
    "g_bin BETWEEN ? AND ?",
    "color_bin BETWEEN ? AND ?",
    `quality IN (${qualities.map(() => "?").join(",")})`,
  ];
  const params = [gFirst, gLast, colorFirst, colorLast, ...qualities];
  if (filters.ruweMax !== null) {
    clauses.push("ruwe_bin <= ?");
    params.push(filters.ruweMax === 1.2 ? 0 : filters.ruweMax === 1.4 ? 1 : 2);
  }
  return { where: clauses.join(" AND "), params, gFirst, gLast, colorFirst, colorLast };
}

function fullFilters(filters) {
  return filters.qualityTiers.length === 3
    && QUALITY_NAMES.every((tier) => filters.qualityTiers.includes(tier))
    && filters.gMin === G_EDGES[0]
    && filters.gMax === G_EDGES.at(-1)
    && filters.bpRpMin === COLOR_EDGES[0]
    && filters.bpRpMax === COLOR_EDGES.at(-1)
    && filters.ruweMax === null;
}

function ensureDatabase() {
  if (database && manifest) return;
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  if (manifest.version !== "v271-gaia-research-aggregate-v2") throw new Error("aggregate-version-mismatch");
  const databasePath = resolve(PROJECT_ROOT, manifest.aggregate.path);
  database = new DatabaseSync(databasePath, { readOnly: true });
}

function cellCenters(order) {
  return new Map(
    database.prepare("SELECT cell,ra_deg,dec_deg FROM healpix_cell_center WHERE order_n=? ORDER BY cell").all(order)
      .map((row) => [number(row.cell), { raDeg: Number(row.ra_deg), decDeg: Number(row.dec_deg) }]),
  );
}

function overview(query, parts) {
  const matched = database.prepare(`SELECT COALESCE(SUM(count),0) AS count FROM selected_cube WHERE ${parts.where}`).get(...parts.params);
  const qualityRows = database.prepare(`SELECT quality,SUM(count) AS count FROM selected_cube WHERE ${parts.where} GROUP BY quality ORDER BY quality`).all(...parts.params);
  const qualityCounts = { gold: 0, silver: 0, limited: 0 };
  for (const row of qualityRows) qualityCounts[QUALITY_NAMES[number(row.quality)]] = number(row.count);
  const qualityCutFlow = database.prepare("SELECT cut_order AS 'order',cut_id AS id,count FROM quality_cut_flow ORDER BY cut_order").all()
    .map((row) => ({ order: number(row.order), id: String(row.id), count: number(row.count) }));
  const analysisFlags = database.prepare("SELECT flag,quality,count FROM analysis_flags ORDER BY flag,quality").all()
    .map((row) => ({ flag: String(row.flag), quality: QUALITY_NAMES[number(row.quality)], count: number(row.count) }));
  const motherRows = database.prepare("SELECT population,SUM(count) AS count FROM mother_cube GROUP BY population ORDER BY population").all();
  const motherPopulations = { "v7-presentation": 0, "v7-gaia-id": 0 };
  for (const row of motherRows) motherPopulations[number(row.population) === 0 ? "v7-presentation" : "v7-gaia-id"] = number(row.count);
  return {
    kind: "overview",
    frozenRows: 200_000,
    selectionDomainRows: manifest.counts.selectionEligibleRows,
    matchedRows: number(matched.count),
    qualityCounts,
    qualityCutFlow,
    analysisFlags,
    motherPopulations,
    hrEligibleRows: manifest.counts.hrEligibleRows,
    astrophysicalOverlapRows: manifest.counts.astrophysicalOverlapRows,
    gaiaSurveyCompleteness: "unavailable",
  };
}

function healpixDensity(query, parts) {
  const centers = cellCenters(query.order);
  if (fullFilters(query.filters)) {
    const rows = database.prepare("SELECT cell,SUM(count) AS count FROM sky_density WHERE order_n=? GROUP BY cell ORDER BY cell").all(query.order);
    return {
      kind: "healpix-density",
      order: query.order,
      densityBasis: "all-frozen-science-rows",
      cells: rows.map((row) => ({ cell: number(row.cell), ...centers.get(number(row.cell)), count: number(row.count) })),
    };
  }
  const cellExpression = query.order === 5 ? "cell" : "cell >> 4";
  const rows = database.prepare(`SELECT ${cellExpression} AS cell,SUM(count) AS count FROM selected_cube WHERE ${parts.where} GROUP BY ${cellExpression} ORDER BY cell`).all(...parts.params);
  return {
    kind: "healpix-density",
    order: query.order,
    densityBasis: "canonical-selection-domain",
    cells: rows.map((row) => ({ cell: number(row.cell), ...centers.get(number(row.cell)), count: number(row.count) })),
  };
}

function hrDensity(query, parts) {
  const shift = query.bins === 64 ? 1 : 0;
  const xExpression = shift ? "x_bin >> 1" : "x_bin";
  const yExpression = shift ? "y_bin >> 1" : "y_bin";
  const domainWhere = `variant=0 AND x_bin BETWEEN 0 AND 127 AND y_bin BETWEEN 0 AND 127 AND ${parts.where}`;
  const rows = database.prepare(`SELECT ${xExpression} AS x,${yExpression} AS y,SUM(count) AS count FROM hr_density WHERE ${domainWhere} GROUP BY ${xExpression},${yExpression} ORDER BY y,x`).all(...parts.params);
  const underflow = database.prepare(`SELECT COALESCE(SUM(count),0) AS count FROM hr_density WHERE variant=0 AND (x_bin<0 OR y_bin<0) AND ${parts.where}`).get(...parts.params);
  const overflow = database.prepare(`SELECT COALESCE(SUM(count),0) AS count FROM hr_density WHERE variant=0 AND (x_bin>127 OR y_bin>127) AND ${parts.where}`).get(...parts.params);
  return {
    kind: "hr-density",
    bins: query.bins,
    variant: "raw-no-extinction-correction",
    cells: rows.map((row) => ({ x: number(row.x), y: number(row.y), count: number(row.count) })),
    xDomain: [-2, 6],
    yDomain: [-10, 20],
    underflowCount: number(underflow.count),
    overflowCount: number(overflow.count),
  };
}

function selection(query, parts) {
  const cellExpression = query.order === 5 ? "cell" : "cell >> 4";
  const selectedRows = database.prepare(`SELECT ${cellExpression} AS cell,SUM(count) AS count FROM selected_cube WHERE ${parts.where} GROUP BY ${cellExpression}`).all(...parts.params);
  const motherRows = database.prepare(
    `SELECT ${cellExpression} AS cell,SUM(count) AS count FROM mother_cube WHERE population=? AND g_bin BETWEEN ? AND ? AND color_bin BETWEEN ? AND ? GROUP BY ${cellExpression}`,
  ).all(POPULATION_IDS[query.population], parts.gFirst, parts.gLast, parts.colorFirst, parts.colorLast);
  const selected = new Map(selectedRows.map((row) => [number(row.cell), number(row.count)]));
  const mother = new Map(motherRows.map((row) => [number(row.cell), number(row.count)]));
  const cellIds = Array.from(new Set([...selected.keys(), ...mother.keys()])).sort((left, right) => left - right);
  const centers = cellCenters(query.order);
  const cells = cellIds.map((cell) => {
    const selectedCount = selected.get(cell) ?? 0;
    const motherCount = mother.get(cell) ?? 0;
    const center = centers.get(cell);
    if (!center) throw new Error("missing-healpix-cell-center");
    return { cell, ...center, selected: selectedCount, mother: motherCount, inclusionFraction: motherCount > 0 ? selectedCount / motherCount : null };
  });
  const selectedTotal = cells.reduce((sum, row) => sum + row.selected, 0);
  const motherTotal = cells.reduce((sum, row) => sum + row.mother, 0);
  return {
    kind: "selection",
    order: query.order,
    population: query.population,
    numerator: "quality-and-ruwe-filtered-frozen-science-subset",
    denominator: "g-and-color-filtered-v7-population",
    cells,
    selected: selectedTotal,
    mother: motherTotal,
    inclusionFraction: motherTotal > 0 ? selectedTotal / motherTotal : null,
  };
}

function execute(query) {
  ensureDatabase();
  const parts = queryParts(query.filters);
  if (query.kind === "overview") return overview(query, parts);
  if (query.kind === "healpix-density") return healpixDensity(query, parts);
  if (query.kind === "hr-density") return hrDensity(query, parts);
  return selection(query, parts);
}

parentPort.on("message", (message) => {
  try {
    ensureDatabase();
    parentPort.postMessage({
      id: message.id,
      ok: true,
      payload: execute(message.query),
      provenance: {
        manifestSha256: manifest.manifestSha256,
        aggregateSha256: manifest.aggregate.sha256,
        scienceSourceSha256: manifest.scienceSource.sha256,
        motherCatalogSha256: manifest.motherCatalog.sha256,
        generatedAt: manifest.generatedAt,
      },
    });
  } catch (error) {
    parentPort.postMessage({ id: message.id, ok: false, error: error instanceof Error ? error.message : "query-failed" });
  }
});
