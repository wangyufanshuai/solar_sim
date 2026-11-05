import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { BETA_IDS, EXPECTED_SEAL } from "./project-mainline-a-beta-stellar.mjs";

export const PACK_SCHEMA = "mainline-a-beta-hero-art-evidence-pack-v615";
export const HERO_SOURCE_PATH = "app/data/stellarHeroesV592.generated.ts";
export const PROJECTION_PATH = "app/data/mainlineABetaStellarProjectionV607.generated.ts";
export const OUTPUT_PATH = "app/data/mainlineABetaHeroArtEvidencePackV615.generated.json";
export const HERO_PACKET_SHA256 = "27efe0f8e645f72e4c4a2d35500dcb976fa19b7e35691b56ee588e6bb9650d47";
export const CURRENT_BASE_IDS = Object.freeze([
  "alpha-centauri-a", "achernar", "betelgeuse", "sirius-a", "rigel", "antares",
  "canopus", "arcturus", "vega", "capella-a", "procyon-a", "aldebaran",
]);
export const PENDING_IDS = Object.freeze(["acrux", "spica", "regulus", "polaris"]);

export function fail(message) {
  throw new Error(`hero art evidence pack: ${message}`);
}

export function assert(condition, message) {
  if (!condition) fail(message);
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  return JSON.stringify(value);
}

function readText(root, relativePath) {
  const absolute = path.join(root, relativePath);
  assert(fs.existsSync(absolute), `missing ${relativePath}`);
  return fs.readFileSync(absolute, "utf8");
}

function parseGeneratedArray(source, symbol) {
  const pattern = new RegExp(`export const ${symbol} = Object\\.freeze\\((\\[[\\s\\S]*?\\]) as const\\);`);
  const match = source.match(pattern);
  assert(match, `${symbol} generated array missing`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`${symbol} JSON parse failed: ${error.message}`);
  }
}

function parseGeneratedObject(source, symbol) {
  const pattern = new RegExp(`export const ${symbol} = (\\{[\\s\\S]*\\}) as const;\\s*$`);
  const match = source.match(pattern);
  assert(match, `${symbol} generated object missing`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`${symbol} JSON parse failed: ${error.message}`);
  }
}

export function loadHeroCatalog(root = process.cwd()) {
  const source = readText(root, HERO_SOURCE_PATH);
  const heroes = parseGeneratedArray(source, "STELLAR_HEROES_V592");
  const packetMatch = source.match(/export const STELLAR_HERO_PACKET_SHA256_V592 = "([a-f0-9]{64})"/i);
  assert(packetMatch?.[1] === HERO_PACKET_SHA256, "hero packet seal changed");
  assert(Array.isArray(heroes) && heroes.length === 24, `hero catalog count changed: ${heroes.length}`);
  assert(new Set(heroes.map((hero) => hero.id)).size === heroes.length, "hero catalog contains duplicate ids");
  return { source, heroes };
}

export function loadProjection(root = process.cwd()) {
  const source = readText(root, PROJECTION_PATH);
  const projection = parseGeneratedObject(source, "MAINLINE_A_BETA_STELLAR_PROJECTION");
  assert(projection.snapshotSha256 === EXPECTED_SEAL, "stellar projection snapshot seal changed");
  assert(projection.rows.length === BETA_IDS.length, "stellar projection row count changed");
  assert(projection.generatedFromExistingSnapshot === true, "projection synthetic-source flag changed");
  assert(projection.scientificPayloadWriteback === false, "projection scientific writeback opened");
  return { source, projection };
}

function finitePositive(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function inspectHeroArt(hero, projectionRow, runtimeBaseline) {
  const checks = {
    identity: typeof hero.id === "string" && hero.id.length > 0 && typeof hero.name === "string" && hero.name.length > 0,
    photometry: finitePositive(hero.temperatureK) && finitePositive(hero.radiusSolar) && finitePositive(hero.luminositySolar),
    geometry: finitePositive(hero.equatorialPolarRadiusRatio) && hero.equatorialPolarRadiusRatio <= 2,
    shader: typeof hero.shaderProfile === "string" && hero.shaderProfile.length > 0,
    corona: typeof hero.coronaModel === "string" && hero.coronaModel.length > 0,
    presentationBoundary: hero.presentationOnly === true && hero.scientificPayloadWriteback === false,
    sourceReference: runtimeBaseline || projectionRow?.presentationReferenceReady === true,
  };
  const blockers = [];
  for (const [key, valid] of Object.entries(checks)) if (!valid) blockers.push(`art-${key}-missing`);
  if (!runtimeBaseline) blockers.push("runtime-allowlist-closed");
  if (projectionRow && projectionRow.blockingReasons.length > 0) blockers.push(...projectionRow.blockingReasons);
  return { checks, blockers: [...new Set(blockers)] };
}

export function buildRecord(hero, projectionRow, runtimeBaseline) {
  const inspection = inspectHeroArt(hero, projectionRow, runtimeBaseline);
  const artStatus = inspection.blockers.length === 0 ? (runtimeBaseline ? "runtime-baseline" : "candidate-presentation") : "evidence-pending";
  return {
    id: hero.id,
    displayName: hero.name,
    status: runtimeBaseline ? "runtime-baseline" : "candidate-only",
    artStatus,
    runtimeAdmission: runtimeBaseline ? "admitted" : "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    source: {
      heroPacketSha256: HERO_PACKET_SHA256,
      projectionRow: projectionRow ? { id: projectionRow.id, sourceRecordDigest: projectionRow.sourceRecordDigest, snapshotSha256: null } : null,
      presentationOnly: hero.presentationOnly === true,
    },
    visualProfile: {
      shaderProfile: hero.shaderProfile,
      coronaModel: hero.coronaModel,
      temperatureK: hero.temperatureK,
      radiusSolar: hero.radiusSolar,
      luminositySolar: hero.luminositySolar,
      equatorialPolarRadiusRatio: hero.equatorialPolarRadiusRatio,
      textureMode: "parameterized-photosphere",
    },
    checks: inspection.checks,
    blockers: inspection.blockers,
  };
}

