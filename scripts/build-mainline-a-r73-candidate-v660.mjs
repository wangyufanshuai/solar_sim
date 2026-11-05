import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";
import { buildCatalogV660 } from "./build-mainline-a-r73-catalog-v660.mjs";
import { verifyR73HttpBoundaryV660 } from
  "./verify-mainline-a-r73-http-v660.mjs";
import { validateR73BrowserV660 } from
  "./capture-mainline-a-r73-browser-v660.mjs";
import { verifyR73LongRunV660 } from
  "./capture-mainline-a-r73-longrun-v660.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = "app/data/mainlineANebulaR73CatalogV660.generated.json";
const AUDIT = "docs/release/v607/mainline-a-r73-v660-catalog-audit-20261013.json";
const CANONICAL = "app/data/mainlineACanonicalCoverageV622.generated.json";
const IMMUTABLE = [
  { path: "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json",
    bytes: 57424,
    sha256: "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b" },
  { path: "app/data/mainlineABetaStellarProjectionV607.generated.ts",
    bytes: 6135,
    sha256: "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce" },
];
const ROLLBACK =
  "docs/release/v607/mainline-a-r70-web-freeze-candidate-20261012v657web02.json";
const MAX_PIN_BYTES = 200 * 1024 * 1024;
const SHA = /^[a-f0-9]{64}$/;

function fail(code, detail) {
  throw new Error(`r73-package-v660:${code}${detail === undefined
    ? "" : `:${JSON.stringify(detail)}`}`);
}
function check(value, code, detail) {
  if (!value) fail(code, detail);
}
function paths(runId, observationId) {
  check(/^20261013v660r73web0[1-9]$/.test(runId)
    && /^20261013v660r73long0[1-9]$/.test(observationId),
  "run-id-invalid");
  const prefix = "docs/release/v607/";
  return {
    build: `${prefix}mainline-a-r73-build-${runId}.json`,
    http: `${prefix}mainline-a-r73-v660-http-${runId}.json`,
    browser: `${prefix}mainline-a-r73-v660-browser-${runId}.json`,
    desktop: `${prefix}mainline-a-r73-v660-browser-desktop-raw-${observationId}.json`,
    final: `${prefix}mainline-a-r73-v660-browser-final-raw-${observationId}.json`,
    longRunAudit: `${prefix}mainline-a-r73-v660-longrun-audit-${observationId}.json`,
    package: `${prefix}mainline-a-r73-v660-web-candidate-${runId}.json`,
    replay: `${prefix}mainline-a-r73-v660-web-candidate-replay-${runId}.json`,
  };
}

async function sha256File(absolute) {
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(absolute)) hash.update(bytes);
  return hash.digest("hex");
}

export async function pinR73FileV660(relative, evidenceClass,
  expectedHash = null) {
  const file = await safeFile(ROOT, relative);
  check(file.stat.size >= 1 && file.stat.size <= MAX_PIN_BYTES,
    "pin-size-invalid", relative);
  const sha256 = await sha256File(file.absolute);
  check(expectedHash === null || sha256 === expectedHash,
    "pin-hash-invalid", relative);
  return { path: file.relative, bytes: file.stat.size,
    sha256, evidenceClass };
}

async function readJson(relative) {
  const file = await safeFile(ROOT, relative);
  check(file.stat.size <= 96 * 1024 * 1024,
    "json-too-large", relative);
  return JSON.parse(await readFile(file.absolute, "utf8"));
}

function screenshotPaths(browser) {
  const collected = [];
  for (const device of ["desktop", "mobileViewport"]) {
    const screenshots = browser[device]?.screenshots ?? {};
    for (const role of ["overview", "imageDetail", "heldDetail"]) {
      const item = screenshots[role];
      check(item?.path && SHA.test(item.sha256)
        && item.bytes > 100, "screenshot-invalid", { device, role });
      collected.push(item);
    }
  }
  return collected;
}

function rawFilePaths(catalog) {
  const files = new Map();
  for (const row of catalog.rows) {
    for (const item of row.rawEvidence) {
      files.set(item.path, { ...item,
        evidenceClass: ["detail", "thumb"].includes(item.role)
          ? "visual" : "external-source" });
    }
    if (row.delivery && !files.has(row.delivery.path)) {
      files.set(row.delivery.path, { ...row.delivery,
        evidenceClass: row.delivery.variant === "derived-preview"
          ? "visual" : "external-source" });
    }
  }
  return [...files.values()].sort((left, right) =>
    left.path.localeCompare(right.path));
}

