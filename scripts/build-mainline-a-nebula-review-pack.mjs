import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { projectNebulaManifests, verifyNebulaLocalEvidence } from "./project-mainline-a-beta-nebula.mjs";

const root = process.cwd();
const projectionPath = path.join(root, "app/data/mainlineABetaNebulaProjectionV609.generated.ts");
const outputPath = process.env.MAINLINE_A_NEBULA_REVIEW_OUTPUT
  ? path.resolve(root, process.env.MAINLINE_A_NEBULA_REVIEW_OUTPUT)
  : path.join(root, "app/data/mainlineANebulaReviewPackV610.generated.json");
const REQUIRED_STATES = ["source-verified", "rights-review", "visual-review", "admission-ready"];

function fail(message) { throw new Error(`nebula review pack: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function readProjection() {
  assert(fs.existsSync(projectionPath), `projection missing: ${projectionPath}`);
  const source = fs.readFileSync(projectionPath, "utf8");
  const start = source.indexOf("[");
  const close = source.lastIndexOf("]");
  assert(start >= 0 && close > start, "projection array cannot be located");
  const body = source.slice(start, close + 1);
  let rows;
  try { rows = JSON.parse(body); }
  catch (error) { fail(`projection-json-invalid:${error instanceof Error ? error.message : String(error)}`); }
  assert(Array.isArray(rows), "projection is not an array");
  return { rows, projectionSha256: crypto.createHash("sha256").update(source).digest("hex") };
}

function verifyRow(row, index) {
  assert(row && typeof row === "object", `row ${index} must be an object`);
  for (const key of ["id", "target", "catalogName", "nasaId", "manifestPath", "manifestSha256"]) assert(typeof row[key] === "string" && row[key], `row ${index} missing ${key}`);
  assert(row.source && typeof row.source === "object", `row ${index} source missing`);
  for (const key of ["url", "localPath", "sha256", "license", "credit"]) assert(typeof row.source[key] === "string" && row.source[key], `row ${index} source.${key} missing`);
  assert(/^https:\/\//.test(row.source.url), `row ${index} source URL must be HTTPS`);
  assert(/^\/[a-z0-9/._-]+$/.test(row.source.localPath) === false, `row ${index} local path must remain source-cache evidence`);
  assert(/^\/[A-Za-z0-9/._-]+$/.test(`/${row.source.localPath}`), `row ${index} local path contains unsafe characters`);
  assert(Number.isInteger(row.source.bytes) && row.source.bytes > 0, `row ${index} bytes invalid`);
  assert(Number.isInteger(row.source.width) && row.source.width >= 256, `row ${index} width invalid`);
  assert(Number.isInteger(row.source.height) && row.source.height >= 256, `row ${index} height invalid`);
  assert(/^[a-f0-9]{64}$/.test(row.source.sha256), `row ${index} source hash invalid`);
  assert(row.rightsStatus === "review", `row ${index} rights must remain review`);
  assert(row.visualAssetAdmitted === false && row.scienceImagePayloadAllowed === false, `row ${index} admission flags must be false`);
}

function reviewState(row) {
  const sourceVerified = Boolean(row.source?.url && row.source?.localPath && row.source?.sha256 && row.source?.bytes && row.source?.width && row.source?.height);
  if (!sourceVerified) return "source-verified";
  if (row.rightsStatus !== "cleared") return "rights-review";
  if (row.visualAssetAdmitted !== true) return "visual-review";
  return "admission-ready";
}

function buildPack() {
  const { rows, projectionSha256 } = readProjection();
  assert(rows.length === 18, `expected 18 candidates, received ${rows.length}`);
  const manifestRows = projectNebulaManifests(root);
  assert(JSON.stringify(rows) === JSON.stringify(manifestRows), "projection does not match sealed manifests");
  const localEvidence = verifyNebulaLocalEvidence(root, manifestRows);
  assert(localEvidence.failed === 0, `local evidence failed for ${localEvidence.failures.map((entry) => entry.id).join(",")}`);
  const evidenceById = new Map(localEvidence.results.map((entry) => [entry.id, entry]));
  const seen = new Set();
  const records = rows.map((row, index) => {
    verifyRow(row, index);
    assert(!seen.has(row.id), `duplicate candidate ${row.id}`);
    seen.add(row.id);
    const evidence = evidenceById.get(row.id);
    assert(evidence?.status === "verified", `row ${index} local evidence is not verified`);
    return {
      id: row.id,
      target: row.target,
      catalogName: row.catalogName,
      nasaId: row.nasaId,
      state: reviewState(row),
      stateOrder: REQUIRED_STATES.indexOf(reviewState(row)),
      blockers: ["per-image NASA usage review", "visual crop and focal-point signoff", "runtime admission approval"],
      source: { url: row.source.url, localPath: row.source.localPath, bytes: row.source.bytes, width: row.source.width, height: row.source.height, sha256: row.source.sha256, license: row.source.license, credit: row.source.credit },
      localEvidence: { status: evidence.status, actualBytes: evidence.actualBytes, actualSha256: evidence.actualSha256, dimensions: evidence.dimensions },
      provenance: { manifestPath: row.manifestPath, manifestSha256: row.manifestSha256, projectionSha256 },
      runtime: { visualAssetAdmitted: false, scienceImagePayloadAllowed: false, candidateOnly: true },
      reviewer: { owner: null, reviewedAt: null, rightsEvidencePath: null, visualEvidencePath: null, decision: "pending" },
    };
  });
  const counts = Object.fromEntries(REQUIRED_STATES.map((state) => [state, records.filter((record) => record.state === state).length]));
  return { schema: "mainline-a-nebula-review-pack-v610", generatedAt: new Date().toISOString(), projectionSha256, candidateCount: records.length, counts, runtimeAdmissionCount: 0, states: REQUIRED_STATES, localEvidence: { checked: localEvidence.checked, verified: localEvidence.verified, failed: localEvidence.failed }, records };
}

function comparablePack(pack) {
  const copy = structuredClone(pack);
  delete copy.generatedAt;
  return JSON.stringify(copy);
}

function main() {
  const pack = buildPack();
  if (process.argv.includes("--check")) {
    assert(fs.existsSync(outputPath), "review pack output missing");
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    assert(existing.schema === pack.schema && existing.candidateCount === pack.candidateCount && existing.projectionSha256 === pack.projectionSha256, "existing pack metadata is stale");
    assert(comparablePack(existing) === comparablePack(pack), "existing pack records or local evidence are stale");
    console.log(JSON.stringify({ status: "verified", candidateCount: pack.candidateCount, counts: pack.counts, output: path.relative(root, outputPath) }, null, 2));
    return;
  }
  fs.writeFileSync(outputPath, `${JSON.stringify(pack, null, 2)}\n`);
  console.log(JSON.stringify({ status: "generated", candidateCount: pack.candidateCount, counts: pack.counts, output: path.relative(root, outputPath) }, null, 2));
}

main();
