import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseVisualAssetDimensionsV590 } from "./visual-asset-dimensions-v590.mjs";

const root = process.cwd();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const assert = (condition, reason) => { if (!condition) throw new Error(reason); };
function verifySealed(path, field) {
  const value = readJson(path);
  const unsigned = { ...value };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === value[field], `v590-readonly-receipt:${path}`);
  return value;
}
function localPath(url) {
  assert(url.startsWith("/") && !url.startsWith("//") && !url.includes("\\"), `v590-readonly-url:${url}`);
  const decoded = decodeURIComponent(url.split("?")[0]);
  assert(!decoded.split("/").includes(".."), `v590-readonly-traversal:${url}`);
  const candidate = resolve(root, "public", decoded.replace(/^\/+/, ""));
  const publicRoot = resolve(root, "public");
  assert(candidate.toLowerCase().startsWith(`${publicRoot.toLowerCase()}\\`), `v590-readonly-public-root:${url}`);
  return candidate;
}
function sumUnique(rows, identity, bytes) {
  const unique = new Map();
  for (const row of rows) unique.set(identity(row), bytes(row));
  return [...unique.values()].reduce((sum, value) => sum + value, 0);
}

const manifest = readJson("public/data/celestial-rendering-v590/manifest.json");
const unsignedManifest = { ...manifest };
delete unsignedManifest.manifestSha256;
assert(manifest.version === "v590-celestial-rendering-candidate-v1", "v590-readonly-version");
assert(manifest.authorityNamespace === "candidate-v590-celestial-rendering", "v590-readonly-namespace");
assert(canonicalSha(unsignedManifest) === manifest.manifestSha256, "v590-readonly-manifest-sha");
assert(manifest.boundaries.formalProductPointer === "v263", "v590-readonly-formal-pointer");
assert(manifest.boundaries.scientificPayloadWriteback === false && manifest.boundaries.scientificAuthorityChanged === false, "v590-readonly-science-boundary");
assert(manifest.boundaries.singleCanvasRequired === true && manifest.boundaries.productionPromotionAllowed === false, "v590-readonly-release-boundary");
assert(manifest.runtime.basisTranscoderPath === "/basis-v590/" && manifest.runtime.unsafeEvalRequired === false, "v590-readonly-basis-runtime-policy");

const basisRuntimeReceipt = verifySealed("public/data/celestial-rendering-v590/basis-runtime-receipt.json", "receiptSha256");
assert(basisRuntimeReceipt.version === "v590-csp-safe-basis-runtime-v1" && basisRuntimeReceipt.status === "derived-runtime-complete", "v590-readonly-basis-runtime-identity");
assert(basisRuntimeReceipt.policy.unsafeEvalRequired === false && basisRuntimeReceipt.policy.historicalBasisRewritten === false, "v590-readonly-basis-runtime-boundary");
assert(basisRuntimeReceipt.output.path === manifest.runtime.basisTranscoderPath, "v590-readonly-basis-runtime-path");
assert(basisRuntimeReceipt.receiptSha256 === manifest.runtime.basisRuntimeReceiptSha256, "v590-readonly-basis-runtime-receipt");
for (const [kind, output] of Object.entries({ js: basisRuntimeReceipt.output.js, wasm: basisRuntimeReceipt.output.wasm })) {
  const path = resolve(root, output.path);
  assert(existsSync(path), `v590-readonly-basis-runtime-missing:${kind}`);
  const bytes = readFileSync(path);
  assert(bytes.byteLength === output.bytes && sha256(bytes) === output.sha256, `v590-readonly-basis-runtime-drift:${kind}`);
  assert(output.sha256 === manifest.runtime[`basisTranscoder${kind === "js" ? "Js" : "Wasm"}Sha256`], `v590-readonly-basis-runtime-manifest:${kind}`);
  if (kind === "js") assert(!bytes.toString("utf8").includes("newFunc(Function"), "v590-readonly-basis-runtime-dynamic-function");
}