export function validateR73CandidateV660(candidate, deps) {
  const issues = [];
  const { catalog, build, http, browser, raw, desktop, longRunAudit } = deps;
  if (candidate?.schema !== "mainline-a-r73-web-candidate-v660"
    || candidate.status !== "candidate-hold-19-images-5-policy-holds"
    || candidate.build?.buildId !== build?.buildId
    || candidate.build?.runtimeBuildId !== build?.runtimeBuildId
    || candidate.build?.sourceSha256 !== build?.inputAfterSha256
    || candidate.catalog?.path !== CATALOG
    || candidate.catalog?.sha256 !== catalog?.sha256
    || candidate.counts?.candidates !== 24
    || candidate.counts?.reviewImages !== 19
    || candidate.counts?.policyHolds !== 5
    || candidate.counts?.rightsSigned !== 0
    || candidate.rollback?.previousCandidate !== ROLLBACK
    || candidate.boundary?.scientificPayloadWriteback !== false
    || candidate.boundary?.publicWebRelease !== "blocked"
    || Object.values(candidate.claims ?? {}).some((value) => value !== false)) {
    issues.push("candidate-identity-or-boundary-invalid");
  }
  if (!verifyR73HttpBoundaryV660(catalog?.value,
    http?.observations, http?.enabledOrigin, http?.disabledOrigin).ok
    || !validateR73BrowserV660(browser, catalog?.value, build).ok) {
    issues.push("http-or-browser-evidence-invalid");
  }
  const performance = verifyR73LongRunV660(raw, desktop,
    build, build.inputAfterSha256);
  if (!performance.ok || longRunAudit?.qualification?.completeLongRuns !== 2
    || longRunAudit?.sourceSha256 !== build?.inputAfterSha256
    || longRunAudit?.status
      !== "verified-two-independent-current-source-local-browser-runs") {
    issues.push("longrun-evidence-invalid");
  }
  const pins = candidate?.pins ?? [];
  if (!Array.isArray(pins) || pins.length < 90
    || new Set(pins.map((item) => item.path)).size !== pins.length
    || pins.some((item) => !SHA.test(item.sha256)
      || item.bytes < 1
      || !["static", "http", "visual", "browser",
        "performance", "external-source"].includes(item.evidenceClass))) {
    issues.push("candidate-pins-invalid");
  }
  return { ok: issues.length === 0, issues, performance };
}

async function pinAll(groups) {
  const pins = new Map();
  for (const group of groups) {
    for (const entry of group.entries) {
      const next = await pinR73FileV660(entry.path, group.evidenceClass,
        entry.sha256 ?? null);
      if (entry.bytes !== undefined) {
        check(next.bytes === entry.bytes,
          "pinned-size-invalid", entry.path);
      }
      const existing = pins.get(next.path);
      if (existing) {
        check(existing.sha256 === next.sha256
          && existing.bytes === next.bytes
          && existing.evidenceClass === next.evidenceClass,
        "conflicting-pin", next.path);
      } else pins.set(next.path, next);
    }
  }
  return [...pins.values()].sort((left, right) =>
    left.path.localeCompare(right.path));
}

