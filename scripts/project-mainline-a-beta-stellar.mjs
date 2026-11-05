import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SNAPSHOT_PATH = "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json";
export const EXPECTED_SEAL = "be5e2956350d7d81f19e29d6f98529702b4cf018cd1c3b6d47b392be82db5061";
export const BETA_IDS = [
  "alpha-centauri-b", "hadar", "altair", "acrux", "spica", "pollux",
  "fomalhaut", "deneb", "regulus", "polaris", "bellatrix", "alnilam",
];

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/** Compile a bounded factual projection; do not infer component identity. */
export function projectSnapshot(snapshot, expectedSeal = EXPECTED_SEAL) {
  if (!snapshot || typeof snapshot !== "object") throw new Error("Snapshot must be an object");
  const { snapshotSha256, ...unsigned } = snapshot;
  if (snapshotSha256 !== expectedSeal || digest(unsigned) !== expectedSeal) {
    throw new Error("SIMBAD snapshot seal mismatch");
  }
  if (!Array.isArray(snapshot.records)) throw new Error("Snapshot records missing");
  if (!snapshot.service?.citation || !snapshot.service?.license) throw new Error("Source attribution missing");
  const seen = new Set();
  for (const row of snapshot.records) {
    if (seen.has(row.id)) throw new Error(`Duplicate snapshot identity: ${row.id}`);
    seen.add(row.id);
  }
  const rows = BETA_IDS.map((id) => {
    const row = snapshot.records.find((candidate) => candidate.id === id);
    if (!row) throw new Error(`Missing Beta source record: ${id}`);
    const issues = [];
    if (row.queryStatus !== "resolved") issues.push("source-unresolved");
    if (!["exact-component", "exact-named-star"].includes(row.resolutionClass)) {
      issues.push("component-identity-ambiguous");
    }
    if (typeof row.mainId !== "string" || !row.mainId.trim()) issues.push("source-identifier-missing");
    const parallax = row.parallax;
    if (!finite(parallax?.valueMas) || parallax.valueMas <= 0) issues.push("positive-parallax-missing");
    if (!finite(parallax?.errorMas) || parallax.errorMas < 0) issues.push("parallax-error-missing");
    if (typeof parallax?.bibcode !== "string" || !parallax.bibcode.trim()) issues.push("upstream-reference-missing");
    return {
      id,
      simbadIdentifier: row.mainId ?? null,
      resolutionClass: row.resolutionClass,
      sourceRecordDigest: digest(row),
      parallaxMas: parallax?.valueMas ?? null,
      errorMas: parallax?.errorMas ?? null,
      bibcode: parallax?.bibcode ?? null,
      presentationReferenceReady: issues.length === 0,
      blockingReasons: issues,
      measurementAdmission: "not-admitted",
    };
  });
  return {
    schema: "mainline-a-beta-stellar-projection-v1",
    sourcePath: SNAPSHOT_PATH,
    snapshotSha256,
    retrievedAt: snapshot.retrievedAt,
    license: snapshot.service.license,
    citation: snapshot.service.citation,
    generatedFromExistingSnapshot: true,
    scientificPayloadWriteback: false,
    rows,
  };
}

export function renderProjection(projection) {
  return [
    "// Derived from the sealed local SIMBAD snapshot; do not edit by hand.",
    "// Source reference admission is distinct from scientific measurement authority.",
    `export const MAINLINE_A_BETA_STELLAR_PROJECTION = ${JSON.stringify(projection, null, 2)} as const;`,
    "",
  ].join("\n");
}

export function run({ root, check = false }) {
  const snapshot = JSON.parse(readFileSync(path.join(root, SNAPSHOT_PATH), "utf8"));
  const projection = projectSnapshot(snapshot);
  const target = path.join(root, "app/data/mainlineABetaStellarProjectionV607.generated.ts");
  const code = renderProjection(projection);
  if (check) {
    if (readFileSync(target, "utf8") !== code) throw new Error("Stellar projection is stale; regenerate it");
  } else {
    writeFileSync(target, code);
  }
  return {
    sourcePath: SNAPSHOT_PATH,
    sourceBytesSha256: createHash("sha256").update(readFileSync(path.join(root, SNAPSHOT_PATH))).digest("hex"),
    snapshotSha256: projection.snapshotSha256,
    ready: projection.rows.filter((row) => row.presentationReferenceReady).map((row) => row.id),
    pending: projection.rows.filter((row) => !row.presentationReferenceReady).map((row) => ({ id: row.id, reasons: row.blockingReasons })),
    check,
  };
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  try {
    console.log(JSON.stringify(run({ root: path.resolve(path.dirname(self), ".."), check: process.argv.includes("--check") }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
