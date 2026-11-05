import { access, readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";

const workspace = path.resolve(process.cwd());
const parentRoot = path.resolve(workspace, "..");
const canonicalRoot = path.resolve(parentRoot, "web");
const defaultReceipt = path.join(workspace, "docs/release/v607/mainline-a-r66-identity-bridge-v626-final-010.json");
const receiptArg = process.argv.indexOf("--receipt");
const receiptPath = path.resolve(workspace, receiptArg >= 0 ? process.argv[receiptArg + 1] : defaultReceipt);
const pointerArg = process.argv.indexOf("--pointer");
const defaultPointer = path.join(workspace, "docs/release/v607/mainline-a-r66-release-package-v626-20260922-033.json");
const pointerPath = path.resolve(workspace, pointerArg >= 0 ? process.argv[pointerArg + 1] : defaultPointer);
const checkOnly = process.argv.includes("--check");
const jsonOnly = process.argv.includes("--json");
const SCHEMA = "mainline-a-release-identity-bridge-v626";
const PACKAGE_SCHEMA = "mainline-a-release-package-v626";
const PRODUCT_IDENTITY = "solar-sim-mainline-a";
const EXPECTED_ROOT_PACKAGE = "solar-sim-viz";
const EXPECTED_NEXT_PACKAGE = "solar-next-web";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stable(entry)]));
  return value;
}

function sha(value) {
  return createHash("sha256").update(Buffer.isBuffer(value) ? value : typeof value === "string" ? value : JSON.stringify(stable(value))).digest("hex");
}

