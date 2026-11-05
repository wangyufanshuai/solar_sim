/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { MAINLINE_A_CURRENT_STARS, MAINLINE_A_CURRENT_CONSTELLATIONS, MAINLINE_A3_NEBULAE } from "../app/data/mainlineAMetadataV607";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "../app/data/mainlineANebulaVisualAssetsV607.all.generated";
import { coveragePackValidationErrorsV622 } from "../app/lib/mainlineACanonicalCoverageV622";

export const SCHEMA = "mainline-a-canonical-coverage-v622";
export const OUTPUT_PATH = "app/data/mainlineACanonicalCoverageV622.generated.json";
const sha = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
const canonical = (v: any): any => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v;
const digest = (v: unknown) => sha(canonical(v));
const source = (row: any) => row.provenance?.[0] ?? { sourceId: "catalog-derived", sourceUrl: "https://www.iau.org/", license: "source-attribution-required", credit: "catalog source" };
export const lifecycle = (row: any, kind: string) => kind === "nebula"
  && ["licensed", "manifest-candidate"].includes(row.presentation?.assetStatus)
  && row.presentation?.assetId ? "asset-delivered"
    : kind === "star" && row.status === "runtime-cleared"
      ? "runtime-cleared" : "catalog-mapped";
export function normalizeCanonicalRow(row: any) {
  return { id: String(row.id), kind: String(row.kind), displayName: String(row.displayName), route: { assetId: row.route?.assetId ?? null, assetPath: row.route?.assetPath ?? null, assetHash: row.route?.assetHash ?? null, route: String(row.route?.route ?? "") }, source: { sourceId: String(row.source?.sourceId ?? ""), sourceUrl: String(row.source?.sourceUrl ?? ""), license: String(row.source?.license ?? ""), credit: row.source?.credit ?? null }, lifecycle: String(row.lifecycle), status: String(row.status), signoff: String(row.signoff), pendingReasons: [...(row.pendingReasons ?? [])].sort(), candidateOnly: row.candidateOnly === true, runtimeAdmission: row.runtimeAdmission, measurementAdmission: row.measurementAdmission, scientificPayloadWriteback: row.scientificPayloadWriteback === false };
}
export function isPathContained(root: string, candidate: string): boolean { const base = path.resolve(root); const target = path.resolve(root, candidate); return target === base || target.startsWith(`${base}${path.sep}`); }
export function validateAssetPath(root: string, row: any): string[] { const errors: string[] = []; if (!row.route) return [`${row.id}:asset-route-missing`]; if (row.route.assetPath && !isPathContained(root, row.route.assetPath)) errors.push(`${row.id}:asset-path-escape`); if (row.route.assetPath && !row.route.assetHash) errors.push(`${row.id}:asset-hash-missing`); return errors; }
export function routeInventory(records: readonly any[]) { const counts: Record<string, number> = {}; for (const row of records) counts[row.route.route] = (counts[row.route.route] ?? 0) + 1; return Object.freeze(counts); }
export function gateSummary(records: readonly any[]) { return Object.freeze({ pending: records.filter((row) => row.pendingReasons.length > 0).length, signoffPending: records.filter((row) => row.signoff === "pending").length, rightsPending: records.filter((row) => row.status === "rights-pending").length, candidateOnly: records.filter((row) => row.candidateOnly).length, admitted: records.filter((row) => row.runtimeAdmission !== "candidate-only" || row.measurementAdmission !== "not-admitted").length }); }
export function manifestDiff(expected: any, actual: any) { const diffs: string[] = []; const left = new Map((expected.records ?? []).map((row: any) => [row.id, row])); const right = new Map((actual.records ?? []).map((row: any) => [row.id, row])); for (const id of new Set([...left.keys(), ...right.keys()])) { if (!left.has(id)) diffs.push(`${id}:added`); else if (!right.has(id)) diffs.push(`${id}:removed`); else if (digest(normalizeCanonicalRow(left.get(id))) !== digest(normalizeCanonicalRow(right.get(id)))) diffs.push(`${id}:changed`); } return Object.freeze(diffs.sort()); }
export function jsonlReceipt(pack: any) { const lines = [JSON.stringify({ section: "meta", schema: pack.schema, manifestDigest: pack.manifestDigest }), JSON.stringify({ section: "counts", ...pack.counts }), JSON.stringify({ section: "routes", ...routeInventory(pack.records) }), JSON.stringify({ section: "gates", ...gateSummary(pack.records) })]; for (const row of pack.records) lines.push(JSON.stringify({ section: "row", id: row.id, kind: row.kind, status: row.status, route: row.route.route, sourceHash: row.sourceHash, rowHash: row.rowHash })); return `${lines.join("\n")}\n`; }

function routeAsset(row: any, kind: string) {
  if (kind === "nebula") {
    const asset = MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL.find((item: any) => item.objectId === row.id);
    return { assetId: asset?.objectId ?? null, assetPath: asset?.localPath ?? null, assetHash: asset?.sha256 ?? null, route: asset ? "mainline-a3-nebula-visual" : "catalog-nebula-marker" };
  }
  return { assetId: row.id, assetPath: null, assetHash: null, route: kind === "star" ? "mainline-a-stellar-parametric" : "mainline-a-constellation-lines" };
}