const assetFiles = [];
const allowedLicenses = new Set(["NASA-public-domain", "USGS-public-domain", "PDS-public-domain", "Poly-Haven-CC0", "Gaia-existing-admission"]);
for (const asset of manifest.assets) {
  assert(allowedLicenses.has(asset.license.id), `v590-readonly-license-id:${asset.id}`);
  const source = new URL(asset.sourceUrl);
  assert(source.protocol === "https:" || source.protocol === "local-admitted-v588:" || source.protocol === "local-admitted-v9:" || source.protocol === "local-existing-gaia:", `v590-readonly-source-scheme:${asset.id}`);
  assert(asset.license.url.startsWith("https://"), `v590-readonly-license:${asset.id}`);
  for (const [variant, file] of Object.entries(asset.variants)) {
    const path = localPath(file.url);
    assert(existsSync(path), `v590-readonly-asset-missing:${asset.id}:${variant}`);
    const bytes = readFileSync(path);
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v590-readonly-asset-drift:${asset.id}:${variant}`);
    const actualDimensions = parseVisualAssetDimensionsV590(bytes, file.format);
    if (actualDimensions) {
      assert(
        actualDimensions.width === file.width && actualDimensions.height === file.height,
        `v590-readonly-asset-dimensions:${asset.id}:${variant}:${actualDimensions.width}x${actualDimensions.height}/${file.width}x${file.height}`,
      );
    }
    assetFiles.push({ assetId: asset.id, variant, ...file });
  }
}

const sourceBytes = sumUnique(manifest.assets, (asset) => asset.sourceSha256, (asset) => asset.sourceBytes);
const fullFiles = assetFiles.filter((file) => file.variant === "fullDesktop" || file.variant === "fullMobile");
const liteFiles = assetFiles.filter((file) => file.variant === "liteDesktop" || file.variant === "liteMobile");
const liteIncrementFiles = liteFiles.filter((file) => !file.inheritedFrom);
const liteBase = readJson("public/atlas-lite/manifest.json");
assert(liteBase.maxBytes === manifest.budgets.liteTotalBytesMaximum, "v590-readonly-lite-base-budget-identity");
const liteIncrementBytes = sumUnique(liteIncrementFiles, (file) => file.url, (file) => file.bytes);
const budgets = {
  sourceCache: [sourceBytes, manifest.budgets.sourceCacheBytesMaximum],
  fullCompressed: [sumUnique(fullFiles, (file) => file.url, (file) => file.bytes), manifest.budgets.fullCompressedBytesMaximum],
  liteIncrement: [liteIncrementBytes, manifest.budgets.liteIncrementBytesMaximum],
  liteTotal: [liteBase.installedBytes + liteIncrementBytes, manifest.budgets.liteTotalBytesMaximum],
};
for (const [name, [actual, maximum]] of Object.entries(budgets)) assert(actual <= maximum, `v590-readonly-budget:${name}:${actual}/${maximum}`);

const sourceManifest = verifySealed("docs/release/v590/source-manifest-v590.json", "receiptSha256");
const sourceManifestPaths = new Set(sourceManifest.files.map((file) => file.path));
for (const requiredPath of [
  "proxy.ts",
  "app/lib/atlasProxyContractV562.ts",
  "scripts/build-atlas-profile.mjs",
  "scripts/start-atlas-v590-standalone.mjs",
  "scripts/start-atlas-standalone.mjs",
]) assert(sourceManifestPaths.has(requiredPath), `v590-readonly-source-coverage:${requiredPath}`);
for (const file of sourceManifest.files) {
  const path = resolve(root, file.path);
  assert(existsSync(path), `v590-readonly-source-missing:${file.path}`);
  assert(sha256(readFileSync(path)) === file.sha256, `v590-readonly-source-drift:${file.path}`);
}
const freezeBefore = verifySealed("docs/release/v590/freeze-before-v590.json", "snapshotSha256");
const frozenRows = [...freezeBefore.inheritedFrozenSnapshot, ...freezeBefore.explicitFrozenSnapshot];
for (const row of frozenRows) {
  const path = resolve(root, row.path);
  const current = existsSync(path) ? sha256(readFileSync(path)) : null;
  assert(current === row.sha256, `v590-readonly-frozen-drift:${row.path}`);
}
const v589Sources = readJson("docs/release/v589/source-manifest-v589.json");
assert(v589Sources.files.length === 22, "v590-readonly-v589-source-count");
const frozenByPath = new Map(frozenRows.map((row) => [row.path, row.sha256]));
for (const row of v589Sources.files) assert(frozenByPath.get(row.path) === row.sha256, `v590-readonly-v589-freeze-coverage:${row.path}`);

const verification = verifySealed("docs/release/v590/verification-receipt-v590.json", "receiptSha256");
const freezeAfter = verifySealed("docs/release/v590/freeze-after-v590.json", "snapshotSha256");
const capability = verifySealed("docs/release/v590/capability-report-v590.json", "reportSha256");
const pointer = verifySealed("dist/release/orbit-atlas-current-celestial-rendering-candidate-v590.json", "pointerSha256");
assert(verification.manifestSha256 === manifest.manifestSha256 && pointer.manifestSha256 === manifest.manifestSha256, "v590-readonly-chain-manifest");
assert(pointer.verificationReceiptSha256 === verification.receiptSha256, "v590-readonly-chain-verification");
assert(pointer.freezeAfterSha256 === freezeAfter.snapshotSha256, "v590-readonly-chain-freeze");
assert(pointer.capabilityReportSha256 === capability.reportSha256, "v590-readonly-chain-capability");
for (const [kind, expected] of Object.entries({
  standalone: { distDir: ".next-atlas-v590-standalone-current", deliveryTier: "standalone-full" },
  lite: { distDir: ".next-atlas-v590-lite-current", deliveryTier: "vercel-lite" },
})) {
  const gate = capability.capabilities.buildGates[kind];
  assert(gate.status === "passed", `v590-readonly-build-gate:${kind}:${gate.status}`);
  const receiptPath = resolve(root, gate.receiptPath);
  assert(existsSync(receiptPath), `v590-readonly-build-receipt-missing:${kind}`);
  const receiptBytes = readFileSync(receiptPath);
  assert(sha256(receiptBytes) === gate.receiptSha256, `v590-readonly-build-receipt-drift:${kind}`);
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  assert(receipt.status === "passed" && receipt.distDir === expected.distDir, `v590-readonly-build-receipt-status:${kind}`);
  assert(receipt.deliveryTier === expected.deliveryTier, `v590-readonly-build-delivery-tier:${kind}`);
  assert(receipt.candidateSourceManifestSha256 === sourceManifest.receiptSha256, `v590-readonly-build-source-manifest:${kind}`);
  assert(receipt.buildId === readFileSync(resolve(root, expected.distDir, "BUILD_ID"), "utf8").trim(), `v590-readonly-build-id:${kind}`);
}
const generated = readFileSync(resolve(root, "app/data/celestialRenderingManifestV590.generated.ts"), "utf8");
assert(generated.includes(manifest.manifestSha256) && generated.includes(freezeBefore.snapshotSha256), "v590-readonly-generated-constants");

console.log(JSON.stringify({
  status: "verified-read-only",
  manifestSha256: manifest.manifestSha256,
  sourceCount: sourceManifest.files.length,
  v589FrozenSourceCoverage: `${v589Sources.files.length}/${v589Sources.files.length}`,
  budgetBytes: Object.fromEntries(Object.entries(budgets).map(([name, [actual, maximum]]) => [name, { actual, maximum }])),
  formalProductPointer: "v263",
  writesPerformed: 0,
}, null, 2));
