import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const receiptPath = resolve(root, "docs/release/v592/reseal-receipt-v592.json");
const outputs = [
  "public/data/living-universe-v592/manifest.json",
  "docs/release/v592/source-manifest-v592.json",
  "docs/release/v592/current-state-receipt-v592.json",
  "docs/release/v592/capability-report-v592.json",
  "dist/release/orbit-atlas-current-living-universe-candidate-v592.json",
  "app/data/livingUniverseManifestV592.generated.ts",
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function snapshot() {
  return Object.fromEntries(outputs.map((path) => [path, { bytes: readFileSync(resolve(root, path)).byteLength, sha256: sha256(readFileSync(resolve(root, path))) }]));
}
function runBuilder() {
  const result = spawnSync(process.execPath, ["scripts/build-v592-living-universe-candidate.mjs"], {
    cwd: root,
    env: { ...process.env, ATLAS_V592_GENERATED_AT: generatedAt },
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`v592-reseal-builder:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}
runBuilder();
const first = snapshot();
runBuilder();
const second = snapshot();
const identical = outputs.every((path) => first[path].bytes === second[path].bytes && first[path].sha256 === second[path].sha256);
const unsigned = {
  version: "v592-living-universe-reseal-receipt-v1",
  generatedAt,
  status: identical ? "passed-double-byte-identical-reseal" : "blocked-reseal-byte-drift",
  builder: "scripts/build-v592-living-universe-candidate.mjs",
  passes: 2,
  outputs: second,
  firstPass: first,
  secondPass: second,
  byteIdentical: identical,
  formalProductPointer: "v263",
  scientificPayloadWriteback: false,
  productionPromotionAllowed: false,
};
const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
mkdirSync(dirname(receiptPath), { recursive: true });
const partial = `${receiptPath}.part`;
writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
rmSync(receiptPath, { force: true });
renameSync(partial, receiptPath);
console.log(JSON.stringify({ status: document.status, byteIdentical: identical, receiptSha256: document.receiptSha256, outputs: second }, null, 2));
if (!identical) process.exitCode = 1;
