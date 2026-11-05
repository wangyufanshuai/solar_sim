import { access, lstat, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";

/**
 * R66 root manifest probe.
 *
 * The root application is an input to the next-web release audit.  This
 * command is deliberately read-only: it never creates a manifest in the root
 * application, never runs Git there, and never promotes a candidate asset.
 * A missing root manifest is reported as a blocking fact instead of being
 * inferred from next-web's generated coverage file.
 */

const workspace = path.resolve(process.cwd());
const parentRoot = path.resolve(workspace, "..");
const canonicalRoot = path.resolve(parentRoot, "web");
const rootArg = process.argv.indexOf("--root");
const requestedRoot = rootArg >= 0 ? path.resolve(process.argv[rootArg + 1] ?? canonicalRoot) : canonicalRoot;
const outputArg = process.argv.indexOf("--output");
const requestedOutput = outputArg >= 0 ? path.resolve(workspace, process.argv[outputArg + 1] ?? "") : path.join(workspace, "docs/release/v607/mainline-a-r66-root-manifest-probe-v626.json");
const checkOnly = process.argv.includes("--check");
const noWrite = checkOnly || process.argv.includes("--no-write");
const jsonOnly = process.argv.includes("--json");
const allowTestRoot = process.argv.includes("--allow-test-root");

const SCHEMA = "mainline-a-root-manifest-probe-v626";
const VERSION = "v626-read-only-root-manifest-probe";
const COVERAGE_SCHEMA = "mainline-a-canonical-coverage-v622";
const PRODUCT_IDENTITY = "solar-sim-mainline-a";
const EXPECTED_ROOT_PACKAGE = "solar-sim-viz";
const EXPECTED_NEXT_PACKAGE = "solar-next-web";
const KNOWN_MANIFEST_BASENAMES = new Set([
  "mainlineACanonicalCoverageV622.generated.json",
  "mainline-a-canonical-coverage-v622.json",
  "mainline-a-canonical-coverage.json",
]);
const IGNORED_DIRECTORIES = new Set(["node_modules", ".git", ".next", "dist", "tmp"]);
const MAX_FILES = 5000;
const MAX_BYTES = 20 * 1024 * 1024;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stable(entry)]));
  }
  return value;
}

function sha256(value) {
  const input = Buffer.isBuffer(value) || value instanceof Uint8Array
    ? value
    : typeof value === "string" ? value : JSON.stringify(stable(value));
  return createHash("sha256").update(input).digest("hex");
}

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function int(value) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function unique(values) {
  return [...new Set(values.map((value) => text(value)).filter(Boolean))].sort();
}

