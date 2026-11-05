import path from "node:path";
import { constants, createReadStream } from "node:fs";
import { copyFile, lstat, mkdir, readFile, readdir, realpath, statfs, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

export const RUNTIME_PAYLOAD_SCHEMA_V636 = "mainline-a-runtime-payload-v636";
export const RUNTIME_PAYLOAD_MANIFEST_V636 = "runtime-payload-manifest.json";
export const RUNTIME_PAYLOAD_BOUNDARY_V636 = Object.freeze({
  candidateOnly: true, hold: true, notAdmitted: true,
  scientificPayloadWriteback: false, releaseApproved: false,
  physicsKernelMutation: false, parentGitMutation: false, runtimePromotion: "closed",
});
const DEFAULT_LIMITS = Object.freeze({ maxFiles: 30000, maxBytes: 2_800_000_000, maxFileBytes: 268_435_456, minimumFreeBytes: 800_000_000 });
const SHA = /^[a-f0-9]{64}$/u;
const IDENTITY_KEYS = ["buildId", "runtimeBuildId", "branch", "head", "profile", "sourceSha256", "receiptPath", "receiptSha256"];
const ROLES = new Set(["standalone", "static", "public", "dependency", "traced-runtime"]);
const REQUIRED_RUNTIME_FILES = ["server.js", "package.json", ".next/BUILD_ID", "node_modules/next/package.json", "node_modules/react/package.json", "node_modules/react-dom/package.json"];
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ordered = (values) => [...values].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

function fail(code, context = "") {
  throw new Error(`runtime-payload:${code}${context ? `:${context}` : ""}`);
}

export function runtimePayloadPathV636(value) {
  if (typeof value !== "string" || !value || value.includes("\\") || value.includes(":")) fail("invalid-relative-path");
  if (path.posix.isAbsolute(value) || /[\u0000-\u001f\u007f]/u.test(value)) fail("invalid-relative-path");
  const segments = value.split("/");
  if (segments.some((part) => !part || part === "." || part === ".." || /[. ]$/u.test(part)
    || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(part))) fail("invalid-relative-path");
  return value;
}

function relativeWithin(root, requested) {
  if (typeof requested !== "string" || !requested || requested.includes("\0")) fail("path-missing");
  const absolute = path.resolve(root, requested);
  const relative = path.relative(root, absolute).replaceAll("\\", "/");
  runtimePayloadPathV636(relative);
  return { absolute, relative };
}

async function plainPath(root, requested, kind = "file") {
  const file = relativeWithin(root, requested);
  let current = root;
  for (const part of file.relative.split("/")) {
    current = path.join(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) fail("symlink-rejected", file.relative);
  }
  const info = await lstat(file.absolute);
  if (kind === "file" ? !info.isFile() : !info.isDirectory()) fail(`not-${kind}`, file.relative);
  const actual = await realpath(file.absolute);
  if (actual !== file.absolute) {
    const actualRelative = relativeWithin(root, actual).relative;
    if (actualRelative.toLowerCase() !== file.relative.toLowerCase()) fail("resolved-path-mismatch", file.relative);
  }
  return { ...file, info };
}

async function plainWorkspace(workspace) {
  const absolute = path.resolve(workspace);
  const info = await lstat(absolute);
  if (info.isSymbolicLink() || !info.isDirectory()) fail("workspace-not-plain-directory");
  return absolute;
}

function excludedReason(relative) {
  const parts = relative.split("/");
  if (parts.some((part) => /^\.env(?:\.|$)/iu.test(part)
    || /^(?:\.npmrc|\.netrc|credentials(?:\.json)?|secrets(?:\.json)?|id_rsa|id_ed25519)$/iu.test(part)
    || /\.(?:pfx|p12|key)$/iu.test(part))) return "secret-bearing-filename-not-packaged";
  if (parts.some((part) => [".git", ".ssh", ".aws", ".azure"].includes(part.toLowerCase()))) return "private-directory-not-packaged";
  return null;
}

async function hashFile(file, maxFileBytes) {
  const before = await lstat(file);
  if (!before.isFile() || before.isSymbolicLink()) fail("not-regular-file");
  if (before.size > maxFileBytes) fail("file-size-limit", path.basename(file));
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(file)) { hash.update(chunk); bytes += chunk.length; }
  const after = await lstat(file);
  if (before.size !== bytes || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ino !== before.ino) fail("file-changed-while-reading");
  return { bytes, sha256: hash.digest("hex") };
}

