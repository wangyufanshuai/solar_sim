import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm run import:openrocket -- <design.ork|telemetry.csv|replay.json>");
const bytes = await readFile(path.resolve(input));
const extension = path.extname(input).toLowerCase();
const checksum = createHash("sha256").update(bytes).digest("hex");
let kind = "json";
let vehicle = { name: path.basename(input, extension), lengthM: null, diameterM: null };
let stages = [];
let events = [];
let telemetry = [];

if (extension === ".ork") {
  kind = "ork";
  const zip = new AdmZip(bytes);
  const entry = zip.getEntries().find((candidate) => candidate.entryName.endsWith(".ork") || candidate.entryName.endsWith(".xml"));
  if (!entry) throw new Error("OpenRocket archive does not contain design XML");
  const parsed = new XMLParser({ ignoreAttributes: false, trimValues: true }).parse(entry.getData().toString("utf8"));
  const rocket = findKey(parsed, "rocket") ?? parsed;
  vehicle.name = String(rocket.name ?? vehicle.name);
  stages = collectStages(rocket);
} else if (extension === ".csv" || extension === ".tsv") {
  kind = "csv";
  telemetry = parseTelemetry(bytes.toString("utf8"));
} else {
  const parsed = JSON.parse(bytes.toString("utf8"));
  vehicle = parsed.vehicle ?? vehicle;
  stages = parsed.stages ?? [];
  events = parsed.events ?? [];
  telemetry = parsed.telemetry ?? [];
}

const manifest = {
  version: "v118-openrocket-replay-manifest",
  vehicle,
  stages,
  events,
  telemetry,
  units: { time: "s", altitude: "m", velocity: "m/s", dynamicPressure: "Pa" },
  source: { kind, filename: path.basename(input), policy: "offline-import-no-browser-exe-launch" },
  checksum,
};
const outputDir = path.resolve("public/data/openrocket");
await mkdir(outputDir, { recursive: true });
const output = path.join(outputDir, `${slug(vehicle.name)}.json`);
await writeFile(output, JSON.stringify(manifest, null, 2));
process.stdout.write(`${output}\n`);

function findKey(node, wanted) {
  if (!node || typeof node !== "object") return null;
  for (const [key, value] of Object.entries(node)) {
    if (key.toLowerCase() === wanted && value && typeof value === "object") return value;
    const found = findKey(value, wanted); if (found) return found;
  }
  return null;
}
function collectStages(node, output = []) {
  if (!node || typeof node !== "object") return output;
  for (const [key, value] of Object.entries(node)) {
    if (["stage", "axialstage", "parallelstage"].includes(key.toLowerCase())) for (const item of Array.isArray(value) ? value : [value]) output.push({ name: String(item?.name ?? `Stage ${output.length + 1}`), componentCount: countComponents(item) });
    collectStages(value, output);
  }
  return output;
}
function countComponents(node) {
  if (!node || typeof node !== "object") return 0;
  return Object.entries(node).reduce((sum, [key, value]) => sum + (/nosecone|bodytube|transition|finset|motor|masscomponent|parachute/i.test(key) ? (Array.isArray(value) ? value.length : 1) : 0) + countComponents(value), 0);
}
function parseTelemetry(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2) return [];
  const delimiter = ["\t", ";", ","].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const headers = lines[0].split(delimiter).map(normalize);
  const index = (...names) => headers.findIndex((header) => names.includes(header));
  const at = (values, ...names) => { const i = index(...names); const value = i >= 0 ? Number(values[i]) : NaN; return Number.isFinite(value) ? value : null; };
  return lines.slice(1).map((line) => { const values = line.split(delimiter); return { timeS: at(values, "time", "time_s", "t") ?? 0, altitudeM: at(values, "altitude", "altitude_m", "height"), velocityMs: at(values, "velocity", "velocity_m_s", "speed"), mach: at(values, "mach", "mach_number"), dynamicPressurePa: at(values, "dynamic_pressure", "dynamic_pressure_pa", "q") }; });
}
function normalize(value) { return value.toLowerCase().replace(/\([^)]*\)|\[[^\]]*\]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "openrocket-replay"; }
