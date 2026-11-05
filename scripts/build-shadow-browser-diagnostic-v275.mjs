import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const OUTPUT = "dist/science/v275-shadow-browser-diagnostic-evidence.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));

const matrices = [
  {
    id: "standalone",
    resultPath: "output/playwright/v275-shadow-standalone-result.json",
    configPath: "playwright.atlas.shadow-v275.config.ts",
    specPath: "tests/atlas-browser/atlas-shadow-v275.spec.ts",
    buildIdPath: ".next-atlas-standalone-current/BUILD_ID",
    buildProfilePath: ".next-atlas-standalone-current/atlas-build-profile.json",
    expectedProfile: "standalone-full",
    expectedProjects: ["desktop-v275-chrome-1440x900", "mobile-v275-chrome-390x844"],
  },
  {
    id: "lite",
    resultPath: "output/playwright/v275-shadow-lite-result.json",
    configPath: "playwright.atlas.shadow-lite-v275.config.ts",
    specPath: "tests/atlas-browser/atlas-shadow-lite-v275.spec.ts",
    buildIdPath: ".next-atlas-lite-current/BUILD_ID",
    buildProfilePath: ".next-atlas-lite-current/atlas-build-profile.json",
    expectedProfile: "vercel-lite",
    expectedProjects: ["lite-v275-chrome-1440x900"],
  },
];

function collectTests(suites) {
  const tests = [];
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) tests.push(...(spec.tests ?? []));
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of suites ?? []) visit(suite);
  return tests;
}

function decodeRuntimeAudit(result) {
  const attachment = (result.attachments ?? []).find((entry) => entry.name === "atlas-runtime-audit-v263");
  if (!attachment?.body || attachment.contentType !== "application/json") {
    throw new Error("Playwright result omitted the Atlas runtime audit attachment");
  }
  return JSON.parse(Buffer.from(attachment.body, "base64").toString("utf8"));
}

async function validateMatrix(matrix) {
  const [report, buildProfile, buildId] = await Promise.all([
    readJson(matrix.resultPath),
    readJson(matrix.buildProfilePath),
    readFile(resolve(ROOT, matrix.buildIdPath), "utf8").then((value) => value.trim()),
  ]);
  const tests = collectTests(report.suites);
  const projects = tests.map((entry) => entry.projectName).sort();
  const expectedProjects = [...matrix.expectedProjects].sort();
  const results = tests.flatMap((entry) => entry.results ?? []);
  const audits = results.map(decodeRuntimeAudit);
  const passed = report.stats?.expected === expectedProjects.length
    && report.stats?.unexpected === 0
    && report.stats?.flaky === 0
    && report.stats?.skipped === 0
    && (report.errors ?? []).length === 0
    && JSON.stringify(projects) === JSON.stringify(expectedProjects)
    && tests.every((entry) => entry.expectedStatus === "passed" && entry.status === "expected")
    && results.length === expectedProjects.length
    && results.every((entry) => entry.status === "passed" && entry.retry === 0 && (entry.errors ?? []).length === 0)
    && audits.every((audit) => audit.version === "v263-browser-runtime-audit-v1"
      && audit.consoleErrors?.length === 0
      && audit.pageErrors?.length === 0
      && audit.missingResources?.length === 0
      && audit.rendererFaults === 0)
    && buildProfile.profile === matrix.expectedProfile
    && buildProfile.buildId === buildId;
  if (!passed) throw new Error(`${matrix.id} v275 diagnostic browser matrix is not passing`);
  return {
    id: matrix.id,
    status: "passed",
    profile: matrix.expectedProfile,
    projects,
    expected: report.stats.expected,
    skipped: report.stats.skipped,
    unexpected: report.stats.unexpected,
    flaky: report.stats.flaky,
    durationMs: Math.round(report.stats.duration),
    startedAt: report.stats.startTime,
    buildId,
    result: { path: matrix.resultPath, sha256: await fileSha256(matrix.resultPath) },
    config: { path: matrix.configPath, sha256: await fileSha256(matrix.configPath) },
    spec: { path: matrix.specPath, sha256: await fileSha256(matrix.specPath) },
    runtimeAudit: {
      consoleErrors: audits.reduce((sum, audit) => sum + audit.consoleErrors.length, 0),
      pageErrors: audits.reduce((sum, audit) => sum + audit.pageErrors.length, 0),
      missingResources: audits.reduce((sum, audit) => sum + audit.missingResources.length, 0),
      rendererFaults: audits.reduce((sum, audit) => sum + audit.rendererFaults, 0),
    },
  };
}

const results = [];
for (const matrix of matrices) results.push(await validateMatrix(matrix));
const evidence = {
  version: "v275-shadow-browser-diagnostic-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "passed-low-memory-diagnostic-browser-matrix-nonqualifying",
  formalQualificationApplied: false,
  resourceStabilityGateApplied: false,
  userAuthorizedCurrentMemoryDiagnostic: true,
  workers: 1,
  retries: 0,
  results,
  aggregate: {
    expected: results.reduce((sum, entry) => sum + entry.expected, 0),
    skipped: results.reduce((sum, entry) => sum + entry.skipped, 0),
    unexpected: results.reduce((sum, entry) => sum + entry.unexpected, 0),
    flaky: results.reduce((sum, entry) => sum + entry.flaky, 0),
    consoleErrors: results.reduce((sum, entry) => sum + entry.runtimeAudit.consoleErrors, 0),
    pageErrors: results.reduce((sum, entry) => sum + entry.runtimeAudit.pageErrors, 0),
    missingResources: results.reduce((sum, entry) => sum + entry.runtimeAudit.missingResources, 0),
    rendererFaults: results.reduce((sum, entry) => sum + entry.runtimeAudit.rendererFaults, 0),
  },
  boundary: "diagnostic-shadow-only-formal-v263-and-legacy-v9-retained",
};
evidence.evidenceSha256 = sha256(canonicalJson(evidence));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
