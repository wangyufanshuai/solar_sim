import type {
  NebulaBatchAttemptV624,
  NebulaBatchPackV624,
  NebulaBatchRowV624,
} from "./mainlineANebulaBatchViewV624";

export type NebulaAuditFindingV624 = Readonly<{
  code: string;
  severity: "blocking" | "pending";
  candidateId: string | null;
  attempt: number | null;
  detail: string;
}>;

export type NebulaRetentionEntryV624 = Readonly<{
  path: string;
  sha256: string | null;
  bytes: number | null;
  references: readonly string[];
  action: "retain" | "quarantine";
  reason: string;
}>;

export type NebulaAuditGateV624 = Readonly<{
  id: string;
  status: "pass" | "hold" | "fail";
  observed: number;
  required: number;
}>;

export type NebulaBatchAuditV624 = Readonly<{
  schema: "mainline-a-nebula-batch-audit-v624";
  batchId: string;
  createdAt: string;
  findings: readonly NebulaAuditFindingV624[];
  gates: readonly NebulaAuditGateV624[];
  counts: Readonly<{
    rows: number;
    captured: number;
    historicalVerified: number;
    rightsUncleared: number;
    networkAttempts: number;
    ledgerAttempts: number;
    blockingFindings: number;
  }>;
  retention: readonly NebulaRetentionEntryV624[];
  retainedBytes: number;
  scope: "ledger-consistency-no-disk-or-network-verification";
  cleanupMode: "report-only-no-deletion";
  runtimeAdmission: "candidate-only";
  scientificPayloadWriteback: false;
}>;

const SHA = /^[a-f0-9]{64}$/i;
const IMAGE = /^image\/(jpeg|jpg|png|webp)(?:;|$)/i;
const ROOT = "docs/release/v607/nebula-image-artifacts/r64/";

function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function validSource(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && parsed.hostname === "images-assets.nasa.gov"
      && !parsed.username && !parsed.password && !parsed.port && !parsed.hash;
  } catch {
    return false;
  }
}

function safeArtifactPath(value: string | null): boolean {
  return typeof value === "string"
    && value.startsWith(ROOT)
    && !value.includes("\\")
    && !value.split("/").some((part) => part === ".." || part === "." || !part)
    && !value.includes(":");
}

function linkedCapture(row: NebulaBatchRowV624): NebulaBatchAttemptV624 | undefined {
  const artifact = row.network.artifact;
  if (!artifact) return undefined;
  return row.network.attempts.find((attempt) =>
    attempt.requestExecuted === true
    && attempt.responseCaptured === 1
    && attempt.httpStatus === 200
    && !attempt.timeout
    && attempt.errorClass === null
    && attempt.rawArtifactPath === artifact.path
    && attempt.rawPageSha256 === artifact.sha256
    && attempt.responseBytes === artifact.bytes);
}

function auditAttempt(
  row: NebulaBatchRowV624,
  attempt: NebulaBatchAttemptV624,
  findings: NebulaAuditFindingV624[],
): void {
  const add = (code: string, detail: string) => findings.push({
    code, detail, severity: "blocking", candidateId: row.id, attempt: attempt.attempt,
  });
  const start = Date.parse(attempt.startedAt);
  const end = Date.parse(attempt.endedAt ?? "");
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    add("attempt-time-invalid", "Attempt start/end must be finite ordered timestamps.");
  }
  if (!positive(attempt.attempt) || !Number.isSafeInteger(attempt.retryCount) || attempt.retryCount < 0) {
    add("attempt-counter-invalid", "Attempt and retry counters must be nonnegative integers.");
  }
  if (attempt.requestUrl !== row.source.url || !validSource(attempt.requestUrl)) {
    add("request-source-mismatch", "Request must identify the allowed source for this candidate.");
  }
  if (!SHA.test(attempt.requestFingerprint)) {
    add("request-fingerprint-malformed", "Fingerprint shape is invalid; the offline disk replay recomputes its value.");
  }
  if (typeof attempt.requestExecuted !== "boolean") {
    add("execution-state-missing", "Network execution must be explicitly recorded.");
  }
  if (!attempt.requestExecuted && (attempt.responseCaptured !== 0 || attempt.httpStatus !== null)) {
    add("offline-response-claim", "An unexecuted attempt cannot claim an HTTP response.");
  }
  if (attempt.finalUrl !== null && !validSource(attempt.finalUrl)) {
    add("final-url-invalid", "Final URL is outside the HTTPS allowlist.");
  }
  if (attempt.redirectChain.some((url) => !validSource(url))) {
    add("redirect-invalid", "Every recorded redirect must stay inside the HTTPS allowlist.");
  }
  if (attempt.responseCaptured === 1) {
    if (attempt.httpStatus !== 200 || !IMAGE.test(attempt.contentType ?? "")) {
      add("captured-response-invalid", "A capture requires HTTP 200 with an image content type.");
    }
    if (attempt.timeout || attempt.errorClass !== null || !validSource(attempt.finalUrl)) {
      add("capture-error-conflict", "A captured attempt cannot be timed out or failed.");
    }
    if (!safeArtifactPath(attempt.rawArtifactPath) || !SHA.test(attempt.rawPageSha256 ?? "")) {
      add("attempt-artifact-invalid", "A captured attempt must link a safe artifact and SHA-256.");
    }
    if (!positive(attempt.responseBytes)) {
      add("attempt-bytes-invalid", "A captured attempt must record a positive byte count.");
    }
  } else if (attempt.rawArtifactPath || attempt.rawPageSha256 || attempt.responseBytes !== null) {
    add("uncaptured-payload-claim", "A failed attempt must not claim a captured artifact.");
  }
  if (attempt.timeout && attempt.errorClass !== "timeout") {
    add("timeout-class-conflict", "Timeout flag and error classification disagree.");
  }
}

