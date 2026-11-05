import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  R74_LICENSE_PATH_V661, R74_OVERLAY_PATH_V661,
  R74_PRIOR_OVERLAY_PATH_V661, R74_SCHEMA_V661,
  R74_SOURCES_V661, R74_TARGET_IDS_V661,
  inspectPageR74V661, rawPathR74V661, requestFingerprintR74V661,
  safePageUrlR74V661, sha256R74V661,
  validatePriorPolicyR74V661,
} from "./mainline-a-r74-alternative-contract-v661.mjs";
import { ledgerPathR74V661, runIdR74V661,
  unexecutedImageRequestsR74V661 } from "./collect-mainline-a-r74-alternatives-v661.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHA = /^[a-f0-9]{64}$/;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

function absoluteInsideRoot(relative) {
  if (typeof relative !== "string" || relative.startsWith("/")
    || relative.includes("\\") || relative.split("/").some((part) =>
      !part || part === "..")) {
    throw new Error("r74-replay-v661:unsafe-local-path");
  }
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error("r74-replay-v661:local-path-escaped-root");
  }
  return absolute;
}

async function defaultRead(relative) {
  return readFile(absoluteInsideRoot(relative));
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function timeIsValid(startedAt, endedAt) {
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  return Number.isFinite(start) && Number.isFinite(end) && start <= end;
}

export function inspectAttemptR74V661(record, source, collectionId) {
  const issues = [];
  const attempt = record?.attempt;
  if (record?.sourceKey !== source.key || record?.targetId !== source.targetId
    || record?.sourceUrl !== source.url || record?.sourceKind !== source.kind
    || attempt?.sourceKey !== source.key || attempt?.targetId !== source.targetId
    || attempt?.requestUrl !== source.url || attempt?.requestExecuted !== true
    || attempt?.collectionId !== collectionId
    || attempt?.requestFingerprint !== requestFingerprintR74V661(source)
    || attempt?.retryCount !== 0
    || !Number.isInteger(attempt?.timeoutMs) || attempt.timeoutMs < 1
    || attempt.timeoutMs > 120_000
    || !timeIsValid(attempt?.startedAt, attempt?.endedAt)) {
    issues.push("request-fingerprint-time-or-source-invalid");
  }
  if (!Array.isArray(attempt?.redirectChain)
    || attempt.redirectChain[0] !== source.url
    || !Array.isArray(attempt?.redirects)
    || attempt.redirects.length !== attempt.redirectChain.length - 1) {
    issues.push("redirect-chain-not-allowlisted");
  } else {
    for (const [index, redirect] of attempt.redirects.entries()) {
      const isFinalBlockedHop = attempt?.errorClass === "redirect-blocked"
        && index === attempt.redirects.length - 1;
      if (redirect?.from !== attempt.redirectChain[index]
        || redirect?.to !== attempt.redirectChain[index + 1]
        || !REDIRECT_CODES.has(redirect?.status)
        || !safePageUrlR74V661(redirect.from, source)
        || isFinalBlockedHop === safePageUrlR74V661(redirect.to, source)) {
        issues.push("redirect-hop-invalid");
      }
    }
    if (attempt.redirects.length === 0
      && attempt?.errorClass === "redirect-blocked") {
      issues.push("blocked-redirect-missing-hop");
    }
  }
  if (record?.imageRequestExecuted !== false
    || record?.imageResponseCaptured !== 0
    || record?.rightsStatus !== "pending"
    || record?.runtimeAdmission !== "candidate-only"
    || record?.hold !== true || record?.notAdmitted !== true
    || record?.scientificPayloadWriteback !== false) {
    issues.push("source-record-boundary-invalid");
  }
  if (attempt?.responseCaptured === 1) {
    if (attempt?.timeout !== false || attempt?.httpStatus !== 200
      || !/^text\/html(?:\s*;|$)/i.test(attempt?.contentType ?? "")
      || attempt?.finalUrl !== source.url
      || attempt?.errorClass !== null || attempt?.errorMessage !== null
      || !Number.isInteger(attempt?.responseBytes)
      || attempt.responseBytes < 10_000
      || !SHA.test(attempt?.responseSha256 ?? "")
      || attempt?.rawArtifactPath !== record?.rawArtifact?.path
      || record?.rawArtifact?.bytes !== attempt.responseBytes
      || record?.rawArtifact?.sha256 !== attempt.responseSha256
      || record?.rawArtifact?.path !== rawPathR74V661(source,
        SHA.test(attempt.responseSha256 ?? "")
          ? attempt.responseSha256 : "0".repeat(64))
      || record?.inspection?.imageRequestExecuted !== false
      || record?.inspection?.imageResponseCaptured !== 0) {
      issues.push("captured-attempt-shape-invalid");
    }
  } else if (attempt?.responseCaptured === 0) {
    if (!attempt?.errorClass || attempt?.timeout !== (attempt.errorClass === "timeout")
      || attempt?.responseBytes !== null || attempt?.responseSha256 !== null
      || attempt?.rawArtifactPath !== null || record?.rawArtifact !== null
      || record?.inspection !== null || record?.sourceState !== "request-failed-hold") {
      issues.push("failed-attempt-fabricated-response");
    }
  } else issues.push("response-captured-invalid");
  return issues;
}

async function pinned(relative, reader) {
  const bytes = await reader(relative);
  return { path: relative, bytes: bytes.length,
    sha256: sha256R74V661(bytes), body: bytes };
}

function sourceProjection(record) {
  const inspection = record.inspection;
  return { sourceKey: record.sourceKey, kind: record.sourceKind,
    sourceUrl: record.sourceUrl, sourceState: record.sourceState,
    responseCaptured: record.attempt.responseCaptured,
    httpStatus: record.attempt.httpStatus,
    contentType: record.attempt.contentType,
    finalUrl: record.attempt.finalUrl,
    requestFingerprint: record.attempt.requestFingerprint,
    retryCount: record.attempt.retryCount,
    timeout: record.attempt.timeout,
    errorClass: record.attempt.errorClass,
    rawArtifact: record.rawArtifact,
    title: inspection?.title ?? null,
    nasaId: inspection?.nasaId ?? null,
    target: inspection?.target ?? null,
    objectName: inspection?.objectName ?? null,
    credit: inspection?.credit ?? null,
    partnerMarkers: inspection?.partnerMarkers ?? [],
    downloads: inspection?.downloads ?? [],
    identityState: inspection?.identityState ?? "request-failed",
    inspectionIssues: inspection?.issues ?? ["request-failed"],
    rightsStatus: "pending", imageRequestExecuted: false,
    imageResponseCaptured: 0, hold: true, notAdmitted: true,
    runtimeAdmission: "candidate-only", scientificPayloadWriteback: false };
}

function targetProjection(id, sources) {
  const alternatives = sources.filter((source) => source.targetId === id)
    .map(sourceProjection);
  const confirmed = alternatives.find((source) =>
    source.identityState === "page-identity-confirmed"
    && source.inspectionIssues.length === 0) ?? null;
  const conflicts = alternatives.filter((source) =>
    source.identityState === "identity-conflict").map((source) => source.sourceKey);
  return { id, alternatives, preferredSourceKey: confirmed?.sourceKey ?? null,
    pageIdentityCandidate: Boolean(confirmed), conflicts,
    imageState: "policy-hold-unrequested",
    imageRequestExecuted: false, imageResponseCaptured: 0,
    rightsStatus: "pending", rightsSigned: false,
    visualSignoff: false, runtimeAdmission: "candidate-only",
    hold: true, notAdmitted: true, scientificPayloadWriteback: false };
}

export function projectOverlayR74V661(ledger, ledgerPin) {
  const rows = R74_TARGET_IDS_V661.map((id) =>
    targetProjection(id, ledger.sources));
  const counts = {
    heldTargets: rows.length,
    officialPagesAttempted: ledger.sources.length,
    officialPagesCaptured: ledger.sources.filter((source) =>
      source.attempt.responseCaptured === 1).length,
    pageIdentityCandidates: rows.filter((row) => row.pageIdentityCandidate).length,
    conflictingPages: ledger.sources.filter((source) =>
      source.inspection?.identityState === "identity-conflict").length,
    imageRequestsExecuted: 0, imageResponsesCaptured: 0,
    rightsSigned: 0, runtimeAdmitted: 0,
  };
  return { schema: "mainline-a-r74-alternative-overlay-v661",
    evidenceClass: "offline-replayed-official-page-candidate",
    generatedAt: ledger.completedAt,
    ledger: ledgerPin,
    counts, rows,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      rightsSigned: false, runtimeAdmitted: false,
      scientificPayloadWriteback: false,
      publicWebReleaseApproved: false } };
}

