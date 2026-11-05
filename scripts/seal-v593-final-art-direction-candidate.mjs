import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const root = process.cwd();
const receiptPath = resolve(root, "docs/release/v593/reseal-receipt-v593.json");
const requiredTracked = [
  "public/data/final-art-direction-v593/manifest.json",
  "docs/release/v593/source-manifest-v593.json",
  "docs/release/v593/freeze-before-v593.json",
  "docs/release/v593/current-state-receipt-v593.json",
  "docs/release/v593/capability-report-v593.json",
  "docs/release/v593/p1-browser-code-gate-v593.json",
  "docs/release/v593/p2-sun-browser-code-gate-v593.json",
  "docs/release/v593/p3-earth-browser-code-gate-v593.json",
  "docs/release/v593/p4-deep-sky-browser-code-gate-v593.json",
  "docs/release/v593/p5-saturn-corrective-browser-code-gate-v593.json",
  "dist/release/orbit-atlas-current-product-rc-candidate-v593.json",
  "app/data/finalArtDirectionManifestV593.generated.ts",
  "dist/content-packs/v593/index.json",
  "dist/content-packs/v593/v593-lite-surface-detail.manifest.json",
  "dist/content-packs/v593/v593-deep-field-observations.manifest.json",
  "docs/release/v593/final-sealed-browser-matrix-v593.json",
  "docs/release/v593/lite-browser-matrix-v593.json",
  "docs/release/v593/resource-lifecycle-v593.json",
  "docs/release/v593/soak-v593.json",
  "docs/release/v593/release-export-v593.json",
  "dist/release/atlas-v593-standalone-build-resource.json",
  "dist/release/atlas-v593-lite-build-resource.json",
];
const optionalTracked = ["docs/release/v593/human-visual-signoff-v593.json"];
function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}
function evidencePath(record, label) {
  if (
    !record
    || typeof record.path !== "string"
    || !Number.isSafeInteger(record.bytes)
    || record.bytes < 0
    || typeof record.sha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.sha256)
  ) throw new Error(`v593-reseal-evidence-record:${label}`);
  const absolute = resolve(root, record.path);
  const workspaceRelative = relative(root, absolute);
  if (isAbsolute(workspaceRelative) || workspaceRelative.startsWith("..")) {
    throw new Error(`v593-reseal-evidence-boundary:${label}`);
  }
  const bytes = readFileSync(absolute);
  if (bytes.byteLength !== record.bytes || createHash("sha256").update(bytes).digest("hex") !== record.sha256) {
    throw new Error(`v593-reseal-evidence-drift:${label}`);
  }
  return workspaceRelative.replaceAll("\\", "/");
}
const lifecycle = readJson("docs/release/v593/resource-lifecycle-v593.json");
const soak = readJson("docs/release/v593/soak-v593.json");
const finalBrowser = readJson("docs/release/v593/final-sealed-browser-matrix-v593.json");
const liteBrowser = readJson("docs/release/v593/lite-browser-matrix-v593.json");
const humanVisualSignoff = existsSync(resolve(root, optionalTracked[0])) ? readJson(optionalTracked[0]) : null;
if (
  lifecycle.version !== "v593-resource-lifecycle-v2"
  || soak.version !== "v593-soak-v2"
  || finalBrowser.version !== "v593-final-sealed-browser-matrix-receipt-v1"
  || liteBrowser.version !== "v593-lite-browser-matrix-v1"
  || lifecycle.sameRealmSceneExit?.receiptSha256 !== soak.sameRealmSceneExit?.receiptSha256
) throw new Error("v593-reseal-current-formal-evidence-contract");
const evidenceTracked = [...new Set([
  evidencePath(finalBrowser.evidence, "full-matrix-stage"),
  evidencePath(liteBrowser.evidence, "lite-matrix-stage"),
  evidencePath(lifecycle.mountCycles?.evidence, "mount-cycles"),
  evidencePath(lifecycle.sameRealmSceneExit?.evidence, "same-realm"),
  evidencePath(soak.cdpHeapSoak?.evidence, "cdp-heap"),
  ...(humanVisualSignoff ? [
    evidencePath(humanVisualSignoff.sourceStageDossier, "human-stage-dossier"),
    evidencePath(humanVisualSignoff.exactAbStage ?? humanVisualSignoff.captureCorrection, "exact-ab-stage"),
    ...(humanVisualSignoff.captureCorrectionLedger ? [evidencePath(humanVisualSignoff.captureCorrectionLedger, "capture-correction-ledger")] : []),
    evidencePath(humanVisualSignoff.userDecision, "human-user-decision"),
    evidencePath(humanVisualSignoff.liveBrowserAbTelemetry?.evidence, "exact-ab-live-telemetry"),
  ] : []),
])];
const tracked = [...new Set([
  ...requiredTracked,
  ...evidenceTracked,
  ...optionalTracked.filter((path) => existsSync(resolve(root, path))),
])];
const generatedAt = "2026-08-22T00:00:00.000Z";
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}
function run(script) {
  const result = spawnSync(process.execPath, [script], { cwd: root, stdio: "inherit", windowsHide: true });
  if (result.status !== 0) throw new Error(`v593-reseal-command:${script}:${result.status}`);
}
function snapshot() {
  return Object.fromEntries(tracked.map((path) => {
    const bytes = readFileSync(resolve(root, path));
    return [path, Object.freeze({ bytes: bytes.byteLength, sha256: sha256(bytes) })];
  }));
}

run("scripts/build-v593-content-packs.mjs");
run("scripts/build-v593-final-art-direction-candidate.mjs");
const firstPass = snapshot();
run("scripts/build-v593-content-packs.mjs");
run("scripts/build-v593-final-art-direction-candidate.mjs");
const secondPass = snapshot();
const byteIdentical = tracked.every((path) => (
  firstPass[path].bytes === secondPass[path].bytes
  && firstPass[path].sha256 === secondPass[path].sha256
));
if (!byteIdentical) throw new Error("v593-reseal-byte-drift");
const receipt = {
  version: "v593-final-art-direction-reseal-receipt-v2",
  generatedAt,
  status: "passed-double-byte-identical-reseal",
  passes: 2,
  outputs: secondPass,
  firstPass,
  secondPass,
  byteIdentical,
  evidenceTracked,
  formalProductPointer: "v263",
  scientificPayloadWriteback: false,
  productionPromotionAllowed: false,
};
receipt.receiptSha256 = canonicalSha(receipt);
await mkdir(dirname(receiptPath), { recursive: true });
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
