import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VERSION = "v116-offline-stellar-search-catalog-v2";
const TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync";
const OUTPUT_DIR = path.resolve("public/data/stellar-search");
const SHARD_COUNT = 16;
const ROWS_PER_SHARD = 6250;
// Gaia source_id's HEALPix encoding uses the range [0, 3 * 2^61).
const SOURCE_ID_LIMIT = 3n * (1n << 61n);
const SOURCE_ID_STEP = SOURCE_ID_LIMIT / BigInt(SHARD_COUNT);
const SELECT_COLUMNS = [
  "source_id",
  "designation",
  "ra",
  "dec",
  "parallax",
  "phot_g_mean_mag",
  "bp_rp",
  "ruwe",
  "teff_gspphot",
  "logg_gspphot",
  "phot_variable_flag",
].join(",");

const CURATED_ALIASES = [
  {
    sourceId: "1779546757669063552",
    displayName: "HD 209458",
    aliases: ["HIP 108859", "HIC 108859", "V376 Peg", "TYC 1688-1821-1"],
  },
  {
    sourceId: "4472832130942575872",
    displayName: "Barnard's Star",
    aliases: ["Barnard star", "HIP 87937", "HIC 87937", "GJ 699", "V2500 Oph"],
  },
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(value);
      value = "";
      if (row.some((entry) => entry !== "")) rows.push(row);
      row = [];
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function rowToDocument(row, alias = null) {
  const sourceId = String(row.source_id);
  return {
    sourceId,
    designation: String(row.designation || `Gaia DR3 ${sourceId}`),
    displayName: alias?.displayName || `Gaia ...${sourceId.slice(-8)}`,
    aliases: alias?.aliases ?? [],
    raDeg: Number(row.ra),
    decDeg: Number(row.dec),
    parallaxMas: finiteOrNull(row.parallax),
    magG: Number(row.phot_g_mean_mag),
    bpRp: finiteOrNull(row.bp_rp),
    ruwe: finiteOrNull(row.ruwe),
    teffK: finiteOrNull(row.teff_gspphot),
    logg: finiteOrNull(row.logg_gspphot),
    radiusSolar: null,
    variable: row.phot_variable_flag === "VARIABLE",
    source: alias ? "simbad-alias" : "gaia-dr3",
  };
}

async function queryGaia(adql, attempts = 4) {
  const url = new URL(TAP_URL);
  url.searchParams.set("REQUEST", "doQuery");
  url.searchParams.set("LANG", "ADQL");
  url.searchParams.set("FORMAT", "csv");
  url.searchParams.set("QUERY", adql);
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      const text = await response.text();
      if (!response.ok || text.startsWith("<VOTABLE")) {
        throw new Error(`Gaia TAP ${response.status}: ${text.slice(0, 240)}`);
      }
      return parseCsv(text);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function buildShard(index) {
  const min = SOURCE_ID_STEP * BigInt(index);
  const max = index === SHARD_COUNT - 1 ? SOURCE_ID_LIMIT : min + SOURCE_ID_STEP;
  const adql = `SELECT TOP ${ROWS_PER_SHARD} ${SELECT_COLUMNS} FROM gaiadr3.gaia_source WHERE source_id >= ${min} AND source_id < ${max} AND phot_g_mean_mag IS NOT NULL AND ra IS NOT NULL AND dec IS NOT NULL`;
  const rows = await queryGaia(adql);
  if (rows.length !== ROWS_PER_SHARD) {
    throw new Error(`Shard ${index} expected ${ROWS_PER_SHARD} rows, received ${rows.length}`);
  }
  const documents = rows.map((row) => rowToDocument(row));
  const id = index.toString(16).padStart(2, "0");
  const filename = `shard-${id}.json`;
  const json = JSON.stringify(documents);
  await writeFile(path.join(OUTPUT_DIR, filename), json);
  return {
    id,
    path: `/data/stellar-search/${filename}`,
    rowCount: documents.length,
    sourceIdMin: min.toString(),
    sourceIdMaxExclusive: max.toString(),
    sha256: createHash("sha256").update(json).digest("hex"),
  };
}

async function buildAliases() {
  const ids = CURATED_ALIASES.map((entry) => entry.sourceId).join(",");
  const rows = await queryGaia(
    `SELECT ${SELECT_COLUMNS} FROM gaiadr3.gaia_source WHERE source_id IN (${ids})`,
  );
  const byId = new Map(rows.map((row) => [String(row.source_id), row]));
  const documents = CURATED_ALIASES.map((alias) => {
    const row = byId.get(alias.sourceId);
    if (!row) throw new Error(`Missing curated Gaia alias row ${alias.sourceId}`);
    return rowToDocument(row, alias);
  });
  await writeFile(path.join(OUTPUT_DIR, "aliases.json"), JSON.stringify(documents, null, 2));
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const shards = [];
  for (let index = 0; index < SHARD_COUNT; index += 1) {
    const shard = await buildShard(index);
    shards.push(shard);
    process.stdout.write(`stellar-search ${shard.id}: ${shard.rowCount}\n`);
  }
  await buildAliases();
  const manifest = {
    version: VERSION,
    source: "ESA Gaia DR3 archive",
    sourceTable: "gaiadr3.gaia_source",
    sourceUrl: TAP_URL,
    generatedAt: new Date().toISOString(),
    rowCount: shards.reduce((sum, shard) => sum + shard.rowCount, 0),
    renderCatalogRowCount: 5000,
    runtimePolicy: "offline-sharded-no-runtime-network",
    aliasPath: "/data/stellar-search/aliases.json",
    shards: shards.map(({ sha256, ...shard }) => ({ ...shard, sha256 })),
  };
  await writeFile(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  process.stdout.write(`stellar-search manifest: ${manifest.rowCount} rows\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
