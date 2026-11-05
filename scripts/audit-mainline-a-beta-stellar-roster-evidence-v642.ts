import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMainlineABetaStellarRosterEvidenceV642,
  canonicalEvidenceValueV642,
  evidenceNegativeMutationV642,
  validateMainlineABetaStellarRosterEvidenceV642,
  type MainlineABetaStellarEvidencePackV642,
} from "../app/lib/mainlineABetaStellarRosterEvidenceV642";
import {
  allRequiredObservedV642,
  evidenceReplaySummaryV642,
  hasUnsafeClaimV642,
  replayMainlineABetaStellarRosterEvidenceV642,
} from "../app/lib/mainlineABetaStellarRosterEvidenceReplayV642";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACK_PATH = path.join(ROOT, "app/data/mainlineABetaStellarRosterEvidenceV642.generated.json");
const RECEIPT_PATH = path.join(ROOT, "docs/release/v607/mainline-a-b3-stellar-evidence-audit-v642.json");

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha256(absolutePath: string): string {
  return sha256(fs.readFileSync(absolutePath));
}

function assertRejected(name: string, value: unknown, expected: string): { name: string; rejected: boolean; firstError: string } {
  const errors = validateMainlineABetaStellarRosterEvidenceV642(value);
  if (errors.length === 0) throw new Error(`${name}: mutation unexpectedly accepted`);
  if (!errors.some((error) => error.includes(expected))) throw new Error(`${name}: missing expected ${expected}; got ${errors.join(",")}`);
  return { name, rejected: true, firstError: errors[0] };
}

function auditPack(pack: MainlineABetaStellarEvidencePackV642) {
  assertMainlineABetaStellarRosterEvidenceV642(pack);
  const unsigned = Object.fromEntries(Object.entries(pack).filter(([key]) => key !== "fingerprint"));
  const recomputedFingerprint = sha256(JSON.stringify(canonicalEvidenceValueV642(unsigned)));
  if (pack.fingerprint !== recomputedFingerprint) throw new Error("V642 pack fingerprint mismatch");
  const rosterSha256 = fileSha256(path.join(ROOT, pack.roster.path));
  if (pack.roster.sha256 !== rosterSha256) throw new Error("V642 roster SHA-256 mismatch");
  const replay = replayMainlineABetaStellarRosterEvidenceV642(pack);
  const summary = evidenceReplaySummaryV642(pack);
  const negatives = [
    assertRejected("wrong-build", evidenceNegativeMutationV642(pack, "wrong-build"), "buildId"),
    assertRejected("visual-claim", evidenceNegativeMutationV642(pack, "visual-claim"), "unverified-claim"),
    assertRejected("external-pass", evidenceNegativeMutationV642(pack, "external-pass"), "external-pass-forbidden"),
    assertRejected("missing-record", evidenceNegativeMutationV642(pack, "missing-record"), "record-count-invalid"),
  ];
  if (pack.boundary.scientificPayloadWriteback !== false) throw new Error("writeback boundary opened");
  if (pack.claims.browserAcceptance || pack.claims.productionPerformance || pack.claims.copyrightApproval) throw new Error("claim boundary opened");
  if (allRequiredObservedV642(pack)) throw new Error("plan-only pack unexpectedly observed all required records");
  if (hasUnsafeClaimV642(pack)) throw new Error("plan-only pack contains unsafe claims");
  return {
    schema: "mainline-a-b3-stellar-evidence-audit-v642",
    generatedAt: "2026-09-29T00:00:00.000Z",
    status: pack.build.buildId ? "verified-build-bound-awaiting-observations" : "verified-plan-only",
    input: {
      path: "app/data/mainlineABetaStellarRosterEvidenceV642.generated.json",
      sha256: fileSha256(PACK_PATH),
      fingerprint: pack.fingerprint,
      recomputedFingerprint,
      rosterSha256,
    },
    counts: {
      records: pack.records.length,
      required: summary.required,
      observed: summary.observed,
      blocked: summary.blocked,
      pending: summary.pending,
      openGates: replay.openGateIds.length,
    },
    validation: {
      issueCount: 0,
      negativeCases: negatives,
      negativePassed: negatives.length,
    },
    gates: replay.gates,
    boundary: pack.boundary,
    claims: pack.claims,
    limits: [
      "The audit verifies schema, binding rules and fail-closed negatives only.",
      "No static plan row is treated as a browser, visual, performance, scientific or rights result.",
      "The four candidate component identities remain unresolved and the evidence pack remains non-reportable.",
    ],
  } as const;
}

function writeJson(value: unknown): void {
  fs.mkdirSync(path.dirname(RECEIPT_PATH), { recursive: true });
  fs.writeFileSync(RECEIPT_PATH, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readReceipt(): { input?: { sha256?: string }; status?: string } {
  if (!fs.existsSync(RECEIPT_PATH)) throw new Error("V642 audit receipt is missing");
  return JSON.parse(fs.readFileSync(RECEIPT_PATH, "utf8")) as { input?: { sha256?: string }; status?: string };
}

export function runAuditV642(check = false) {
  const pack = JSON.parse(fs.readFileSync(PACK_PATH, "utf8")) as MainlineABetaStellarEvidencePackV642;
  const audit = auditPack(pack);
  if (check) {
    const existing = readReceipt();
    if (existing.input?.sha256 !== audit.input.sha256) throw new Error("V642 audit receipt input hash is stale");
    const expectedStatus = pack.build.buildId ? "verified-build-bound-awaiting-observations" : "verified-plan-only";
    if (existing.status !== expectedStatus) throw new Error("V642 audit receipt status is unexpected");
    return audit;
  }
  writeJson(audit);
  return audit;
}

function main(): void {
  const check = process.argv.includes("--check");
  const audit = runAuditV642(check);
  console.log(JSON.stringify({
    schema: audit.schema,
    check,
    status: audit.status,
    records: audit.counts.records,
    negativePassed: audit.validation.negativePassed,
    openGates: audit.counts.openGates,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
