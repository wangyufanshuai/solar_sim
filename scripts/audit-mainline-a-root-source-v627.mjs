import { access, lstat, readdir, readFile, realpath, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";

/**
 * R66 root input audit.
 *
 * The V626 manifest probe answers one narrow question: whether the root app
 * contains a canonical coverage document.  This companion audit records the
 * read-only source inventory that explains that answer.  It deliberately
 * does not manufacture a manifest from source names, infer a route from a
 * screenshot, or promote a copied fixture.  The output is an input audit for
 * the release alignment job, never a root release receipt.
 */

const workspace = path.resolve(process.cwd());
const parentRoot = path.resolve(workspace, "..");
const canonicalRoot = path.resolve(parentRoot, "web");
const rootFlag = process.argv.indexOf("--root");
const requestedRoot = rootFlag >= 0
  ? path.resolve(process.argv[rootFlag + 1] ?? canonicalRoot)
  : canonicalRoot;
const outputFlag = process.argv.indexOf("--output");
const requestedOutput = outputFlag >= 0
  ? path.resolve(workspace, process.argv[outputFlag + 1] ?? "")
  : path.join(workspace, "docs/release/v607/mainline-a-r66-root-source-audit-v627.json");
const noWrite = process.argv.includes("--no-write") || process.argv.includes("--check");
const checkOnly = process.argv.includes("--check");
const jsonOnly = process.argv.includes("--json");
const allowTestRoot = process.argv.includes("--allow-test-root");

const SCHEMA = "mainline-a-root-source-audit-v627";
const VERSION = "v627-read-only-root-source-inventory";
const EXPECTED_ROOT_PACKAGE = "solar-sim-viz";
const EXPECTED_RELEASE_IDENTITY = "solar-sim-mainline-a";
const COVERAGE_SCHEMA = "mainline-a-canonical-coverage-v622";
const MAX_FILES = 2500;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
const IGNORED_DIRS = new Set(["node_modules", ".git", ".next", "dist", "tmp", "coverage"]);
const SOURCE_DIRS = new Set(["src", "public"]);
const MANIFEST_NAMES = new Set([
  "mainlineACanonicalCoverageV622.generated.json",
  "mainline-a-canonical-coverage-v622.json",
  "mainline-a-canonical-coverage.json",
]);
const MARKER_PATTERNS = Object.freeze({
  mainline: /mainline\s*-?\s*a/i,
  canonical: /canonical(?:coverage|manifest)?/i,
  stellar: /stellar|hero[-_ ]?star|starfield/i,
  nebula: /nebula/i,
  constellation: /constellation/i,
  assetRoute: /asset(?:s|Path|Url)|texture|route/i,
});
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".ico", ".glb", ".gltf", ".bin", ".mp4", ".woff", ".woff2", ".ttf", ".otf",
]);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, stable(entry)]));
}

function digest(value) {
  const input = Buffer.isBuffer(value) || value instanceof Uint8Array
    ? value
    : typeof value === "string" ? value : JSON.stringify(stable(value));
  return createHash("sha256").update(input).digest("hex");
}

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function int(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))].sort((a, b) => a.localeCompare(b));
}

function issue(code, severity, detail, evidenceClass = "static") {
  return { code, severity, detail, evidenceClass };
}

function within(root, target) {
  const a = path.resolve(root);
  const b = path.resolve(target);
  return a === b || b.startsWith(`${a}${path.sep}`);
}

function relative(root, target) {
  const value = path.relative(root, target);
  return value && !value.startsWith("..") && !path.isAbsolute(value)
    ? value.replaceAll("\\", "/")
    : value === "" ? "." : null;
}

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

async function resolved(target) {
  try { return await realpath(target); } catch { return path.resolve(target); }
}

