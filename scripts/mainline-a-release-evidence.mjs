import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { evaluateMainlineALongRunV635 } from "./validate-mainline-a-longrun-v635.mjs";

export const INPUT_SCHEMA = "mainline-a-release-evidence-input-v1";
export const BOUNDARY = Object.freeze({
  candidateOnly: true, hold: true, notAdmitted: true,
  scientificPayloadWriteback: false, parentGitMutation: false,
  physicsKernelMutation: false, runtimePromotion: "closed",
});
export const CLASSES = new Set(["static", "http", "visual", "browser", "performance", "external-source"]);
const ROLE_CLASSES = Object.freeze({
  build: "static", http: "http", browser: "browser", performance: "performance",
  lifecycle: "performance", longRun: "performance", canonicalRuntime: "browser", coverage: "static", freeze: "static",
  stellarRaw: "external-source", stellarStructured: "external-source", heroPack: "static",
  nebulaBatch1: "external-source", nebulaBatch2: "external-source", nebulaAudit: "external-source",
  sourceRights: "external-source", rightsDirective: "static", canonicalAssets: "http",
  extensionAssets: "static", sourceArtifacts: "external-source", rootManifestProbe: "static",
  rootSourceAudit: "static", round: "static",
});
const REFERENCE_ROLES = new Set([
  "stellarRaw", "stellarStructured", "nebulaBatch1", "nebulaBatch2", "nebulaAudit",
  "sourceRights", "canonicalAssets", "extensionAssets", "sourceArtifacts", "browser", "coverage", "performance", "lifecycle", "longRun", "canonicalRuntime", "http",
]);
const SHA = /^[a-f0-9]{64}$/u;
const R65_LONG_RUN_SCHEMA = "mainline-a-r65-long-run-v643";
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
export const unique = (values) => [...new Set(values)].sort();
export const hasText = (value) => typeof value === "string" && value.trim().length > 0;
export const validSha = (value) => typeof value === "string" && SHA.test(value);

export function relativePath(workspace, requested) {
  if (!hasText(requested) || requested.includes("\0")) throw new Error("evidence-path-missing");
  const absolute = path.resolve(workspace, requested);
  const relative = path.relative(path.resolve(workspace), absolute);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error("evidence-path-outside-workspace");
  }
  return relative.replaceAll("\\", "/");
}

export async function safeFile(workspace, requested) {
  const relative = relativePath(workspace, requested);
  let target = path.resolve(workspace);
  for (const part of relative.split("/")) {
    target = path.join(target, part);
    const stat = await lstat(target);
    if (stat.isSymbolicLink()) throw new Error(`evidence-symlink-rejected:${relative}`);
  }
  const resolved = await realpath(target);
  relativePath(workspace, resolved);
  const stat = await lstat(target);
  if (!stat.isFile()) throw new Error(`evidence-not-file:${relative}`);
  return { absolute: target, relative, stat };
}

export async function readPinnedFile(workspace, descriptor, role) {
  if (!descriptor || !validSha(descriptor.sha256)) throw new Error(`evidence-sha-missing:${role}`);
  if (!CLASSES.has(descriptor.evidenceClass)) throw new Error(`evidence-class-invalid:${role}`);
  const file = await safeFile(workspace, descriptor.path);
  if (file.stat.size > 256 * 1024 * 1024) throw new Error(`evidence-size-limit:${role}`);
  const raw = await readFile(file.absolute);
  const actual = sha256(raw);
  if (actual !== descriptor.sha256) throw new Error(`evidence-sha-mismatch:${role}:${file.relative}`);
  if (descriptor.bytes !== undefined && descriptor.bytes !== raw.length) throw new Error(`evidence-size-mismatch:${role}`);
  return {
    raw,
    record: { role, path: file.relative, bytes: raw.length, sha256: actual, evidenceClass: descriptor.evidenceClass },
  };
}

export async function ensureOutputParent(workspace, requested) {
  const relative = relativePath(workspace, requested);
  const absolute = path.resolve(workspace, relative);
  const parent = path.dirname(absolute);
  let current = path.resolve(workspace);
  for (const part of path.relative(current, parent).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("output-parent-not-directory-or-symlink");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(current);
    }
  }
  return { absolute, relative };
}

export async function writeExclusiveJson(workspace, requested, value) {
  const { absolute, relative } = await ensureOutputParent(workspace, requested);
  await writeFile(absolute, jsonBytes(value), { flag: "wx" });
  return { path: relative, bytes: jsonBytes(value).length, sha256: sha256(jsonBytes(value)) };
}

export function parseArguments(argv, allowed) {
  const options = {};
  const booleanFlags = new Set(["check", "no-write", "json"]);
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i].replace(/^--/u, "");
    if (!argv[i].startsWith("--") || !allowed.includes(key)) throw new Error(`unsupported-argument:${argv[i]}`);
    if (Object.hasOwn(options, key)) throw new Error(`duplicate-argument:${key}`);
    if (booleanFlags.has(key)) options[key] = true;
    else {
      if (!hasText(argv[i + 1]) || argv[i + 1].startsWith("--")) throw new Error(`argument-value-missing:${key}`);
      options[key] = argv[++i];
    }
  }
  return options;
}

