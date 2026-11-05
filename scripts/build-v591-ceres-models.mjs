import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const cli = "@gltf-transform/cli@4.4.2";
const metadataPath = "docs/release/v591/metadata-probe-ceres-pds-target-products.json";
const acquisitionPath = "docs/release/v591/acquisition-asset-ceres-pds-radius-albedo.json";
const shapeBlockedPath = "docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-blocked.json";
const centralBlockedPath = "docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-central-blocked.json";
const radiusPath = "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/ceres_radius_g.tif";
const radiusLabelPath = "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/radius.xml";
const tempRoot = resolve(root, "tmp/v591-ceres-model-build");
const outputRoot = resolve(root, "public/models/candidate-v591/ceres");
const receiptPath = resolve(root, "docs/release/v591/ceres-model-lod-receipt-v591.json");
const plans = Object.freeze([
  { lod: 0, ratio: 0.40, error: 0.002, minimumTriangles: 95_000, maximumTriangles: 110_000 },
  { lod: 1, ratio: 0.095, error: 0.012, minimumTriangles: 21_000, maximumTriangles: 28_000 },
  { lod: 2, ratio: 0.019, error: 0.05, minimumTriangles: 4_000, maximumTriangles: 6_500 },
]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function fileDigest(path) { return sha256(readFileSync(resolve(root, path))); }
function readSealed(path) { const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-ceres-model-seal:${path}`); return value; }
function run(command, args) { const result = spawnSync(command, args, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true }); if (result.status !== 0) throw new Error(`v591-ceres-model-command:${command}:${args.join(" ")}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`); return `${result.stdout ?? ""}${result.stderr ?? ""}`; }
function inspect(path) {
  const csv = run("bunx", [cli, "inspect", path, "--format", "csv"]);
  const meshSection = csv.split(" MESHES")[1]?.split(" MATERIALS")[0] ?? "";
  const rows = meshSection.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^\d+,/.test(line));
  assert(rows.length > 0, `v591-ceres-model-inspect:${path}`);
  const metrics = rows.map((row) => row.split(",")).reduce((sum, columns) => ({ triangles: sum.triangles + Number(columns[4]), vertices: sum.vertices + Number(columns[5]) }), { triangles: 0, vertices: 0 });
  const extensionMatch = /extensionsUsed,([^\r\n]*)/.exec(csv);
  return { ...metrics, extensionsUsed: extensionMatch?.[1]?.trim() || "none" };
}
function atomicJson(path, value) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; rmSync(part, { force: true }); writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }

const metadata = readSealed(metadataPath);
const acquisition = readSealed(acquisitionPath);
const shapeBlocked = readSealed(shapeBlockedPath);
const centralBlocked = readSealed(centralBlockedPath);
assert(metadata.status === "required-shape-map-products-present-no-payload", "v591-ceres-model-metadata");
assert(acquisition.status === "four-assets-committed-single-request-each-no-retry" && acquisition.metadataReceiptSha256 === metadata.receiptSha256, "v591-ceres-model-acquisition");
assert(acquisition.modelPolicy === "derive-runtime-mesh-from-global-radius-geotiff;do-not-retry-blocked-plt-url", "v591-ceres-model-policy");
assert(shapeBlocked.receiptSha256 === acquisition.shapeBlockedReceiptSha256 && centralBlocked.receiptSha256 === acquisition.centralMirrorBlockedReceiptSha256, "v591-ceres-model-negative-chain");
const radiusAsset = acquisition.assets.find((asset) => asset.id === "ceres-radius-data");
const radiusLabel = acquisition.assets.find((asset) => asset.id === "ceres-radius-label");
assert(radiusAsset?.outputPath === radiusPath && radiusAsset.bytes === statSync(resolve(root, radiusPath)).size && radiusAsset.sha256 === fileDigest(radiusPath), "v591-ceres-model-radius-source");
assert(radiusLabel?.outputPath === radiusLabelPath && radiusLabel.sha256 === fileDigest(radiusLabelPath), "v591-ceres-model-radius-label");

rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
mkdirSync(outputRoot, { recursive: true });
const normalizedPath = resolve(tempRoot, "source-normalized.glb");
const normalizedReceiptPath = resolve(tempRoot, "source-normalized-receipt.json");
const weldedPath = resolve(tempRoot, "source-welded.glb");
run("python", ["scripts/prepare-v591-ceres-radius-model.py", "--radius", radiusPath, "--label", radiusLabelPath, "--output", normalizedPath, "--receipt", normalizedReceiptPath]);
const normalized = JSON.parse(readFileSync(normalizedReceiptPath, "utf8"));
const normalizedUnsigned = { ...normalized }; delete normalizedUnsigned.receiptSha256;
assert(normalized.receiptSha256 === canonicalSha(normalizedUnsigned), "v591-ceres-model-normalized-seal");
assert(normalized.output?.vertexCount === 130_562 && normalized.output?.triangleCount === 261_120 && normalized.output?.watertight === true && normalized.output?.normals === true, "v591-ceres-model-normalized-geometry");
assert(normalized.derivation?.syntheticDetailAdded === false && normalized.source?.missingPixelCount === 0, "v591-ceres-model-no-synthetic-detail");
run("bunx", [cli, "weld", normalizedPath, weldedPath]);
const weldedInspection = inspect(weldedPath);
assert(weldedInspection.triangles === 261_120, "v591-ceres-model-welded-triangles");

const lods = [];
for (const plan of plans) {
  const simplifiedPath = resolve(tempRoot, `lod${plan.lod}-simplified.glb`);
  const prunedPath = resolve(tempRoot, `lod${plan.lod}-pruned.glb`);
  const meshoptPath = resolve(tempRoot, `lod${plan.lod}-meshopt.glb`);
  const finalPath = resolve(outputRoot, `ceres-lod${plan.lod}.glb`);
  run("bunx", [cli, "simplify", weldedPath, simplifiedPath, "--ratio", String(plan.ratio), "--error", String(plan.error)]);
  run("bunx", [cli, "prune", simplifiedPath, prunedPath]);
  run("bunx", [cli, "meshopt", prunedPath, meshoptPath]);
  const inspection = inspect(meshoptPath);
  assert(inspection.triangles >= plan.minimumTriangles && inspection.triangles <= plan.maximumTriangles, `v591-ceres-model-lod-triangles:${plan.lod}:${inspection.triangles}`);
  assert(inspection.extensionsUsed.includes("EXT_meshopt_compression"), `v591-ceres-model-lod-meshopt:${plan.lod}`);
  rmSync(finalPath, { force: true });
  renameSync(meshoptPath, finalPath);
  lods.push({ lod: plan.lod, path: `public/models/candidate-v591/ceres/ceres-lod${plan.lod}.glb`, bytes: statSync(finalPath).size, sha256: fileDigest(`public/models/candidate-v591/ceres/ceres-lod${plan.lod}.glb`), triangleCount: inspection.triangles, vertexCount: inspection.vertices, normals: true, meshopt: true, pivot: "body-center-origin", units: "mean-radius-1", rotationAxis: "positive-y" });
}
assert(lods[0].triangleCount > lods[1].triangleCount && lods[1].triangleCount > lods[2].triangleCount, "v591-ceres-model-lod-order");
const unsigned = {
  version: "v591-ceres-model-lod-receipt-v1",
  generatedAt: process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-15T00:00:00Z",
  status: "ceres-three-lod-radius-derived-model-ready-for-runtime-admission",
  metadataReceiptSha256: metadata.receiptSha256,
  acquisitionReceiptSha256: acquisition.receiptSha256,
  shapeBlockedReceiptSha256: shapeBlocked.receiptSha256,
  centralMirrorBlockedReceiptSha256: centralBlocked.receiptSha256,
  sourceDetailCeiling: "pds-dawn-spc-radius-2222x1111-261120-triangles",
  source: { path: radiusPath, bytes: radiusAsset.bytes, sha256: radiusAsset.sha256, md5: radiusAsset.md5, productId: radiusAsset.productId, license: radiusAsset.license },
  normalized: { receiptSha256: normalized.receiptSha256, sourceProjection: normalized.derivation.sourceProjection, sourceUnits: normalized.source.units, units: normalized.derivation.units, pivot: normalized.derivation.pivot, rotationAxis: normalized.derivation.rotationAxis, watertight: true, eulerNumber: 2, minimumRadiusMeters: normalized.source.minimumRadiusMeters, maximumRadiusMeters: normalized.source.maximumRadiusMeters, syntheticDetailAdded: false },
  toolchain: { parser: normalized.derivation.tool, gltfTransform: "4.4.2", compression: "EXT_meshopt_compression", deterministic: true },
  lods,
  authorityState: acquisition.authorityState,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicJson(receiptPath, receipt);
rmSync(tempRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: receipt.status, lods: receipt.lods.map(({ lod, triangleCount, bytes, sha256: digest }) => ({ lod, triangleCount, bytes, sha256: digest })), receiptSha256: receipt.receiptSha256 }, null, 2));