async function readJson(file, maximum = 16_777_216) {
  if ((await lstat(file)).size > maximum) fail("json-size-limit");
  return JSON.parse(await readFile(file, "utf8"));
}

function limitsFor(value = {}) {
  const limits = { ...DEFAULT_LIMITS, ...value };
  if (Object.keys(limits).some((key) => !Object.hasOwn(DEFAULT_LIMITS, key))
    || Object.values(limits).some((n) => !Number.isSafeInteger(n) || n <= 0)) fail("limits-invalid");
  return limits;
}

async function walkPlain(root, relative, visit, exclude = () => false) {
  const directory = await plainPath(root, relative, "directory");
  for (const entry of (await readdir(directory.absolute, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const child = `${relative}/${entry.name}`;
    if (exclude(child, entry)) continue;
    if (entry.isSymbolicLink()) fail("symlink-rejected", child);
    if (entry.isDirectory()) await walkPlain(root, child, visit, exclude);
    else if (entry.isFile()) await visit(child);
    else fail("special-file-rejected", child);
  }
}

async function expectedLink(root, relative, expectedTarget, links) {
  const target = relativeWithin(root, relative);
  const info = await lstat(target.absolute);
  if (!info.isSymbolicLink()) {
    if (!info.isDirectory()) fail("runtime-mount-not-directory", relative);
    return;
  }
  const actual = await realpath(target.absolute);
  if (actual.toLowerCase() !== path.resolve(root, expectedTarget).toLowerCase()) fail("link-target-not-allowlisted", relative);
  await plainPath(root, expectedTarget, "directory");
  links.push({ path: relative, target: expectedTarget, action: "materialize-regular-files-only" });
}

function validateReceipt(value, reference) {
  if (value.status !== "passed" || value.exitCode !== 0 || value.sourceStable !== true) fail("build-not-passed");
  for (const key of ["buildId", "runtimeBuildId", "branch", "head", "profile"]) {
    if (typeof value[key] !== "string" || !value[key] || value[key].startsWith("unknown")) fail("build-identity-missing", key);
  }
  if (value.branch !== "codex/solar-sim-mainline-a" || !/^[a-f0-9]{40}$/u.test(value.head)) fail("build-repository-identity-invalid");
  const before = value.inputBefore;
  if (!Array.isArray(before?.inputs) || before.inputs.length === 0 || before.count !== before.inputs.length
    || !SHA.test(before.sha256) || digest(JSON.stringify(before.inputs)) !== before.sha256
    || value.inputAfterSha256 !== before.sha256
    || value.runtimeBuildId !== `mainline-a-${before.sha256.slice(0, 16)}`) fail("build-source-binding-invalid");
  const names = new Set();
  for (const row of before.inputs) {
    runtimePayloadPathV636(row.path);
    if (names.has(row.path.toLowerCase()) || !SHA.test(row.sha256) || !Number.isSafeInteger(row.bytes) || row.bytes < 0) fail("build-source-record-invalid");
    names.add(row.path.toLowerCase());
  }
  return Object.fromEntries(IDENTITY_KEYS.map((key) => [key,
    key === "sourceSha256" ? before.sha256 : key === "receiptPath" ? reference.path : key === "receiptSha256" ? reference.sha256 : value[key]]));
}

function packageNameFrom(relative) {
  const pieces = relative.split("/");
  const i = pieces.lastIndexOf("node_modules");
  if (i < 0 || !pieces[i + 1]) return null;
  return pieces[i + 1].startsWith("@") ? `${pieces[i + 1]}/${pieces[i + 2] ?? ""}` : pieces[i + 1];
}

async function resolvePackage(workspace, name, importer = workspace) {
  if (!/^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/iu.test(name)) fail("package-name-invalid");
  let directory = importer;
  while (directory === workspace || directory.startsWith(`${workspace}${path.sep}`)) {
    const candidate = path.join(directory, "node_modules", name, "package.json");
    try { return await plainPath(workspace, candidate); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (directory === workspace) break;
    directory = path.dirname(directory);
  }
  fail("runtime-package-missing", name);
}

function platformAllowed(metadata) {
  const accepts = (rules, actual) => !Array.isArray(rules) || (rules.every((rule) => rule !== `!${actual}`)
    && (!rules.some((rule) => !rule.startsWith("!")) || rules.includes(actual) || rules.includes("any")));
  return accepts(metadata.os, process.platform) && accepts(metadata.cpu, process.arch);
}

function inventoryDigest(files) {
  return digest(JSON.stringify(files.map(({ path: file, bytes, sha256 }) => ({ path: file, bytes, sha256 }))));
}

export async function prepareRuntimePayloadV636({ workspace, buildReceipt, limits: requestedLimits } = {}) {
  const root = await plainWorkspace(workspace);
  const limits = limitsFor(requestedLimits);
  if (!buildReceipt || !SHA.test(buildReceipt.sha256)) fail("explicit-build-receipt-required");
  const receiptFile = await plainPath(root, buildReceipt.path);
  const receiptHash = await hashFile(receiptFile.absolute, limits.maxFileBytes);
  if (receiptHash.sha256 !== buildReceipt.sha256) fail("build-receipt-sha-mismatch");
  const receipt = await readJson(receiptFile.absolute);
  const build = validateReceipt(receipt, { path: receiptFile.relative, sha256: receiptHash.sha256 });
  const stage = relativeWithin(root, receipt.workingDirectory);
  await plainPath(root, stage.relative, "directory");
  if (relativeWithin(root, receipt.distDir).relative !== `${stage.relative}/.next`) fail("build-distdir-mismatch");
  const standalone = `${stage.relative}/.next/standalone`;
  await plainPath(root, standalone, "directory");
  const buildId = (await readFile((await plainPath(root, `${stage.relative}/.next/BUILD_ID`)).absolute, "utf8")).trim();
  if (buildId !== build.buildId) fail("build-id-file-mismatch");
  const files = new Map();
  const caseNames = new Map();
  const exclusions = [];
  const links = [];
  const traces = [];
  let totalBytes = 0;
  async function add(sourcePath, outputPath, role) {
    runtimePayloadPathV636(outputPath);
    const why = excludedReason(outputPath);
    if (why) { exclusions.push({ path: outputPath, sourcePath, reason: why }); return; }
    const source = await plainPath(root, sourcePath);
    const hash = await hashFile(source.absolute, limits.maxFileBytes);
    const lower = outputPath.toLowerCase();
    if (caseNames.has(lower) && caseNames.get(lower) !== outputPath) fail("case-collision", outputPath);
    const prior = files.get(outputPath);
    if (prior) {
      if (prior.sha256 !== hash.sha256 || prior.bytes !== hash.bytes) fail("source-collision", outputPath);
      return;
    }
    totalBytes += hash.bytes;
    if (totalBytes > limits.maxBytes || files.size + 1 > limits.maxFiles) fail("payload-limit-exceeded");
    caseNames.set(lower, outputPath);
    files.set(outputPath, { path: outputPath, ...hash, sourcePath: source.relative, role });
  }
  const standaloneLinkRoots = new Set([`${standalone}/node_modules`, `${standalone}/public`]);
  for (const entry of await readdir(path.join(root, standalone), { withFileTypes: true })) {
    const relative = `${standalone}/${entry.name}`;
    if (standaloneLinkRoots.has(relative)) {
      await expectedLink(root, relative, entry.name, links);
      continue;
    }
    if (entry.isSymbolicLink()) fail("standalone-link-not-allowlisted", relative);
    if (entry.isDirectory()) await walkPlain(root, relative,
      (file) => add(file, file.slice(standalone.length + 1), "standalone"),
      (file) => {
        const reason = excludedReason(file.slice(standalone.length + 1));
        if (reason) exclusions.push({ path: file.slice(standalone.length + 1), sourcePath: file, reason });
        return Boolean(reason);
      });
    else if (entry.isFile()) await add(relative, entry.name, "standalone");
    else fail("standalone-special-file", relative);
  }
  await walkPlain(root, `${stage.relative}/.next/static`, (file) => add(file, file.slice(stage.relative.length + 1), "static"));
  await walkPlain(root, "public", (file) => add(file, file, "public"), (file) => {
    const reason = excludedReason(file);
    if (reason) exclusions.push({ path: file, sourcePath: file, reason });
    return Boolean(reason);
  });
  const packageRoots = new Set(["next", "react", "react-dom"]);
  await walkPlain(root, `${stage.relative}/.next`, async (tracePath) => {
    if (!tracePath.endsWith(".nft.json")) return;
    const traceFile = await plainPath(root, tracePath);
    const trace = await readJson(traceFile.absolute);
    if (trace.version !== 1 || !Array.isArray(trace.files) || trace.files.length > limits.maxFiles) fail("trace-schema-invalid", tracePath);
    traces.push({ path: tracePath, ...await hashFile(traceFile.absolute, limits.maxFileBytes) });
    for (const name of trace.files) {
      if (typeof name !== "string" || !name || name.includes("\0") || path.isAbsolute(name) || path.win32.isAbsolute(name)) fail("trace-path-invalid", tracePath);
      const absolute = path.resolve(path.dirname(traceFile.absolute), name.replaceAll("\\", "/"));
      const lexical = relativeWithin(root, absolute).relative;
      const resolved = await realpath(absolute);
      const relative = relativeWithin(root, resolved).relative;
      const stagePrefix = `${stage.relative}/`;
      const output = relative.startsWith(stagePrefix) ? relative.slice(stagePrefix.length) : relative;
      if (output === "node_modules" || output === "public") {
        await expectedLink(root, lexical, output, links);
        exclusions.push({ path: output, sourcePath: lexical, reason: output === "node_modules" ? "directory-trace-expanded-as-runtime-package-closure" : "directory-trace-materialized-from-public" });
        continue;
      }
      if (lexical !== relative) {
        const mount = lexical.startsWith(stagePrefix) ? lexical.slice(stagePrefix.length).split("/")[0] : null;
        if (!mount || !["node_modules", "public", "data", "docs", "scripts", "source-cache"].includes(mount)) fail("trace-link-not-allowlisted", lexical);
        await expectedLink(root, `${stage.relative}/${mount}`, mount, links);
        if (relative !== lexical.slice(stagePrefix.length)) fail("trace-link-resolution-mismatch", lexical);
      }
      const info = await lstat(resolved);
      if (!info.isFile()) fail("trace-directory-not-supported", output);
      if (output.startsWith("node_modules/")) packageRoots.add(packageNameFrom(output));
      else {
        const allowed = relative.startsWith(stagePrefix) || /^(?:public|data|docs|scripts|source-cache)\//u.test(output);
        if (!allowed) fail("trace-source-not-allowlisted", output);
        await add(relative, output, "traced-runtime");
      }
    }
  }, (file) => [`${stage.relative}/.next/standalone`, `${stage.relative}/.next/static`, `${stage.relative}/.next/cache`].includes(file));
  if (!traces.length) fail("runtime-traces-missing");
  const packages = [];
  const visited = new Set();
  async function visitPackage(name, importer, optional = false) {
    let file;
    try { file = await resolvePackage(root, name, importer); }
    catch (error) {
      if (optional && error.message?.startsWith("runtime-payload:runtime-package-missing:")) {
        exclusions.push({ path: name, reason: "optional-package-not-installed" }); return;
      }
      throw error;
    }
    const packageRoot = path.dirname(file.absolute);
    if (visited.has(packageRoot)) return;
    const metadata = await readJson(file.absolute);
    if (metadata.name !== name || typeof metadata.version !== "string") fail("package-identity-invalid", name);
    if (!platformAllowed(metadata)) {
      if (!optional) fail("required-package-platform-mismatch", name);
      exclusions.push({ path: name, reason: "optional-package-for-other-host" }); return;
    }
    visited.add(packageRoot);
    packages.push({ name, version: metadata.version, path: file.relative, ...await hashFile(file.absolute, limits.maxFileBytes) });
    const directory = path.dirname(file.relative).replaceAll("\\", "/");
    await walkPlain(root, directory, (source) => add(source, source, "dependency"), (source) => {
      if (source === `${directory}/node_modules`) return true;
      const reason = excludedReason(source);
      if (reason) exclusions.push({ path: source, sourcePath: source, reason });
      return Boolean(reason);
    });
    const optionalDependencies = metadata.optionalDependencies ?? {};
    for (const dependency of Object.keys(metadata.dependencies ?? {}).sort()) await visitPackage(dependency, packageRoot, Object.hasOwn(optionalDependencies, dependency));
    for (const dependency of Object.keys(optionalDependencies).sort()) await visitPackage(dependency, packageRoot, true);
  }
  for (const name of [...packageRoots].sort()) await visitPackage(name, root);
  const requiredFile = await plainPath(root, `${stage.relative}/.next/required-server-files.json`);
  const required = await readJson(requiredFile.absolute);
  if (required.config?.output !== "standalone" || required.config?.distDir !== ".next" || Object.keys(required.config?.env ?? {}).length) fail("serialized-config-not-portable-or-env-present");
  if (required.config.cacheHandler || Object.keys(required.config.cacheHandlers ?? {}).length) fail("external-cache-handler-requires-explicit-closure");
  if (!Array.isArray(required.files) || required.files.length === 0) fail("required-server-files-empty");
  for (const file of required.files) {
    const relative = runtimePayloadPathV636(file.replaceAll("\\", "/"));
    if (!files.has(relative)) await add(`${stage.relative}/${relative}`, relative, "standalone");
  }
  for (const name of REQUIRED_RUNTIME_FILES) {
    if (!files.has(name)) fail("required-runtime-file-missing", name);
  }
  const list = ordered(files.values());
  const manifest = {
    schema: RUNTIME_PAYLOAD_SCHEMA_V636,
    status: "candidate-materialization-plan",
    build, host: { platform: process.platform, arch: process.arch, node: process.versions.node },
    entrypoint: "server.js", files: list,
    inventorySha256: inventoryDigest(list), totals: { files: list.length, bytes: totalBytes },
    traceInputs: ordered(traces), packages: ordered(packages),
    resolvedLinks: [...new Map(links.map((entry) => [entry.path, entry])).values()].sort((a, b) => a.path.localeCompare(b.path)),
    exclusions: exclusions.sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason)),
    publicScope: "complete-public-tree-except-explicit-private-files",
    runtimeDependencyScope: "standalone-and-next-traces-with-declared-installed-host-runtime-package-dependencies",
    dataAndDocsScope: "only-individual-files-required-by-next-traces; no-workspace-directory-copy",
    boundary: RUNTIME_PAYLOAD_BOUNDARY_V636,
    claims: { portableAcrossHosts: false, browserValidation: false, copyrightApproval: false, productionPerformance: false },
  };
  validateManifest(manifest);
  return { workspace: root, manifest, limits, totals: manifest.totals, build, materialized: false };
}

function validateManifest(manifest) {
  if (manifest?.schema !== RUNTIME_PAYLOAD_SCHEMA_V636 || manifest.status !== "candidate-materialization-plan") fail("manifest-schema-invalid");
  for (const [key, value] of Object.entries(RUNTIME_PAYLOAD_BOUNDARY_V636)) if (manifest.boundary?.[key] !== value) fail("boundary-open", key);
  for (const key of IDENTITY_KEYS) if (typeof manifest.build?.[key] !== "string" || !manifest.build[key]) fail("manifest-build-missing", key);
  if (!SHA.test(manifest.build.sourceSha256) || !SHA.test(manifest.build.receiptSha256)
    || manifest.build.runtimeBuildId !== `mainline-a-${manifest.build.sourceSha256.slice(0, 16)}`) fail("manifest-build-invalid");
  if (manifest.entrypoint !== "server.js" || !Array.isArray(manifest.files) || !manifest.files.length) fail("manifest-files-invalid");
  if (manifest.publicScope !== "complete-public-tree-except-explicit-private-files") fail("public-scope-invalid");
  const names = new Set();
  for (const file of manifest.files) {
    runtimePayloadPathV636(file.path); runtimePayloadPathV636(file.sourcePath);
    if (file.path === RUNTIME_PAYLOAD_MANIFEST_V636 || excludedReason(file.path) || excludedReason(file.sourcePath)) fail("forbidden-manifest-file", file.path);
    if (names.has(file.path.toLowerCase())) fail("manifest-case-duplicate", file.path);
    names.add(file.path.toLowerCase());
    if (!SHA.test(file.sha256) || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || !ROLES.has(file.role)) fail("manifest-file-invalid", file.path);
  }
  for (const required of REQUIRED_RUNTIME_FILES) {
    if (!manifest.files.some((file) => file.path === required && file.bytes > 0)) fail("required-runtime-file-missing", required);
  }
  if (JSON.stringify(manifest.files) !== JSON.stringify(ordered(manifest.files))) fail("manifest-order-invalid");
  if (manifest.inventorySha256 !== inventoryDigest(manifest.files)
    || manifest.totals?.files !== manifest.files.length
    || manifest.totals?.bytes !== manifest.files.reduce((sum, file) => sum + file.bytes, 0)) fail("manifest-inventory-invalid");
  if (Object.values(manifest.claims ?? {}).some((value) => value !== false)) fail("manifest-claim-open");
  if (!manifest.host || manifest.host.platform !== process.platform || manifest.host.arch !== process.arch
    || typeof manifest.host.node !== "string" || manifest.host.node.split(".")[0] !== process.versions.node.split(".")[0]) fail("host-runtime-incompatible");
}

async function newOutputDirectory(root, requested) {
  const result = relativeWithin(root, requested);
  let current = root;
  const segments = result.relative.split("/");
  for (const part of segments.slice(0, -1)) {
    current = path.join(current, part);
    try { await mkdir(current); }
    catch (error) { if (error.code !== "EEXIST") throw error; }
    const info = await lstat(current);
    if (info.isSymbolicLink() || !info.isDirectory()) fail("output-parent-not-plain");
  }
  await mkdir(result.absolute, { recursive: false });
  return result;
}

export async function materializeRuntimePayloadV636({ workspace, destination, plan } = {}) {
  const root = await plainWorkspace(workspace);
  if (plan?.workspace !== root || plan.materialized !== false) fail("plan-workspace-or-state-invalid");
  validateManifest(plan.manifest);
  const limits = limitsFor(plan.limits);
  if (plan.manifest.totals.bytes > limits.maxBytes || plan.manifest.files.length > limits.maxFiles) fail("payload-limit-exceeded");
  const free = await statfs(root);
  if (free.bavail * free.bsize < plan.manifest.totals.bytes + limits.minimumFreeBytes) fail("insufficient-free-space");
  const receipt = await plainPath(root, plan.manifest.build.receiptPath);
  if ((await hashFile(receipt.absolute, limits.maxFileBytes)).sha256 !== plan.manifest.build.receiptSha256) fail("build-receipt-changed-after-prepare");
  const output = await newOutputDirectory(root, destination);
  for (const file of plan.manifest.files) {
    const source = await plainPath(root, file.sourcePath);
    const current = await hashFile(source.absolute, limits.maxFileBytes);
    if (current.sha256 !== file.sha256 || current.bytes !== file.bytes) fail("source-changed-after-prepare", file.path);
    const target = relativeWithin(output.absolute, file.path);
    await mkdir(path.dirname(target.absolute), { recursive: true });
    await copyFile(source.absolute, target.absolute, constants.COPYFILE_EXCL);
  }
  const manifestPath = `${output.relative}/${RUNTIME_PAYLOAD_MANIFEST_V636}`;
  const bytes = jsonBytes(plan.manifest);
  await writeFile(path.join(root, manifestPath), bytes, { flag: "wx" });
  const manifestSha256 = digest(bytes);
  const verification = await verifyRuntimePayloadV636({ workspace: root, directory: output.relative, expectedManifestSha256: manifestSha256, expectedBuild: plan.build });
  return { directory: output.relative, manifestPath, manifestSha256, manifest: plan.manifest, verification };
}

export async function verifyRuntimePayloadV636({ workspace, directory, expectedManifestSha256, expectedBuild } = {}) {
  const root = await plainWorkspace(workspace);
  if (!SHA.test(expectedManifestSha256)) fail("manifest-pin-required");
  const target = await plainPath(root, directory, "directory");
  const manifestFile = await plainPath(root, `${target.relative}/${RUNTIME_PAYLOAD_MANIFEST_V636}`);
  const raw = await readFile(manifestFile.absolute);
  if (raw.length > 33_554_432 || digest(raw) !== expectedManifestSha256) fail("manifest-pin-mismatch");
  const manifest = JSON.parse(raw.toString("utf8"));
  validateManifest(manifest);
  if (expectedBuild) for (const [key, value] of Object.entries(expectedBuild)) {
    if (!IDENTITY_KEYS.includes(key) || manifest.build[key] !== value) fail("expected-build-mismatch", key);
  }
  const found = new Set();
  const expected = new Map(manifest.files.map((file) => [file.path, file]));
  const directories = new Set();
  for (const file of manifest.files) {
    const segments = file.path.split("/");
    for (let count = 1; count < segments.length; count += 1) directories.add(segments.slice(0, count).join("/"));
  }
  const observed = [];
  await walkPlain(root, target.relative, async (filePath) => {
    const relative = filePath.slice(target.relative.length + 1);
    if (relative === RUNTIME_PAYLOAD_MANIFEST_V636) return;
    const file = expected.get(relative);
    if (!file) fail("unexpected-file", relative);
    if (found.has(relative.toLowerCase())) fail("output-case-collision", relative);
    found.add(relative.toLowerCase());
    const actual = await hashFile(path.join(root, filePath), DEFAULT_LIMITS.maxFileBytes);
    if (actual.sha256 !== file.sha256 || actual.bytes !== file.bytes) fail("output-file-mismatch", relative);
    observed.push({ ...file, ...actual });
  }, (filePath, entry) => {
    const relative = filePath.slice(target.relative.length + 1);
    if (entry.isDirectory() && !directories.has(relative)) fail("unexpected-directory", relative);
    return false;
  });
  for (const file of manifest.files) if (!found.has(file.path.toLowerCase())) fail("missing-file", file.path);
  if (inventoryDigest(ordered(observed)) !== manifest.inventorySha256) fail("output-inventory-mismatch");
  const actualBuildId = (await readFile(path.join(target.absolute, ".next/BUILD_ID"), "utf8")).trim();
  if (actualBuildId !== manifest.build.buildId) fail("output-build-id-mismatch");
  return { status: "verified", directory: target.relative, manifestPath: manifestFile.relative,
    manifestSha256: expectedManifestSha256, build: manifest.build,
    inventorySha256: manifest.inventorySha256, totals: manifest.totals,
    hostCompatible: true, scope: "exact-candidate-runtime-files; no-launch-browser-or-rights-approval", boundary: RUNTIME_PAYLOAD_BOUNDARY_V636 };
}