async function parseJson(target) {
  try {
    const raw = await readFile(target, "utf8");
    return { value: JSON.parse(raw), raw, error: null };
  } catch (error) {
    return { value: null, raw: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function packageSummary(parsed, root) {
  const value = parsed.value;
  const name = text(value?.name, "unknown-package");
  const identity = text(value?.mainlineAReleaseIdentity, name === EXPECTED_ROOT_PACKAGE
    ? EXPECTED_RELEASE_IDENTITY
    : name);
  return {
    path: relative(root, path.join(root, "package.json")) ?? "package.json",
    present: Boolean(value && typeof value === "object"),
    packageName: name,
    packageType: text(value?.type, "unknown-type"),
    releaseIdentity: identity,
    scripts: Object.keys(value?.scripts ?? {}).sort(),
    sha256: parsed.raw ? digest(Buffer.from(parsed.raw, "utf8")) : null,
    errors: parsed.error ? [parsed.error] : [],
  };
}

function sourceKind(relativePath) {
  const parts = relativePath.split("/");
  if (parts[0] === "src") return "source";
  if (parts[0] === "public") return "public-asset";
  if (relativePath === "index.html") return "entrypoint";
  if (relativePath === "package.json" || relativePath === "package-lock.json") return "package-metadata";
  return "project-metadata";
}

function markerCounts(content) {
  return Object.fromEntries(Object.entries(MARKER_PATTERNS).map(([name, pattern]) => [
    name,
    [...String(content).matchAll(new RegExp(pattern.source, `${pattern.flags}g`))].length,
  ]));
}

function markerNames(counts) {
  return Object.entries(counts).filter(([, count]) => count > 0).map(([name]) => name).sort();
}

function manifestShape(value, raw, relativePath) {
  const records = Array.isArray(value?.records) ? value.records : [];
  const counts = value?.counts ?? {};
  const kinds = records.reduce((result, record) => {
    const kind = text(record?.kind, "unknown");
    result[kind] = (result[kind] ?? 0) + 1;
    return result;
  }, {});
  const boundary = {
    candidateOnly: value?.boundary?.candidateOnly === true,
    hold: value?.boundary?.hold === true,
    notAdmitted: value?.boundary?.notAdmitted === true,
    scientificPayloadWriteback: value?.boundary?.scientificPayloadWriteback === false,
  };
  const errors = [];
  if (!value || typeof value !== "object") errors.push("manifest-json-invalid");
  if (value?.schema !== COVERAGE_SCHEMA) errors.push("manifest-schema-mismatch");
  if (int(counts.total) !== 36 || int(counts.stars) !== 12 || int(counts.nebulae) !== 12 || int(counts.constellations) !== 12) errors.push("canonical-12-12-12-missing");
  if (records.length !== 36) errors.push("manifest-record-count-mismatch");
  if (kinds.star !== 12 || kinds.nebula !== 12 || kinds.constellation !== 12) errors.push("manifest-kind-count-mismatch");
  const ids = records.map((record) => text(record?.id)).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push("manifest-duplicate-id");
  if (Object.values(boundary).some((entry) => entry !== true)) errors.push("manifest-boundary-open");
  const structure = {
    schema: text(value?.schema),
    counts: { total: int(counts.total), stars: int(counts.stars), nebulae: int(counts.nebulae), constellations: int(counts.constellations) },
    kinds,
    ids: ids.sort(),
    boundary,
  };
  return {
    path: relativePath,
    present: Boolean(value),
    valid: errors.length === 0,
    errors: unique(errors),
    bytes: raw ? Buffer.byteLength(raw) : 0,
    sha256: raw ? digest(Buffer.from(raw, "utf8")) : null,
    structuralSha256: value ? digest(structure) : null,
    counts: structure.counts,
    recordCounts: kinds,
    boundary,
  };
}

async function inspectManifest(filePath, root) {
  const relativePath = relative(root, filePath);
  const parsed = await parseJson(filePath);
  return manifestShape(parsed.value, parsed.raw, relativePath ?? filePath);
}

async function inventory(root) {
  const files = [];
  const errors = [];
  let totalBytes = 0;
  let visited = 0;
  async function visit(directory) {
    if (visited >= MAX_FILES) {
      errors.push("file-limit-exceeded");
      return;
    }
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) {
      errors.push(`${relative(root, directory) ?? directory}: ${error.message}`);
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (visited >= MAX_FILES) { errors.push("file-limit-exceeded"); break; }
      if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) { await visit(target); continue; }
      if (!entry.isFile()) continue;
      visited += 1;
      const rel = relative(root, target);
      if (!rel) { errors.push(`outside-root:${target}`); continue; }
      let metadata;
      try { metadata = await lstat(target); } catch (error) { errors.push(`${rel}: ${error.message}`); continue; }
      if (metadata.isSymbolicLink()) { errors.push(`${rel}: symlink-rejected`); continue; }
      if (metadata.size > MAX_FILE_BYTES) { errors.push(`${rel}: file-size-limit`); continue; }
      totalBytes += metadata.size;
      if (totalBytes > MAX_TOTAL_BYTES) { errors.push("total-size-limit"); break; }
      const extension = path.extname(entry.name).toLowerCase();
      const record = {
        path: rel,
        kind: sourceKind(rel),
        bytes: metadata.size,
        binary: BINARY_EXTENSIONS.has(extension),
        sha256: null,
        markerCounts: {},
        markers: [],
      };
      try {
        const bytes = await readFile(target);
        record.sha256 = digest(bytes);
        if (!record.binary && (SOURCE_DIRS.has(rel.split("/")[0]) || ["index.html", "vite.config.js"].includes(rel))) {
          const content = bytes.toString("utf8");
          record.markerCounts = markerCounts(content);
          record.markers = markerNames(record.markerCounts);
        }
      } catch (error) { errors.push(`${rel}: ${error.message}`); }
      files.push(record);
    }
  }
  if (await exists(root)) await visit(root); else errors.push("root-missing");
  files.sort((left, right) => left.path.localeCompare(right.path));
  return { files, errors: unique(errors), visited, totalBytes, fileCount: files.length, inventorySha256: digest(files) };
}

function sourceSummary(scan) {
  const sourceFiles = scan.files.filter((file) => file.kind === "source" || file.kind === "entrypoint");
  const publicFiles = scan.files.filter((file) => file.kind === "public-asset");
  const markerTotals = Object.fromEntries(Object.keys(MARKER_PATTERNS).map((name) => [name, sourceFiles.reduce((sum, file) => sum + int(file.markerCounts?.[name]), 0)]));
  const markerFiles = sourceFiles.filter((file) => file.markers.length > 0).map((file) => file.path);
  const directorySummary = [...new Set(scan.files.map((file) => file.path.split("/")[0]))].sort().map((directory) => {
    const entries = scan.files.filter((file) => file.path.split("/")[0] === directory);
    return {
      directory,
      fileCount: entries.length,
      bytes: entries.reduce((sum, file) => sum + int(file.bytes), 0),
      binaryFiles: entries.filter((file) => file.binary).length,
      textFiles: entries.filter((file) => !file.binary).length,
      hashedFiles: entries.filter((file) => typeof file.sha256 === "string" && file.sha256.length === 64).length,
      markerFiles: entries.filter((file) => file.markers.length > 0).map((file) => file.path),
    };
  });
  return {
    sourceFileCount: sourceFiles.length,
    publicFileCount: publicFiles.length,
    directorySummary,
    markerTotals,
    markerFiles,
    routeLikeFiles: sourceFiles.filter((file) => file.markers.includes("assetRoute")).map((file) => file.path),
    mainlineFiles: sourceFiles.filter((file) => file.markers.includes("mainline")).map((file) => file.path),
    hasMainlineMarkers: markerTotals.mainline > 0,
    hasCanonicalMarkers: markerTotals.canonical > 0,
    hasAssetRouteMarkers: markerTotals.assetRoute > 0,
  };
}

function findManifestCandidates(scan, root) {
  return scan.files.filter((file) => MANIFEST_NAMES.has(path.basename(file.path))).map((file) => path.join(root, file.path));
}

async function inspectManifests(root, scan) {
  const paths = findManifestCandidates(scan, root);
  const values = [];
  for (const filePath of paths) values.push(await inspectManifest(filePath, root));
  return values.sort((left, right) => String(left.path).localeCompare(String(right.path)));
}

function packageLockSummary(parsed) {
  const value = parsed.value;
  const rootPackage = value?.packages?.[""] ?? value;
  return {
    path: "package-lock.json",
    present: Boolean(value && typeof value === "object"),
    packageName: text(rootPackage?.name, "unknown-package"),
    lockfileVersion: int(value?.lockfileVersion),
    sha256: parsed.raw ? digest(Buffer.from(parsed.raw, "utf8")) : null,
    errors: parsed.error ? [parsed.error] : [],
  };
}

function classifyIssues(rootPath, rootRealPath, packageInfo, lockInfo, scan, source, manifests) {
  const issues = [];
  const blockers = [];
  const canonical = path.resolve(rootPath) === canonicalRoot && rootRealPath === canonicalRoot;
  if (!canonical && !allowTestRoot) { issues.push(issue("root-path-boundary", "error", `root input must resolve to ${canonicalRoot}`)); blockers.push("root-path-boundary"); }
  if (packageInfo.packageName !== EXPECTED_ROOT_PACKAGE) { issues.push(issue("root-package-identity-mismatch", "error", `expected ${EXPECTED_ROOT_PACKAGE}, received ${packageInfo.packageName}`)); blockers.push("root-package-identity-mismatch"); }
  if (packageInfo.releaseIdentity !== EXPECTED_RELEASE_IDENTITY) { issues.push(issue("root-release-identity-mismatch", "error", `expected ${EXPECTED_RELEASE_IDENTITY}, received ${packageInfo.releaseIdentity}`)); blockers.push("root-release-identity-mismatch"); }
  if (packageInfo.errors.length) { issues.push(issue("root-package-unreadable", "error", packageInfo.errors.join("; "))); blockers.push("root-package-unreadable"); }
  if (lockInfo.present && lockInfo.packageName !== EXPECTED_ROOT_PACKAGE) { issues.push(issue("root-lock-identity-mismatch", "error", `lockfile names ${lockInfo.packageName}`)); blockers.push("root-lock-identity-mismatch"); }
  if (!scan.fileCount) { issues.push(issue("root-source-empty", "error", "root source inventory is empty")); blockers.push("root-source-empty"); }
  if (scan.errors.length) { issues.push(issue("root-source-scan-error", "error", scan.errors.join("; "))); blockers.push("root-source-scan-error"); }
  if (!manifests.length) { issues.push(issue("root-manifest-not-observed", "error", "no canonical coverage manifest was observed in the root input")); blockers.push("root-manifest-not-observed"); }
  const valid = manifests.filter((manifest) => manifest.valid);
  if (manifests.length && !valid.length) { issues.push(issue("root-manifest-invalid", "error", "root manifest candidates were observed but none passed schema validation")); blockers.push("root-manifest-invalid"); }
  if (source.hasMainlineMarkers === false) issues.push(issue("root-mainline-markers-absent", "info", "root source contains no Mainline A marker; absence is recorded, not inferred as coverage"));
  if (source.hasCanonicalMarkers === false) issues.push(issue("root-canonical-markers-absent", "info", "root source contains no canonical marker"));
  return { issues, blockers: unique(blockers), canonical, validManifestCount: valid.length };
}

function buildReport(rootPath, rootRealPath, packageInfo, lockInfo, scan, source, manifests, classification) {
  const blockers = unique([...classification.blockers, ...scan.errors.map((error) => `scan:${error}`)]);
  return {
    schema: SCHEMA,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    status: blockers.length ? "blocked" : "passed",
    evidenceClass: "static",
    evidenceClasses: ["static"],
    workspaceBoundary: {
      nextWeb: workspace,
      parentRoot,
      canonicalRoot,
      rootPath,
      rootRealPath,
      readOnlyInput: true,
      rootWrites: false,
      parentGitOps: false,
      outputWithinNextWeb: within(workspace, requestedOutput),
    },
    boundary: {
      candidateOnly: true,
      hold: true,
      notAdmitted: true,
      scientificPayloadWriteback: false,
      runtimePromotion: "closed",
      parentGitMutation: false,
      physicsKernelMutation: false,
    },
    root: {
      package: packageInfo,
      packageLock: lockInfo,
      source: source,
      manifests,
      inventory: scan,
    },
    classification,
    gates: [
      { id: "root-path-boundary", state: classification.canonical ? "passed" : "blocked", required: true, evidenceClass: "static", blockers: classification.canonical ? [] : ["root-path-boundary"] },
      { id: "root-package-identity", state: packageInfo.packageName === EXPECTED_ROOT_PACKAGE && packageInfo.releaseIdentity === EXPECTED_RELEASE_IDENTITY ? "passed" : "blocked", required: true, evidenceClass: "static", blockers: packageInfo.packageName === EXPECTED_ROOT_PACKAGE && packageInfo.releaseIdentity === EXPECTED_RELEASE_IDENTITY ? [] : ["root-package-identity-mismatch"] },
      { id: "root-source-inventory", state: scan.errors.length === 0 && scan.fileCount > 0 ? "passed" : "blocked", required: true, evidenceClass: "static", blockers: scan.errors.length === 0 && scan.fileCount > 0 ? [] : ["root-source-scan-error"] },
      { id: "root-canonical-manifest", state: manifests.some((manifest) => manifest.valid) ? "passed" : "blocked", required: true, evidenceClass: "static", blockers: manifests.some((manifest) => manifest.valid) ? [] : [manifests.length ? "root-manifest-invalid" : "root-manifest-not-observed"] },
      { id: "no-synthetic-promotion", state: "passed", required: true, evidenceClass: "rollback", blockers: [] },
    ],
    claimsClosed: {
      rootSourceObserved: scan.fileCount > 0,
      rootCoverage: manifests.some((manifest) => manifest.valid),
      manifestParity: false,
      scientificValidity: false,
      legalClearance: false,
      productionPerformance: false,
      realUserValidation: false,
    },
    blockers,
    issues: classification.issues,
    writes: { root: false, parentGit: false, scientificPayload: false, output: !noWrite },
    inputDigests: {
      packageSha256: packageInfo.sha256,
      packageLockSha256: lockInfo.sha256,
      inventorySha256: scan.inventorySha256,
      manifestSha256: manifests.map((manifest) => manifest.sha256),
      reportInputsSha256: digest({ packageInfo, lockInfo, scan, source, manifests, classification }),
    },
    notes: [
      "This audit inventories the canonical root input without writing to it or invoking Git.",
      "Source names, route markers, screenshots, and copied fixtures do not constitute canonical coverage evidence.",
      "A missing or invalid root manifest remains blocked; next-web coverage is never substituted.",
      "No network access, candidate promotion, scientific payload writeback, or physics-kernel operation is performed.",
    ],
  };
}

function validateOutput(target) {
  if (!within(workspace, target)) throw new Error(`output escapes next-web workspace: ${target}`);
}

async function main() {
  validateOutput(requestedOutput);
  const rootRealPath = await resolved(requestedRoot);
  const packageInfo = packageSummary(await parseJson(path.join(requestedRoot, "package.json")), requestedRoot);
  const lockInfo = packageLockSummary(await parseJson(path.join(requestedRoot, "package-lock.json")));
  const scan = await inventory(requestedRoot);
  const source = sourceSummary(scan);
  const manifests = await inspectManifests(requestedRoot, scan);
  const classification = classifyIssues(requestedRoot, rootRealPath, packageInfo, lockInfo, scan, source, manifests);
  const report = buildReport(requestedRoot, rootRealPath, packageInfo, lockInfo, scan, source, manifests, classification);
  if (!noWrite) await writeFile(requestedOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (jsonOnly) console.log(JSON.stringify(report, null, 2));
  else console.log(`R66 root source audit: ${report.status} files=${scan.fileCount} manifests=${manifests.length} blockers=${report.blockers.length}${noWrite ? " (no-write)" : ""}`);
  if (checkOnly && report.status !== "passed") process.exitCode = 1;
  return report;
}

await main();
