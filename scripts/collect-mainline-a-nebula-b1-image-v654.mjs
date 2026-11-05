import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectOfficialJpegV652 } from "./collect-mainline-a-nebula-page-image-link-v652.mjs";
import {
  fingerprintOfficialJpegRequestV652, safeOfficialJpegUrlV652,
} from "./mainline-a-nebula-page-image-link-v652.mjs";
import {
  B1_BATCH, B1_IMAGE_DIR, B1_MAX_JPEG_BYTES, sha256B1V654,
} from "./mainline-a-nebula-b1-source-v654.mjs";
import {
  auditB1SourcePagesV654, replayB1SourceAuditV654,
} from "./verify-mainline-a-nebula-b1-v654.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const B1_PAGE_LEDGER_V654 =
  "docs/release/v607/mainline-a-r67-b1-source-page-ledger-20261012-v654b1page01.json";
export const B1_PAGE_AUDIT_V654 =
  "docs/release/v607/mainline-a-r67-b1-source-page-audit-20261012-v654b1page01.json";
const SCHEMA = "mainline-a-r67-b1-page-image-ledger-v654";
const RUN_ID = /^20261012-v654b1image0[1-9]$/;
const SHA = /^[a-f0-9]{64}$/;

function fail(code) {
  throw new Error(`b1-image-v654:${code}`);
}
function pin(relative, bytes) {
  return { path: relative, sha256: sha256B1V654(bytes),
    bytes: bytes.byteLength };
}
function inside(base, absolute) {
  return absolute.startsWith(`${base}${path.sep}`);
}
export function b1OfficialImagePathV654(candidate, sha256) {
  if (!/^[a-z0-9-]+$/.test(candidate?.id ?? "")
    || !/^PIA\d{5}$/.test(candidate?.nasaId ?? "")
    || !SHA.test(sha256 ?? "")) fail("artifact-identity-invalid");
  return `${B1_IMAGE_DIR}/${candidate.id}-${candidate.nasaId.toLowerCase()}-${sha256}.jpg`;
}
export function validateB1ImageCandidateV654(candidate, pinFromPage, row) {
  const issues = [];
  if (candidate?.id !== pinFromPage?.id || candidate?.nasaId !== row?.nasaId
    || candidate?.pageUrl !== row?.pageUrl
    || pinFromPage?.path !== row?.artifact?.path
    || pinFromPage?.sha256 !== row?.artifact?.sha256
    || pinFromPage?.directJpegUrl !== row?.inspection?.directJpegUrl
    || pinFromPage?.officialCredit !== candidate?.expectedCredit
    || !safeOfficialJpegUrlV652(pinFromPage?.directJpegUrl,
      candidate?.nasaId)
    || candidate?.candidateImageArtifact?.sha256
      !== row?.candidateImageArtifact?.sha256
    || row?.rightsSignoff !== "pending"
    || row?.runtimeAdmission !== "candidate-only"
    || row?.scientificPayloadWriteback !== false) {
    issues.push("page-image-binding-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

async function saveCaptured(candidate, capture) {
  if (!capture.captured) return null;
  const raw = capture.captured.body;
  if (raw.byteLength < 100 || raw.byteLength > B1_MAX_JPEG_BYTES
    || sha256B1V654(raw) !== capture.captured.sha256) {
    fail("captured-jpeg-invalid");
  }
  const relative = b1OfficialImagePathV654(candidate,
    capture.captured.sha256);
  const base = path.resolve(ROOT, B1_IMAGE_DIR);
  const absolute = path.resolve(ROOT, relative);
  if (!inside(base, absolute)) fail("artifact-path-escaped");
  await mkdir(base, { recursive: true });
  try {
    await writeFile(absolute, raw, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const old = await readFile(absolute);
    if (sha256B1V654(old) !== capture.captured.sha256
      || old.byteLength !== raw.byteLength) fail("existing-raw-conflict");
  }
  return { path: relative, sha256: capture.captured.sha256,
    bytes: raw.byteLength, finalUrl: capture.captured.finalUrl,
    contentType: capture.captured.contentType };
}

export async function collectB1OfficialImagesV654(runId, options = {}) {
  if (!RUN_ID.test(runId ?? "")) fail("run-id-invalid");
  const relative = `docs/release/v607/mainline-a-r67-b1-page-image-ledger-${runId}.json`;
  try {
    await access(path.join(ROOT, relative));
    fail("ledger-already-exists");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const [pageLedgerBytes, pageAuditBytes, batchBytes] = await Promise.all([
    readFile(path.join(ROOT, B1_PAGE_LEDGER_V654)),
    readFile(path.join(ROOT, B1_PAGE_AUDIT_V654)),
    readFile(path.join(ROOT, B1_BATCH)),
  ]);
  const pageLedger = JSON.parse(pageLedgerBytes.toString("utf8"));
  const pageAudit = JSON.parse(pageAuditBytes.toString("utf8"));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const fresh = await auditB1SourcePagesV654(B1_PAGE_LEDGER_V654);
  replayB1SourceAuditV654(pageAudit, fresh);
  if (fresh.status !== "verified-six-b1-official-pages-candidate"
    || fresh.inputPins.batch.sha256 !== sha256B1V654(batchBytes)
    || pageLedger.rows?.length !== 6 || batch.rows?.length !== 6) {
    fail("source-page-input-no-longer-replays");
  }
  const startedAt = new Date().toISOString();
  const rows = [];
  for (const [index, page] of pageLedger.rows.entries()) {
    const image = batch.rows[index];
    const candidate = { id: image?.id, nasaId: page.nasaId,
      pageUrl: page.pageUrl, expectedCredit: image?.source?.credit,
      candidateImageArtifact: image?.network?.artifact };
    const pagePin = pageAudit.artifacts[index];
    const linked = validateB1ImageCandidateV654(candidate, pagePin, page);
    if (!linked.ok) fail(`${page.id}:input-link-invalid`);
    const url = pagePin.directJpegUrl;
    const captured = await collectOfficialJpegV652(candidate, url, {
      ...options, collectionId: options.collectionId ?? randomUUID(),
    });
    let artifact = null;
    let persistError = null;
    try {
      artifact = await saveCaptured(candidate, captured);
      if (artifact) captured.attempts.at(-1).rawArtifactPath = artifact.path;
    } catch (error) {
      persistError = String(error?.message ?? error).slice(0, 500);
    }
    const byteIdentical = Boolean(artifact
      && artifact.sha256 === candidate.candidateImageArtifact.sha256
      && artifact.bytes === candidate.candidateImageArtifact.bytes);
    rows.push({ id: candidate.id, nasaId: candidate.nasaId,
      sourcePageUrl: candidate.pageUrl,
      sourcePageRawSha256: pagePin.sha256,
      officialDownloadUrl: url,
      candidateImageArtifact: candidate.candidateImageArtifact,
      requestFingerprint: fingerprintOfficialJpegRequestV652(url,
        candidate.nasaId),
      responseCaptured: artifact ? 1 : 0,
      attempts: captured.attempts, artifact, persistError,
      byteIdentical,
      sourceLinkStatus: byteIdentical ? "byte-identical-candidate" : "pending",
      rightsSignoff: "pending", runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false });
    console.log(JSON.stringify({ stage: "b1-official-jpeg-attempt",
      id: candidate.id, responseCaptured: rows.at(-1).responseCaptured,
      byteIdentical }));
  }
  const ledger = { schema: SCHEMA, evidenceClass: "external-source",
    runId, startedAt, endedAt: new Date().toISOString(),
    inputPins: { pageLedger: pin(B1_PAGE_LEDGER_V654, pageLedgerBytes),
      pageAudit: pin(B1_PAGE_AUDIT_V654, pageAuditBytes),
      imageBatch: pin(B1_BATCH, batchBytes) },
    rows, counts: { total: rows.length,
      responseCaptured: rows.filter((item) => item.responseCaptured === 1).length,
      byteIdentical: rows.filter((item) => item.byteIdentical).length,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } };
  await writeFile(path.join(ROOT, relative),
    `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
  return { status: "b1-official-jpeg-attempt-ledger-preserved",
    path: relative, counts: ledger.counts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4 || process.argv[2] !== "--run") fail("usage-invalid");
  console.log(JSON.stringify(await collectB1OfficialImagesV654(process.argv[3]), null, 2));
}
