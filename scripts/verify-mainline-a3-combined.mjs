import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const first = readJson("docs/release/v607/mainline-a-stage-a3-local-delivery.json");
const extension = readJson("docs/release/v607/mainline-a-stage-a3-extension-delivery.json");
const all = [...first.assets, ...extension.objects];
const failures = [];
const creditsText = fs.readFileSync(path.join(root, "public/textures/mainline-a/CREDITS.md"), "utf8");
const runtime = JSON.parse(execFileSync(process.execPath, [
  path.join(root, "node_modules/tsx/dist/cli.mjs"), "-e",
  'import { MAINLINE_A3_NEBULAE } from "./app/data/mainlineAMetadataV607.ts"; import { MAINLINE_A3_ASSET_COVERAGE_SUMMARY } from "./app/data/mainlineAAssetCoverageV607.ts"; import { MAINLINE_A1_OBJECTS } from "./app/data/mainlineARegistryV607.ts"; console.log(JSON.stringify({metadata:MAINLINE_A3_NEBULAE,coverage:MAINLINE_A3_ASSET_COVERAGE_SUMMARY,registry:MAINLINE_A1_OBJECTS.filter(row=>row.kind==="nebula")}));',
], { cwd: root, encoding: "utf8" }));
if (first.assets?.length !== 6) failures.push("first delivery count");
if (extension.objects?.length !== 6) failures.push("extension delivery count");
if (all.length !== 12 || new Set(all.map((asset) => asset.objectId)).size !== 12) failures.push("combined identity count");
const totalByteSize = all.reduce((sum, asset) => sum + asset.byteSize, 0);
if (totalByteSize !== 3_324_626) failures.push("combined byte size");
for (const asset of all) {
  const localPath = path.join(root, asset.localPath);
  if (!fs.existsSync(localPath)) { failures.push(`${asset.objectId}: missing local file`); continue; }
  const bytes = fs.readFileSync(localPath);
  if (bytes.byteLength !== asset.byteSize || sha256(bytes) !== asset.sha256) failures.push(`${asset.objectId}: local bytes mismatch`);
  if (asset.license !== "CC BY 4.0" || asset.rightsStatus !== "cleared" || !asset.credit?.trim()) failures.push(`${asset.objectId}: rights metadata`);
  if (!creditsText.split(/\r?\n/).includes(`- [${asset.imageId}](${asset.sourcePage}) — ${asset.credit}`)) failures.push(`${asset.objectId}: static credit missing or altered`);
  for (const [label, rows] of [["metadata", runtime.metadata], ["registry", runtime.registry]]) {
    const row = rows.find((item) => item.id === asset.objectId);
    if (!row || row.presentation.assetStatus !== "licensed" || row.presentation.rightsStatus !== "cleared" || row.presentation.assetId !== asset.imageId) failures.push(`${asset.objectId}: ${label} presentation mismatch`);
    if (row?.provenance[0]?.sourceUrl !== asset.sourcePage || row?.provenance[0]?.credit !== asset.credit || row?.provenance[0]?.license !== asset.license) failures.push(`${asset.objectId}: ${label} source mismatch`);
    if (JSON.stringify(row?.observationEncoding.bands) !== JSON.stringify(asset.bands)) failures.push(`${asset.objectId}: ${label} bands mismatch`);
  }
}
const creditEntryCount = (creditsText.match(/^\- \[[^\]]+\]\([^\)]+\)/gm) ?? []).length;
if (creditEntryCount !== all.length) failures.push(`credits entry count ${creditEntryCount}/${all.length}`);
if (runtime.metadata.length !== 12 || runtime.registry.length !== 12 || runtime.coverage.total !== 12 || runtime.coverage.licensed !== 12 || runtime.coverage.catalogMarkers !== 0 || runtime.coverage.manifestCandidates !== 0) failures.push("current runtime coverage mismatch");
if (!runtime.metadata.find((row) => row.id === "m1")?.provenance.some((source) => source.sourceId === "nasa-messier-1-distance")) failures.push("M1 distance provenance lost");
const sourceInputs = ["docs/release/v607/mainline-a-stage-a3-local-delivery.json", "docs/release/v607/mainline-a-stage-a3-extension-delivery.json", "app/data/mainlineANebulaVisualAssetsV607.all.generated.ts", "app/data/mainlineAMetadataV607.ts", "app/data/mainlineARegistryV607.ts", "app/data/mainlineAAssetCoverageV607.ts", "app/data/mainlineA3MetadataV607.test.ts", "scripts/materialize-mainline-a3-all-assets.mjs", "scripts/verify-mainline-a3-combined.mjs", "public/textures/mainline-a/CREDITS.md"];
const result = {
  schema: "mainline-a3-combined-acceptance-v1",
  verifiedAt: new Date().toISOString(),
  status: failures.length ? "failed" : "12-assets-cleared-local-bytes-verified-registry-generated",
  sourceInputs,
  sourceHashes: sourceInputs.map((input) => ({ path: input, sha256: sha256(fs.readFileSync(path.join(root, input))) })),
  assetCount: all.length,
  totalByteSize,
  originalAssetCount: first.assets?.length ?? 0,
  extensionAssetCount: extension.objects?.length ?? 0,
  licensedObjectIds: all.map((asset) => asset.objectId),
  failures,
  boundaries: {
    runtimeResolver: "integrated-for-12-object-lookup",
    metadataCoverage: failures.length ? "not-qualified" : "12-of-12-runtime-metadata-registry-and-static-credits-verified",
    browserVisual: "separate-browser-matrix-one-nebula-only; full-twelve-visual-acceptance-pending",
    performance: "pending"
  }
};
const output = "docs/release/v607/mainline-a3-combined-acceptance.json";
fs.writeFileSync(path.join(root, output), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ ...result, receipt: output }, null, 2));
if (failures.length) process.exitCode = 1;