function auditRow(row: NebulaBatchRowV624): NebulaAuditFindingV624[] {
  const findings: NebulaAuditFindingV624[] = [];
  const add = (code: string, detail: string, severity: "blocking" | "pending" = "blocking") =>
    findings.push({ code, detail, severity, candidateId: row.id, attempt: null });
  if (!validSource(row.source.url)) add("source-invalid", "Source is outside the HTTPS allowlist.");
  if (!row.source.credit.trim() || !row.source.declaredLicense.trim() || !row.source.licenseUrl.trim()) {
    add("rights-metadata-missing", "Source credit, declared license and policy URL are required.");
  }
  if (row.rights.status !== "cleared") {
    add("rights-uncleared", "Actual item rights approval is still absent.", "pending");
  }
  if (row.runtimeAdmission !== "candidate-only"
    || row.measurementAdmission !== "not-admitted"
    || row.scientificPayloadWriteback !== false) {
    add("admission-boundary-open", "Candidate, measurement and payload boundaries must stay closed.");
  }
  const attemptNumbers = new Set<number>();
  for (const attempt of row.network.attempts) {
    if (attemptNumbers.has(attempt.attempt)) add("attempt-duplicate", "Duplicate attempt number.");
    attemptNumbers.add(attempt.attempt);
    auditAttempt(row, attempt, findings);
  }
  const artifact = row.network.artifact;
  if (row.network.responseCaptured === 1) {
    if (!artifact || !linkedCapture(row)) {
      add("capture-link-missing", "Selected artifact must link an executed successful attempt.");
    }
    if (artifact) {
      if (!safeArtifactPath(artifact.path) || !SHA.test(artifact.sha256)) {
        add("artifact-metadata-invalid", "Selected artifact path or hash is malformed.");
      }
      if (![artifact.bytes, artifact.width, artifact.height].every(positive)) {
        add("artifact-size-invalid", "Byte length and decoded dimensions must be positive integers.");
      }
      if (!["jpg", "jpeg", "png", "webp"].includes(artifact.format)) {
        add("artifact-format-invalid", "Decoded image format is unsupported.");
      }
    }
  } else {
    if (artifact) add("artifact-without-capture", "An uncaptured row cannot select an artifact.");
    add("capture-pending", "A current raw response has not been captured.", "pending");
  }
  if (row.historical.status !== "verified") {
    add("history-unverified", "Historical bytes have not closed their comparison.", "pending");
  }
  return findings;
}

