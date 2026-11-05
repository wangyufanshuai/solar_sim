import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const cli = "@gltf-transform/cli@4.4.2";
const bodies = [
  {
    body: "eros",
    sourcePath: "source-cache/celestial-convergence-v591/small-bodies/eros/eros-nasa.stl",
    assetReceiptPath: "docs/release/v591/acquisition-assets-nasa-git-blobs/eros-nasa-shape-source.json",
    expectedSourceTriangles: 200856,
    expectedNormalizedTriangles: 198730,
    detailCeiling: "nasa-shape-200856-triangles",
    plans: [
      { lod: 0, ratio: 0.50, error: 0.006, minimumTriangles: 90000, maximumTriangles: 110000 },
      { lod: 1, ratio: 0.125, error: 0.018, minimumTriangles: 22000, maximumTriangles: 28000 },
      { lod: 2, ratio: 0.025, error: 0.05, minimumTriangles: 4000, maximumTriangles: 6500 },
    ],
  },
  {
    body: "kleopatra",
    sourcePath: "source-cache/celestial-convergence-v591/small-bodies/kleopatra/kleopatra-nasa.stl",
    assetReceiptPath: "docs/release/v591/acquisition-assets-nasa-git-blobs/kleopatra-nasa-shape-source.json",
    expectedSourceTriangles: 4092,
    expectedNormalizedTriangles: 4092,
    detailCeiling: "nasa-low-resolution-radar-shape-4092-triangles",
    plans: [
      { lod: 0, ratio: 1, error: 0, minimumTriangles: 4000, maximumTriangles: 4200 },
      { lod: 1, ratio: 0.50, error: 0.035, minimumTriangles: 1800, maximumTriangles: 2300 },
      { lod: 2, ratio: 0.25, error: 0.08, minimumTriangles: 850, maximumTriangles: 1200 },
    ],
  },
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function fileSha(path) { return sha256(readFileSync(path)); }
function readSealed(relativePath) {
  const value = JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-small-body-model-seal:${relativePath}`);
  return value;
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true });
  if (result.status !== 0) throw new Error(`v591-small-body-model-command:${command}:${args.join(" ")}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}
function inspect(path) {
  const csv = run("bunx", [cli, "inspect", path, "--format", "csv"]);
  const meshSection = csv.split(" MESHES")[1]?.split(" MATERIALS")[0] ?? "";
  const rows = meshSection.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^\d+,/.test(line));
  assert(rows.length > 0, `v591-small-body-model-inspect:${path}`);
  const metrics = rows.map((row) => row.split(",")).reduce((sum, columns) => ({
    triangles: sum.triangles + Number(columns[4]),
    vertices: sum.vertices + Number(columns[5]),
  }), { triangles: 0, vertices: 0 });
  const extensionMatch = /extensionsUsed,([^\r\n]*)/.exec(csv);
  return { ...metrics, extensionsUsed: extensionMatch?.[1]?.trim() || "none" };
}
function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

