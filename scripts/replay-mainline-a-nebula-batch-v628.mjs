import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ARTIFACT_ROOT, BATCH_ID, IDS, OUTPUT, ROOT, sha256, validateBatch } from "./collect-mainline-a-nebula-batch-v628.mjs";

const SYNTHETIC = /(fixture|synthetic|mock|example\.invalid|data:|placeholder)/i;

export function integrityErrorClass(row, root) {
  const errors = [];
  if (!row || !IDS.includes(row.id)) errors.push("unknown-row");
  if (SYNTHETIC.test(JSON.stringify(row ?? {}))) errors.push("synthetic-marker");
  if (row?.network?.status === "captured") {
    const artifact = row.network.artifact;
    if (!artifact?.path || !artifact?.sha256) errors.push("captured-artifact-missing");
    else {
      const absolute = path.resolve(root, artifact.path);
      const base = path.resolve(root, ARTIFACT_ROOT);
      if (!absolute.startsWith(`${base}${path.sep}`)) errors.push("artifact-path-outside-root");
      if (!fs.existsSync(absolute)) errors.push("artifact-file-missing");
      else if (sha256(fs.readFileSync(absolute)) !== artifact.sha256) errors.push("artifact-sha-mismatch");
    }
  }
  if (row?.source?.sourcePageStatus !== "pending") errors.push("source-page-promoted");
  if (row?.rights?.status !== "pending" || row?.rights?.signoffStatus !== "pending") errors.push("rights-promoted");
  return [...new Set(errors)];
}

export function replayBatch(batch, root = ROOT) {
  const shapeIssues = validateBatch(batch);
  const rowReports = (batch?.rows ?? []).map((row) => ({ id: row.id, errors: integrityErrorClass(row, root), responseCaptured: row.network?.responseCaptured ?? 0, artifactSha256: row.network?.artifact?.sha256 ?? null }));
  const integrityIssues = rowReports.flatMap((report) => report.errors.map((error) => `${report.id}:${error}`));
  const expected = { total: batch?.rows?.length ?? 0, captured: rowReports.filter((report) => report.responseCaptured === 1).length, sourcePagePending: rowReports.filter((report) => !report.errors.includes("source-page-promoted")).length };
  const countIssues = [];
  if (batch?.counts?.total !== expected.total) countIssues.push("count-total-mismatch");
  if (batch?.counts?.captured !== expected.captured) countIssues.push("count-captured-mismatch");
  return { schema: "mainline-a-nebula-batch-replay-v628", batchId: batch?.batchId ?? null, status: shapeIssues.length || integrityIssues.length || countIssues.length ? "blocked" : "passed", shapeIssues, integrityIssues, countIssues, rowReports, recomputed: expected, boundary: { candidateOnly: batch?.boundary?.candidateOnly === true, hold: batch?.boundary?.hold === true, notAdmitted: batch?.boundary?.notAdmitted === true, scientificPayloadWriteback: batch?.boundary?.scientificPayloadWriteback ?? null } };
}

export async function verifyFile({ root = ROOT, input = OUTPUT } = {}) {
  const absolute = path.resolve(root, input);
  const batch = JSON.parse(await fsp.readFile(absolute, "utf8"));
  if (batch.batchId !== BATCH_ID) throw new Error("unexpected V628 batch id");
  return replayBatch(batch, root);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyFile().then((report) => { console.log(JSON.stringify(report, null, 2)); if (report.status !== "passed") process.exitCode = 1; }).catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
}
