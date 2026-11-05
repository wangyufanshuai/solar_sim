import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createBrowserEvidenceSessionV639, encodeBrowserEvidenceSessionV639 } from "../app/lib/mainlineABrowserEvidenceSessionV639";
import { BROWSER_EVIDENCE_RECOVERY_MAX_INPUT_BYTES_V640 } from "../app/lib/mainlineABrowserEvidenceRecoveryV640";
import { checkBrowserEvidenceRecoveryV640, runBrowserEvidenceRecoveryV640 } from "./recover-mainline-a-browser-evidence-session-v640";

const build = {
  runtimeBuildId: "mainline-a-ac4d35393e9637c0",
  branch: "codex/solar-sim-mainline-a",
  head: "1".repeat(40),
  status: "passed",
  exitCode: 0,
  sourceStable: true,
};
const viewport = { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" as const };
const at = "2026-09-28T14:00:00.000Z";

async function fixtureRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "mainline-a-v640-"));
  await writeFile(path.join(root, "build.json"), `${JSON.stringify(build, null, 2)}\n`);
  const session = createBrowserEvidenceSessionV639({ build: { buildId: build.runtimeBuildId, branch: build.branch, head: build.head }, viewport, sessionId: "r65-session-abcdef12", at });
  await writeFile(path.join(root, "session-a.json"), encodeBrowserEvidenceSessionV639(session));
  await writeFile(path.join(root, "session-b.json"), encodeBrowserEvidenceSessionV639({ ...session, updatedAt: "2026-09-28T14:00:01.000Z" }));
  return root;
}

function options(root: string, output: string, inputs: string[] = ["session-a.json", "session-b.json"]): Parameters<typeof runBrowserEvidenceRecoveryV640>[0] {
  return { root, inputs, buildReceipt: "build.json", output, check: false, requireMerge: true, expectedSha256: undefined };
}

test("v640 CLI writes a merge report and checks its digest-bound output", async () => {
  const root = await fixtureRoot();
  try {
    const report = await runBrowserEvidenceRecoveryV640(options(root, "report.json"));
    assert.equal(report.action, "merge");
    const raw = await readFile(path.join(root, "report.json"), "utf8");
    assert.match(raw, /mainline-a-browser-evidence-recovery-v640/);
    const checked = await checkBrowserEvidenceRecoveryV640({ ...options(root, "report.json"), check: true });
    assert.equal(checked.action, "merge");
    const inferred = await checkBrowserEvidenceRecoveryV640({ ...options(root, "report.json", []), check: true });
    assert.equal(inferred.planDigest, report.planDigest);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("v640 CLI rejects a report bound to a different build", async () => {
  const root = await fixtureRoot();
  try {
    await runBrowserEvidenceRecoveryV640(options(root, "report.json"));
    await assert.rejects(() => checkBrowserEvidenceRecoveryV640({
      ...options(root, "report.json"),
      check: true,
      buildReceipt: "build.json",
      expectedSha256: "0".repeat(64),
    }), /report-sha-mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("v640 CLI stays fail-closed when all input sessions are malformed", async () => {
  const root = await fixtureRoot();
  try {
    await writeFile(path.join(root, "bad.json"), "{\"schema\":\"not-a-session\"}");
    await assert.rejects(() => runBrowserEvidenceRecoveryV640({ ...options(root, "bad-report.json", ["bad.json"]), requireMerge: true }), /merge-required:blocked/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("v640 CLI check replays the original session bytes and rejects a changed source", async () => {
  const root = await fixtureRoot();
  try {
    await runBrowserEvidenceRecoveryV640(options(root, "report.json"));
    const source = path.join(root, "session-b.json");
    const changed = JSON.parse(await readFile(source, "utf8"));
    changed.updatedAt = "2026-09-28T14:00:02.000Z";
    await writeFile(source, encodeBrowserEvidenceSessionV639(changed));
    await assert.rejects(() => checkBrowserEvidenceRecoveryV640({ ...options(root, "report.json"), check: true }), /report-replay-mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("v640 CLI check rejects forged report summaries even when no expected output digest is supplied", async () => {
  const root = await fixtureRoot();
  try {
    await runBrowserEvidenceRecoveryV640(options(root, "report.json"));
    const output = path.join(root, "report.json");
    const changed = JSON.parse(await readFile(output, "utf8"));
    changed.sources[0].bytes += 1;
    await writeFile(output, `${JSON.stringify(changed, null, 2)}\n`);
    await assert.rejects(() => checkBrowserEvidenceRecoveryV640({ ...options(root, "report.json"), check: true }), /report-replay-mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("v640 CLI rejects substituted input lists and a branch change in the build receipt", async () => {
  const root = await fixtureRoot();
  try {
    await runBrowserEvidenceRecoveryV640(options(root, "report.json"));
    await assert.rejects(() => checkBrowserEvidenceRecoveryV640({ ...options(root, "report.json", ["session-a.json"]), check: true }), /input-list-mismatch/);
    await writeFile(path.join(root, "build.json"), `${JSON.stringify({ ...build, branch: "codex/other-branch" })}\n`);
    await assert.rejects(() => checkBrowserEvidenceRecoveryV640({ ...options(root, "report.json"), check: true }), /report-build-mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("v640 CLI distinguishes an empty input from a missing input and refuses oversized bytes", async () => {
  const root = await fixtureRoot();
  try {
    await writeFile(path.join(root, "empty.json"), "");
    const blocked = await runBrowserEvidenceRecoveryV640({ ...options(root, "empty-report.json", ["empty.json", "missing.json"]), requireMerge: false });
    assert.deepEqual(blocked.sources.map((source) => source.status), ["empty", "missing"]);
    const checked = await checkBrowserEvidenceRecoveryV640({ ...options(root, "empty-report.json", []), check: true, requireMerge: false });
    assert.equal(checked.action, "blocked");
    await writeFile(path.join(root, "oversize.json"), Buffer.alloc(BROWSER_EVIDENCE_RECOVERY_MAX_INPUT_BYTES_V640 + 1));
    await assert.rejects(() => runBrowserEvidenceRecoveryV640({ ...options(root, "oversize-report.json", ["oversize.json"]), requireMerge: false }), /input-oversize:oversize.json/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