export async function captureCurrentInputs(workspace) {
  const files = [];
  async function walk(directory, prefix) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = `${prefix}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`source-symlink-rejected:${name}`);
      if (entry.isDirectory()) await walk(path.join(directory, entry.name), name);
      else if (/\.(ts|tsx|js|jsx|json|css|mjs|glsl)$/u.test(entry.name) && !/\.test\./u.test(entry.name)) files.push(name);
    }
  }
  await walk(path.join(workspace, "app"), "app");
  files.push("package.json", "package-lock.json", "next.config.mjs", "proxy.ts", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs", ".env.local");
  const inputs = [];
  for (const name of files.sort()) {
    const file = await safeFile(workspace, name);
    const bytes = await readFile(file.absolute);
    inputs.push({ path: name, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return { scope: "app-source-config-package-lock-excludes-public-assets-and-tests", count: inputs.length, sha256: sha256(JSON.stringify(inputs)), inputs };
}

export function verifyBuildSnapshot(build, snapshot) {
  const problems = [];
  if (build?.status !== "passed" || build?.exitCode !== 0 || build?.sourceStable !== true) problems.push("build-not-passed");
  for (const key of ["buildId", "runtimeBuildId", "branch", "head"]) {
    if (!hasText(build?.[key]) || build[key].startsWith("unknown")) problems.push(`build-identity-missing:${key}`);
  }
  const before = build?.inputBefore;
  const entries = before?.inputs;
  if (!Array.isArray(entries) || !entries.length || entries.some((row) => !hasText(row.path) || !validSha(row.sha256) || !Number.isSafeInteger(row.bytes))) {
    problems.push("build-input-manifest-invalid");
  } else {
    if (new Set(entries.map((row) => row.path)).size !== entries.length) problems.push("build-input-path-duplicate");
    if (sha256(JSON.stringify(entries)) !== before.sha256 || entries.length !== before.count) problems.push("build-input-manifest-digest-mismatch");
  }
  if (!validSha(before?.sha256) || build?.inputAfterSha256 !== before?.sha256) problems.push("build-input-unstable");
  if (snapshot.sha256 !== before?.sha256 || snapshot.scope !== before?.scope) problems.push("current-source-build-mismatch");
  if (build?.runtimeBuildId !== `mainline-a-${before?.sha256?.slice(0, 16)}`) problems.push("runtime-source-identity-mismatch");
  return unique(problems);
}

export function buildBinding(receipt, build) {
  if (!receipt || !build) return { bound: false, problems: ["receipt-missing"] };
  const identity = receipt.build ?? receipt.buildIdentity ?? receipt;
  const problems = [];
  for (const key of ["runtimeBuildId", "branch", "head"]) {
    if (!hasText(identity[key] ?? receipt[key]) || (identity[key] ?? receipt[key]) !== build[key]) problems.push(`receipt-build-mismatch:${key}`);
  }
  const artifact = identity.buildArtifactId ?? receipt.buildArtifactId ?? identity.buildId ?? receipt.buildId;
  if (artifact !== build.buildId) problems.push("receipt-build-mismatch:buildId");
  const statuses = [receipt.status, receipt.verdict, receipt.quality?.status];
  if (receipt.retracted === true || receipt.invalidated === true || receipt.valid === false || statuses.some((status) => /retract|invalid|superseded/iu.test(String(status)))) {
    problems.push("receipt-retracted");
  }
  return { bound: problems.length === 0, problems };
}

function collectReferences(value, role, output, depth = 0) {
  if (!value || typeof value !== "object") return;
  if (depth > 24 || output.length > 12000) throw new Error("evidence-reference-limit");
  if (!Array.isArray(value)) {
    const referencePath = value.path ?? value.artifactPath ?? value.rawPath ?? value.rawArtifactPath ?? value.sourceArtifactPath ?? value.assetPath ?? value.expectedPath;
    const digest = value.sha256 ?? value.actualSha256 ?? value.artifactSha256 ?? value.rawSha256 ?? value.rawArtifactSha256 ?? value.rawPageSha256 ?? value.assetHash;
    if (hasText(referencePath) && validSha(digest)) {
      output.push({ path: referencePath, sha256: digest, evidenceClass: ROLE_CLASSES[role], role: `${role}:reference` });
    }
  }
  for (const child of Object.values(value)) collectReferences(child, role, output, depth + 1);
}

function rejectPromotion(value, role, depth = 0) {
  if (!value || typeof value !== "object") return;
  if (depth > 24) throw new Error("evidence-object-depth-limit");
  if (value.scientificPayloadWriteback === true || value.physicsKernelMutation === true || value.parentGitMutation === true) {
    throw new Error(`evidence-boundary-open:${role}`);
  }
  if (value.fixture === true || value.synthetic === true || value.transport === "fixture-replay" || value.origin === "fixture") {
    throw new Error(`fixture-evidence-not-admitted:${role}`);
  }
  for (const child of Object.values(value)) rejectPromotion(child, role, depth + 1);
}

export async function loadEvidenceInput(workspace, requested) {
  if (!hasText(requested)) throw new Error("explicit-evidence-input-required");
  const bundleFile = await safeFile(workspace, requested);
  const raw = await readFile(bundleFile.absolute);
  const input = JSON.parse(raw.toString("utf8"));
  if (input.schema !== INPUT_SCHEMA || !["candidate", "fixture"].includes(input.mode)) throw new Error("evidence-input-schema-invalid");
  if (!input.entries || typeof input.entries !== "object" || Array.isArray(input.entries)) throw new Error("evidence-entries-missing");
  if (!input.entries.build) throw new Error("explicit-build-receipt-required");
  const values = {};
  const index = [];
  const references = [...(input.artifacts ?? [])];
  for (const [role, descriptor] of Object.entries(input.entries)) {
    if (!Object.hasOwn(ROLE_CLASSES, role)) throw new Error(`evidence-role-unknown:${role}`);
    if (descriptor?.evidenceClass !== ROLE_CLASSES[role]) throw new Error(`evidence-role-class-mismatch:${role}`);
    const pinned = await readPinnedFile(workspace, descriptor, role);
    values[role] = JSON.parse(pinned.raw.toString("utf8"));
    if (input.mode !== "fixture") {
      const subject = ["rootManifestProbe", "rootSourceAudit"].includes(role) ? { boundary: values[role].boundary } : values[role];
      rejectPromotion(subject, role);
    }
    const existing = index.find((row) => row.path === pinned.record.path);
    if (existing) {
      if (existing.sha256 !== pinned.record.sha256 || existing.evidenceClass !== pinned.record.evidenceClass) throw new Error(`evidence-reference-conflict:${pinned.record.path}`);
      existing.roles = unique([...(existing.roles ?? [existing.role]), role]);
    } else index.push(pinned.record);
    if (REFERENCE_ROLES.has(role)) collectReferences(values[role], role, references);
  }
  const known = new Map(index.map((row) => [row.path, row.sha256]));
  for (const descriptor of references) {
    if (known.size > 12000) throw new Error("evidence-reference-limit");
    const normalized = relativePath(workspace, descriptor.path);
    if (known.has(normalized)) {
      if (known.get(normalized) !== descriptor.sha256) throw new Error(`evidence-reference-conflict:${normalized}`);
      continue;
    }
    const pinned = await readPinnedFile(workspace, descriptor, descriptor.role ?? "artifact");
    index.push(pinned.record);
    known.set(normalized, pinned.record.sha256);
    if (normalized.endsWith(".json")) {
      const inheritedRole = descriptor.role?.split(":")[0];
      if (REFERENCE_ROLES.has(inheritedRole)) {
        const referencedValue = JSON.parse(pinned.raw.toString("utf8"));
        if (input.mode !== "fixture") rejectPromotion(referencedValue, inheritedRole);
        collectReferences(referencedValue, inheritedRole, references);
      }
    }
  }
  const snapshot = await captureCurrentInputs(workspace);
  const buildProblems = verifyBuildSnapshot(values.build, snapshot);
  const build = {
    ...Object.fromEntries(["buildId", "runtimeBuildId", "branch", "head", "profile", "sourceStable"].map((key) => [key, values.build[key]])),
    receiptPath: input.entries.build.path,
    receiptSha256: input.entries.build.sha256,
    sourceSha256: values.build.inputBefore?.sha256 ?? null,
    currentSourceSha256: snapshot.sha256,
  };
  return {
    input, values, build, buildProblems, snapshot, index,
    bundle: { path: bundleFile.relative, bytes: raw.length, sha256: sha256(raw) },
  };
}

export async function verifyEvidenceIndex(workspace, records) {
  if (!Array.isArray(records) || !records.length) throw new Error("evidence-index-empty");
  const observed = new Set();
  for (const descriptor of records) {
    if (observed.has(descriptor.path)) throw new Error(`evidence-index-path-duplicate:${descriptor.path}`);
    observed.add(descriptor.path);
    await readPinnedFile(workspace, descriptor, descriptor.role);
  }
  return { files: observed.size, status: "verified", evidenceClass: "static", scientificValidity: false, rightsApproval: false };
}

export function runReadOnlyRootProbe(workspace, scriptName) {
  const child = spawnSync(process.execPath, [path.join(workspace, "scripts", scriptName), "--no-write", "--json"], {
    cwd: workspace, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  if (child.status !== 0) throw new Error(`root-readonly-probe-failed:${scriptName}`);
  return JSON.parse(child.stdout);
}

function gate(id, evidenceClass, state, blockers = [], detail = {}) {
  return { id, evidenceClass, state, required: true, blockers: unique(blockers), ...detail };
}

function boundedState(value, build, accepted) {
  const binding = buildBinding(value, build);
  const state = binding.bound && accepted(value) ? "passed" : value?.status?.includes("not-run") || value?.status?.includes("before-navigation") ? "not-run" : "blocked";
  return { binding, state };
}

function indexedReference(ref, index) {
  return hasText(ref?.path) && validSha(ref?.sha256)
    && index.some((item) => item.path === ref.path.replaceAll("\\", "/") && item.sha256 === ref.sha256);
}

function validHttpReceipt(value, index, buildReceipt, build) {
  if (value?.schema !== "mainline-a-http-evidence-v626" || value.status !== "passed"
    || value.pageStatus !== 200 || value.healthStatus !== 200 || !(value.htmlBytes > 0)
    || value.allScriptAssetsOk !== true || value.performanceClaim !== false || value.scientificPayloadWriteback !== false
    || value.buildReportValid !== true || value.buildReportError !== null || value.sourceReport !== build.receiptPath
    || value.errors !== undefined && (!Array.isArray(value.errors) || value.errors.length > 0)) return false;
  let base;
  try { base = new URL(value.url); } catch { return false; }
  if (!["http:", "https:"].includes(base.protocol) || value.pageRedirected !== false || value.healthRedirected !== false
    || value.pageFinalUrl !== new URL("/", base).href || value.healthFinalUrl !== new URL("/api/health", base).href) return false;
  const assets = value.scriptAssets;
  return Array.isArray(assets) && assets.length > 0 && new Set(assets.map((asset) => asset.src)).size === assets.length
    && assets.every((asset) => asset.status === 200 && asset.matchesBuild === true
      && asset.bytes > 0 && asset.bytes === asset.expectedBytes && validSha(asset.sha256)
      && asset.error === null && asset.redirected === false && asset.finalUrl === new URL(asset.src, base).href
      && /^\/_next\/static\//u.test(asset.src)
      && asset.expectedPath?.replaceAll("\\", "/") === `${buildReceipt.distDir}/static/${asset.src.slice("/_next/static/".length)}`
      && asset.sha256 === asset.expectedSha256 && indexedReference({ path: asset.expectedPath, sha256: asset.expectedSha256 }, index));
}

function validBrowserDevice(device, index, build) {
  return ["passed", "complete"].includes(device?.status) && Array.isArray(device.viewport)
    && device.viewport.length === 2 && device.viewport.every((size) => Number.isFinite(size) && size > 0)
    && device.dom?.clientWidth === device.viewport[0] && device.dom?.clientHeight === device.viewport[1]
    && device.dom?.markers?.shell === true && device.dom?.markers?.scientificPayloadWriteback === "false"
    && ["runtimeBuildId", "branch", "head"].every((key) => device.dom?.build?.[key] === build[key])
    && indexedReference(device.screenshot, index);
}

async function replayResourceReferences(workspace, receipt, evidence) {
  const refs = receipt?.rawObservations ?? (Array.isArray(receipt?.runs) ? receipt.runs.map((run) => run.rawObservation) : []);
  if (!Array.isArray(refs) || !refs.length || refs.length > 32 || !refs.every((ref) => indexedReference(ref, evidence.index))) return [];
  const reports = [];
  for (const ref of refs) {
    const script = path.join(import.meta.dirname, "replay-mainline-a-resource-observation-v633.ts");
    const child = spawnSync(process.execPath, ["--import", pathToFileURL(path.join(import.meta.dirname, "../node_modules/tsx/dist/loader.mjs")).href, script,
      "--input", ref.path, "--expected-sha256", ref.sha256, "--build-receipt", evidence.build.receiptPath], {
      cwd: workspace, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024,
    });
    if (child.status !== 0) return [];
    const replay = JSON.parse(child.stdout);
    if (replay.schema !== "mainline-a-resource-observation-replay-v633" || replay.status !== "measured-local"
      || replay.rawSha256 !== ref.sha256 || replay.buildReceiptSha256 !== evidence.build.receiptSha256) return [];
    reports.push(replay);
  }
  return reports;
}

export function verifyR65LongRunBindingV645(receipt, build, offlineReport, pinnedSha256) {
  const issues = [];
  if (receipt?.schema !== R65_LONG_RUN_SCHEMA || receipt?.status !== "qualified") issues.push("r65-long-run:qualified-receipt-missing");
  if (receipt?.build?.buildId !== build.runtimeBuildId || receipt?.build?.runtimeBuildId !== build.runtimeBuildId
    || receipt?.build?.branch !== build.branch || receipt?.build?.head !== build.head || receipt?.build?.route !== "/") {
    issues.push("r65-long-run:build-identity-mismatch");
  }
  if (receipt?.claims?.twoIndependentLongRuns !== true || receipt?.claims?.desktopViewport !== true
    || receipt?.claims?.mobileViewport !== true || receipt?.claims?.resourceLifecycle !== true
    || receipt?.claims?.physicalMobile !== false || receipt?.claims?.productionPerformance !== false
    || receipt?.claims?.realUserValidation !== false || receipt?.claims?.scientificValidity !== false
    || receipt?.claims?.copyrightApproval !== false || receipt?.boundary?.scientificPayloadWriteback !== false) {
    issues.push("r65-long-run:claim-boundary-invalid");
  }
  if (!validSha(pinnedSha256) || offlineReport?.sourceSha256 !== pinnedSha256
    || offlineReport?.receiptSchema !== R65_LONG_RUN_SCHEMA || offlineReport?.inputVerification?.ok !== true
    || offlineReport?.verification?.ok !== true
    || offlineReport?.verification?.status !== "qualified" || offlineReport?.verification?.completeLongRuns < 2
    || !offlineReport?.verification?.devices?.includes("desktop") || !offlineReport?.verification?.devices?.includes("mobile")
    || new Set(offlineReport?.verification?.independentKeys ?? []).size < 2
    || offlineReport?.replaySummary?.status !== "verified"
    || offlineReport?.classification?.performance !== "qualified"
    || offlineReport?.claims?.qualified !== true || offlineReport?.claims?.productionPerformance !== false
    || offlineReport?.claims?.realUserValidation !== false || offlineReport?.claims?.physicalMobile !== false) {
    issues.push("r65-long-run:offline-replay-invalid");
  }
  return { status: issues.length ? "blocked" : "passed", bound: issues.length === 0, problems: unique(issues) };
}

async function replayR65LongRunReferenceV645(workspace, evidence) {
  const descriptor = evidence.input.entries.longRun;
  const receipt = evidence.values.longRun;
  if (receipt?.schema !== R65_LONG_RUN_SCHEMA) return null;
  if (!descriptor || !indexedReference(descriptor, evidence.index)) {
    return { status: "blocked", bound: false, problems: ["r65-long-run:pinned-reference-missing"], offlineReport: null };
  }
  const script = path.join(import.meta.dirname, "build-mainline-a-r65-longrun-v643.ts");
  const loader = pathToFileURL(path.join(import.meta.dirname, "../node_modules/tsx/dist/loader.mjs")).href;
  const child = spawnSync(process.execPath, ["--import", loader, script, "--input", descriptor.path,
    "--no-write", "--check", "--require-qualified", "--json"], {
    cwd: workspace, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  let offlineReport;
  try { offlineReport = JSON.parse(child.stdout); } catch { offlineReport = null; }
  const binding = verifyR65LongRunBindingV645(receipt, evidence.build, offlineReport, descriptor.sha256);
  const problems = child.status === 0 ? binding.problems : unique([...binding.problems, "r65-long-run:offline-command-failed"]);
  return { status: problems.length ? "blocked" : "passed", bound: problems.length === 0, problems,
    offlineReport: offlineReport ? { schema: offlineReport.schema, sourceSha256: offlineReport.sourceSha256,
      inputVerification: offlineReport.inputVerification, verification: offlineReport.verification,
      classification: offlineReport.classification,
      replaySummary: offlineReport.replaySummary, claims: offlineReport.claims } : null };
}

async function replayCanonicalRuntimeReference(workspace, evidence) {
  const descriptor = evidence.input.entries.canonicalRuntime;
  if (!descriptor) return null;
  const coverage = evidence.input.entries.coverage;
  const refs = evidence.values.canonicalRuntime?.rawObservations;
  const blocked = (issue) => ({ status: "blocked", issues: [issue] });
  if (!indexedReference(descriptor, evidence.index) || !indexedReference(coverage, evidence.index)
    || !Array.isArray(refs) || refs.length > 72 || !refs.every((ref) => indexedReference(ref, evidence.index))) {
    return blocked("canonical-runtime:pinned-reference-missing");
  }
  const child = spawnSync(process.execPath, ["--import", pathToFileURL(path.join(import.meta.dirname, "../node_modules/tsx/dist/loader.mjs")).href,
    path.join(import.meta.dirname, "replay-mainline-a-canonical-runtime-v635.ts"),
    "--input", descriptor.path, "--expected-sha256", descriptor.sha256,
    "--build-receipt", evidence.build.receiptPath, "--coverage", coverage.path, "--coverage-sha256", coverage.sha256], {
    cwd: workspace, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  let replay;
  try { replay = JSON.parse(child.stdout); } catch { return blocked("canonical-runtime:replay-unavailable"); }
  if (child.status !== 0 || replay.schema !== "mainline-a-canonical-runtime-replay-v635"
    || replay.status !== "measured-local" || replay.rawSha256 !== descriptor.sha256
    || replay.buildReceiptSha256 !== evidence.build.receiptSha256 || replay.coverageSha256 !== coverage.sha256
    || !Array.isArray(replay.issues) || replay.issues.length) {
    return blocked("canonical-runtime:raw-replay-not-verified");
  }
  return replay;
}

function countCanonical(coverage) {
  const records = Array.isArray(coverage?.records) ? coverage.records : [];
  const counts = Object.fromEntries(["star", "nebula", "constellation"].map((kind) => [kind, records.filter((record) => record.kind === kind).length]));
  const complete = records.length === 36 && new Set(records.map((record) => record.id)).size === 36
    && Object.values(counts).every((count) => count === 12);
  return { complete, counts, records };
}

function verifiedImageRows(receipt, rowsKey, index, coverage = null) {
  const rows = Array.isArray(receipt?.[rowsKey]) ? receipt[rowsKey] : [];
  const indexed = new Map(index.map((row) => [row.path, row.sha256]));
  const ids = new Set();
  for (const row of rows) {
    const ref = row.raw ?? row;
    const canonicalRecord = coverage?.records?.find((record) => record.kind === "nebula" && record.id === row.id);
    const filePath = ref.path ?? row.localPath ?? canonicalRecord?.route?.assetPath;
    const digest = ref.sha256 ?? row.localSha256;
    const canonicalMatch = !canonicalRecord || canonicalRecord.route.assetHash === digest;
    if (hasText(row.id) && canonicalMatch && indexed.get(filePath) === digest && validSha(digest)) ids.add(row.id);
  }
  return [...ids].sort();
}

function capturedExtensionIds(values, eligibleIds, index) {
  const verified = new Map(index.map((row) => [row.path, row.sha256]));
  const captures = new Set();
  const claimedIds = new Set();
  const duplicateIds = new Set();
  for (const batch of [values.nebulaBatch1, values.nebulaBatch2]) {
    for (const row of batch?.rows ?? []) {
      if (claimedIds.has(row.id)) duplicateIds.add(row.id);
      claimedIds.add(row.id);
      const artifact = row.network?.artifact;
      const artifactPath = artifact?.path?.replaceAll("\\", "/");
      if (!eligibleIds.includes(row.id) || !artifact || verified.get(artifactPath) !== artifact.sha256) continue;
      const success = row.network?.attempts?.some((attempt) =>
        attempt.requestExecuted === true && attempt.responseCaptured === 1
        && attempt.httpStatus === 200 && attempt.timeout === false
        && /^https:\/\//u.test(attempt.requestUrl ?? "") && /^https:\/\//u.test(attempt.finalUrl ?? "")
        && validSha(attempt.requestFingerprint) && attempt.rawPageSha256 === artifact.sha256
        && attempt.responseBytes === artifact.bytes && attempt.rawArtifactPath?.replaceAll("\\", "/") === artifactPath);
      if (success) captures.add(row.id);
    }
  }
  return [...captures].filter((id) => !duplicateIds.has(id)).sort();
}

function stellarSourceSummary(values, index) {
  const expectedIds = ["acrux", "spica", "regulus", "polaris"];
  const rawRecords = Array.isArray(values.stellarRaw?.records) ? values.stellarRaw.records : [];
  const parsedRecords = Array.isArray(values.stellarStructured?.records) ? values.stellarStructured.records : [];
  const verified = new Map(index.map((row) => [row.path, row.sha256]));
  const captured = new Map();
  const issues = [];
  if (new Set(rawRecords.map((record) => record.id)).size !== rawRecords.length) issues.push("stellar-raw-duplicate-id");
  if (new Set(parsedRecords.map((record) => record.id)).size !== parsedRecords.length) issues.push("stellar-structured-duplicate-id");
  for (const record of rawRecords) {
    const attempt = record.attempts?.find((item) =>
      item.responseCaptured === 1 && item.httpStatus === 200 && item.timeout === false
      && /^https:\/\//u.test(item.requestUrl ?? "") && /^https:\/\//u.test(item.finalUrl ?? "")
      && ["https-html", "https"].includes(item.transport) && validSha(item.requestFingerprint)
      && verified.get(item.rawArtifactPath?.replaceAll("\\", "/")) === item.rawPageSha256);
    if (attempt && expectedIds.includes(record.id) && record.responseCaptured === 1) captured.set(record.id, attempt);
  }
  const parsed = new Set();
  for (const record of parsedRecords) {
    const raw = captured.get(record.id);
    if (raw && record.parseStatus === "parsed-candidate" && record.rawPageSha256 === raw.rawPageSha256
      && record.sourceArtifactPath?.replaceAll("\\", "/") === raw.rawArtifactPath?.replaceAll("\\", "/")
      && Number.isFinite(record.raDeg) && record.raDeg >= 0 && record.raDeg < 360
      && Number.isFinite(record.decDeg) && Math.abs(record.decDeg) <= 90) parsed.add(record.id);
  }
  const reportedComponent = parsedRecords.filter((record) => record.componentIdentityStatus === "confirmed").length;
  const declaredRaw = values.stellarRaw?.counts?.responseCaptured;
  const declaredParsed = values.stellarStructured?.counts?.parsedCandidate ?? values.stellarStructured?.counts?.parsedCandidates;
  if (declaredRaw !== captured.size) issues.push("stellar-raw-summary-mismatch");
  if (declaredParsed !== parsed.size) issues.push("stellar-structured-summary-mismatch");
  if (values.stellarStructured?.counts?.componentConfirmed !== reportedComponent) issues.push("stellar-component-summary-mismatch");
  if (values.stellarRaw?.counts?.total !== rawRecords.length || values.stellarStructured?.counts?.total !== parsedRecords.length) issues.push("stellar-record-total-mismatch");
  return {
    rawResponses: captured.size, structuredCandidates: parsed.size,
    componentConfirmed: 0, componentClaimedByRecords: reportedComponent,
    trustedComponentVerification: "not-run-no-trusted-verifier", issues: unique(issues),
  };
}

export async function createAlignmentReport(workspace, evidence, rootObservation = null) {
  const { values, build, index, buildProblems, input } = evidence;
  const fixture = input.mode === "fixture";
  const liveRoot = rootObservation ?? (fixture ? null : {
    source: runReadOnlyRootProbe(workspace, "audit-mainline-a-root-source-v627.mjs"),
    manifest: runReadOnlyRootProbe(workspace, "probe-mainline-a-root-manifest-v626.mjs"),
  });
  const root = liveRoot?.source;
  const probe = liveRoot?.manifest;
  const rootCurrent = Boolean(root && values.rootSourceAudit
    && root.root?.inventory?.fileCount > 0 && root.root.inventory.errors?.length === 0
    && root.root.inventory.inventorySha256 === values.rootSourceAudit.root?.inventory?.inventorySha256);
  const rootIdentity = root?.root?.package?.packageName === "solar-sim-viz"
    && root.root.package.releaseIdentity === "solar-sim-mainline-a"
    && root.workspaceBoundary?.readOnlyInput === true && root.workspaceBoundary?.rootWrites === false
    && root.workspaceBoundary?.parentGitOps === false;
  const nextPackage = JSON.parse(await readFile(path.join(workspace, "package.json"), "utf8"));
  const nextIdentity = nextPackage.name === "solar-next-web" && nextPackage.mainlineAReleaseIdentity === "solar-sim-mainline-a";
  const coverageRef = input.entries.coverage;
  const probeCurrent = Boolean(probe && values.rootManifestProbe && coverageRef
    && probe.nextWeb?.manifest?.sha256 === coverageRef.sha256
    && values.rootManifestProbe.nextWeb?.manifest?.sha256 === coverageRef.sha256
    && values.rootManifestProbe.root?.manifest?.sha256 === probe.root?.manifest?.sha256);
  const rootParity = probeCurrent && probe.parity?.structuralMatch === true;
  const canonical = countCanonical(values.coverage);
  const buildPass = buildProblems.length === 0 && !fixture;
  const http = boundedState(values.http, build, (value) => validHttpReceipt(value, index, values.build, build));
  const browser = boundedState(values.browser, build, (value) => /^mainline-a-browser-evidence-/u.test(value.schema ?? "")
    && ["passed", "complete"].includes(value.status) && value.browserPermissionBypass !== true
    && value.toolResult?.isError === false && value.navigationSucceeded === true && value.domInspection === "observed");
  const desktop = browser.state === "passed" && validBrowserDevice(values.browser?.desktop, index, build) ? "passed" : "not-run";
  const mobile = browser.state === "passed" && validBrowserDevice(values.browser?.mobileViewport, index, build) ? "passed" : "not-run";
  const screenshotRefs = [values.browser?.desktop?.screenshot, values.browser?.mobileViewport?.screenshot].filter(Boolean);
  const visual = (desktop === "passed" || mobile === "passed") && screenshotRefs.length > 0 && screenshotRefs.every((ref) =>
    validSha(ref.sha256) && index.some((entry) => entry.path === ref.path && entry.sha256 === ref.sha256)) ? "passed" : "not-run";
  const currentR65LongRun = await replayR65LongRunReferenceV645(workspace, evidence);
  const sameR65Artifact = (role) => currentR65LongRun !== null
    && values[role]?.schema === R65_LONG_RUN_SCHEMA
    && input.entries[role]?.path === input.entries.longRun?.path
    && input.entries[role]?.sha256 === input.entries.longRun?.sha256;
  const r65RoleBinding = (role) => {
    const problems = unique([...(currentR65LongRun?.problems ?? ["r65-long-run:offline-replay-missing"]),
      ...(sameR65Artifact(role) ? [] : [`r65-long-run:${role}-artifact-drift`])]);
    return { bound: problems.length === 0, problems };
  };
  const performanceReplays = currentR65LongRun ? []
    : values.performance?.status === "passed" ? await replayResourceReferences(workspace, values.performance, evidence) : [];
  const lifecycleReplays = currentR65LongRun ? []
    : values.lifecycle?.status === "passed" ? await replayResourceReferences(workspace, values.lifecycle, evidence) : [];
  const performance = currentR65LongRun && values.performance?.schema === R65_LONG_RUN_SCHEMA
    ? { state: r65RoleBinding("performance").bound && desktop === "passed" ? "passed" : "blocked",
      binding: r65RoleBinding("performance") }
    : boundedState(values.performance, build, (value) => value.status === "passed"
      && performanceReplays.length > 0 && desktop === "passed");
  const lifecycle = currentR65LongRun && values.lifecycle?.schema === R65_LONG_RUN_SCHEMA
    ? { state: r65RoleBinding("lifecycle").bound && desktop === "passed" && values.lifecycle.claims.resourceLifecycle === true
        ? "passed" : "blocked", binding: r65RoleBinding("lifecycle") }
    : boundedState(values.lifecycle, build, (value) => value.status === "passed"
      && lifecycleReplays.length > 0 && lifecycleReplays.every((replay) => replay.baselineRestored === true
        && replay.resourceReleaseObserved === true && replay.acquiredCount > 0 && replay.releasedCount > 0 && replay.retainedCount === 0)
      && desktop === "passed");
  const longRunReplays = currentR65LongRun ? []
    : values.longRun?.status === "passed" ? await replayResourceReferences(workspace, values.longRun, evidence) : [];
  const longRunEvaluation = currentR65LongRun
    ? { schema: "mainline-a-r65-long-run-alignment-v645",
      status: currentR65LongRun.bound && desktop === "passed" && mobile === "passed" && !fixture ? "measured-local" : "blocked",
      issues: unique([...currentR65LongRun.problems, ...(desktop === "passed" ? [] : ["desktop-browser-not-observed"]),
        ...(mobile === "passed" ? [] : ["mobile-viewport-not-observed"]), ...(fixture ? ["fixture-not-admitted"] : [])]) }
    : evaluateMainlineALongRunV635({
      replays: longRunReplays, expectedBuild: build,
      browserDevices: { desktop: desktop === "passed", mobileViewport: mobile === "passed" }, fixture,
    });
  const longRun = currentR65LongRun
    ? { state: longRunEvaluation.status === "measured-local" ? "passed" : "blocked",
      binding: { bound: currentR65LongRun.bound, problems: currentR65LongRun.problems } }
    : boundedState(values.longRun, build, (value) => value.status === "passed" && longRunEvaluation.status === "measured-local");
  const canonicalRuntimeReplay = await replayCanonicalRuntimeReference(workspace, evidence);
  const canonicalRuntimeIssues = canonicalRuntimeReplay ? [
    ...canonicalRuntimeReplay.issues,
    ...(desktop === "passed" ? [] : ["canonical-runtime:desktop-browser-not-observed"]),
    ...(buildPass ? [] : ["canonical-runtime:current-build-not-verified"]),
  ] : ["canonical-runtime-clearance-pending"];
  const canonicalRuntimeState = !canonicalRuntimeReplay ? "pending"
    : canonicalRuntimeIssues.length === 0 ? "passed" : "blocked";
  const canonicalImageIds = verifiedImageRows(values.canonicalAssets, "rows", index, values.coverage);
  const extensionImageIds = verifiedImageRows(values.sourceArtifacts, "rawImages", index);
  const canonicalIds = new Set(canonical.records.filter((record) => record.kind === "nebula").map((record) => record.id));
  const canonicalImages = canonicalImageIds.filter((id) => canonicalIds.has(id));
  const extensionRawFiles = extensionImageIds.filter((id) => !canonicalIds.has(id));
  const extensionImages = capturedExtensionIds(values, extensionRawFiles, index);
  const stellar = stellarSourceSummary(values, index);
  const sourceClosure = {
    canonicalRawOrRuntimeFilesVerified: canonicalImages.length,
    extensionRawImagesVerified: extensionImages.length,
    extensionRawFilesVerified: extensionRawFiles.length,
    targetCanonical: 12, targetExtension: 12, targetTotal: 24,
    totalDistinctVerified: new Set([...canonicalImages, ...extensionImages]).size,
    canonicalIds: canonicalImages, extensionIds: extensionImages,
    stellarRawResponses: stellar.rawResponses,
    stellarStructuredCandidates: stellar.structuredCandidates,
    stellarComponentConfirmed: stellar.componentConfirmed,
    stellarSummary: stellar,
    fixturePromotion: fixture,
    evidenceScope: "current local file hashes and captured source ledger; canonical asset HTTP binding is reported separately and does not grant copyright approval",
    canonicalAssetsHttpBindsCurrentBuild: buildBinding(values.canonicalAssets, build).bound,
  };
  const nebulaHashComplete = canonicalImages.length === 12 && extensionImages.length === 12 && !fixture;
  const rightsClosure = {
    status: "pending", signedItems: 0, pendingItems: 12,
    userDirectiveRecorded: Boolean(values.rightsDirective),
    signoffVerification: "not-run-no-trusted-signoff-input", legalClearance: false,
  };
  const gates = [
    gate("build-current-source", "static", buildPass ? "passed" : "blocked", [...buildProblems, ...(fixture ? ["fixture-not-admitted"] : [])]),
    gate("root-readonly-input", "static", rootCurrent && rootIdentity ? "passed" : "blocked", rootCurrent && rootIdentity ? [] : ["root-source-receipt-missing-stale-or-identity-invalid"]),
    gate("next-web-identity", "static", nextIdentity ? "passed" : "blocked", nextIdentity ? [] : ["next-web-package-identity-mismatch"]),
    gate("manifest-parity", "static", rootParity ? "passed" : "pending", rootParity ? [] : ["root-manifest-not-present-or-mismatched"]),
    gate("canonical-coverage", "static", canonical.complete ? "passed" : "blocked", canonical.complete ? [] : ["canonical-12-12-12-missing"]),
    gate("canonical-runtime", "browser", canonicalRuntimeState, canonicalRuntimeIssues),
    gate("http", "http", buildPass ? http.state : "blocked", http.binding.problems),
    gate("desktop-browser", "browser", buildPass ? desktop : "blocked", desktop === "passed" ? [] : ["desktop-browser-not-run", ...browser.binding.problems]),
    gate("mobile-viewport", "browser", buildPass ? mobile : "blocked", mobile === "passed" ? [] : ["mobile-viewport-not-run"]),
    gate("visual", "visual", buildPass ? visual : "blocked", visual === "passed" ? [] : ["visual-evidence-not-observed"]),
    gate("performance", "performance", buildPass ? performance.state : "blocked", performance.binding.problems),
    gate("lifecycle", "performance", buildPass ? lifecycle.state : "blocked", lifecycle.binding.problems),
    gate("nebula-file-integrity", "static", nebulaHashComplete ? "passed" : "blocked", nebulaHashComplete ? [] : ["nebula-24-file-closure-incomplete"]),
    gate("stellar-component-identity", "external-source", stellar.issues.length ? "blocked" : "pending", [...stellar.issues, "stellar-component-identity-pending"]),
    gate("rights-closure", "external-source", "pending", ["human-rights-signoff-pending"]),
    gate("physical-mobile", "performance", "not-run", ["physical-device-not-run"]),
    gate("long-run", "performance", !values.longRun ? "not-run" : buildPass ? longRun.state : "blocked",
      !values.longRun ? ["long-run-not-run"] : [...longRun.binding.problems, ...longRunEvaluation.issues]),
  ];
  const blockers = unique(gates.filter((item) => item.state !== "passed").flatMap((item) => item.blockers.length ? item.blockers : [`${item.id}-not-passed`]));
  return {
    schema: "mainline-a-release-alignment-pinned-v1", version: "explicit-evidence-v2",
    generatedAt: new Date().toISOString(), status: "blocked", evidenceClass: "static",
    candidatePackageAllowed: buildProblems.length === 0 && !fixture && nextIdentity,
    boundary: BOUNDARY, build, sourceBinding: { valid: buildPass, currentSha256: evidence.snapshot.sha256, problems: buildProblems },
    evidenceInput: evidence.bundle, evidenceIndex: index,
    receiptSelection: Object.fromEntries(Object.entries(input.entries).map(([role, descriptor]) => [role, {
      path: descriptor.path, sha256: descriptor.sha256, selection: "explicit-only",
      ...( ["http", "browser", "performance", "lifecycle", "longRun"].includes(role)
        ? currentR65LongRun && ["performance", "lifecycle", "longRun"].includes(role) && values[role]?.schema === R65_LONG_RUN_SCHEMA
          ? role === "longRun" ? { bound: currentR65LongRun.bound, problems: currentR65LongRun.problems } : r65RoleBinding(role)
          : buildBinding(values[role], build) : {}),
    }])),
    manifest: { canonicalStars: canonical.counts.star, canonicalNebulae: canonical.counts.nebula, canonicalConstellations: canonical.counts.constellation },
    rootObservation: { source: root ?? null, manifest: probe ?? null, suppliedSourceReceiptCurrent: rootCurrent, suppliedManifestBindsCoverage: probeCurrent },
    comparison: { manifestParity: rootParity, rootManifestProbeCurrent: probeCurrent, rootManifestProbeParity: rootParity, parentGitOperations: false },
    sourceClosure, rightsClosure, gates, blockers,
    canonicalRuntimeReplay,
    resourceReplay: { performance: performanceReplays, lifecycle: lifecycleReplays, longRun: longRunReplays,
      r65V643: currentR65LongRun?.offlineReport ?? null, longRunEvaluation,
      scope: "offline structure and hash replay of local observations; not production performance" },
    claims: { releaseApproved: false, runtimeAdmission: false, scientificValidity: false, realUserValidation: false, productionPerformance: false, copyrightApproval: false },
  };
}

export function failureReport(schema, error) {
  return { schema, status: "blocked", candidatePackageAllowed: false, readOnly: true, boundary: BOUNDARY, blockers: [error.message] };
}
