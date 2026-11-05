import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const output = path.join(root, "docs/release/v607/mainline-a-stage-a6-bound-build.json");
const distDir = ".next-mainline-a-v607-bound";
const receiptName = "atlas-mainline-a-v607-bound-build.json";
function walk(relative) {
  if (!existsSync(path.join(root, relative))) return [];
  return readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => {
    const next = `${relative}/${entry.name}`;
    return entry.isDirectory() ? walk(next) : entry.isFile() ? [next] : [];
  });
}
function capture() {
  const paths = [...new Set([
    ...walk("app"),
    ...walk("scripts").filter((file) => /\.(?:mjs|cjs|js|ts|json)$/.test(file)),
    ...walk("public/textures/mainline-a"),
    "package.json", "package-lock.json", "next.config.mjs", "tsconfig.json", "proxy.ts",
  ])].filter((file) => existsSync(path.join(root, file))).sort();
  return paths.map((file) => { const bytes = readFileSync(path.join(root, file)); return { path: file, bytes: bytes.length, sha256: sha256(bytes) }; });
}

const before = capture();
const inputDigest = sha256(JSON.stringify(before));
const startedAt = new Date().toISOString();
const base = {
  schema: "mainline-a6-bounded-source-build-v1",
  scope: "app-tree-scripts-build-config-mainline-image-files",
  unboundInputs: ["node_modules and native toolchain", "environment values", "public assets outside mainline-a", "generated inputs outside app/scripts"],
  fullDependencyClosureClaimed: false,
  startedAt,
  inputDigest,
  sources: before,
  distDir,
};
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify({ ...base, status: "running", exitCode: null }, null, 2)}\n`);
console.log(`Mainline A build: captured ${before.length} files (${inputDigest})`);
const args = ["scripts/build-atlas-profile.mjs", "--profile", "vercel-lite", "--dist-dir", distDir, "--previous-dist-dir", `${distDir}-previous`];
const child = spawn(process.execPath, args, {
  cwd: root,
  env: { ...process.env, ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: inputDigest, ATLAS_BUILD_RECEIPT_NAME: receiptName, ATLAS_NODE_HEAP_MB: "8192", ATLAS_ROUTE_OVERLAY: "on" },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
const logs = [];
child.stdout.on("data", (chunk) => { logs.push(chunk); process.stdout.write(chunk); });
child.stderr.on("data", (chunk) => { logs.push(chunk); process.stderr.write(chunk); });
const exitCode = await new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
const after = capture();
const unchanged = sha256(JSON.stringify(after)) === inputDigest;
const receiptPath = `dist/release/${receiptName}`;
const receipt = existsSync(path.join(root, receiptPath)) ? JSON.parse(readFileSync(path.join(root, receiptPath), "utf8")) : null;
const qualified = exitCode === 0 && unchanged && receipt?.candidateSourceManifestSha256 === inputDigest && receipt?.distDir === distDir;
const record = {
  ...base,
  status: qualified ? "profile-build-passed-listed-inputs-unchanged" : "not-qualified",
  finishedAt: new Date().toISOString(), exitCode,
  listedInputsUnchanged: unchanged,
  receiptPath, receipt,
  buildId: qualified ? receipt.buildId : null,
  fullRepositoryTypecheck: "not-proven-by-filtered-profile-build",
  browserPerformanceQualified: false,
  finalReleaseQualified: false,
};
writeFileSync(path.join(root, "docs/release/v607/mainline-a-stage-a6-bound-build.log"), Buffer.concat(logs));
writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`);
console.log(JSON.stringify({ status: record.status, exitCode, listedInputsUnchanged: unchanged, buildId: record.buildId, inputDigest }, null, 2));
if (!qualified) process.exitCode = 1;
