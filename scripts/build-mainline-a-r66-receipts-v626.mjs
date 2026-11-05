import { access, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd());
const release = path.join(root, "docs/release/v607");
const codeReceiptPath = path.join(release, process.env.MAINLINE_A_R66_CODE_RECEIPT ?? "mainline-a-r66-code-change-final.json");
const roundReceiptPath = path.join(release, process.env.MAINLINE_A_R66_ROUND_RECEIPT ?? "mainline-a-art-round-66-20260920-final.json");
const checkOnly = process.argv.includes("--check");
const productionFiles = [
  ["app/lib/mainlineAReleaseAlignmentV626.ts", "typed alignment, source/rights/runtime closures, gates, rollback and package contract"],
  ["scripts/audit-mainline-a-release-alignment-v626.mjs", "read-only root mirror and next-web digest audit"],
  ["scripts/build-mainline-a-release-package-v626.mjs", "candidate release package, rollback, gate checklist and manifest"],
  ["scripts/collect-mainline-a-r66-http-evidence-v626.mjs", "R66 local production HTTP/build binding collector"],
];
const integrationFiles = [
  "package.json",
  "scripts/build-mainline-a-preserved.mjs",
  "app/components/AtlasAppShell.tsx",
  "app/components/PostV593StellarRosterPanel.tsx",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function effectiveLines(text) {
  return text.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("//") && !trimmed.startsWith("/*") && !trimmed.startsWith("*") && !trimmed.startsWith("#");
  }).length;
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function fileRecord(relativePath, role) {
  const body = await readFile(path.join(root, relativePath));
  return { path: relativePath.replaceAll("\\", "/"), effectiveLines: effectiveLines(body.toString("utf8")), bytes: body.byteLength, sha256: sha256(body), role };
}

async function main() {
  const records = [];
  for (const [relativePath, role] of productionFiles) records.push(await fileRecord(relativePath, role));
  const effectiveProductionLines = records.reduce((sum, record) => sum + record.effectiveLines, 0);
  const build = await readJson("docs/release/v607/mainline-a-r66-build-20260920-002.json");
  const alignment = await readJson("docs/release/v607/mainline-a-r66-alignment-v626.json");
  const http = await readJson("docs/release/v607/mainline-a-r66-http-20260920-002.json");
  const browser = await readJson("docs/release/v607/mainline-a-r66-browser-20260920-002.json");
  const packagePointer = await readJson("docs/release/v607/mainline-a-r66-release-package-v626-20260920-004.json");
  const code = {
    schema: "mainline-a-code-change-receipt-v626",
    round: "R66",
    generatedAt: new Date().toISOString(),
    scope: "next-web only; root app inputs were read-only",
    baseline: "156ec7790a99be2f89f5d8f44831cb118c9437e1",
    boundaryBaseline: "af61a2f",
    branch: build.branch,
    head: build.head,
    effectiveProductionLines,
    minimumRequired: 1000,
    minimumMet: effectiveProductionLines >= 1000,
    testsExcluded: true,
    countMethod: "Nonblank, noncomment production lines in four new R66 typed/CLI HTTP/package files; tests, generated receipts, screenshots and documentation excluded.",
    files: records,
    integrationFiles,
    excluded: ["tests", "generated JSON", "screenshots", "receipts", "docs", "standard build logs", "root app source files"],
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, parentGitMutation: false, physicsKernelsUnmodified: true },
    validation: { alignment: alignment.status, package: packagePointer.status, preservedProductionBuild: build.status, http: http.pageStatus === 200 && http.healthStatus === 200, browser: browser.consoleErrors === 0 && browser.consoleWarnings === 0, physicalMobile: "not-run", longRun: "not-run" },
  };
  const round = {
    schema: "mainline-a-art-round-receipt-v626",
    round: "R66",
    generatedAt: code.generatedAt,
    objective: "root/next-web read-only alignment and final candidate release package",
    codeChangeReceipt: "docs/release/v607/mainline-a-r66-code-change.json",
    build: { status: build.status, receipt: "docs/release/v607/mainline-a-r66-build-20260920-002.json", buildId: build.buildId, runtimeBuildId: build.runtimeBuildId, sourceStable: build.sourceStable, profile: build.profile },
    evidence: {
      static: { status: alignment.gates.find((gate) => gate.id === "static")?.state ?? "blocked", receipt: "docs/release/v607/mainline-a-r66-alignment-v626.json", claim: "alignment and contract evidence only" },
      http: { status: alignment.gates.find((gate) => gate.id === "http")?.state ?? "blocked", receipt: "docs/release/v607/mainline-a-r66-http-20260920-002.json", pageStatus: http.pageStatus, healthStatus: http.healthStatus, claim: "local production HTTP/build binding" },
      visual: { status: "passed", screenshots: browser.screenshots, claim: "visual evidence only" },
      browser: { status: "passed", receipt: "docs/release/v607/mainline-a-r66-browser-20260920-002.json", desktopViewport: browser.desktop.viewport, mobileViewport: browser.mobile.viewport, consoleErrors: browser.consoleErrors, consoleWarnings: browser.consoleWarnings, claim: "Codex in-app browser local observation" },
      performance: { status: "blocked", receipt: "docs/release/v607/mainline-a-r65-performance-v625.json", blockers: ["long-run-observation-required", "physical-device-not-run"], claim: "R65 four-second browser samples retained; no production or real-user claim" },
      externalSource: { status: alignment.sourceClosure.status, receipts: alignment.receipts["external-source"], claim: "historical/live source ledger remains candidate-only and rights pending" },
      releasePackage: { status: packagePointer.status, pointer: "docs/release/v607/mainline-a-r66-release-package-v626-20260920-004.json", directory: packagePointer.packageDirectory, claim: "candidate release metadata and rollback contract" },
    },
    alignment: { receipt: "docs/release/v607/mainline-a-r66-alignment-v626.json", status: alignment.status, rootMirror: alignment.workspaceBoundary.rootMirror, rootReadOnly: true, packageIdentityMatch: alignment.comparison.packageIdentityMatch, sourceIdentityMatch: alignment.comparison.sourceIdentityMatch, manifestParity: alignment.comparison.manifestParity, blockers: alignment.blockers },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, parentGitMutation: false, physicsKernelsUnmodified: true },
    openGates: [...alignment.blockers, "physical mobile device", "30-minute soak", "12 canonical signoffs", "Beta 24 nebula rights and source closure", "root/next-web unified identity and manifest parity"],
    claimsClosed: { publicDeployment: false, legalClearance: false, scientificValidity: false, productionPerformance: false, realUserValidation: false },
    notes: ["Root app E:\\86137\\myai\\solar_sim\\web was read without parent Git operations.", "The candidate package is intentionally blocked and reversible; no source asset or scientific payload was promoted."],
  };
  if (!checkOnly) {
    if (await exists(codeReceiptPath) || await exists(roundReceiptPath)) throw new Error("R66 receipts already exist; refusing overwrite");
    await writeFile(codeReceiptPath, `${JSON.stringify(code, null, 2)}\n`, "utf8");
    await writeFile(roundReceiptPath, `${JSON.stringify(round, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({ codeChange: code, round }, null, 2));
  if (checkOnly && (!code.minimumMet || round.alignment.status !== "blocked")) process.exitCode = 1;
}

await main();
