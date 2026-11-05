import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMainlineABetaStellarRosterEvidenceV642,
  canonicalEvidenceValueV642,
  evidenceRecordFingerprintInputV642,
  type MainlineABetaStellarEvidencePackV642,
} from "../app/lib/mainlineABetaStellarRosterEvidenceV642";
import { replayMainlineABetaStellarRosterEvidenceV642 } from "../app/lib/mainlineABetaStellarRosterEvidenceReplayV642";
import { validateBrowserReceiptV642 } from "./collect-mainline-a-b3-evidence-v642";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SESSION_PATH = "docs/release/v607/mainline-a-b3-evidence-session-v642-20260929-final-002.json";

type SessionReceipt = Readonly<{
  schema: string;
  status: string;
  plan: { path: string; sha256: string };
  build: { path: string; sha256: string; buildId: string; runtimeBuildId: string; sourceStable: boolean };
  http: { path: string; sha256: string; status: string };
  browser: { path: string; sha256: string; desktop: boolean; mobileViewport: boolean; physicalMobile: boolean };
  replay: { total: number; required: number; observed: number; openGateIds: readonly string[]; reportable: boolean };
  session: MainlineABetaStellarEvidencePackV642;
  evidenceClasses: Record<string, string>;
  limits: readonly string[];
}>;

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha256(relativePath: string): string {
  return sha256(fs.readFileSync(path.join(ROOT, relativePath)));
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalEvidenceValueV642(value));
}

export function verifyB3SessionV642(receipt: SessionReceipt): readonly string[] {
  const issues: string[] = [];
  if (receipt.schema !== "mainline-a-b3-evidence-session-receipt-v642") issues.push("session-schema");
  if (receipt.status !== "local-evidence-observed-external-gates-held") issues.push("session-status");
  if (receipt.plan.path !== "app/data/mainlineABetaStellarRosterEvidenceV642.generated.json") issues.push("plan-path");
  if (receipt.build.path !== "docs/release/v607/mainline-a-r66-build-b3v642-20260929-003.json") issues.push("build-path");
  if (receipt.http.path !== "docs/release/v607/mainline-a-b3-http-v642-20260929-final-002.json") issues.push("http-path");
  if (receipt.browser.path !== "docs/release/v607/mainline-a-b3-browser-v642-20260929-final.json") issues.push("browser-path");
  for (const [name, ref] of [["plan", receipt.plan], ["build", receipt.build], ["http", receipt.http], ["browser", receipt.browser]] as const) {
    if (!fs.existsSync(path.join(ROOT, ref.path))) issues.push(`${name}-missing`);
    else if (fileSha256(ref.path) !== ref.sha256) issues.push(`${name}-sha256`);
  }
  if (issues.length > 0) return [...new Set(issues)];
  const build = readJson<Parameters<typeof validateBrowserReceiptV642>[1] & { status: string; sourceStable: boolean }>(receipt.build.path);
  const http = readJson<{ status: string; checks: readonly { path: string; status: number | null; sha256: string | null; bytes: number | null; error: string | null }[]; issues: readonly string[] }>(receipt.http.path);
  const browser = readJson<Parameters<typeof validateBrowserReceiptV642>[0]>(receipt.browser.path);
  if (build.status !== "passed" || !build.sourceStable || !receipt.build.sourceStable) issues.push("build-not-stable");
  if (build.buildId !== receipt.build.buildId || build.runtimeBuildId !== receipt.build.runtimeBuildId) issues.push("build-identity");
  if (http.status !== "passed" || receipt.http.status !== "passed" || http.issues.length > 0 || http.checks.length !== 3) issues.push("http-status");
  if (http.checks.some((check) => check.status !== 200 || check.sha256 === null || check.bytes === null || check.error !== null)) issues.push("http-check");
  const chunk = http.checks.find((check) => check.path.startsWith("/_next/static/chunks/"));
  if (!chunk) issues.push("http-chunk-missing");
  else {
    const localChunkPath = path.join(ROOT, build.distDir, "static/chunks", path.basename(chunk.path));
    if (!fs.existsSync(localChunkPath) || sha256(fs.readFileSync(localChunkPath)) !== chunk.sha256) issues.push("http-chunk-sha256");
  }
  issues.push(...validateBrowserReceiptV642(browser, build).map((issue) => `browser:${issue}`));
  if (!receipt.browser.desktop || !receipt.browser.mobileViewport || receipt.browser.physicalMobile) issues.push("browser-scope");
  try { assertMainlineABetaStellarRosterEvidenceV642(receipt.session); } catch { issues.push("session-validation"); }
  const unsigned = Object.fromEntries(Object.entries(receipt.session).filter(([key]) => key !== "fingerprint"));
  if (receipt.session.fingerprint !== sha256(canonicalJson(unsigned))) issues.push("session-fingerprint");
  for (const record of receipt.session.records) {
    const recomputed = sha256(canonicalJson(evidenceRecordFingerprintInputV642(record)));
    if (record.observationFingerprint !== null && record.observationFingerprint !== recomputed) issues.push(`record-fingerprint:${record.id}`);
    if (record.evidenceClass !== "external-source" && record.buildId !== build.buildId) issues.push(`record-build:${record.id}`);
    if (record.evidenceClass === "external-source" && record.state !== "blocked") issues.push(`external-promotion:${record.id}`);
  }
  if (receipt.session.build.buildId !== build.buildId || receipt.session.build.distDir !== build.distDir) issues.push("session-build");
  if (receipt.session.roster.componentConfirmed !== 0) issues.push("component-promotion");
  if (receipt.session.boundary.scientificPayloadWriteback !== false || receipt.session.boundary.runtimeWrites !== false) issues.push("writeback");
  const replay = replayMainlineABetaStellarRosterEvidenceV642(receipt.session);
  if (receipt.replay.total !== replay.total || receipt.replay.required !== replay.required || receipt.replay.observed !== replay.observed) issues.push("replay-counts");
  if (JSON.stringify(receipt.replay.openGateIds) !== JSON.stringify(replay.openGateIds)) issues.push("replay-gates");
  if (receipt.replay.reportable !== false || replay.reportable !== false) issues.push("reportable-claim");
  if (replay.openGateIds.includes("performance") === false || replay.openGateIds.includes("external-source") === false) issues.push("missing-open-gates");
  if (receipt.evidenceClasses.performance !== "not-run-long-run" || receipt.evidenceClasses.externalSource !== "held") issues.push("class-labels");
  if (receipt.limits.length < 3) issues.push("limits-missing");
  return [...new Set(issues)];
}

