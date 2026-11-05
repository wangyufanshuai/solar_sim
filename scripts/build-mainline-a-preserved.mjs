import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIB = 1024 * 1024;
export const PRESERVED_BUILD_CACHE_LOG_PREFIX = "[mainline-a-webpack-cache] ";

export function buildDiskCacheMode(value = "default") {
  if (value !== "default" && value !== "off") throw new Error("Build disk cache must be default or off");
  return value;
}

export async function readBuildDiskAvailability(io = fs) {
  const stats = await io.statfs(ROOT, { bigint: true });
  const available = BigInt(stats.bavail) * BigInt(stats.bsize);
  if (available < 0n || available > BigInt(Number.MAX_SAFE_INTEGER) || BigInt(stats.bsize) <= 0n) {
    throw new Error("Cannot represent workspace available disk bytes safely");
  }
  return { observedAt: new Date().toISOString(), availableBytes: Number(available), volumePath: ROOT };
}

export async function preparePreservedBuildStage(stage, diskCache = "default", io = fs) {
  const mode = buildDiskCacheMode(diskCache);
  if (path.dirname(path.resolve(stage)).toLowerCase() !== ROOT.toLowerCase()
    || !/^\.next-mainline-a-r\d+-[a-z0-9-]{8,40}$/.test(path.basename(stage))) {
    throw new Error("Build stage must be a new immediate next-web output slot");
  }
  const preflight = {
    ...await readBuildDiskAvailability(io),
    cacheMode: mode,
    minimumFreeBytes: (mode === "off" ? 256 : 1024) * MIB,
    policy: "minimum-free-space-before-any-build-write",
    basis: mode === "off"
      ? "256 MiB floor; prior successful 066b slot used about 43 MB excluding cache; remaining margin is not a peak-use guarantee"
      : "1 GiB floor includes filesystem-cache allowance for a new preserved slot",
    peakUseGuaranteed: false,
    spaceReserved: false,
  };
  if (preflight.availableBytes < preflight.minimumFreeBytes) {
    const error = new Error("Insufficient workspace space before staging: "
      + preflight.availableBytes + " available bytes; " + preflight.minimumFreeBytes + " required bytes");
    error.code = "MAINLINE_A_BUILD_DISK_INSUFFICIENT";
    error.preflight = preflight;
    throw error;
  }
  await io.mkdir(stage, { recursive: false });
  return preflight;
}

export function buildCacheObservation(log, requestedMode) {
  const mode = buildDiskCacheMode(requestedMode);
  const observations = [];
  const issues = [];
  for (const line of log.split(/\r?\n/)) {
    if (!line.startsWith(PRESERVED_BUILD_CACHE_LOG_PREFIX)) continue;
    try {
      const record = JSON.parse(line.slice(PRESERVED_BUILD_CACHE_LOG_PREFIX.length));
      if (!["client", "nodejs", "edge"].includes(record.target)
        || !["default", "off"].includes(record.requestedMode)
        || !["disabled", "memory", "filesystem", "not-configured"].includes(record.cacheType)) {
        issues.push("webpack-cache-observation-invalid");
        continue;
      }
      observations.push({ target: record.target, requestedMode: record.requestedMode, cacheType: record.cacheType });
    } catch {
      issues.push("webpack-cache-observation-unreadable");
    }
  }
  for (const target of ["client", "nodejs"]) {
    if (!observations.some((record) => record.target === target)) issues.push("webpack-cache-observation-missing:" + target);
  }
  if (observations.some((record) => record.requestedMode !== mode)) issues.push("webpack-cache-request-mismatch");
  if (mode === "off" && observations.some((record) => record.cacheType !== "disabled")) {
    issues.push("webpack-cache-disable-not-observed");
  }
  return {
    requestedMode: mode,
    scope: "webpack-compiler-cache-only-other-next-cache-directories-may-exist",
    observationSource: "next-webpack-configuration-hook",
    observedCacheTypes: [...new Set(observations.map((record) => record.cacheType))].sort(),
    observations,
    verified: issues.length === 0,
    issues,
  };
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

export function buildSlot(round, runId) {
  if (!Number.isInteger(round) || round < 60 || round > 999) throw new Error("Unsupported Mainline A round");
  if (!/^[a-z0-9-]{8,40}$/.test(runId)) throw new Error("Invalid build run id");
  return ".next-mainline-a-r" + round + "-" + runId;
}

export function buildHeapMb(value = process.env.ATLAS_NODE_HEAP_MB ?? "8192") {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < 4096 || amount > 8192) {
    throw new Error("Build heap must stay between 4096 and 8192 MiB");
  }
  return amount;
}

