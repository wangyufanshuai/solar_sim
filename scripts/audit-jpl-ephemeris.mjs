import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tablePath = path.join(root, "public", "data", "jpl-ephemeris-v2.json");
const requiredBodies = ["sun", "earth", "venus", "jupiter", "saturn"];
const MAX_BYTES = 8 * 1024 * 1024;

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

let table;
try {
  const st = await stat(tablePath);
  if (st.size <= 0) fail("JPL ephemeris table is empty");
  if (st.size > MAX_BYTES) fail(`JPL ephemeris table exceeds ${MAX_BYTES} bytes`);
  table = JSON.parse(await readFile(tablePath, "utf8"));
} catch (err) {
  fail(`missing or invalid ${path.relative(root, tablePath)}: ${err.message}`);
}

if (table) {
  if (table.source !== "NASA/JPL Horizons API") fail("unexpected JPL table source");
  if (!Number.isFinite(table.epochJdTdb)) fail("missing epochJdTdb");
  if (!Number.isFinite(table.stepDays) || table.stepDays <= 0) fail("invalid stepDays");
  if (!Number.isFinite(table.stopSimDay) || table.stopSimDay < 4200) fail("coverage is shorter than 4200 days");
  if (!table.checksum || typeof table.checksum !== "string") fail("missing checksum");

  for (const id of requiredBodies) {
    const body = table.bodies?.[id];
    if (!body) {
      fail(`missing body ${id}`);
      continue;
    }
    if (!Array.isArray(body.rows) || body.rows.length < 800) fail(`too few rows for ${id}`);
    let previous = -Infinity;
    for (const row of body.rows ?? []) {
      if (!Number.isFinite(row.simDay) || row.simDay <= previous) fail(`non-monotonic simDay for ${id}`);
      previous = row.simDay;
      for (const key of ["positionAu", "velocityAuPerDay"]) {
        if (!Array.isArray(row[key]) || row[key].length !== 3 || row[key].some((value) => !Number.isFinite(value))) {
          fail(`invalid ${key} for ${id}`);
        }
      }
    }
  }
}

if (!process.exitCode) {
  console.log(`PASS JPL ephemeris: ${requiredBodies.length} bodies, ${table.stopSimDay} days, step ${table.stepDays} days`);
}