export async function replayLedgerR74V661(ledger, options = {}) {
  const reader = options.readRaw ?? defaultRead;
  const issues = [];
  if (ledger?.schema !== R74_SCHEMA_V661
    || ledger?.evidenceClass !== "real-https-page-attempts-local-candidate"
    || ledger?.sourceCount !== R74_SOURCES_V661.length
    || !Array.isArray(ledger?.sources)
    || ledger.sources.length !== R74_SOURCES_V661.length
    || !ledger?.collectionId || !timeIsValid(ledger?.createdAt, ledger?.completedAt)) {
    issues.push("ledger-identity-or-count-invalid");
  }
  if (!sameJson(ledger?.unexecutedImageRequests,
    unexecutedImageRequestsR74V661())) {
    issues.push("five-image-request-holds-drift");
  }
  if (!sameJson(ledger?.boundary, { candidateOnly: true, hold: true,
    notAdmitted: true, rightsSigned: 0, runtimeAdmitted: 0,
    scientificPayloadWriteback: false, imageRequestsExecuted: 0,
    imageResponsesCaptured: 0 })) {
    issues.push("ledger-boundary-invalid");
  }
  const expectedInputs = [R74_LICENSE_PATH_V661, R74_PRIOR_OVERLAY_PATH_V661];
  const pinnedInputs = [];
  for (const [index, relative] of expectedInputs.entries()) {
    try {
      const actual = await pinned(relative, reader);
      const stored = ledger?.inputs?.[index];
      if (stored?.path !== relative || stored?.bytes !== actual.bytes
        || stored?.sha256 !== actual.sha256) issues.push(`${relative}:input-pin-drift`);
      pinnedInputs.push({ ...actual, parsed: JSON.parse(actual.body.toString("utf8")) });
    } catch {
      issues.push(`${relative}:input-unreadable`);
    }
  }
  if (pinnedInputs.length === 2) {
    const policy = validatePriorPolicyR74V661(
      pinnedInputs[0].parsed, pinnedInputs[1].parsed);
    if (!policy.ok) issues.push(...policy.issues);
  }
  const checks = [];
  for (const [index, source] of R74_SOURCES_V661.entries()) {
    const record = ledger?.sources?.[index];
    const sourceIssues = inspectAttemptR74V661(record, source,
      ledger?.collectionId);
    if (record?.attempt?.responseCaptured === 1) {
      const expectedPath = rawPathR74V661(source,
        SHA.test(record?.rawArtifact?.sha256 ?? "")
          ? record.rawArtifact.sha256 : "0".repeat(64));
      if (record?.rawArtifact?.path !== expectedPath) {
        sourceIssues.push("raw-path-not-content-addressed");
      }
      try {
        const actual = await pinned(expectedPath, reader);
        if (actual.bytes !== record.rawArtifact.bytes
          || actual.sha256 !== record.rawArtifact.sha256) {
          sourceIssues.push("raw-bytes-or-sha-drift");
        }
        const recomputed = inspectPageR74V661(actual.body, source);
        if (!sameJson(recomputed, record.inspection)) {
          sourceIssues.push("stored-inspection-drift");
        }
        const state = recomputed.identityState === "identity-conflict"
          ? "identity-conflict-hold"
          : recomputed.ok ? "page-captured-rights-hold"
            : "page-captured-inspection-hold";
        if (record.sourceState !== state) sourceIssues.push("source-state-drift");
      } catch {
        sourceIssues.push("raw-artifact-unreadable");
      }
    }
    checks.push({ key: source.key, ok: sourceIssues.length === 0,
      issues: sourceIssues, responseCaptured: record?.attempt?.responseCaptured ?? 0 });
    issues.push(...sourceIssues.map((issue) => `${source.key}:${issue}`));
  }
  return { ok: issues.length === 0, issues, checks,
    limitations: ["Local raw-byte replay does not independently authenticate NASA or grant rights.",
      "No held image request was executed; page download links are metadata only."] };
}