export async function buildR73CandidateV660(mode, runId,
  observationId) {
  check(mode === "write" || mode === "check", "mode-invalid");
  const files = paths(runId, observationId);
  const source = await captureBuildInputs();
  const [catalog, audit, build, http, browser,
    raw, desktop, longRunAudit, reviewSource, r71Source,
    r72Source, canonical] = await Promise.all([
    readJson(CATALOG), readJson(AUDIT), readJson(files.build),
    readJson(files.http), readJson(files.browser),
    readJson(files.final), readJson(files.desktop),
    readJson(files.longRunAudit),
    readJson("app/data/mainlineANebulaCandidateReviewV655.generated.json"),
    readJson("app/data/mainlineANebulaR71SourceV658.generated.json"),
    readJson("app/data/mainlineANebulaR72SourceV659.generated.json"),
    readJson(CANONICAL),
  ]);
  check(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === source.sha256,
  "current-build-source-drift");
  const catalogCheck = await buildCatalogV660("check");
  check(catalogCheck.counts.total === 24,
    "catalog-replay-incomplete");
  check(canonical.schema === "mainline-a-canonical-coverage-v622"
    && canonical.counts?.total === 36
    && canonical.counts?.stars === 12
    && canonical.counts?.nebulae === 12
    && canonical.counts?.constellations === 12
    && canonical.boundary?.scientificPayloadWriteback === false,
  "canonical-coverage-or-boundary-invalid");
  const screenshots = screenshotPaths(browser);
  const upstream = [
    ...Object.values(reviewSource.generatedFrom ?? {}),
    r71Source.sourceAudit, r72Source.audit,
  ];
  check(upstream.length >= 9 && upstream.every((item) =>
    item?.path && SHA.test(item.sha256) && item.bytes > 100),
  "upstream-source-index-invalid");
  const pins = await pinAll([
    { evidenceClass: "static", entries: [
      { path: CATALOG, sha256: audit.catalog.sha256,
        bytes: audit.catalog.bytes },
      ...catalog.inputs,
      { path: AUDIT }, { path: CANONICAL },
      ...IMMUTABLE,
      { path: files.build }, { path: ROLLBACK },
    ] },
    { evidenceClass: "external-source",
      entries: [...rawFilePaths(catalog).filter((item) =>
        item.evidenceClass === "external-source"), ...upstream] },
    { evidenceClass: "visual", entries: [
      ...rawFilePaths(catalog).filter((item) =>
        item.evidenceClass === "visual"), ...screenshots,
    ] },
    { evidenceClass: "http", entries: [{ path: files.http }] },
    { evidenceClass: "browser", entries: [{ path: files.browser }] },
    { evidenceClass: "performance", entries: [
      { path: files.desktop }, { path: files.final },
      { path: files.longRunAudit },
    ] },
  ]);
  const candidate = {
    schema: "mainline-a-r73-web-candidate-v660",
    status: "candidate-hold-19-images-5-policy-holds",
    createdAt: mode === "check"
      ? (await readJson(files.package)).createdAt
      : new Date().toISOString(),
    build: { receipt: files.build, buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      sourceSha256: source.sha256,
      preservedDistDir: build.distDir },
    catalog: { path: CATALOG, bytes: audit.catalog.bytes,
      sha256: audit.catalog.sha256, audit: AUDIT },
    counts: { candidates: 24, reviewImages: 19,
      policyHolds: 5, rightsSigned: 0, runtimeAdmitted: 0,
      visualScreenshots: screenshots.length,
      independentThirtyMinuteRuns: 2 },
    evidence: { http: files.http, browser: files.browser,
      performance: files.longRunAudit,
      externalSource: AUDIT },
    rollback: { previousCandidate: ROLLBACK,
      preservedPreviousDistDir:
        ".next-mainline-a-r70-20261012v657web02/.next",
      deploymentChanged: false,
      note: "Local review candidate only; no public deployment to roll back" },
    pins,
    boundary: catalog.boundary,
    claims: catalog.claims,
  };
  const validated = validateR73CandidateV660(candidate, {
    catalog: { value: catalog, path: CATALOG,
      sha256: audit.catalog.sha256 }, build, http, browser,
    raw, desktop, longRunAudit,
  });
  check(validated.ok, "candidate-verification-invalid",
    validated.issues);
  if (mode === "check") {
    const saved = await readJson(files.package);
    check(JSON.stringify(saved) === JSON.stringify(candidate),
      "candidate-package-drift");
  } else await writeFile(path.join(ROOT, files.package),
    `${JSON.stringify(candidate, null, 2)}\n`, { flag: "wx" });
  const replay = { schema: "mainline-a-r73-web-candidate-replay-v660",
    status: "verified-candidate-hold",
    verifiedAt: new Date().toISOString(),
    package: files.package,
    sourceSha256: source.sha256,
    pinnedFileCount: pins.length,
    pinEvidenceClasses: Object.fromEntries(["static", "http", "visual",
      "browser", "performance", "external-source"].map((kind) =>
      [kind, pins.filter((pin) => pin.evidenceClass === kind).length])),
    counts: candidate.counts,
    longRun: { completeLongRuns: validated.performance.completeLongRuns,
      durationsMs: validated.performance.durationsMs,
      resourceTotals: validated.performance.resourceTotals },
    issues: [],
    claims: candidate.claims,
  };
  if (mode === "check") {
    const savedReplay = await readJson(files.replay);
    check(savedReplay.schema === replay.schema
      && savedReplay.status === replay.status
      && savedReplay.package === replay.package
      && savedReplay.sourceSha256 === replay.sourceSha256
      && savedReplay.pinnedFileCount === replay.pinnedFileCount
      && JSON.stringify(savedReplay.pinEvidenceClasses)
        === JSON.stringify(replay.pinEvidenceClasses)
      && JSON.stringify(savedReplay.counts) === JSON.stringify(replay.counts)
      && JSON.stringify(savedReplay.longRun) === JSON.stringify(replay.longRun)
      && savedReplay.issues?.length === 0
      && Object.values(savedReplay.claims ?? {}).every((claim) =>
        claim === false),
    "candidate-replay-drift");
  } else await writeFile(path.join(ROOT, files.replay),
    `${JSON.stringify(replay, null, 2)}\n`, { flag: "wx" });
  return { status: replay.status, package: files.package,
    replay: files.replay, pinnedFileCount: pins.length,
    counts: replay.counts };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const [, , operation, runId, observationId] = process.argv;
  check(["--write", "--check"].includes(operation)
    && process.argv.length === 5, "usage-invalid");
  console.log(JSON.stringify(await buildR73CandidateV660(
    operation.slice(2), runId, observationId)));
}
