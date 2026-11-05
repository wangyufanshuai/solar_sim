import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BROWSER_EVIDENCE_SESSION_AUDIT_SCHEMA_V639,
  auditBrowserEvidenceSessionV639,
  auditSummaryV639,
  parseBrowserEvidenceSessionAuditArgumentsV639,
} from "./audit-mainline-a-browser-evidence-session-v639";
import { createBrowserEvidenceSessionV639, encodeBrowserEvidenceSessionV639 } from "../app/lib/mainlineABrowserEvidenceSessionV639";

const build = {
  status: "passed", exitCode: 0, sourceStable: true,
  runtimeBuildId: "mainline-a-ac4d35393e9637c0", branch: "codex/solar-sim-mainline-a", head: "1".repeat(40),
};
const viewport = { width: 390, height: 844, devicePixelRatio: 2, device: "mobile-simulated" as const };

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "mainline-a-v639-audit-"));
  const session = createBrowserEvidenceSessionV639({ build: { buildId: build.runtimeBuildId, branch: build.branch, head: build.head }, viewport, at: "2026-09-28T15:00:00.000Z" });
  await writeFile(path.join(root, "session.json"), encodeBrowserEvidenceSessionV639(session));
  await writeFile(path.join(root, "build.json"), JSON.stringify(build));
  return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}

describe("offline v639 browser evidence session audit", () => {
  it("parses the bounded command contract and optional completeness gate", () => {
    expect(parseBrowserEvidenceSessionAuditArgumentsV639(["--input", "session.json", "--build-receipt", "build.json", "--output", "out.json"], "C:/work")).toEqual({ root: "C:/work", input: "session.json", buildReceipt: "build.json", output: "out.json", expectedSha256: undefined, requireComplete: false });
    expect(parseBrowserEvidenceSessionAuditArgumentsV639(["--input", "session.json", "--build-receipt", "build.json", "--output", "out.json", "--require-complete"], "C:/work").requireComplete).toBe(true);
    expect(() => parseBrowserEvidenceSessionAuditArgumentsV639(["--input", "session.json"], "C:/work")).toThrow("session-audit:required:--build-receipt");
    expect(() => parseBrowserEvidenceSessionAuditArgumentsV639(["--input", "../session.json", "--build-receipt", "build.json", "--output", "out.json"], "C:/work")).not.toThrow();
  });

  it("replays an empty current-build session as partial-local and writes an independently hashed receipt", async () => {
    const value = await fixture();
    try {
      const result = await auditBrowserEvidenceSessionV639({ root: value.root, input: "session.json", buildReceipt: "build.json", output: "reports/session-audit.json" });
      expect(result.report.schema).toBe(BROWSER_EVIDENCE_SESSION_AUDIT_SCHEMA_V639);
      expect(result.report.status).toBe("partial-local");
      expect(result.report.summary.verified).toBe(0);
      expect(result.report.batch.verified).toBe(0);
      expect(result.report.limits.browserAuthenticity).toBe(false);
      expect(result.report.boundary.scientificPayloadWriteback).toBe(false);
      expect(result.report.negativeChecks.every((check) => check.status === "passed")).toBe(true);
      expect(result.receipt.bytes).toBe((await readFile(path.join(value.root, "reports/session-audit.json"))).byteLength);
      expect(auditSummaryV639(result.report)).toContain("partial-local");
    } finally { await value.cleanup(); }
  });

  it("fails when the input digest does not match", async () => {
    const value = await fixture();
    try {
      await expect(auditBrowserEvidenceSessionV639({ root: value.root, input: "session.json", buildReceipt: "build.json", output: "out.json", expectedSha256: "0".repeat(64) })).rejects.toThrow("session-audit:input-sha-mismatch");
    } finally { await value.cleanup(); }
  });

  it("keeps traversal and oversized output fail-closed", async () => {
    const value = await fixture();
    try {
      await expect(auditBrowserEvidenceSessionV639({ root: value.root, input: "../session.json", buildReceipt: "build.json", output: "out.json" })).rejects.toThrow(/session-audit:(path|file-size)/);
      await expect(auditBrowserEvidenceSessionV639({ root: value.root, input: "session.json", buildReceipt: "build.json", output: "../out.json" })).rejects.toThrow("session-audit:output-boundary");
    } finally { await value.cleanup(); }
  });

  it("rejects a build receipt that is not a passed, source-stable production build", async () => {
    const value = await fixture();
    try {
      await writeFile(path.join(value.root, "bad-build.json"), JSON.stringify({ ...build, status: "failed" }));
      await expect(auditBrowserEvidenceSessionV639({ root: value.root, input: "session.json", buildReceipt: "bad-build.json", output: "out.json" })).rejects.toThrow("session-audit:build-not-passed");
    } finally { await value.cleanup(); }
  });

  it("does not turn a partial ledger into a complete audit through the strict flag", async () => {
    const value = await fixture();
    try {
      await expect(auditBrowserEvidenceSessionV639({ root: value.root, input: "session.json", buildReceipt: "build.json", output: "out.json", requireComplete: true })).rejects.toThrow("session-audit:complete-required:partial-local");
    } finally { await value.cleanup(); }
  });
});