const summaries = [];
for (const definition of bodies) {
  const { body } = definition;
  const acquisition = readSealed(definition.assetReceiptPath);
  assert(acquisition.status === "committed-single-request-no-retry", `v591-${body}-acquisition-status`);
  assert(acquisition.asset?.body === body && acquisition.asset?.outputPath === definition.sourcePath, `v591-${body}-acquisition-identity`);
  const sourceAbsolute = resolve(root, definition.sourcePath);
  assert(existsSync(sourceAbsolute) && statSync(sourceAbsolute).size === acquisition.asset.bytes && fileSha(sourceAbsolute) === acquisition.asset.sha256, `v591-${body}-source-sha`);
  const tempRoot = resolve(root, `tmp/v591-${body}-model-build`);
  const outputRoot = resolve(root, `public/models/candidate-v591/${body}`);
  const receiptPath = resolve(root, `docs/release/v591/${body}-model-lod-receipt-v591.json`);
  rmSync(tempRoot, { recursive: true, force: true });
  mkdirSync(tempRoot, { recursive: true });
  mkdirSync(outputRoot, { recursive: true });
  const normalizedPath = resolve(tempRoot, "source-normalized.glb");
  const normalizedReceiptPath = resolve(tempRoot, "source-normalized-receipt.json");
  const weldedPath = resolve(tempRoot, "source-welded.glb");
  run("python", ["scripts/prepare-v591-small-body-source.py", "--source", definition.sourcePath, "--output", normalizedPath, "--receipt", normalizedReceiptPath, "--body", body]);
  const normalized = JSON.parse(readFileSync(normalizedReceiptPath, "utf8"));
  const normalizedUnsigned = { ...normalized };
  delete normalizedUnsigned.receiptSha256;
  assert(normalized.receiptSha256 === canonicalSha(normalizedUnsigned), `v591-${body}-normalized-seal`);
  assert(normalized.source?.triangleCount === definition.expectedSourceTriangles, `v591-${body}-source-triangles`);
  assert(normalized.output?.triangleCount === definition.expectedNormalizedTriangles && normalized.output?.watertight === true && normalized.output?.normals === true, `v591-${body}-normalized-geometry`);
  const sourceInspection = inspect(normalizedPath);
  assert(sourceInspection.triangles === definition.expectedNormalizedTriangles, `v591-${body}-source-inspection`);
  run("bunx", [cli, "weld", normalizedPath, weldedPath]);
  const weldedInspection = inspect(weldedPath);
  const lods = [];
  for (const plan of definition.plans) {
    const simplifiedPath = resolve(tempRoot, `lod${plan.lod}-simplified.glb`);
    const prunedPath = resolve(tempRoot, `lod${plan.lod}-pruned.glb`);
    const meshoptPath = resolve(tempRoot, `lod${plan.lod}-meshopt.glb`);
    if (plan.ratio === 1) run("bunx", [cli, "copy", weldedPath, simplifiedPath]);
    else run("bunx", [cli, "simplify", weldedPath, simplifiedPath, "--ratio", String(plan.ratio), "--error", String(plan.error)]);
    run("bunx", [cli, "prune", simplifiedPath, prunedPath]);
    run("bunx", [cli, "meshopt", prunedPath, meshoptPath]);
    const inspection = inspect(meshoptPath);
    assert(inspection.triangles >= plan.minimumTriangles && inspection.triangles <= plan.maximumTriangles, `v591-${body}-lod-triangles:${plan.lod}:${inspection.triangles}`);
    assert(inspection.extensionsUsed.includes("EXT_meshopt_compression"), `v591-${body}-meshopt:${plan.lod}`);
    const finalPath = resolve(outputRoot, `${body}-lod${plan.lod}.glb`);
    const partial = `${finalPath}.part`;
    rmSync(partial, { force: true });
    renameSync(meshoptPath, partial);
    rmSync(finalPath, { force: true });
    renameSync(partial, finalPath);
    lods.push({
      lod: plan.lod,
      path: `public/models/candidate-v591/${body}/${body}-lod${plan.lod}.glb`,
      bytes: statSync(finalPath).size,
      sha256: fileSha(finalPath),
      triangleCount: inspection.triangles,
      vertexCount: inspection.vertices,
      extensionsUsed: inspection.extensionsUsed,
      simplification: { ratio: plan.ratio, error: plan.error, source: "independent-welded-source" },
      normals: true,
      meshopt: true,
      pivot: "bounds-midpoint",
      units: "normalized-diameter-2",
      rotationAxis: "positive-y",
    });
  }
  assert(lods[0].triangleCount > lods[1].triangleCount && lods[1].triangleCount > lods[2].triangleCount, `v591-${body}-lod-order`);
  const unsigned = {
    version: "v591-nasa-small-body-model-lod-receipt-v1",
    status: "three-lod-nasa-shape-model-ready-for-runtime-admission",
    body,
    source: {
      acquisitionReceiptPath: definition.assetReceiptPath,
      acquisitionReceiptSha256: acquisition.receiptSha256,
      path: definition.sourcePath,
      bytes: acquisition.asset.bytes,
      sha256: acquisition.asset.sha256,
      repositoryPath: acquisition.asset.repositoryPath,
      gitBlobSha1: acquisition.asset.gitBlobSha1,
      license: acquisition.asset.license,
      observationIdentity: acquisition.asset.observationIdentity,
      observationLimit: acquisition.asset.observationLimit,
      detailCeiling: definition.detailCeiling,
    },
    normalized: {
      receiptSha256: normalized.receiptSha256,
      triangleCount: normalized.output.triangleCount,
      vertexCount: normalized.output.vertexCount,
      watertight: normalized.output.watertight,
      eulerNumber: normalized.output.eulerNumber,
      bounds: normalized.output.bounds,
      units: normalized.derivation.units,
      pivot: normalized.derivation.pivot,
      rotationAxis: normalized.derivation.rotationAxis,
      printableSplitReconstruction: normalized.derivation.printableSplitReconstruction ?? null,
    },
    pipeline: {
      trimeshVersion: normalized.derivation.version,
      gltfTransformVersion: "4.4.2",
      stages: ["inspect", "weld", "independent-simplify", "prune", "meshopt", "inspect"],
      sourceInspection,
      weldedInspection,
      deterministicParameters: true,
    },
    lods,
    sourceDetailCeiling: definition.detailCeiling,
    presentationOnly: true,
    proceduralFallback: false,
    measuredPhotometryClaim: false,
    scientificPayloadWriteback: false,
  };
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicJson(receiptPath, receipt);
  rmSync(tempRoot, { recursive: true, force: true });
  summaries.push({ body, sourceTriangles: sourceInspection.triangles, lods: lods.map(({ lod, triangleCount, bytes, sha256: digest }) => ({ lod, triangleCount, bytes, sha256: digest })), receiptSha256: receipt.receiptSha256 });
}
console.log(JSON.stringify({ status: "eros-kleopatra-three-lod-models-ready", bodies: summaries }, null, 2));