export function buildPack({ root = process.cwd(), catalog = loadHeroCatalog(root), projection = loadProjection(root) } = {}) {
  const projectionById = new Map(projection.projection.rows.map((row) => [row.id, row]));
  const currentIds = new Set([...CURRENT_BASE_IDS, ...projection.projection.rows.filter((row) => row.presentationReferenceReady).map((row) => row.id)]);
  assert(currentIds.size === 20, `runtime baseline count changed: ${currentIds.size}`);
  const records = catalog.heroes.map((hero) => buildRecord(hero, projectionById.get(hero.id), currentIds.has(hero.id)));
  assert(records.length === 24, "art evidence record count changed");
  assert(records.filter((record) => record.status === "runtime-baseline").length === 20, "runtime baseline records changed");
  assert(records.filter((record) => record.status === "candidate-only").length === 4, "candidate-only records changed");
  assert(records.filter((record) => PENDING_IDS.includes(record.id)).every((record) => record.status === "candidate-only"), "pending hero admission changed");
  return {
    schema: PACK_SCHEMA,
    generatedAt: projection.projection.retrievedAt,
    heroCatalog: { path: HERO_SOURCE_PATH, packetSha256: HERO_PACKET_SHA256, contentSha256: sha256(catalog.source), count: catalog.heroes.length },
    projection: { path: PROJECTION_PATH, contentSha256: sha256(projection.source), snapshotSha256: projection.projection.snapshotSha256, sourceLicense: projection.projection.license, citation: projection.projection.citation },
    counts: {
      total: records.length,
      runtimeBaseline: records.filter((record) => record.status === "runtime-baseline").length,
      candidateOnly: records.filter((record) => record.status === "candidate-only").length,
      artReady: records.filter((record) => record.artStatus !== "evidence-pending").length,
      evidencePending: records.filter((record) => record.artStatus === "evidence-pending").length,
    },
    presentationBoundary: { runtimeWrites: false, scienceWrites: false, sourceIsSynthetic: false, textureMode: "parameterized-photosphere" },
    records,
  };
}

export function readPack(root = process.cwd()) {
  const absolute = path.join(root, OUTPUT_PATH);
  assert(fs.existsSync(absolute), `output missing: ${OUTPUT_PATH}`);
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

export function verifyPack(actual, expected) {
  assert(stableJson(actual) === stableJson(expected), "existing art evidence pack differs from the sealed input");
  assert(actual.schema === PACK_SCHEMA, "art evidence schema changed");
  assert(actual.counts?.total === 24 && actual.counts.runtimeBaseline === 20 && actual.counts.candidateOnly === 4, "art evidence counts changed");
  assert(actual.presentationBoundary?.runtimeWrites === false && actual.presentationBoundary?.scienceWrites === false, "presentation boundary opened");
  assert(Array.isArray(actual.records) && actual.records.length === 24, "art evidence records missing");
  actual.records.forEach((record, index) => {
    assert(record.id && record.displayName && record.source?.heroPacketSha256 === HERO_PACKET_SHA256, `record identity changed at ${index}`);
    assert(record.measurementAdmission === "not-admitted" && record.scientificPayloadWriteback === false, `${record.id} admission boundary changed`);
    assert(Array.isArray(record.blockers), `${record.id} blockers missing`);
  });
  return { status: "verified", total: actual.counts.total, runtimeBaseline: actual.counts.runtimeBaseline, candidateOnly: actual.counts.candidateOnly, output: OUTPUT_PATH };
}

export function writePack(root = process.cwd(), pack = buildPack({ root })) {
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", ...pack.counts, output: OUTPUT_PATH };
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack({ root });
  return check ? verifyPack(readPack(root), pack) : writePack(root, pack);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