export function auditPathR74V661(runId) {
  return `docs/release/v607/mainline-a-r74-v661-page-audit-${runIdR74V661(runId)}.json`;
}

export async function verifyRunR74V661(runId, options = {}) {
  const relative = ledgerPathR74V661(runId);
  const bytes = await defaultRead(relative);
  const ledger = JSON.parse(bytes.toString("utf8"));
  const replay = await replayLedgerR74V661(ledger);
  if (!replay.ok) return { ok: false, issues: replay.issues, replay };
  const ledgerPin = { path: relative, bytes: bytes.length,
    sha256: sha256R74V661(bytes) };
  const overlay = projectOverlayR74V661(ledger, ledgerPin);
  const audit = { schema: "mainline-a-r74-page-replay-v661", runId,
    status: "verified-page-candidates-all-five-images-held",
    ledger: ledgerPin, checks: replay.checks,
    counts: overlay.counts, limitations: replay.limitations,
    boundary: overlay.boundary };
  if (options.write) {
    await writeFile(absoluteInsideRoot(R74_OVERLAY_PATH_V661),
      `${JSON.stringify(overlay, null, 2)}\n`, { flag: "wx" });
    await writeFile(absoluteInsideRoot(auditPathR74V661(runId)),
      `${JSON.stringify(audit, null, 2)}\n`, { flag: "wx" });
  }
  if (options.check) {
    const storedOverlay = JSON.parse((await defaultRead(R74_OVERLAY_PATH_V661))
      .toString("utf8"));
    const storedAudit = JSON.parse((await defaultRead(auditPathR74V661(runId)))
      .toString("utf8"));
    if (!sameJson(storedOverlay, overlay) || !sameJson(storedAudit, audit)) {
      return { ok: false, issues: ["stored-overlay-or-audit-drift"], replay };
    }
  }
  return { ok: true, issues: [], overlay, audit, replay };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf("--run-id");
  const runId = index < 0 ? null : process.argv[index + 1];
  verifyRunR74V661(runId, { write: process.argv.includes("--write"),
    check: process.argv.includes("--check") }).then((result) => {
    console.log(JSON.stringify({ ok: result.ok, issues: result.issues,
      counts: result.overlay?.counts ?? null,
      audit: result.ok ? auditPathR74V661(runId) : null }, null, 2));
    if (!result.ok) process.exitCode = 1;
  }).catch((error) => {
    console.error(String(error?.message ?? error));
    process.exitCode = 1;
  });
}
