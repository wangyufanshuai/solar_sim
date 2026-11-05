import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const DIST = resolve(ROOT, "dist/science");
const RAW_REPORT = resolve(DIST, "browser-fresh-v263-playwright.json");
const RESULT = resolve(DIST, "browser-fresh-v263-result.json");
const CONFIG = resolve(ROOT, "playwright.atlas.fresh.config.ts");
const HELPER = resolve(ROOT, "tests/atlas-browser/atlasBrowserTestV263.ts");
const BUILD_ID_PATH = resolve(ROOT, ".next-atlas-standalone-current/BUILD_ID");
const OUTER_LIMIT_MS = 45 * 60 * 1_000;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileSha256 = async (path) => sha256(await readFile(path));
const exists = async (path) => access(path).then(() => true, () => false);
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

function listenerPid3015() {
  if (process.platform !== "win32") return null;
  const command = "$row = netstat -ano | Select-String '127\\.0\\.0\\.1:3015\\s+.*LISTENING' | Select-Object -First 1; if ($row) { (($row.ToString() -split '\\s+') | Where-Object { $_ })[-1] }";
  const result = spawnSync("powershell", ["-NoProfile", "-Command", command], { encoding: "utf8", shell: false });
  const pid = Number(result.stdout.trim());
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function stopProcessTree(pid) {
  if (!(Number.isInteger(pid) && pid > 0)) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", shell: false });
  } else {
    try { process.kill(pid, "SIGTERM"); } catch { /* already gone */ }
  }
}

function collectSpecs(suites, output = []) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const latest = test.results?.at(-1) ?? null;
        const auditAttachment = latest?.attachments?.find((attachment) => attachment.name === "atlas-runtime-audit-v263");
        let runtimeAudit = null;
        if (auditAttachment?.body) {
          try { runtimeAudit = JSON.parse(Buffer.from(auditAttachment.body, "base64").toString("utf8")); } catch { runtimeAudit = null; }
        }
        output.push({
          id: spec.id,
          file: spec.file,
          line: spec.line,
          title: spec.title,
          project: test.projectName,
          expectedStatus: test.expectedStatus,
          status: test.status,
          annotations: test.annotations,
          durationMs: latest?.duration ?? 0,
          retry: latest?.retry ?? 0,
          errors: latest?.errors ?? [],
          attachments: (latest?.attachments ?? []).map(({ name, path, contentType }) => ({ name, path, contentType })),
          runtimeAudit,
        });
      }
    }
    collectSpecs(suite.suites, output);
  }
  return output;
}

await mkdir(DIST, { recursive: true });
if (await exists(RESULT)) throw new Error(`v263 fresh result already exists; automatic rerun is forbidden: ${RESULT}`);
if (await exists(RAW_REPORT)) throw new Error(`v263 raw report already exists; diagnose before any run: ${RAW_REPORT}`);
const preflightPid = listenerPid3015();
if (preflightPid !== null) throw new Error(`Port 3015 is already occupied by PID ${preflightPid}`);

const buildId = (await readFile(BUILD_ID_PATH, "utf8")).trim();
if (buildId !== "19OANocf2iaAVsGCShYAk") throw new Error(`Unexpected standalone build ID: ${buildId}`);
const startedAt = new Date();
const child = spawn(process.execPath, [
  resolve(ROOT, "node_modules/playwright/cli.js"),
  "test",
  "-c",
  "playwright.atlas.fresh.config.ts",
], {
  cwd: ROOT,
  env: { ...process.env, ATLAS_FRESH_V263_JSON_REPORT: RAW_REPORT },
  stdio: "inherit",
  shell: false,
});

let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  stopProcessTree(child.pid);
}, OUTER_LIMIT_MS);
const playwrightExitCode = await new Promise((resolveExit, reject) => {
  child.once("error", reject);
  child.once("close", (code) => resolveExit(code ?? 1));
});
clearTimeout(timeout);

let cleanupApplied = false;
const residualPid = listenerPid3015();
if (residualPid !== null) {
  stopProcessTree(residualPid);
  cleanupApplied = true;
}
const port3015Clear = listenerPid3015() === null;
const endedAt = new Date();
const rawReport = await readFile(RAW_REPORT, "utf8").then(JSON.parse, () => null);
const tests = collectSpecs(rawReport?.suites ?? []);
const runtimeTotals = tests.reduce((total, entry) => {
  total.consoleErrors += entry.runtimeAudit?.consoleErrors?.length ?? 0;
  total.pageErrors += entry.runtimeAudit?.pageErrors?.length ?? 0;
  total.missingResources += entry.runtimeAudit?.missingResources?.length ?? 0;
  total.rendererFaults += entry.runtimeAudit?.rendererFaults ?? 0;
  return total;
}, { consoleErrors: 0, pageErrors: 0, missingResources: 0, rendererFaults: 0 });
const expectedSkip = tests.filter((entry) => entry.status === "skipped");
const passed = playwrightExitCode === 0
  && !timedOut
  && rawReport?.stats?.expected === 21
  && rawReport?.stats?.skipped === 1
  && rawReport?.stats?.unexpected === 0
  && tests.length === 22
  && expectedSkip.length === 1
  && expectedSkip[0]?.project === "desktop-chrome-1440x900"
  && expectedSkip[0]?.title === "mobile gas giant close-up keeps a low-noise background"
  && Object.values(runtimeTotals).every((value) => value === 0)
  && port3015Clear;

const rawStat = await stat(RAW_REPORT);
const result = {
  version: "v263-browser-fresh-result-v1",
  status: passed ? "passed-corrected-fresh-matrix" : "blocked-fresh-matrix-not-reclosed",
  command: "npm run test:atlas:browser:fresh",
  startedAt: startedAt.toISOString(),
  endedAt: endedAt.toISOString(),
  elapsedMs: endedAt.getTime() - startedAt.getTime(),
  outerLimitMs: OUTER_LIMIT_MS,
  timedOut,
  playwrightExitCode,
  wrapperExitCode: passed ? 0 : (playwrightExitCode || 1),
  build: { profile: "standalone-full", buildId },
  harness: {
    config: "playwright.atlas.fresh.config.ts",
    configSha256: await fileSha256(CONFIG),
    helper: "tests/atlas-browser/atlasBrowserTestV263.ts",
    helperSha256: await fileSha256(HELPER),
    workers: 1,
    retries: 0,
    trace: "on-first-retry",
    projects: ["desktop-chrome-1440x900", "mobile-chrome-390x844"],
    files: 11,
    tests: 22,
  },
  summary: rawReport?.stats ?? null,
  runtimeTotals,
  expectedSkip: expectedSkip.map(({ project, file, title, annotations }) => ({ project, file, title, annotations })),
  tests,
  artifacts: [{
    path: "dist/science/browser-fresh-v263-playwright.json",
    bytes: rawStat.size,
    sha256: await fileSha256(RAW_REPORT),
  }],
  cleanup: { preflightPort3015Clear: true, cleanupApplied, port3015Clear },
  automaticRetryApplied: false,
  assertionOrThresholdRelaxationApplied: false,
  scienceMutation: "not-applied",
};
result.resultSha256 = sha256(JSON.stringify(canonicalize(result)));
await writeFile(RESULT, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  status: result.status,
  summary: result.summary,
  runtimeTotals,
  playwrightExitCode,
  wrapperExitCode: result.wrapperExitCode,
  result: RESULT,
  resultSha256: result.resultSha256,
}, null, 2));
process.exitCode = result.wrapperExitCode;
