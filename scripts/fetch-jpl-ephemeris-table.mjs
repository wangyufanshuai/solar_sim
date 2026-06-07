import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "public", "data", "jpl-ephemeris-v2.json");
const cacheDir = path.join(root, ".cache", "jpl-ephemeris");

const epochJdTdb = Number(process.env.SOLAR_JPL_EPOCH_JD ?? "2451545.0");
const durationDays = Number(process.env.SOLAR_JPL_DURATION_DAYS ?? "4200");
const stepDays = Number(process.env.SOLAR_JPL_STEP_DAYS ?? "5");
const center = "500@10";

const bodies = [
  { id: "sun", command: "10", name: "Sun" },
  { id: "earth", command: "399", name: "Earth" },
  { id: "venus", command: "299", name: "Venus" },
  { id: "jupiter", command: "599", name: "Jupiter" },
  { id: "saturn", command: "699", name: "Saturn" },
];

function horizonsUrl(command) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${command}'`,
    OBJ_DATA: "NO",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "VECTORS",
    CENTER: `'${center}'`,
    START_TIME: `'JD${epochJdTdb}'`,
    STOP_TIME: `'JD${epochJdTdb + durationDays}'`,
    STEP_SIZE: `'${stepDays} days'`,
    CSV_FORMAT: "YES",
    OUT_UNITS: "AU-D",
  });
  return `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "solar-sim-jpl-ephemeris/1.0" } });
      if (!res.ok) throw new Error(`${url} -> ${res.status}`);
      return res.json();
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  if (process.platform === "win32") {
    return fetchJsonViaPowerShell(url);
  }
  throw lastError;
}

function fetchJsonViaPowerShell(url) {
  const script = [
    "$ProgressPreference='SilentlyContinue';",
    "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;",
    `$u=${JSON.stringify(url)};`,
    "$r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 120;",
    "[Console]::Write($r.Content);",
  ].join(" ");
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-Command", script], { cwd: root });
    let out = "";
    let err = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.stderr.on("data", (chunk) => { err += chunk; });
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(err || `PowerShell exited ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(out.replace(/^\uFEFF/, "")));
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}

function parseVectors(result, bodyId) {
  const lines = String(result).split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "$$SOE");
  const end = lines.findIndex((line) => line.trim() === "$$EOE");
  if (start < 0 || end < 0 || end <= start) throw new Error(`Horizons vectors missing SOE/EOE for ${bodyId}`);
  const rows = [];
  for (const line of lines.slice(start + 1, end)) {
    const parts = line.split(",").map((part) => part.trim());
    if (parts.length < 8) continue;
    const jd = Number(parts[0]);
    const nums = parts.slice(2, 8).map(Number);
    if (!Number.isFinite(jd) || nums.some((value) => !Number.isFinite(value))) continue;
    rows.push({
      simDay: Number((jd - epochJdTdb).toFixed(9)),
      positionAu: [nums[0], nums[1], nums[2]],
      velocityAuPerDay: [nums[3], nums[4], nums[5]],
    });
  }
  if (rows.length < Math.floor(durationDays / stepDays)) {
    throw new Error(`Horizons returned too few rows for ${bodyId}: ${rows.length}`);
  }
  return rows;
}

function checksum(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

await mkdir(path.dirname(outPath), { recursive: true });
await mkdir(cacheDir, { recursive: true });

const tableBodies = {};
for (const body of bodies) {
  const url = horizonsUrl(body.command);
  const raw = await fetchJson(url);
  await writeFile(path.join(cacheDir, `${body.id}.json`), `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  tableBodies[body.id] = {
    id: body.id,
    name: body.name,
    command: body.command,
    rows: parseVectors(raw.result, body.id),
  };
  console.log(`${body.id}: ${tableBodies[body.id].rows.length} rows`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "NASA/JPL Horizons API",
  sourceUrl: "https://ssd.jpl.nasa.gov/horizons/app.html",
  model: "DE441 vectors, heliocentric geometric ecliptic, AU and AU/day",
  center,
  epochJdTdb,
  startSimDay: 0,
  stopSimDay: durationDays,
  stepDays,
  interpolation: "cubic Hermite using tabulated position and velocity",
  caveat: "Preliminary mission design ephemeris table; not SPICE/GMAT/STK certification.",
  bodies: tableBodies,
};
manifest.checksum = checksum(manifest);

await writeFile(outPath, `${JSON.stringify(manifest)}\n`, "utf8");
console.log(`Wrote ${path.relative(root, outPath)} (${manifest.checksum})`);