function text(value, fallback = "") { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function inside(root, candidate) { const base = path.resolve(root); const value = path.resolve(candidate); return value === base || value.startsWith(`${base}${path.sep}`); }
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function readJson(file) { return JSON.parse(await readFile(file, "utf8")); }
async function safeRealPath(file) { try { return await realpath(file); } catch { return path.resolve(file); } }

function add(errors, code, detail, evidenceClass = "static") { errors.push({ code, detail, evidenceClass }); }

async function verifyReceiptShape(receipt, errors) {
  if (receipt.schema !== SCHEMA) add(errors, "schema-mismatch", `expected ${SCHEMA}, received ${receipt.schema}`, "static");
  if (receipt.productIdentity !== PRODUCT_IDENTITY) add(errors, "product-identity-mismatch", `expected ${PRODUCT_IDENTITY}, received ${receipt.productIdentity}`, "root-package");
  if (receipt.rootPackage?.packageName !== EXPECTED_ROOT_PACKAGE) add(errors, "root-package-mismatch", `received ${receipt.rootPackage?.packageName}`, "root-package");
  if (receipt.nextWebPackage?.packageName !== EXPECTED_NEXT_PACKAGE) add(errors, "next-web-package-mismatch", `received ${receipt.nextWebPackage?.packageName}`, "next-web-package");
  if (receipt.mapping?.releaseIdentityMatch !== true) add(errors, "release-identity-not-mapped", "root and next-web release identities are not mapped", "root-package");
  if (receipt.mapping?.runtimeNameDifferenceIntentional !== true) add(errors, "runtime-name-difference-unclassified", "runtime package names must be explicitly classified", "next-web-package");
  const boundary = receipt.boundary ?? {};
  const boundaryKeys = ["candidateOnly", "hold", "notAdmitted"];
  for (const key of boundaryKeys) if (boundary[key] !== true) add(errors, `boundary-${key}`, `${key} must remain true`, "rollback");
  if (boundary.scientificPayloadWriteback !== false) add(errors, "scientific-writeback-enabled", "writeback must remain false", "rollback");
  if (boundary.parentGitMutation !== false || boundary.physicsKernelMutation !== false) add(errors, "protected-boundary", "parent Git and physics kernel mutation must remain false", "rollback");
  if (boundary.runtimePromotion !== "closed") add(errors, "runtime-promotion-open", "runtime promotion must remain closed", "rollback");
  if (receipt.rootSource?.readOnly !== true) add(errors, "root-not-read-only", "root source must be read-only", "source-digest");
  if (receipt.rootSource?.hasGitDirectory === true) add(errors, "root-git-directory", "root mirror must not expose a Git directory", "root-package");
  if (receipt.status === "passed" && (receipt.blockers?.length ?? 0) > 0) add(errors, "status-blocker-drift", "passed receipt contains blockers", "static");
}

async function verifyRootBoundary(receipt, errors) {
  const root = path.resolve(receipt.rootMirror ?? "");
  const rootReal = await safeRealPath(root);
  if (root !== canonicalRoot) add(errors, "root-path-not-canonical", `expected ${canonicalRoot}, received ${root}`, "root-package");
  if (!inside(parentRoot, rootReal) || rootReal === parentRoot) add(errors, "root-realpath-outside", `resolved root ${rootReal} escapes the parent workspace`, "root-package");
  if (await exists(path.join(root, ".git"))) add(errors, "root-git-present", "root mirror contains .git", "root-package");
  if (!(await exists(path.join(root, "package.json")))) add(errors, "root-package-missing", "root package.json is missing", "root-package");
  return { root, rootReal };
}

async function verifyEvidenceIndex(receipt, errors) {
  const index = receipt.evidenceIndex ?? {};
  const paths = Object.entries(index).flatMap(([evidenceClass, values]) => (Array.isArray(values) ? values.map((value) => ({ evidenceClass, value })) : []));
  for (const entry of paths) {
    if (path.isAbsolute(entry.value)) {
      if (entry.evidenceClass === "source-digest" && path.resolve(entry.value) !== path.resolve(receipt.rootMirror)) add(errors, "absolute-evidence-path", `${entry.evidenceClass}:${entry.value}`, entry.evidenceClass);
      continue;
    }
    const resolved = path.resolve(workspace, entry.value);
    if (!inside(workspace, resolved)) add(errors, "evidence-path-escape", `${entry.evidenceClass}:${entry.value}`, entry.evidenceClass);
    if (!(await exists(resolved)) && entry.value !== "package.json" && entry.value !== "package-lock.json") add(errors, "evidence-missing", `${entry.evidenceClass}:${entry.value}`, entry.evidenceClass);
  }
  return paths.length;
}

async function verifyBuildReceipt(receipt, errors) {
  const buildPath = text(receipt.build?.receiptPath);
  if (!buildPath || buildPath === "missing") { add(errors, "build-receipt-missing", "identity bridge has no preserved build receipt", "build-receipt"); return null; }
  const resolved = path.resolve(workspace, buildPath);
  if (!inside(workspace, resolved)) { add(errors, "build-receipt-escape", buildPath, "build-receipt"); return null; }
  if (!(await exists(resolved))) { add(errors, "build-receipt-not-found", buildPath, "build-receipt"); return null; }
  const value = await readJson(resolved);
  if (value.runtimeBuildId !== receipt.build.runtimeBuildId) add(errors, "runtime-build-id-drift", buildPath, "build-receipt");
  const expectedBuildId = receipt.build.nextBuildId ?? receipt.build.buildId;
  if (value.buildId !== expectedBuildId) add(errors, "build-id-drift", buildPath, "build-receipt");
  if (receipt.build.receiptSha256 && sha(value) !== receipt.build.receiptSha256) add(errors, "build-receipt-sha-mismatch", buildPath, "build-receipt");
  return { path: buildPath, sha256: sha(value), value };
}

async function verifyPackagePointer(pointerFile, receipt, errors) {
  if (!(await exists(pointerFile))) { add(errors, "package-pointer-missing", pointerFile, "release-package"); return null; }
  const pointer = await readJson(pointerFile);
  if (pointer.schema !== PACKAGE_SCHEMA) add(errors, "package-pointer-schema", pointer.schema ?? "missing", "release-package");
  if (pointer.boundary?.scientificPayloadWriteback !== false) add(errors, "package-pointer-writeback", "pointer boundary is open", "release-package");
  if (pointer.rootMirror && pointer.rootMirror !== receipt.rootMirror) add(errors, "package-root-drift", `${pointer.rootMirror} != ${receipt.rootMirror}`, "release-package");
  if (!pointer.packagePath) { add(errors, "package-path-missing", "pointer has no packagePath", "release-package"); return pointer; }
  const packagePath = path.resolve(workspace, pointer.packagePath);
  if (!inside(workspace, packagePath)) { add(errors, "package-path-escape", pointer.packagePath, "release-package"); return pointer; }
  if (!(await exists(packagePath))) { add(errors, "package-file-missing", pointer.packagePath, "release-package"); return pointer; }
  const packageValue = await readJson(packagePath);
  if (packageValue.schema !== PACKAGE_SCHEMA) add(errors, "package-schema", packageValue.schema ?? "missing", "release-package");
  if (packageValue.packageId !== pointer.packageId) add(errors, "package-id-drift", `${pointer.packageId} != ${packageValue.packageId}`, "release-package");
  if (packageValue.comparison?.releaseIdentityMatch !== true) add(errors, "package-identity-gate", "package did not preserve release identity mapping", "release-package");
  if (pointer.sha256 && pointer.sha256 !== sha(packageValue)) add(errors, "package-value-sha-mismatch", pointer.packagePath, "release-package");
  return { pointer, packageValue, packagePath };
}

async function verifyAlignment(receipt, errors) {
  const alignmentPath = path.join(workspace, "docs/release/v607/mainline-a-r66-alignment-v626.json");
  if (!(await exists(alignmentPath))) { add(errors, "alignment-missing", alignmentPath, "release-package"); return null; }
  const alignment = await readJson(alignmentPath);
  if (alignment.workspaceBoundary?.rootMirror !== receipt.rootMirror) add(errors, "alignment-root-drift", `${alignment.workspaceBoundary?.rootMirror} != ${receipt.rootMirror}`, "release-package");
  if (alignment.comparison?.releaseIdentityMatch !== true) add(errors, "alignment-identity-gate", "alignment did not preserve release identity mapping", "release-package");
  if (alignment.boundary?.scientificPayloadWriteback !== false) add(errors, "alignment-writeback", "alignment boundary is open", "release-package");
  return alignment;
}

async function verifyRawPackageIdentity(receipt, errors) {
  const packageFile = path.join(workspace, "package.json");
  const packageLock = path.join(workspace, "package-lock.json");
  if (!(await exists(packageFile))) add(errors, "next-web-package-missing", packageFile, "next-web-package");
  if (!(await exists(packageLock))) add(errors, "next-web-lock-missing", packageLock, "next-web-package");
  if (await exists(packageFile)) {
    const value = await readJson(packageFile);
    if (value.name !== receipt.nextWebPackage?.packageName) add(errors, "next-web-package-sha-input-drift", `package name ${value.name}`, "next-web-package");
    if (value.mainlineAReleaseIdentity !== PRODUCT_IDENTITY) add(errors, "declared-release-identity-drift", `package field ${value.mainlineAReleaseIdentity ?? "missing"}`, "next-web-package");
    const actual = await readFile(packageFile);
    if (receipt.nextWebPackage?.packageSha256 && sha(actual) !== receipt.nextWebPackage.packageSha256) add(errors, "next-web-package-sha-mismatch", packageFile, "next-web-package");
  }
  if (await exists(packageLock) && receipt.nextWebPackage?.lockSha256) {
    const actualLock = await readFile(packageLock);
    if (sha(actualLock) !== receipt.nextWebPackage.lockSha256) add(errors, "next-web-lock-sha-mismatch", packageLock, "next-web-package");
  }
}

function verifyManifestLayers(receipt, errors) {
  const parity = receipt.manifestParity ?? {};
  const expectedStates = ["byte", "structural", "coverage"];
  for (const layer of expectedStates) {
    if (!(layer in parity)) add(errors, `manifest-${layer}-missing`, `manifest parity has no ${layer} layer`, "manifest");
  }
  if (parity.rootManifestPresent === true) add(errors, "root-manifest-claim-unexpected", "root manifest is not present in the canonical root mirror", "manifest");
  if (parity.state === "passed") add(errors, "manifest-parity-overclaim", "manifest parity cannot pass without a root manifest", "manifest");
}

function verifyRollback(receipt, errors) {
  const rollback = receipt.rollback ?? {};
  if (rollback.reversible !== true) add(errors, "rollback-not-reversible", "rollback metadata is not marked reversible", "rollback");
  const forbidden = Array.isArray(rollback.forbiddenActions) ? rollback.forbiddenActions : [];
  if (!forbidden.some((value) => /reset|clean|checkout/i.test(value)) || !forbidden.some((value) => /writeback/i.test(value))) add(errors, "rollback-forbidden-list-incomplete", "forbidden action list should include destructive and writeback actions", "rollback");
  if (!Array.isArray(rollback.steps) || rollback.steps.length < 3) add(errors, "rollback-steps-missing", "rollback must contain named reversible steps", "rollback");
  if (text(rollback.currentHead) === "unknown-head") add(errors, "rollback-head-missing", "current head is not recorded", "rollback");
}

function verifyEvidenceClassSeparation(receipt, errors) {
  const classes = ["static", "http", "visual", "browser", "performance", "external-source"];
  const notes = Array.isArray(receipt.notes) ? receipt.notes.join(" ").toLowerCase() : "";
  for (const evidenceClass of classes) {
    if (!notes.includes(evidenceClass) && evidenceClass !== "static") add(errors, `evidence-class-note-missing-${evidenceClass}`, `receipt notes do not name ${evidenceClass}`, "release-package");
  }
  if (/production performance|real user|scientific validity|legal clearance/i.test(notes)) add(errors, "evidence-overclaim-language", "identity bridge notes contain an unbounded proof claim", "release-package");
}

function summary(receipt, errors, evidenceCount) {
  const byClass = Object.fromEntries([...new Set(errors.map((entry) => entry.evidenceClass))].sort().map((value) => [value, errors.filter((entry) => entry.evidenceClass === value).map((entry) => entry.code)]));
  return {
    schema: "mainline-a-release-identity-bridge-verifier-v626",
    version: "v626-readonly-verifier",
    status: errors.length === 0 ? "passed" : "blocked",
    receipt: path.relative(workspace, receiptPath).replaceAll("\\", "/"),
    productIdentity: receipt.productIdentity,
    runtimeNames: { root: receipt.rootPackage?.runtimeName, nextWeb: receipt.nextWebPackage?.runtimeName, intentionalDifference: receipt.mapping?.runtimeNameDifferenceIntentional === true },
    bridgeStatus: receipt.status,
    evidenceCount,
    errors,
    errorsByEvidenceClass: byClass,
    boundary: receipt.boundary,
    claimsClosed: { sourceParity: false, manifestParity: false, legalClearance: false, scientificValidity: false, productionPerformance: false, realUserValidation: false },
  };
}

async function main() {
  const errors = [];
  if (!(await exists(receiptPath))) throw new Error(`missing identity bridge receipt: ${receiptPath}`);
  const receipt = await readJson(receiptPath);
  await verifyReceiptShape(receipt, errors);
  if (receipt.status !== "passed") add(errors, "bridge-status-blocked", `receipt status=${receipt.status}`, "release-package");
  await verifyRootBoundary(receipt, errors);
  const evidenceCount = await verifyEvidenceIndex(receipt, errors);
  await verifyRawPackageIdentity(receipt, errors);
  verifyManifestLayers(receipt, errors);
  verifyRollback(receipt, errors);
  verifyEvidenceClassSeparation(receipt, errors);
  await verifyBuildReceipt(receipt, errors);
  await verifyPackagePointer(pointerPath, receipt, errors);
  await verifyAlignment(receipt, errors);
  const result = summary(receipt, errors, evidenceCount);
  if (jsonOnly) console.log(JSON.stringify(result, null, 2)); else console.log(`R66 identity bridge verify: ${result.status} errors=${errors.length} product=${result.productIdentity}`);
  if (checkOnly && result.status !== "passed") process.exitCode = 1;
  return result;
}

await main();