function makeRow(row: any, kind: string) {
  const provenance = source(row);
  const route = routeAsset(row, kind);
  const status = kind === "constellation" ? "signoff-pending" : kind === "nebula" ? (route.assetPath ? "rights-pending" : "payload-pending") : row.status === "runtime-cleared" ? "runtime-cleared" : "evidence-pending";
  const item = { id: row.id, kind, displayName: row.displayName ?? row.name ?? row.commonName ?? row.id, route, source: { sourceId: provenance.sourceId, sourceUrl: provenance.sourceUrl, license: provenance.license ?? "source-attribution-required", credit: provenance.credit ?? null }, sourceHash: digest(provenance), lifecycle: lifecycle(row, kind), status, signoff: kind === "constellation" ? "pending" : "not-applicable", pendingReasons: status === "runtime-cleared" || status === "asset-delivered" ? [] : [status], candidateOnly: true, runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false };
  return { ...item, rowHash: digest(normalizeCanonicalRow(item)) };
}

export function buildPack() {
  const stars = MAINLINE_A_CURRENT_STARS.slice(0, 12).map((row: any) => makeRow(row, "star"));
  const nebulae = MAINLINE_A3_NEBULAE.slice(0, 12).map((row: any) => makeRow(row, "nebula"));
  const constellations = MAINLINE_A_CURRENT_CONSTELLATIONS.slice(0, 12).map((row: any) => makeRow(row, "constellation"));
  const records = [...stars, ...nebulae, ...constellations];
  const pack = { schema: SCHEMA, generatedAt: new Date().toISOString(), counts: { total: records.length, stars: stars.length, nebulae: nebulae.length, constellations: constellations.length }, records, manifestDigest: digest(records) };
  const typedErrors = coveragePackValidationErrorsV622(pack as any);
  if (typedErrors.length) throw new Error(`typed coverage validation failed: ${typedErrors.join(",")}`);
  return { ...pack, counts: { ...pack.counts, runtimeCleared: records.filter((row) => row.lifecycle === "runtime-cleared").length, signoffPending: records.filter((row) => row.status === "signoff-pending").length, rightsPending: records.filter((row) => row.status === "rights-pending").length }, boundary: { canonicalCoverageOnly: true, candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false } };
}

export function validatePack(pack: any) {
  if (pack.schema !== SCHEMA || pack.counts.total !== 36 || pack.records.length !== 36) return ["count-or-schema-invalid"];
  const errors: string[] = [];
  if (pack.counts.stars !== 12 || pack.counts.nebulae !== 12 || pack.counts.constellations !== 12) errors.push("12-12-12-coverage-invalid");
  if (!pack.boundary.candidateOnly || !pack.boundary.hold || !pack.boundary.notAdmitted || pack.boundary.scientificPayloadWriteback) errors.push("boundary-invalid");
  for (const row of pack.records) {
    if (!row.source?.sourceUrl || !/^https?:\/\//.test(row.source.sourceUrl)) errors.push(`${row.id}:source-url-invalid`);
    if (!/^[a-f0-9]{64}$/.test(row.sourceHash) || !/^[a-f0-9]{64}$/.test(row.rowHash)) errors.push(`${row.id}:hash-invalid`);
    if (!row.route?.route) errors.push(`${row.id}:asset-route-missing`);
    if (row.kind === "constellation" && row.signoff !== "pending") errors.push(`${row.id}:signoff-opened`);
    if (row.runtimeAdmission !== "candidate-only" || row.measurementAdmission !== "not-admitted") errors.push(`${row.id}:admission-opened`);
    errors.push(...validateAssetPath(process.cwd(), row));
    if (digest(normalizeCanonicalRow(row)) !== row.rowHash) errors.push(`${row.id}:row-hash-mismatch`);
  }
  return errors;
}

export function run(check = false, jsonl = false) {
  const pack = buildPack();
  if (check) { const current = JSON.parse(fs.readFileSync(path.resolve(OUTPUT_PATH), "utf8")); const errors = validatePack(current); if (errors.length) throw new Error(errors.join(",")); return { status: "verified", counts: current.counts, manifestDigest: current.manifestDigest }; }
  const errors = validatePack(pack); if (errors.length) throw new Error(errors.join(",")); fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(pack, null, 2)}\n`, "utf8"); if (jsonl) fs.writeFileSync("docs/release/v607/mainline-a-v622-canonical-coverage.jsonl", jsonlReceipt(pack), "utf8"); return { status: "generated", counts: pack.counts, manifestDigest: pack.manifestDigest };
}

if (process.argv[1]?.endsWith("build-mainline-a-canonical-coverage-v622.ts")) console.log(JSON.stringify(run(process.argv.includes("--check"), process.argv.includes("--jsonl")), null, 2));