async function sourceFiles(directory, relative = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = relative ? relative + "/" + entry.name : entry.name;
    if (entry.isSymbolicLink()) throw new Error("Build input symlink requires explicit review: " + name);
    if (entry.isDirectory()) result.push(...await sourceFiles(path.join(directory, entry.name), name));
    else if (/\.(ts|tsx|js|jsx|json|css|mjs|glsl)$/.test(entry.name) && !/\.test\./.test(entry.name)) result.push(name);
  }
  return result;
}

export async function captureBuildInputs() {
  const files = (await sourceFiles(path.join(ROOT, "app"))).map((name) => "app/" + name);
  files.push("package.json", "package-lock.json", "next.config.mjs", "proxy.ts", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs", ".env.local");
  const inputs = [];
  for (const relative of files.sort()) {
    const bytes = await fs.readFile(path.join(ROOT, relative));
    inputs.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return {
    scope: "app-source-config-package-lock-excludes-public-assets-and-tests",
    count: inputs.length,
    sha256: sha256(JSON.stringify(inputs)),
    inputs,
  };
}

export function admittedLitePath(relative) {
  const normalized = relative.replaceAll("\\", "/");
  return !/^app\/local-shadow-v\d+(?:\/|$)/.test(normalized)
    && !/^app\/api\/atlas\/relativity-evidence\/v\d+(?:\/|$)/.test(normalized);
}

export async function hydrateStandaloneAssets(stage, io = fs) {
  const source = path.join(stage, ".next", "static");
  const target = path.join(stage, ".next", "standalone", ".next", "static");
  try {
    await io.access(source);
  } catch {
    throw new Error("Next production build did not emit .next/static");
  }
  await io.mkdir(path.dirname(target), { recursive: true });
  await io.cp(source, target, { recursive: true, force: false, errorOnExist: false });
  return {
    source: path.relative(ROOT, source).replaceAll("\\", "/"),
    target: path.relative(ROOT, target).replaceAll("\\", "/"),
    copied: true,
    requiredForStandaloneRuntime: true,
  };
}

async function stageLiteSources(stage) {
  const excludedRoutes = [];
  await fs.cp(path.join(ROOT, "app"), path.join(stage, "app"), {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(ROOT, source).replaceAll("\\", "/");
      if (admittedLitePath(relative)) return true;
      excludedRoutes.push(relative);
      return false;
    },
  });
  for (const name of ["package.json", "package-lock.json", "next.config.mjs", "proxy.ts", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs", "next-env.d.ts", ".env.local"]) {
    await fs.copyFile(path.join(ROOT, name), path.join(stage, name), 1);
  }
  for (const name of ["node_modules", "public", "data", "docs", "scripts", "source-cache"]) {
    await fs.symlink(path.join(ROOT, name), path.join(stage, name), "junction");
  }
  return {
    excludedRoutes: excludedRoutes.sort(),
    policy: "same-formal-lite-route-graph-as-build-atlas-profile",
    sourceMode: "copied-app-sources-original-routes-untouched",
    dependencyJunctions: ["node_modules", "public", "data", "docs", "scripts", "source-cache"],
  };
}

export async function buildPreserved({ round = 64, runId = new Date().toISOString().replace(/[^0-9]/g, ""), diskCache = "default" } = {}) {
  const repository = path.resolve(git(["rev-parse", "--show-toplevel"]));
  if (repository.toLowerCase() !== ROOT.toLowerCase()) throw new Error("Refusing build outside next-web Git boundary");
  const branch = git(["branch", "--show-current"]);
  if (branch !== "codex/solar-sim-mainline-a") throw new Error("Unexpected Mainline A branch");
  const head = git(["rev-parse", "HEAD"]);
  const slot = buildSlot(round, runId);
  const distDir = slot + "/.next";
  const heapMb = buildHeapMb();
  const cacheMode = buildDiskCacheMode(diskCache);
  const stage = path.join(ROOT, slot);
  const absolute = path.join(stage, ".next");
  const diskPreflight = await preparePreservedBuildStage(stage, cacheMode);
  const startedAt = new Date().toISOString();
  const before = await captureBuildInputs();
  const staging = await stageLiteSources(stage);
  const tsconfigPath = ".atlas-mainline-a-r" + round + "-" + runId + ".json";
  await fs.writeFile(path.join(stage, tsconfigPath), JSON.stringify({
    extends: "./tsconfig.json",
    compilerOptions: { incremental: false },
    include: ["next-env.d.ts", "proxy.ts", "app/**/*.ts", "app/**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules", "**/*.test.ts", "**/*.test.tsx", "tests/**", "scripts/**", "tmp/**", ".next/**"],
  }, null, 2) + "\n", { flag: "wx" });
  const log = [];
  const environment = {
    ...process.env,
    ATLAS_NEXT_DIST_DIR: ".next",
    ATLAS_TSCONFIG_PATH: tsconfigPath,
    ATLAS_LOW_MEMORY_BUILD: "true",
    ATLAS_MAINLINE_A_PRESERVED_BUILD: "1",
    ATLAS_MAINLINE_A_DISK_CACHE: cacheMode,
    ATLAS_WEBPACK_STATS: "",
    ATLAS_LOCAL_ASSET_PACK_ROOT: "off",
    ATLAS_TEXTURE_PROXY: "off",
    NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE: "vercel-lite",
    NEXT_PUBLIC_MAINLINE_A_BUILD_ID: "mainline-a-" + before.sha256.slice(0, 16),
    NEXT_PUBLIC_MAINLINE_A_BRANCH: branch,
    NEXT_PUBLIC_MAINLINE_A_HEAD: head,
    NODE_OPTIONS: "--max-old-space-size=" + heapMb,
  };
  let exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"], {
      cwd: stage, env: environment, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
    for (const stream of [child.stdout, child.stderr]) stream.on("data", (bytes) => {
      const text = bytes.toString();
      log.push(text);
      process.stdout.write(text);
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
  const cache = buildCacheObservation(log.join(""), cacheMode);
  if (exitCode === 0 && !cache.verified) {
    log.push("\nWebpack cache configuration was not verified: " + cache.issues.join(", ") + "\n");
    exitCode = 1;
  }
  let standaloneAssets = { copied: false, requiredForStandaloneRuntime: true };
  if (exitCode === 0) {
    try {
      standaloneAssets = await hydrateStandaloneAssets(stage);
    } catch (error) {
      log.push(`\nstandalone asset hydration failed: ${error.message}\n`);
      exitCode = 1;
    }
  }
  const after = await captureBuildInputs();
  const sourceStable = before.sha256 === after.sha256;
  const diskAfter = await readBuildDiskAvailability().catch((error) => ({
    availableBytes: null, status: "unavailable", reason: error.message,
  }));
  const reportRoot = path.join(ROOT, "docs/release/v607");
  const prefix = "mainline-a-r" + round + "-build-" + runId;
  await fs.writeFile(path.join(reportRoot, prefix + ".log"), log.join(""), { flag: "wx" });
  const buildId = exitCode === 0 ? (await fs.readFile(path.join(absolute, "BUILD_ID"), "utf8")).trim() : null;
  const report = {
    round, startedAt, endedAt: new Date().toISOString(), exitCode, distDir, tsconfigPath,
    workingDirectory: stage, staging, standaloneAssets,
    repository, branch, head, runtimeBuildId: "mainline-a-" + before.sha256.slice(0, 16), profile: "vercel-lite",
    buildId, heapMb, cache,
    disk: { preflight: diskPreflight, afterBuild: diskAfter },
    inputBefore: before,
    inputAfterSha256: after.sha256,
    sourceStable,
    command: "node scripts/build-mainline-a-preserved.mjs --round " + round + " --run-id " + runId + " --disk-cache " + cacheMode,
    logPath: "docs/release/v607/" + prefix + ".log",
    status: exitCode === 0 && sourceStable ? "passed" : "failed",
    preservation: "new-output-directory-existing-builds-untouched",
    evidenceClass: "static-production-build-not-browser-or-performance",
  };
  const reportPath = "docs/release/v607/" + prefix + ".json";
  await fs.writeFile(path.join(ROOT, reportPath), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  if (report.status !== "passed") throw new Error("Preserved build failed; evidence saved at " + reportPath);
  return { status: report.status, distDir, buildId, sourceSha256: before.sha256, reportPath };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argument = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
  };
  buildPreserved({ round: Number(argument("--round") ?? 64), runId: argument("--run-id"), diskCache: argument("--disk-cache") })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message);
      if (error.preflight) console.error(JSON.stringify({ status: "not-started", writesPerformed: false, disk: error.preflight }));
      process.exitCode = 1;
    });
}
