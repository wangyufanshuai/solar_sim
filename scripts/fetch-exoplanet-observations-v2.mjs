import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const VERSION = "v149-exoplanet-observation-lab-v2";
const TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const cacheRoot = path.resolve("tools/asset-cache");
const outputRoot = path.resolve("public/data/exoplanet-observations-v2");
const broadCache = path.join(cacheRoot, "nasa-pscomppars-observations-v2.json");
const validationCache = path.join(cacheRoot, "nasa-ps-default-observations-v2.json");
const refresh = process.argv.includes("--refresh");

const MODEL_FIELDS = [
  "pl_orbper", "pl_ratror", "pl_ratdor", "pl_imppar", "pl_trandep", "pl_trandur", "pl_tranmid",
  "pl_orbincl", "pl_orbeccen", "pl_orblper", "pl_rvamp", "pl_orbsmax", "pl_rade",
];
const broadFields = ["hostname", "pl_name", ...MODEL_FIELDS.flatMap((field) => [
  field, `${field}err1`, `${field}err2`, `${field}lim`, `${field}_reflink`,
]), "st_rad", "pl_tranmid_systemref"];
const validationFields = ["hostname", "pl_name", "default_flag", "pl_refname", ...MODEL_FIELDS.flatMap((field) => [
  field, `${field}err1`, `${field}err2`, `${field}lim`,
]), "st_rad"];
const fields = [...new Set([...broadFields, ...validationFields])];
const broadQuery = `select ${broadFields.join(",")} from pscomppars`;
const validationHosts = ["HD 209458", "51 Peg", "TRAPPIST-1", "Kepler-90"];
const escapedHosts = validationHosts.map((host) => `'${host.replaceAll("'", "''")}'`).join(",");
const validationQuery = `select ${validationFields.join(",")} from ps where default_flag=1 and hostname in (${escapedHosts})`;

const sha256 = (input) => createHash("sha256").update(input).digest("hex");
const normalize = (value) => String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const finite = (value) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);

async function exists(file) {
  try { await stat(file); return true; } catch { return false; }
}