function issue(code, severity, detail, evidenceClass = "static") {
  return { code, severity, detail, evidenceClass };
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function safeRealPath(filePath) {
  try { return await realpath(filePath); } catch { return path.resolve(filePath); }
}

async function readJson(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return { value: JSON.parse(raw), raw, error: null };
  } catch (error) {
    return { value: null, raw: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function within(root, filePath) {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile === resolvedRoot || resolvedFile.startsWith(`${resolvedRoot}${path.sep}`);
}

function relative(root, filePath) {
  const value = path.relative(root, filePath);
  return value && !value.startsWith("..") && !path.isAbsolute(value) ? value.replaceAll("\\", "/") : null;
}

function manifestBoundary(value) {
  const boundary = value?.boundary ?? {};
  const keys = ["candidateOnly", "hold", "notAdmitted", "scientificPayloadWriteback", "runtimeWrites", "measurementWrites"];
  return Object.fromEntries(keys.map((key) => [key, typeof boundary[key] === "boolean" ? boundary[key] : null]));
}

function coverageCounts(value) {
  const counts = value?.counts ?? {};
  return { total: int(counts.total), stars: int(counts.stars), nebulae: int(counts.nebulae), constellations: int(counts.constellations) };
}

function recordCounts(value) {
  const records = Array.isArray(value?.records) ? value.records : [];
  return records.reduce((result, record) => {
    const kind = text(record?.kind, "unknown");
    result[kind] = (result[kind] ?? 0) + 1;
    return result;
  }, {});
}

function structuralSnapshot(value) {
  const records = Array.isArray(value?.records) ? value.records : [];
  const ids = records.map((record) => ({ id: text(record?.id), kind: text(record?.kind), route: text(record?.route?.route), status: text(record?.status) })).sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`));
  return { schema: text(value?.schema), counts: coverageCounts(value), recordCounts: recordCounts(value), ids, boundary: manifestBoundary(value) };
}

function validateCoverage(value, raw, sourcePath) {
  const errors = [];
  if (!value || typeof value !== "object") errors.push("manifest-json-invalid");
  if (value?.schema !== COVERAGE_SCHEMA) errors.push("manifest-schema-mismatch");
  const counts = coverageCounts(value);
  if (counts.total !== 36 || counts.stars !== 12 || counts.nebulae !== 12 || counts.constellations !== 12) errors.push("canonical-12-12-12-missing");
  const records = Array.isArray(value?.records) ? value.records : [];
  if (records.length !== 36) errors.push("manifest-record-count-mismatch");
  const kinds = recordCounts(value);
  if (kinds.star !== 12 || kinds.nebula !== 12 || kinds.constellation !== 12) errors.push("manifest-kind-count-mismatch");
  const ids = records.map((record) => text(record?.id)).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push("manifest-duplicate-id");
  const boundary = manifestBoundary(value);
  const boundaryValid = boundary.candidateOnly === true && boundary.hold === true && boundary.notAdmitted === true
    && boundary.scientificPayloadWriteback === false && boundary.runtimeWrites === false && boundary.measurementWrites === false;
  if (!boundaryValid) errors.push("manifest-boundary-open");
  return {
    path: sourcePath,
    present: Boolean(value),
    valid: errors.length === 0,
    errors: unique(errors),
    bytes: raw ? Buffer.byteLength(raw) : 0,
    sha256: raw ? sha256(Buffer.from(raw, "utf8")) : null,
    structuralSha256: value ? sha256(structuralSnapshot(value)) : null,
    schema: text(value?.schema, "missing"),
    counts,
    recordCounts: kinds,
    boundary,
    boundaryValid,
  };
}

async function inspectCandidates(root) {
  const candidates = [];
  const errors = [];
  let visited = 0;
  async function visit(directory) {
    if (visited >= MAX_FILES) return;
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) {
      errors.push(`${relative(root, directory) ?? directory}: ${error.message}`);
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (visited >= MAX_FILES || IGNORED_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) { await visit(fullPath); continue; }
      if (!entry.isFile() || !KNOWN_MANIFEST_BASENAMES.has(entry.name)) continue;
      visited += 1;
      let metadata;
      try { metadata = await lstat(fullPath); } catch (error) { errors.push(`${relative(root, fullPath)}: ${error.message}`); continue; }
      if (metadata.isSymbolicLink()) { errors.push(`${relative(root, fullPath)}: symlink rejected`); continue; }
      if (metadata.size > MAX_BYTES) { errors.push(`${relative(root, fullPath)}: exceeds audit limit`); continue; }
      const parsed = await readJson(fullPath);
      candidates.push(validateCoverage(parsed.value, parsed.raw, relative(root, fullPath)));
      if (parsed.error && !parsed.value) errors.push(`${relative(root, fullPath)}: ${parsed.error}`);
    }
  }
  if (await exists(root)) await visit(root); else errors.push("root-missing");
  return { candidates: candidates.sort((a, b) => String(a.path).localeCompare(String(b.path))), errors: unique(errors), visited };
}

async function packageIdentity(root) {
  const filePath = path.join(root, "package.json");
  const parsed = await readJson(filePath);
  const packageValue = parsed.value;
  return {
    path: relative(root, filePath) ?? "package.json",
    present: Boolean(packageValue),
    packageName: text(packageValue?.name, "unknown-package"),
    packageType: text(packageValue?.type, "unknown-type"),
    releaseIdentity: packageValue?.name === EXPECTED_ROOT_PACKAGE ? PRODUCT_IDENTITY : text(packageValue?.mainlineAReleaseIdentity, text(packageValue?.name, "unknown-package")),
    sha256: parsed.raw ? sha256(Buffer.from(parsed.raw, "utf8")) : null,
    errors: parsed.error ? [parsed.error] : [],
  };
}

async function nextCoverage() {
  const relativePath = "app/data/mainlineACanonicalCoverageV622.generated.json";
  const parsed = await readJson(path.join(workspace, relativePath));
  return validateCoverage(parsed.value, parsed.raw, relativePath);
}

function compare(rootInfo, nextInfo, rootScan, nextInfoCoverage, rootIsCanonical) {
  const blockers = [];
  const issues = [];
  if (!rootIsCanonical && !allowTestRoot) {
    issues.push(issue("root-path-boundary", "error", `root probe must read ${canonicalRoot}; received ${rootInfo.path}`));
    blockers.push("root-path-boundary");
  }
  if (rootInfo.packageName !== EXPECTED_ROOT_PACKAGE) {
    issues.push(issue("root-package-identity-mismatch", "error", `expected ${EXPECTED_ROOT_PACKAGE}, received ${rootInfo.packageName}`));
    blockers.push("root-package-identity-mismatch");
  }
  if (nextInfo.packageName !== EXPECTED_NEXT_PACKAGE) {
    issues.push(issue("next-web-package-identity-mismatch", "error", `expected ${EXPECTED_NEXT_PACKAGE}, received ${nextInfo.packageName}`));
    blockers.push("next-web-package-identity-mismatch");
  }
  const rootManifest = rootScan.candidates.find((candidate) => candidate.valid) ?? rootScan.candidates[0] ?? null;
  if (!rootManifest?.present) {
    issues.push(issue("root-manifest-not-present", "error", "root app has no canonical coverage manifest; next-web coverage cannot stand in for it"));
    blockers.push("root-manifest-not-present");
  } else if (!rootManifest.valid) {
    issues.push(issue("root-manifest-invalid", "error", `root manifest ${rootManifest.path} failed validation: ${rootManifest.errors.join(", ")}`));
    blockers.push("root-manifest-invalid");
  }
  if (!nextInfoCoverage.valid) {
    issues.push(issue("next-web-manifest-invalid", "error", `next-web manifest failed validation: ${nextInfoCoverage.errors.join(", ")}`));
    blockers.push("next-web-manifest-invalid");
  }
  const structuralMatch = Boolean(rootManifest?.valid && nextInfoCoverage.valid && rootManifest.structuralSha256 === nextInfoCoverage.structuralSha256);
  const digestMatch = Boolean(rootManifest?.valid && nextInfoCoverage.valid && rootManifest.sha256 === nextInfoCoverage.sha256);
  if (rootManifest?.valid && nextInfoCoverage.valid && !structuralMatch) {
    issues.push(issue("manifest-structure-diff", "error", "root and next-web canonical manifests have different structural snapshots"));
    blockers.push("manifest-structure-diff");
  }
  return {
    status: blockers.length ? "blocked" : "passed",
    rootManifest,
    nextWebManifest: nextInfoCoverage,
    structuralMatch,
    digestMatch,
    sourceRelation: digestMatch ? "same-bytes" : structuralMatch ? "same-structure-different-bytes" : "not-comparable",
    issues,
    blockers: unique(blockers),
  };
}

function buildReport(rootPath, rootRealPath, rootInfo, nextInfo, scan, nextManifest, comparison) {
  const boundary = { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, parentGitMutation: false, physicsKernelMutation: false, runtimePromotion: "closed" };
  const rootReadOnly = rootRealPath === canonicalRoot && rootInfo.present && !rootInfo.errors.length;
  const blockers = unique([...comparison.blockers, ...(rootReadOnly ? [] : ["root-read-only-boundary"])].concat(scan.errors.map((error) => `root-scan:${error}`)));
  const gates = [
    { id: "root-readonly", state: rootReadOnly ? "passed" : "blocked", required: true, evidenceClass: "static", blockers: rootReadOnly ? [] : ["root-read-only-boundary"] },
    { id: "root-manifest", state: comparison.rootManifest?.valid ? "passed" : "blocked", required: true, evidenceClass: "static", blockers: comparison.rootManifest?.valid ? [] : ["root-manifest-not-present"] },
    { id: "next-web-manifest", state: nextManifest.valid ? "passed" : "blocked", required: true, evidenceClass: "static", blockers: nextManifest.valid ? [] : ["next-web-manifest-invalid"] },
    { id: "manifest-structure", state: comparison.structuralMatch ? "passed" : "pending", required: true, evidenceClass: "static", blockers: comparison.structuralMatch ? [] : ["manifest-structure-diff"] },
    { id: "candidate-boundary", state: "passed", required: true, evidenceClass: "rollback", blockers: [] },
  ];
  return {
    schema: SCHEMA,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    status: blockers.length ? "blocked" : "passed",
    evidenceClass: "static",
    evidenceClasses: ["static"],
    workspaceBoundary: { workspace, parentRoot, canonicalRoot, rootPath, rootRealPath, readOnlyInput: true, rootWrites: false, parentGitOps: false },
    boundary,
    root: { ...rootInfo, realPath: rootRealPath, scan: { ...scan, candidates: scan.candidates }, manifest: comparison.rootManifest },
    nextWeb: { ...nextInfo, manifest: nextManifest },
    parity: { structuralMatch: comparison.structuralMatch, digestMatch: comparison.digestMatch, relation: comparison.sourceRelation, rootManifestPresent: Boolean(comparison.rootManifest?.present), nextWebManifestPresent: nextManifest.present },
    comparison,
    gates,
    blockers,
    claimsClosed: { rootCoverage: comparison.rootManifest?.valid === true, manifestParity: comparison.structuralMatch, legalClearance: false, scientificValidity: false, productionPerformance: false, realUserValidation: false },
    writes: { root: false, parentGit: false, scientificPayload: false, output: !noWrite },
    notes: ["The root mirror is read only; a missing root manifest remains a blocking finding.", "Generated next-web coverage is not used as root evidence.", "This probe does not perform network access, Git operations, candidate promotion or scientific payload writeback."],
    inputDigests: { rootPackageSha256: rootInfo.sha256, rootManifestSha256: comparison.rootManifest?.sha256 ?? null, nextWebManifestSha256: nextManifest.sha256, reportInputsSha256: sha256({ rootInfo, nextInfo, scan, nextManifest, comparison }) },
  };
}

function validateOutput(outputPath) {
  if (!within(workspace, outputPath)) throw new Error(`output escapes next-web workspace: ${outputPath}`);
}

async function main() {
  validateOutput(requestedOutput);
  const rootRealPath = await safeRealPath(requestedRoot);
  const rootIsCanonical = path.resolve(requestedRoot) === canonicalRoot && rootRealPath === canonicalRoot;
  const rootInfo = { ...(await packageIdentity(requestedRoot)), path: requestedRoot };
  const nextInfo = { ...(await packageIdentity(workspace)), path: workspace };
  const scan = await inspectCandidates(requestedRoot);
  const nextManifest = await nextCoverage();
  const comparison = compare(rootInfo, nextInfo, scan, nextManifest, rootIsCanonical);
  const report = buildReport(requestedRoot, rootRealPath, rootInfo, nextInfo, scan, nextManifest, comparison);
  if (!noWrite) await writeFile(requestedOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (jsonOnly) console.log(JSON.stringify(report, null, 2));
  else console.log(`R66 root manifest probe: ${report.status} rootManifest=${report.parity.rootManifestPresent} parity=${report.parity.structuralMatch} blockers=${report.blockers.length}${noWrite ? " (no-write)" : ""}`);
  if (checkOnly && report.status !== "passed") process.exitCode = 1;
  return report;
}

await main();
