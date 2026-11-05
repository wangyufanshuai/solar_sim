import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const cli = "@gltf-transform/cli@4.4.2";
const archiveReceiptPath = "docs/release/v591/acquisition-asset-tempel-1-pds-shape-v2.json";
const extractedRoot = "source-cache/celestial-convergence-v591/tempel-1/pds-shape-v2/dif-c-hriv_its_mri-5-tempel1-shape-v2.0";
const sourcePath = `${extractedRoot}/data/tempel1_2012_cart.wrl`;
const labelPath = `${extractedRoot}/data/tempel1_2012_cart.lbl`;
const mosaicPath = `${extractedRoot}/document/tempel1_8ppd_imagemosaic.png`;
const checksumPath = `${extractedRoot}/index/checksum.tab`;
const tempRoot = resolve(root, "tmp/v591-tempel-1-model-build");
const outputRoot = resolve(root, "public/models/candidate-v591/tempel-1");
const receiptPath = resolve(root, "docs/release/v591/tempel-1-model-lod-receipt-v591.json");
const plans = [
  { lod: 0, ratio: 1, error: 0, minimumTriangles: 32_040, maximumTriangles: 32_040 },
  { lod: 1, ratio: 0.25, error: 0.012, minimumTriangles: 7_000, maximumTriangles: 9_000 },
  { lod: 2, ratio: 0.0625, error: 0.045, minimumTriangles: 1_500, maximumTriangles: 2_600 },
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function fileDigest(path, algorithm = "sha256") { return createHash(algorithm).update(readFileSync(resolve(root, path))).digest("hex"); }
function readSealed(path) { const value = JSON.parse(readFileSync(resolve(root, path), "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-tempel1-model-seal:${path}`); return value; }
function run(command, args) { const result = spawnSync(command, args, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true }); if (result.status !== 0) throw new Error(`v591-tempel1-model-command:${command}:${args.join(" ")}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`); return `${result.stdout ?? ""}${result.stderr ?? ""}`; }
function inspect(path) {
  const csv = run("bunx", [cli, "inspect", path, "--format", "csv"]);
  const meshSection = csv.split(" MESHES")[1]?.split(" MATERIALS")[0] ?? "";
  const rows = meshSection.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^\d+,/.test(line));
  assert(rows.length > 0, `v591-tempel1-model-inspect:${path}`);
  const metrics = rows.map((row) => row.split(",")).reduce((sum, columns) => ({ triangles: sum.triangles + Number(columns[4]), vertices: sum.vertices + Number(columns[5]) }), { triangles: 0, vertices: 0 });
  const extensionMatch = /extensionsUsed,([^\r\n]*)/.exec(csv);
  return { ...metrics, extensionsUsed: extensionMatch?.[1]?.trim() || "none" };
}
function atomicJson(path, value) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; rmSync(part, { force: true }); writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }

const acquisition = readSealed(archiveReceiptPath);
assert(acquisition.status === "committed-single-request-no-retry" && acquisition.asset?.datasetId === "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0", "v591-tempel1-model-acquisition");
const archive = resolve(root, acquisition.asset.outputPath);
assert(existsSync(archive) && statSync(archive).size === acquisition.asset.bytes && fileDigest(acquisition.asset.outputPath) === acquisition.asset.sha256, "v591-tempel1-model-archive-drift");
const checksums = new Map(readFileSync(resolve(root, checksumPath), "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const match = /^([a-f0-9]{32})\s+(.+)$/i.exec(line); assert(match, `v591-tempel1-model-checksum-row:${line}`); return [match[2].trim().toLowerCase(), match[1].toLowerCase()]; }));
for (const path of [sourcePath, labelPath, mosaicPath]) {
  const relativeInside = path.slice(extractedRoot.length + 1).toLowerCase();
  assert(existsSync(resolve(root, path)) && fileDigest(path, "md5") === checksums.get(relativeInside), `v591-tempel1-model-pds-checksum:${relativeInside}`);
}

rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
mkdirSync(outputRoot, { recursive: true });
const normalizedPath = resolve(tempRoot, "source-normalized.glb");
const normalizedReceiptPath = resolve(tempRoot, "source-normalized-receipt.json");
const weldedPath = resolve(tempRoot, "source-welded.glb");
run("python", ["scripts/prepare-v591-tempel1-pds-source.py", "--source", sourcePath, "--label", labelPath, "--mosaic", mosaicPath, "--output", normalizedPath, "--receipt", normalizedReceiptPath]);
const normalized = JSON.parse(readFileSync(normalizedReceiptPath, "utf8"));
const normalizedUnsigned = { ...normalized }; delete normalizedUnsigned.receiptSha256;
assert(normalized.receiptSha256 === canonicalSha(normalizedUnsigned), "v591-tempel1-model-normalized-seal");
assert(normalized.source?.vertexCount === 16_022 && normalized.source?.triangleCount === 32_040 && normalized.source?.watertight === true, "v591-tempel1-model-source-geometry");
assert(normalized.output?.vertexCount === 16_022 && normalized.output?.triangleCount === 32_040 && normalized.output?.watertight === true && normalized.output?.normals === true, "v591-tempel1-model-normalized-geometry");
run("bunx", [cli, "weld", normalizedPath, weldedPath]);
const weldedInspection = inspect(weldedPath);
assert(weldedInspection.triangles === 32_040, "v591-tempel1-model-welded-triangles");
const lods = [];
for (const plan of plans) {
  const simplifiedPath = resolve(tempRoot, `lod${plan.lod}-simplified.glb`);
  const prunedPath = resolve(tempRoot, `lod${plan.lod}-pruned.glb`);
  const meshoptPath = resolve(tempRoot, `lod${plan.lod}-meshopt.glb`);
  const finalPath = resolve(outputRoot, `tempel-1-lod${plan.lod}.glb`);
  if (plan.ratio === 1) run("bunx", [cli, "copy", weldedPath, simplifiedPath]);
  else run("bunx", [cli, "simplify", weldedPath, simplifiedPath, "--ratio", String(plan.ratio), "--error", String(plan.error)]);
  run("bunx", [cli, "prune", simplifiedPath, prunedPath]);
  run("bunx", [cli, "meshopt", prunedPath, meshoptPath]);
  const inspection = inspect(meshoptPath);
  assert(inspection.triangles >= plan.minimumTriangles && inspection.triangles <= plan.maximumTriangles, `v591-tempel1-model-lod-triangles:${plan.lod}:${inspection.triangles}`);
  assert(inspection.extensionsUsed.includes("EXT_meshopt_compression"), `v591-tempel1-model-lod-meshopt:${plan.lod}`);
  rmSync(finalPath, { force: true });
  renameSync(meshoptPath, finalPath);
  lods.push({ lod: plan.lod, path: `public/models/candidate-v591/tempel-1/tempel-1-lod${plan.lod}.glb`, bytes: statSync(finalPath).size, sha256: fileDigest(`public/models/candidate-v591/tempel-1/tempel-1-lod${plan.lod}.glb`), triangleCount: inspection.triangles, vertexCount: inspection.vertices, normals: true, meshopt: true });
}
assert(lods[0].triangleCount > lods[1].triangleCount && lods[1].triangleCount > lods[2].triangleCount, "v591-tempel1-model-lod-order");
const unsigned = {
  version: "v591-tempel-1-model-lod-receipt-v1",
  generatedAt: "2026-08-14T00:00:00Z",
  status: "tempel-1-three-lod-model-ready-for-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  sourceDetailCeiling: "pds-deep-impact-stardust-next-32040-triangles",
  source: { path: sourcePath, bytes: statSync(resolve(root, sourcePath)).size, sha256: fileDigest(sourcePath), md5: fileDigest(sourcePath, "md5"), datasetId: acquisition.asset.datasetId, packageSha256: acquisition.asset.sha256, license: acquisition.asset.license },
  mosaic: { path: mosaicPath, bytes: statSync(resolve(root, mosaicPath)).size, sha256: fileDigest(mosaicPath), md5: fileDigest(mosaicPath, "md5") },
  normalized: { receiptSha256: normalized.receiptSha256, sourceFrame: "body-centered-source-positive-z-spin-axis", runtimeFrame: "right-handed-positive-y-spin-axis", sourceUnits: "kilometer", units: "normalized-diameter-2", pivot: "bounds-midpoint", rotationAxis: "positive-y", watertight: true, eulerNumber: 2, constraintFlagCounts: normalized.source.constraintFlagCounts, sourceFrameCenterOffsetKilometers: normalized.derivation.sourceFrameCenterOffsetKilometers, sourceMaximumExtentKilometers: normalized.derivation.sourceMaximumExtentKilometers },
  toolchain: { parser: normalized.derivation.version, gltfTransform: "4.4.2", compression: "EXT_meshopt_compression", deterministic: true },
  lods,
  authorityState: acquisition.authorityState,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicJson(receiptPath, receipt);
rmSync(tempRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: receipt.status, lods: receipt.lods.map(({ lod, triangleCount, bytes, sha256 }) => ({ lod, triangleCount, bytes, sha256 })), receiptSha256: receipt.receiptSha256 }, null, 2));
