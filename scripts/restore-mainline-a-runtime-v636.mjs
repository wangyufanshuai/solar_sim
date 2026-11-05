import path from "node:path";
import process from "node:process";
import { constants } from "node:fs";
import { copyFile, lstat, mkdir, readFile, statfs } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  BOUNDARY, ensureOutputParent, failureReport, parseArguments, relativePath,
  safeFile, sha256, writeExclusiveJson,
} from "./mainline-a-release-evidence.mjs";
import { verifyRuntimePayloadV636 } from "./mainline-a-runtime-payload-v636.mjs";

const MANIFEST = "runtime-payload-manifest.json";

export function validateRestoreTargetV636(workspace, sourceDirectory, destination, output) {
  const source = relativePath(workspace, sourceDirectory);
  const target = relativePath(workspace, destination);
  const key = target.toLowerCase();
  const sourceKey = source.toLowerCase();
  if (key === sourceKey || key.startsWith(`${sourceKey}/`) || sourceKey.startsWith(`${key}/`)) {
    throw new Error("restore-source-destination-overlap");
  }
  if (output) {
    const report = relativePath(workspace, output).toLowerCase();
    if (report === key || report.startsWith(`${key}/`)) throw new Error("restore-receipt-must-be-outside-runtime");
    if (report === sourceKey || report.startsWith(`${sourceKey}/`)) throw new Error("restore-receipt-cannot-modify-source");
  }
  return { source, target };
}

export async function requireUnusedRestoreTargetV636(workspace, destination) {
  const target = path.resolve(workspace, relativePath(workspace, destination));
  try {
    await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return target;
    throw error;
  }
  throw new Error("restore-destination-already-exists");
}

export async function planRuntimeRestoreV636({ workspace, payloadManifest, destination, output }) {
  const pinned = await safeFile(workspace, payloadManifest?.path);
  if (path.basename(pinned.absolute) !== MANIFEST) throw new Error("restore-manifest-name-invalid");
  const raw = await readFile(pinned.absolute);
  if (!/^[a-f0-9]{64}$/u.test(payloadManifest?.sha256 ?? "") || sha256(raw) !== payloadManifest.sha256) {
    throw new Error("restore-manifest-pin-mismatch");
  }
  const directories = validateRestoreTargetV636(workspace, path.dirname(pinned.absolute), destination, output);
  await requireUnusedRestoreTargetV636(workspace, directories.target);
  if (output) {
    await requireUnusedRestoreTargetV636(workspace, output);
  }
  const verified = await verifyRuntimePayloadV636({
    workspace, directory: directories.source, expectedManifestSha256: payloadManifest.sha256,
  });
  const manifest = JSON.parse(raw.toString("utf8"));
  const bytes = manifest.files.reduce((sum, file) => sum + file.bytes, raw.length);
  const disk = await statfs(workspace);
  const freeBytes = disk.bavail * disk.bsize;
  const requiredFreeBytes = bytes + 64 * 1024 * 1024;
  if (freeBytes < requiredFreeBytes) throw new Error("restore-insufficient-free-space");
  return {
    schema: "mainline-a-runtime-restore-plan-v636", status: "planned", boundary: BOUNDARY,
    source: directories.source, destination: directories.target,
    payloadManifest: { path: pinned.relative, sha256: payloadManifest.sha256, bytes: raw.length },
    build: manifest.build, files: manifest.files.length, bytes, requiredFreeBytes, freeBytes,
    sourceVerification: verified, restorePolicy: "new-exclusive-directory-only",
    existingEnvironmentMutation: false, releaseApproved: false,
  };
}

export async function restoreRuntimeV636({ workspace, payloadManifest, destination, output, mode = "restore" }) {
  if (!["plan", "restore"].includes(mode)) throw new Error("restore-mode-invalid");
  const startedAt = new Date().toISOString();
  const plan = await planRuntimeRestoreV636({ workspace, payloadManifest, destination, output });
  if (mode === "plan") return { ...plan, readOnly: true };
  const source = await safeFile(workspace, plan.payloadManifest.path);
  const raw = await readFile(source.absolute);
  if (sha256(raw) !== plan.payloadManifest.sha256) throw new Error("restore-source-manifest-changed");
  const manifest = JSON.parse(raw.toString("utf8"));
  const target = await ensureOutputParent(workspace, plan.destination);
  await mkdir(target.absolute, { recursive: false });
  let copied = 0;
  let copiedBytes = 0;
  try {
    for (const descriptor of manifest.files) {
      const from = await safeFile(workspace, `${plan.source}/${descriptor.path}`);
      const to = await ensureOutputParent(workspace, `${plan.destination}/${descriptor.path}`);
      await copyFile(from.absolute, to.absolute, constants.COPYFILE_EXCL);
      copied += 1;
      copiedBytes += descriptor.bytes;
    }
    const manifestTarget = await ensureOutputParent(workspace, `${plan.destination}/${MANIFEST}`);
    await copyFile(source.absolute, manifestTarget.absolute, constants.COPYFILE_EXCL);
    const verified = await verifyRuntimePayloadV636({
      workspace, directory: plan.destination, expectedManifestSha256: plan.payloadManifest.sha256,
      expectedBuild: manifest.build,
    });
    const receipt = {
      schema: "mainline-a-runtime-restore-v636", status: "restored-verified",
      startedAt, endedAt: new Date().toISOString(), source: plan.source, destination: plan.destination,
      payloadManifest: plan.payloadManifest,
      restoredManifest: { path: `${plan.destination}/${MANIFEST}`, sha256: plan.payloadManifest.sha256 },
      build: manifest.build, files: copied, bytes: copiedBytes, verification: verified,
      restorePolicy: plan.restorePolicy, existingEnvironmentMutation: false,
      evidenceClass: "static", httpSmoke: "not-run", browser: "not-run", performance: "not-run",
      releaseApproved: false, rightsApproval: false, scientificValidity: false, boundary: BOUNDARY,
    };
    if (output) await writeExclusiveJson(workspace, output, receipt);
    return receipt;
  } catch (error) {
    const receipt = {
      schema: "mainline-a-runtime-restore-v636", status: "failed-partial-preserved",
      startedAt, endedAt: new Date().toISOString(), source: plan.source, destination: plan.destination,
      payloadManifest: plan.payloadManifest, copiedFiles: copied, copiedBytes,
      failure: error instanceof Error ? error.message : String(error),
      partialDirectoryPreserved: true, cleanupOrOverwritePerformed: false,
      releaseApproved: false, boundary: BOUNDARY,
    };
    if (output) {
      try { await writeExclusiveJson(workspace, output, receipt); }
      catch (reportError) { receipt.receiptWriteError = reportError.message; }
    }
    throw Object.assign(new Error(`restore-failed:${receipt.failure}`), { receipt });
  }
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2), ["payload", "sha256", "destination", "output", "mode", "json"]);
    if (!options.output && options.mode !== "plan") throw new Error("restore-output-required");
    const result = await restoreRuntimeV636({
      workspace: process.cwd(), payloadManifest: { path: options.payload, sha256: options.sha256 },
      destination: options.destination, output: options.output, mode: options.mode ?? "restore",
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(JSON.stringify(error.receipt ?? failureReport("mainline-a-runtime-restore-v636", error), null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