async function fetchSnapshot(query, destination) {
  if (!refresh && await exists(destination)) return readFile(destination, "utf8");
  const url = `${TAP}?query=${encodeURIComponent(query)}&format=json`;
  const response = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!response.ok) throw new Error(`NASA TAP ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const body = await response.text();
  const partial = `${destination}.part`;
  await writeFile(partial, body);
  await rename(partial, destination);
  return body;
}

function reported(row, field, unit) {
  const value = finite(row[field]);
  const lower = finite(row[`${field}err2`]);
  const upper = finite(row[`${field}err1`]);
  return {
    value,
    kind: "reported",
    source: `NASA Exoplanet Archive ${row.default_flag === 1 ? "PS default row" : "PSCompPars"}`,
    field,
    unit,
    uncertaintyLower: lower == null ? null : Math.abs(lower),
    uncertaintyUpper: upper == null ? null : Math.abs(upper),
    reference: row[`${field}_reflink`] || row.pl_refname || null,
    note: finite(row[`${field}lim`]) ? `Archive limit flag ${row[`${field}lim`]}` : null,
  };
}

function derived(value, field, unit, inputs, note) {
  return {
    value,
    kind: "derived",
    source: "Atlas deterministic observation transform",
    field,
    unit,
    uncertaintyLower: null,
    uncertaintyUpper: null,
    reference: null,
    note: `${note}; inputs: ${inputs.join(", ")}`,
  };
}

function transform(row, sourceTable) {
  const hostName = String(row.hostname);
  const planetName = String(row.pl_name);
  const stellarRadius = finite(row.st_rad);
  const planetRadius = finite(row.pl_rade);
  const semiMajorAxis = finite(row.pl_orbsmax);
  let radiusRatio = reported(row, "pl_ratror", "R_p/R_star");
  if (radiusRatio.value == null && stellarRadius && planetRadius) {
    radiusRatio = derived(planetRadius / (stellarRadius * 109.076), "pl_ratror", "R_p/R_star", ["pl_rade", "st_rad"], "Earth-radius to Solar-radius conversion");
  }
  let scaledSemiMajorAxis = reported(row, "pl_ratdor", "a/R_star");
  if (scaledSemiMajorAxis.value == null && stellarRadius && semiMajorAxis) {
    scaledSemiMajorAxis = derived(semiMajorAxis / (stellarRadius * 0.00465047), "pl_ratdor", "a/R_star", ["pl_orbsmax", "st_rad"], "AU to Solar-radius conversion");
  }
  return {
    systemId: normalize(hostName),
    planetId: normalize(planetName),
    hostName,
    planetName,
    periodDays: reported(row, "pl_orbper", "day"),
    radiusRatio,
    scaledSemiMajorAxis,
    impactParameter: reported(row, "pl_imppar", "R_star"),
    transitDepthPercent: reported(row, "pl_trandep", "%"),
    transitDurationHours: reported(row, "pl_trandur", "hour"),
    inclinationDeg: reported(row, "pl_orbincl", "deg"),
    eccentricity: reported(row, "pl_orbeccen", ""),
    argumentOfPeriastronDeg: reported(row, "pl_orblper", "deg"),
    transitMidpointBjd: reported(row, "pl_tranmid", "BJD"),
    rvSemiAmplitudeMS: reported(row, "pl_rvamp", "m/s"),
    sourceTable,
  };
}

await mkdir(cacheRoot, { recursive: true });
await mkdir(outputRoot, { recursive: true });
const broadRaw = await fetchSnapshot(broadQuery, broadCache);
const validationRaw = await fetchSnapshot(validationQuery, validationCache);
const broadRows = JSON.parse(broadRaw);
const validationRows = JSON.parse(validationRaw);
const records = broadRows.map((row) => transform(row, "pscomppars"));
const validationRecords = validationRows.map((row) => transform(row, "ps-default"));

const systems = new Map();
for (const record of records) {
  if (!systems.has(record.systemId)) systems.set(record.systemId, []);
  systems.get(record.systemId).push(record);
}
const orderedSystems = [...systems.entries()].sort(([left], [right]) => left.localeCompare(right));
const shards = [];
const index = {};
for (let offset = 0; offset < orderedSystems.length; offset += 128) {
  const chunk = orderedSystems.slice(offset, offset + 128);
  const id = String(Math.floor(offset / 128)).padStart(3, "0");
  const payload = chunk.map(([systemId, planets]) => ({ systemId, hostName: planets[0].hostName, planets }));
  const body = JSON.stringify(payload);
  const filename = `observations-${id}.json`;
  await writeFile(path.join(outputRoot, filename), body);
  for (const [systemId] of chunk) index[systemId] = id;
  shards.push({ id, path: `/data/exoplanet-observations-v2/${filename}`, systemCount: chunk.length, planetCount: payload.reduce((sum, system) => sum + system.planets.length, 0), sha256: sha256(body) });
}
const validationBody = JSON.stringify(validationRecords, null, 2);
await writeFile(path.join(outputRoot, "validation-systems.json"), `${validationBody}\n`);
const generatedAt = new Date().toISOString();
const manifest = {
  version: VERSION,
  systemCount: systems.size,
  planetCount: records.length,
  generatedAt,
  runtimePolicy: "offline-observation-shards-worker-models",
  shards,
  index,
  validationSystemsPath: "/data/exoplanet-observations-v2/validation-systems.json",
  provenance: {
    source: "NASA Exoplanet Archive",
    broadTable: "pscomppars",
    validationTable: "ps-default",
    sourceUrl: TAP,
    broadQuery,
    validationQuery,
    broadSha256: sha256(broadRaw),
    validationSha256: sha256(validationRaw),
  },
};
if (manifest.systemCount < 4_700 || manifest.planetCount < 6_000) throw new Error(`Observation catalog gate failed: ${manifest.systemCount}/${manifest.planetCount}`);
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const snapshotPath = path.resolve("dist/science/exoplanet-observation-snapshot-v149.json");
await mkdir(path.dirname(snapshotPath), { recursive: true });
await writeFile(snapshotPath, `${JSON.stringify({
  version: "v147-scientific-data-snapshot-registry",
  generatedAt,
  entries: [{
    id: "nasa-exoplanet-observations-v2",
    source: "NASA Exoplanet Archive",
    sourceUrl: TAP,
    query: `${broadQuery}; ${validationQuery}`,
    retrievedAt: generatedAt,
    schemaVersion: 2,
    rowCount: records.length,
    fields,
    rawSha256: sha256(broadRaw + validationRaw),
    outputSha256: sha256(JSON.stringify({ shards, validation: sha256(validationBody) })),
    license: "NASA/IPAC Exoplanet Archive data-use policy",
    citation: "NASA Exoplanet Archive",
    transform: "reported values retained; only explicit radius-ratio and a/R* derivations are labelled derived",
  }],
  temporaryDataLimitBytes: 2_147_483_648,
  runtimePolicy: "build-time-network-runtime-offline",
}, null, 2)}\n`);
console.log(`${VERSION}: ${manifest.systemCount} systems, ${manifest.planetCount} planets, ${shards.length} shards`);
