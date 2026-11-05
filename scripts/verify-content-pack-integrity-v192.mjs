import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const versionArgIndex = process.argv.indexOf("--version");
const evidenceVersion = versionArgIndex >= 0 ? process.argv[versionArgIndex + 1] : "v192";
if (!/^v\d+$/.test(evidenceVersion ?? "")) throw new Error(`Invalid evidence version: ${evidenceVersion}`);
const packRoot = path.resolve(root, "dist", "content-packs");
const index = JSON.parse(await readFile(path.join(packRoot, "index.json"), "utf8"));

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

const packs = [];
for (const descriptor of index.packs) {
  const manifest = JSON.parse(
    await readFile(path.join(packRoot, descriptor.path), "utf8"),
  );
  const failures = [];
  let verifiedBytes = 0;
  let verifiedFiles = 0;
  for (const entry of manifest.files) {
    const absolute = path.resolve(
      packRoot,
      "files",
      manifest.id,
      ...entry.path.split("/"),
    );
    try {
      const info = await stat(absolute);
      if (!info.isFile()) {
        failures.push({ path: entry.path, reason: "not-a-file" });
        continue;
      }
      if (info.size !== entry.bytes) {
        failures.push({
          path: entry.path,
          reason: "size-mismatch",
          expectedBytes: entry.bytes,
          actualBytes: info.size,
        });
        continue;
      }
      const actualSha256 = await sha256(absolute);
      if (actualSha256 !== entry.sha256) {
        failures.push({
          path: entry.path,
          reason: "sha256-mismatch",
          expectedSha256: entry.sha256,
          actualSha256,
        });
        continue;
      }
      verifiedFiles += 1;
      verifiedBytes += info.size;
    } catch (error) {
      failures.push({
        path: entry.path,
        reason: error?.code === "ENOENT" ? "missing" : "stat-error",
        detail: String(error?.message ?? error),
      });
    }
  }
  packs.push({
    id: manifest.id,
    manifestFileCount: manifest.files.length,
    manifestInstalledBytes: manifest.installedBytes,
    verifiedFiles,
    verifiedBytes,
    failureCount: failures.length,
    failures,
    passed: failures.length === 0
      && verifiedFiles === manifest.files.length
      && verifiedBytes === manifest.installedBytes,
  });
}

const report = {
  version: `${evidenceVersion}-content-pack-integrity`,
  generatedAt: new Date().toISOString(),
  packCount: packs.length,
  manifestFileCount: packs.reduce((sum, pack) => sum + pack.manifestFileCount, 0),
  verifiedFileCount: packs.reduce((sum, pack) => sum + pack.verifiedFiles, 0),
  failureCount: packs.reduce((sum, pack) => sum + pack.failureCount, 0),
  passed: packs.every((pack) => pack.passed),
  packs,
};
const output = path.resolve(root, "dist", "science", `content-pack-integrity-${evidenceVersion}.json`);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  packCount: report.packCount,
  manifestFileCount: report.manifestFileCount,
  verifiedFileCount: report.verifiedFileCount,
  failureCount: report.failureCount,
  passed: report.passed,
}, null, 2));
if (!report.passed) process.exitCode = 1;
