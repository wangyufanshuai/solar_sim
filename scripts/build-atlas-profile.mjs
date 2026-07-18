import { spawn } from "node:child_process";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readlink,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch {
    return false;
  }
}

function within(parent, candidate) {
  const result = relative(parent, candidate);
  return result === "" || (!result.startsWith("..") && !isAbsolute(result));
}

function assertSafeBuildDirectory(root, distDir) {
  if (!/^\.next[-a-zA-Z0-9.]*$/.test(distDir)) {
    throw new Error(`Unsafe Next dist directory: ${distDir}`);
  }
  const target = resolve(root, distDir);
  if (!within(root, target) || target === root) {
    throw new Error(`Next dist directory escapes workspace: ${target}`);
  }
  return target;
}

async function renameWithRetry(source, destination) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rename(source, destination);
      return;
    } catch (error) {
      lastError = error;
      if (!new Set(["EPERM", "EBUSY", "EACCES"]).has(error?.code)) throw error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function removeBuildDirectory(directory, internalDistDir) {
  const junctions = [
    join(directory, "standalone", "public"),
    join(directory, "standalone", internalDistDir, "static"),
  ];
  for (const junction of junctions) {
    if (!await exists(junction)) continue;
    const stat = await lstat(junction);
    if (stat.isSymbolicLink()) await rm(junction, { force: true });
  }
  await rm(directory, { recursive: true, force: true });
}

async function detachJunctions(directory, detached) {
  if (!await exists(directory)) return;
  const boundary = await realpath(directory);

  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const candidate = join(current, entry.name);
      const info = await lstat(candidate);
      const resolved = info.isDirectory() ? await realpath(candidate) : candidate;
      const leavesBoundary = info.isDirectory() && !within(boundary, resolved);
      if (info.isSymbolicLink() || leavesBoundary) {
        detached.push({ path: candidate, target: await readlink(candidate) });
        await rm(candidate, { force: true });
      } else if (info.isDirectory()) {
        await visit(candidate);
      }
    }
  }

  await visit(directory);
}

async function restoreJunctions(junctions) {
  for (const junction of junctions) {
    await mkdir(dirname(junction.path), { recursive: true });
    await symlink(junction.target, junction.path, "junction");
  }
}

async function validateBuildTopology(target, distDir) {
  for (const required of [
    join(target, "BUILD_ID"),
    join(target, "standalone", "server.js"),
    join(target, "standalone", distDir),
  ]) {
    if (!await exists(required)) throw new Error(`Incomplete standalone build: ${required}`);
  }
  const buildId = (await readFile(join(target, "BUILD_ID"), "utf8")).trim();
  if (!buildId) throw new Error("Standalone build has an empty BUILD_ID");

  const standalone = join(target, "standalone");
  let directoryCount = 0;
  async function visit(current) {
    directoryCount += 1;
    if (directoryCount > 25_000) {
      throw new Error("Standalone topology exceeds the directory safety budget");
    }
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const candidate = join(current, entry.name);
      const info = await lstat(candidate);
      if (info.isSymbolicLink()) {
        throw new Error(`Fresh build unexpectedly contains a link: ${candidate}`);
      }
      if (!info.isDirectory()) continue;
      const resolved = await realpath(candidate);
      if (!within(target, resolved)) {
        throw new Error(`Standalone directory escapes build root: ${candidate} -> ${resolved}`);
      }
      const segments = relative(standalone, candidate).split(/[\\/]+/);
      if (segments.slice(1).includes("standalone")) {
        throw new Error(`Recursive standalone trace detected: ${candidate}`);
      }
      await visit(candidate);
    }
  }
  await visit(standalone);
  return { buildId, directoryCount };
}

async function runBuild(root, env) {
  const command = process.execPath;
  const args = [resolve(root, "node_modules", "next", "dist", "bin", "next"), "build", "--webpack"];
  return new Promise((resolveCode, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit", shell: false });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Next build terminated by ${signal}`));
      else resolveCode(code ?? 1);
    });
  });
}

const root = await realpath(process.cwd());
const profile = argumentValue("--profile", "standalone-full");
const preserveActiveDev = process.argv.includes("--preserve-active-dev");
const rotate = process.argv.includes("--rotate");
const distDir = argumentValue(
  "--dist-dir",
  profile === "vercel-lite" ? ".next-atlas-lite-current" : ".next-atlas-standalone-current",
);
const previousDistDir = argumentValue("--previous-dist-dir", `${distDir}-previous`);
if (!new Set(["standalone-full", "vercel-lite"]).has(profile)) {
  throw new Error(`Unsupported Atlas delivery profile: ${profile}`);
}

const target = assertSafeBuildDirectory(root, distDir);
const previous = assertSafeBuildDirectory(root, previousDistDir);
if (target === previous) throw new Error("Current and previous build slots must differ");

