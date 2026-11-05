import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sha256 = async (relativePath) => createHash("sha256")
  .update(await readFile(path.join(root, relativePath)))
  .digest("hex");
const artifactPaths = [
  ["nsis", "src-tauri/target/release/bundle/nsis/Solar Atlas_1.0.0_x64-setup.exe"],
  ["msi", "src-tauri/target/release/bundle/msi/Solar Atlas_1.0.0_x64_en-US.msi"],
];
const stagePath = "dist/desktop-stage/v200/desktop-stage.json";
const stage = JSON.parse(await readFile(path.join(root, stagePath), "utf8"));
if (stage.version !== "v200-desktop-compact") throw new Error(`Unexpected desktop stage version: ${stage.version}`);
const artifacts = await Promise.all(artifactPaths.map(async ([kind, relativePath]) => ({
  kind,
  path: relativePath,
  bytes: (await stat(path.join(root, relativePath))).size,
  sha256: await sha256(relativePath),
  signed: false,
})));
const report = {
  version: "v200-desktop-compact-build-evidence",
  generatedAt: new Date().toISOString(),
  profile: "desktop-compact",
  stage: { path: stagePath, sha256: await sha256(stagePath), bytes: stage.bytes, files: stage.files, nextBuildId: stage.nextBuildId },
  webviewInstallMode: "embedBootstrapper",
  artifacts,
  installQa: "pending-clean-windows-11-vm-on-second-computer",
  passed: artifacts.length === 2 && artifacts.every((artifact) => artifact.bytes > 0),
};
await mkdir(path.join(root, "dist/science"), { recursive: true });
await writeFile(path.join(root, "dist/science/desktop-build-v200.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`v200 desktop build evidence: ${artifacts.length} unsigned installers`);