export function planNebulaArtifactRetentionV624(
  rows: readonly NebulaBatchRowV624[],
): readonly NebulaRetentionEntryV624[] {
  const entries = new Map<string, {
    path: string;
    sha256: string | null;
    bytes: number | null;
    references: string[];
    action: "retain" | "quarantine";
    reason: string;
  }>();
  for (const row of rows) {
    for (const attempt of row.network.attempts) {
      if (!attempt.rawArtifactPath) continue;
      const id = row.id + ":attempt-" + attempt.attempt;
      const verifiedLink = attempt.requestExecuted === true
        && attempt.responseCaptured === 1
        && attempt.httpStatus === 200
        && !attempt.timeout
        && attempt.errorClass === null
        && SHA.test(attempt.rawPageSha256 ?? "")
        && safeArtifactPath(attempt.rawArtifactPath)
        && positive(attempt.responseBytes);
      const prior = entries.get(attempt.rawArtifactPath);
      if (prior) {
        prior.references.push(id);
        if (!verifiedLink || prior.sha256 !== attempt.rawPageSha256 || prior.bytes !== attempt.responseBytes) {
          prior.action = "quarantine";
          prior.reason = "Conflicting ledger references; retain bytes for inspection.";
        }
      } else {
        entries.set(attempt.rawArtifactPath, {
          path: attempt.rawArtifactPath,
          sha256: attempt.rawPageSha256,
          bytes: attempt.responseBytes,
          references: [id],
          action: verifiedLink ? "retain" : "quarantine",
          reason: verifiedLink
            ? "Evidence retention only; disk replay and rights gates remain separate."
            : "Unverified artifact reference; retain bytes for inspection.",
        });
      }
    }
    const selected = row.network.artifact;
    if (selected && !entries.has(selected.path)) {
      entries.set(selected.path, {
        ...selected,
        references: [row.id + ":unlinked-selected-artifact"],
        action: "quarantine",
        reason: "No attempt links the selected artifact; do not discard evidence.",
      });
    }
  }
  return [...entries.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export function auditNebulaBatchV624(pack: NebulaBatchPackV624): NebulaBatchAuditV624 {
  const findings = pack.rows.flatMap(auditRow);
  const batchIssue = (code: string, detail: string) => findings.push({
    code, detail, severity: "blocking", candidateId: null, attempt: null,
  });
  if (!pack.boundary.candidateOnly || !pack.boundary.hold
    || !pack.boundary.notAdmitted || pack.boundary.scientificPayloadWriteback !== false) {
    batchIssue("batch-boundary-open", "Batch boundaries do not match candidate-only hold policy.");
  }
  if (!pack.rows.length) batchIssue("empty-batch", "An empty batch cannot pass coverage.");
  if (new Set(pack.rows.map((row) => row.id)).size !== pack.rows.length) {
    batchIssue("duplicate-candidate", "Candidate IDs must be unique.");
  }
  const attempts = pack.rows.flatMap((row) => row.network.attempts);
  const captured = pack.rows.filter((row) => row.network.responseCaptured === 1 && linkedCapture(row)).length;
  const historicalVerified = pack.rows.filter((row) => row.historical.status === "verified").length;
  const rightsUncleared = pack.rows.filter((row) => row.rights.status !== "cleared").length;
  const networkAttempts = attempts.filter((attempt) => attempt.requestExecuted === true).length;
  const expectedCounts: Record<string, number> = {
    total: pack.rows.length,
    captured,
    historicalVerified,
    rightsPending: rightsUncleared,
    networkAttempted: networkAttempts,
    ledgerAttempts: attempts.length,
  };
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (pack.counts[key] !== value) batchIssue("count-mismatch-" + key, "Declared and recomputed count differ.");
  }
  const blockingFindings = findings.filter((entry) => entry.severity === "blocking").length;
  const retention = planNebulaArtifactRetentionV624(pack.rows);
  const gate = (id: string, observed: number, required: number): NebulaAuditGateV624 => ({
    id,
    observed,
    required,
    status: blockingFindings ? "fail" : observed === required && pack.rows.length > 0 ? "pass" : "hold",
  });
  return {
    schema: "mainline-a-nebula-batch-audit-v624",
    batchId: pack.batchId,
    createdAt: pack.createdAt,
    findings,
    gates: [
      gate("ledger-integrity", blockingFindings, 0),
      gate("raw-capture-linkage", captured, pack.rows.length),
      gate("historical-comparison", historicalVerified, pack.rows.length),
      gate("rights-clearance", pack.rows.length - rightsUncleared, pack.rows.length),
    ],
    counts: {
      rows: pack.rows.length,
      captured,
      historicalVerified,
      rightsUncleared,
      networkAttempts,
      ledgerAttempts: attempts.length,
      blockingFindings,
    },
    retention,
    retainedBytes: retention.reduce((sum, entry) => sum + (entry.bytes ?? 0), 0),
    scope: "ledger-consistency-no-disk-or-network-verification",
    cleanupMode: "report-only-no-deletion",
    runtimeAdmission: "candidate-only",
    scientificPayloadWriteback: false,
  };
}

export function exportNebulaAuditV624(report: NebulaBatchAuditV624): string {
  return JSON.stringify(report, null, 2) + "\n";
}
