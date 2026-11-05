import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const body = "vesta";
const cli = "@gltf-transform/cli@4.4.2";
const acquisitionAssetReceiptPath = "docs/release/v591/acquisition-assets-nasa-small-bodies/vesta-nasa-shape-source.json";
const sourcePath = "source-cache/celestial-convergence-v591/small-bodies/vesta/vesta-nasa-global-a.stl";
const tempRoot = resolve(root, "tmp/v591-vesta-model-build");
const normalizedPath = resolve(tempRoot, "source-normalized.glb");
const normalizedReceiptPath = resolve(tempRoot, "source-normalized-receipt.json");
const weldedPath = resolve(tempRoot, "source-welded.glb");
const outputRoot = resolve(root, "public/models/candidate-v591/vesta");
const receiptPath = resolve(root, "docs/release/v591/vesta-model-lod-receipt-v591.json");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function fileSha(path) {
  return sha256(readFileSync(path));
}
function readSealed(path) {
  const value = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-vesta-model-seal:${path}`);
  return value;
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`v591-vesta-model-command:${command}:${args.join(" ")}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}
function inspect(path) {
  const csv = run("bunx", [cli, "inspect", path, "--format", "csv"]);
  const meshSection = csv.split(" MESHES")[1]?.split(" MATERIALS")[0] ?? "";
  const row = meshSection.split(/\r?\n/).map((line) => line.trim()).find((line) => /^0,/.test(line));
  assert(row, `v591-vesta-model-inspect-row:${path}`);
  const columns = row.split(",");
  const triangles = Number(columns[4]);
  const vertices = Number(columns[5]);
  assert(Number.isInteger(triangles) && triangles > 0 && Number.isInteger(vertices) && vertices > 0, `v591-vesta-model-inspect-counts:${path}`);
  const extensionMatch = /extensionsUsed,([^\r\n]*)/.exec(csv);
  return { triangles, vertices, extensionsUsed: extensionMatch?.[1]?.trim() || "none", csv };
}
function writeJsonAtomically(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

assert(tempRoot.startsWith(resolve(root, "tmp") + "\\"), "v591-vesta-model-temp-scope");
rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
mkdirSync(outputRoot, { recursive: true });

const acquisition = readSealed(acquisitionAssetReceiptPath);
assert(acquisition.status === "committed-single-request-no-retry", "v591-vesta-model-acquisition-status");
assert(acquisition.asset?.body === body && acquisition.asset?.outputPath === sourcePath, "v591-vesta-model-acquisition-identity");
assert(existsSync(resolve(root, sourcePath)), "v591-vesta-model-source-missing");
assert(statSync(resolve(root, sourcePath)).size === acquisition.asset.bytes && fileSha(resolve(root, sourcePath)) === acquisition.asset.sha256, "v591-vesta-model-source-sha");

run("python", [
  "scripts/prepare-v591-small-body-source.py",
  "--source", sourcePath,
  "--output", normalizedPath,
  "--receipt", normalizedReceiptPath,
  "--body", body,
]);
const normalized = JSON.parse(readFileSync(normalizedReceiptPath, "utf8"));
const normalizedUnsigned = { ...normalized };
delete normalizedUnsigned.receiptSha256;
assert(normalized.receiptSha256 === canonicalSha(normalizedUnsigned), "v591-vesta-model-normalized-seal");
assert(normalized.output?.triangleCount === 800000 && normalized.output?.watertight === true && normalized.output?.normals === true, "v591-vesta-model-normalized-geometry");
const sourceInspection = inspect(normalizedPath);
assert(sourceInspection.triangles === 800000 && sourceInspection.vertices === 400002, "v591-vesta-model-source-inspection");
run("bunx", [cli, "weld", normalizedPath, weldedPath]);
const weldedInspection = inspect(weldedPath);

const lodPlans = [
  { lod: 0, ratio: 0.125, error: 0.01, minimumTriangles: 80000, maximumTriangles: 125000 },
  { lod: 1, ratio: 0.03125, error: 0.025, minimumTriangles: 20000, maximumTriangles: 35000 },
  { lod: 2, ratio: 0.00625, error: 0.06, minimumTriangles: 4000, maximumTriangles: 8000 },
];
const lods = [];
for (const plan of lodPlans) {
  const simplifiedPath = resolve(tempRoot, `lod${plan.lod}-simplified.glb`);
  const prunedPath = resolve(tempRoot, `lod${plan.lod}-pruned.glb`);
  const meshoptPath = resolve(tempRoot, `lod${plan.lod}-meshopt.glb`);
  run("bunx", [cli, "simplify", weldedPath, simplifiedPath, "--ratio", String(plan.ratio), "--error", String(plan.error)]);
  run("bunx", [cli, "prune", simplifiedPath, prunedPath]);
  run("bunx", [cli, "meshopt", prunedPath, meshoptPath]);
  const inspection = inspect(meshoptPath);
  assert(inspection.triangles >= plan.minimumTriangles && inspection.triangles <= plan.maximumTriangles, `v591-vesta-model-lod-triangles:${plan.lod}:${inspection.triangles}`);
  assert(inspection.extensionsUsed.includes("EXT_meshopt_compression"), `v591-vesta-model-meshopt:${plan.lod}`);
  const finalPath = resolve(outputRoot, `vesta-lod${plan.lod}.glb`);
  const partialPath = `${finalPath}.part`;
  rmSync(partialPath, { force: true });
  renameSync(meshoptPath, partialPath);
  rmSync(finalPath, { force: true });
  renameSync(partialPath, finalPath);
  lods.push({
    lod: plan.lod,
    path: `public/models/candidate-v591/vesta/vesta-lod${plan.lod}.glb`,
    bytes: statSync(finalPath).size,
    sha256: fileSha(finalPath),
    triangleCount: inspection.triangles,
    vertexCount: inspection.vertices,
    extensionsUsed: inspection.extensionsUsed,
    simplification: { ratio: plan.ratio, error: plan.error, source: "independent-welded-source" },
  });
}
assert(lods[0].triangleCount > lods[1].triangleCount && lods[1].triangleCount > lods[2].triangleCount, "v591-vesta-model-lod-order");

const unsigned = {
  version: "v591-vesta-model-lod-receipt-v1",
  status: "three-lod-nasa-shape-model-ready-for-runtime-admission",
  body,
  source: {
    acquisitionReceiptPath: acquisitionAssetReceiptPath,
    acquisitionReceiptSha256: acquisition.receiptSha256,
    path: sourcePath,
    bytes: acquisition.asset.bytes,
    sha256: acquisition.asset.sha256,
    repositoryPath: acquisition.asset.repositoryPath,
    gitBlobSha1: acquisition.asset.gitBlobSha1,
    license: acquisition.asset.license,
    observationIdentity: acquisition.asset.observationIdentity,
    observationLimit: acquisition.asset.observationLimit,
  },
  normalized: {
    receiptSha256: normalized.receiptSha256,
    sha256: normalized.output.sha256,
    triangleCount: normalized.output.triangleCount,
    vertexCount: normalized.output.vertexCount,
    watertight: normalized.output.watertight,
    eulerNumber: normalized.output.eulerNumber,
    bounds: normalized.output.bounds,
    units: normalized.derivation.units,
    pivot: normalized.derivation.pivot,
    rotationAxis: normalized.derivation.rotationAxis,
  },
  pipeline: {
    trimeshVersion: normalized.derivation.version,
    gltfTransformVersion: "4.4.2",
    stages: ["inspect", "weld", "independent-simplify", "prune", "meshopt", "inspect"],
    sourceInspection: { triangles: sourceInspection.triangles, vertices: sourceInspection.vertices, extensionsUsed: sourceInspection.extensionsUsed },
    weldedInspection: { triangles: weldedInspection.triangles, vertices: weldedInspection.vertices, extensionsUsed: weldedInspection.extensionsUsed },
    deterministicParameters: true,
  },
  lods,
  presentationOnly: true,
  proceduralFallback: false,
  measuredPhotometryClaim: false,
  scientificPayloadWriteback: false,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
writeJsonAtomically(receiptPath, receipt);
console.log(JSON.stringify({
  status: receipt.status,
  sourceTriangles: sourceInspection.triangles,
  lods: lods.map(({ lod, bytes, sha256: digest, triangleCount, vertexCount }) => ({ lod, bytes, sha256: digest, triangleCount, vertexCount })),
  receiptSha256: receipt.receiptSha256,
}, null, 2));