const lockPath = resolve(root, ".atlas-build.lock");
let lock;
try {
  lock = await open(lockPath, "wx");
  await lock.writeFile(`${JSON.stringify({ pid: process.pid, profile, distDir, startedAt: new Date().toISOString() })}\n`);
} catch (error) {
  if (error?.code === "EEXIST") throw new Error(`Another Atlas build owns ${lockPath}`);
  throw error;
}

const hold = resolve(dirname(root), `${basename(root)}-${distDir.replace(/[^a-zA-Z0-9]+/g, "-")}-trace-hold`);
const rollback = join(hold, "current-rollback");
const previousRollback = join(hold, "previous-rollback");
const isolatedJunctions = [];
const rollbackJunctions = [];
const previousRollbackJunctions = [];
const moved = [];
let rollbackPresent = false;
let previousRollbackPresent = false;
let holdCreated = false;
let targetPrepared = false;
let buildCode = 1;

try {
  if (await exists(hold)) throw new Error(`Trace hold already exists: ${hold}`);
  await mkdir(hold, { recursive: true });
  holdCreated = true;

  if (rotate && await exists(target)) {
    await detachJunctions(target, rollbackJunctions);
    await renameWithRetry(target, rollback);
    rollbackPresent = true;
    targetPrepared = true;
  } else {
    await removeBuildDirectory(target, distDir);
    targetPrepared = true;
  }

  // The previous slot is itself a complete standalone tree. Leaving it below
  // the tracing root lets Next recursively copy it into the new current slot,
  // so hold it outside the workspace for the entire trace operation.
  if (await exists(previous)) {
    await detachJunctions(previous, previousRollbackJunctions);
    await renameWithRetry(previous, previousRollback);
    previousRollbackPresent = true;
  }

  const isolated = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => (
      entry.isDirectory()
      && entry.name.startsWith(".next")
      && entry.name !== distDir
      && !(preserveActiveDev && entry.name === ".next")
    ))
    .map((entry) => resolve(root, entry.name));
  if (preserveActiveDev) {
    const activeStandalone = resolve(root, ".next", "standalone");
    if (await exists(activeStandalone)) isolated.push(activeStandalone);
  }
  for (const payload of [resolve(root, "dist", "content-packs"), resolve(root, "dist", "desktop-stage")]) {
    if (await exists(payload)) isolated.push(payload);
  }

  for (let index = 0; index < isolated.length; index += 1) {
    const source = isolated[index];
    if (basename(source).startsWith(".next")) await detachJunctions(source, isolatedJunctions);
    const destination = join(hold, `isolated-${index}-${basename(source)}`);
    await renameWithRetry(source, destination);
    moved.push({ source, destination });
  }

  buildCode = await runBuild(root, {
    ...process.env,
    ATLAS_NEXT_DIST_DIR: distDir,
    ATLAS_LOCAL_ASSET_PACK_ROOT: "off",
    ATLAS_TEXTURE_PROXY: profile === "vercel-lite" ? "off" : process.env.ATLAS_TEXTURE_PROXY,
    NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE: profile,
  });
  if (buildCode !== 0) throw new Error(`Next build failed with exit code ${buildCode}`);

  const topology = await validateBuildTopology(target, distDir);
  await writeFile(join(target, "atlas-build-profile.json"), `${JSON.stringify({
    version: "v225-atlas-build-slot-v1",
    profile,
    slot: "current",
    distDir,
    buildId: topology.buildId,
    directoryCount: topology.directoryCount,
  }, null, 2)}\n`, "utf8");

  if (rotate && rollbackPresent) {
    await renameWithRetry(rollback, previous);
    rollbackPresent = false;
    if (previousRollbackPresent) {
      await removeBuildDirectory(previousRollback, distDir);
      previousRollbackPresent = false;
    }
  } else if (previousRollbackPresent) {
    await renameWithRetry(previousRollback, previous);
    previousRollbackPresent = false;
    await restoreJunctions(previousRollbackJunctions);
  }
} catch (error) {
  buildCode = 1;
  if (targetPrepared) await removeBuildDirectory(target, distDir);
  if (rollbackPresent) {
    await renameWithRetry(rollback, target);
    rollbackPresent = false;
    await restoreJunctions(rollbackJunctions);
  }
  if (previousRollbackPresent) {
    await renameWithRetry(previousRollback, previous);
    previousRollbackPresent = false;
    await restoreJunctions(previousRollbackJunctions);
  }
  throw error;
} finally {
  const restoreErrors = [];
  for (const entry of moved.reverse()) {
    try {
      await renameWithRetry(entry.destination, entry.source);
    } catch (error) {
      restoreErrors.push(error);
    }
  }
  try {
    await restoreJunctions(isolatedJunctions);
  } catch (error) {
    restoreErrors.push(error);
  }
  if (holdCreated) await rm(hold, { recursive: true, force: true });
  await lock.close();
  await rm(lockPath, { force: true });
  if (restoreErrors.length > 0) {
    throw new AggregateError(restoreErrors, "Atlas build completed but isolated payloads could not be restored");
  }
}

process.exitCode = buildCode;