export function sessionNegativeCasesV642(receipt: SessionReceipt) {
  const mutations = [
    { name: "build-id", value: { ...receipt, build: { ...receipt.build, buildId: "wrong-build-id" } }, expected: "build-identity" },
    { name: "http-sha", value: { ...receipt, http: { ...receipt.http, sha256: "0".repeat(64) } }, expected: "http-sha256" },
    { name: "component", value: { ...receipt, session: { ...receipt.session, roster: { ...receipt.session.roster, componentConfirmed: 1 } } }, expected: "session-validation" },
    { name: "reportable", value: { ...receipt, replay: { ...receipt.replay, reportable: true } }, expected: "reportable-claim" },
  ];
  return mutations.map(({ name, value, expected }) => {
    const issues = verifyB3SessionV642(value as SessionReceipt);
    return { name, rejected: issues.includes(expected), issues };
  });
}

export function runVerificationV642() {
  const receipt = readJson<SessionReceipt>(SESSION_PATH);
  const issues = verifyB3SessionV642(receipt);
  const negatives = sessionNegativeCasesV642(receipt);
  if (issues.length > 0 || negatives.some((entry) => !entry.rejected)) {
    throw new Error(`V642 session verification failed: ${issues.join(",")}; negative failures: ${negatives.filter((entry) => !entry.rejected).map((entry) => entry.name).join(",")}`);
  }
  return {
    schema: "mainline-a-b3-evidence-session-verification-v642",
    verifiedAt: new Date().toISOString(),
    status: "verified-local-evidence-external-held",
    input: { path: SESSION_PATH, sha256: fileSha256(SESSION_PATH) },
    counts: { records: receipt.session.records.length, observed: receipt.replay.observed, required: receipt.replay.required, negativePassed: negatives.length },
    negatives,
    openGates: receipt.replay.openGateIds,
    boundary: receipt.session.boundary,
    claims: receipt.session.claims,
  } as const;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = runVerificationV642();
    const output = "docs/release/v607/mainline-a-b3-evidence-session-verification-v642-20260929-final-002.json";
    fs.writeFileSync(path.join(ROOT, output), `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    console.log(JSON.stringify({ status: report.status, records: report.counts.records, negativePassed: report.counts.negativePassed, openGates: report.openGates }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
