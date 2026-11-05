import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const SMOKE_BOUNDARY_V636 = Object.freeze({
  candidateOnly: true, hold: true, notAdmitted: true,
  scientificPayloadWriteback: false, releaseApproved: false,
  browserExecuted: false, visualApproval: false, performanceClaim: false,
  physicalDeviceClaim: false, realUserValidation: false,
});
const SHA = /^[a-f0-9]{64}$/u;
const MAX_JSON_BYTES = 32 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024 * 1024;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const assert = (condition, code) => { if (!condition) throw new Error(code); };
const now = () => new Date().toISOString();

function relativeInside(root, requested) {
  assert(typeof requested === "string" && requested.length > 0 && !requested.includes("\0"), "path-invalid");
  const absolute = path.resolve(root, requested);
  const relative = path.relative(path.resolve(root), absolute);
  assert(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), "path-outside-root");
  return { absolute, relative: relative.replaceAll("\\", "/") };
}

async function regularFileInside(root, requested) {
  const confined = relativeInside(root, requested);
  let cursor = path.resolve(root);
  for (const part of confined.relative.split("/")) {
    cursor = path.join(cursor, part);
    assert(!(await lstat(cursor)).isSymbolicLink(), "symlink-not-allowed");
  }
  const stat = await lstat(confined.absolute);
  assert(stat.isFile(), "regular-file-required");
  relativeInside(await realpath(root), await realpath(confined.absolute));
  return { ...confined, stat };
}

async function pinnedJson(workspace, descriptor) {
  assert(descriptor && SHA.test(descriptor.sha256), "pinned-sha256-required");
  const file = await regularFileInside(workspace, descriptor.path);
  assert(file.stat.size > 0 && file.stat.size <= MAX_JSON_BYTES, "pinned-json-size-invalid");
  const bytes = await readFile(file.absolute);
  assert(hash(bytes) === descriptor.sha256, "pinned-json-sha256-mismatch");
  return { value: JSON.parse(bytes.toString("utf8")), bytes, path: file.relative, sha256: descriptor.sha256 };
}

function boundedMilliseconds(value, fallback, maximum) {
  const result = value ?? fallback;
  assert(Number.isSafeInteger(result) && result >= 50 && result <= maximum, "timeout-out-of-range");
  return result;
}

export function smokeChildEnvironmentV636(port, parent = process.env) {
  assert(Number.isInteger(port) && port > 0 && port <= 65535, "port-invalid");
  const environment = {
    NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port),
    NEXT_TELEMETRY_DISABLED: "1", PATH: path.dirname(process.execPath),
  };
  if (process.platform === "win32" && typeof parent.SystemRoot === "string") environment.SystemRoot = parent.SystemRoot;
  return environment;
}

async function unusedLoopbackPort() {
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen({ host: "127.0.0.1", port: 0, exclusive: true }, resolve);
  });
  const address = reservation.address();
  const port = address && typeof address === "object" ? address.port : null;
  await new Promise((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()));
  assert(Number.isInteger(port), "port-allocation-failed");
  return port;
}

export async function requestSmokeBytesV636(url, timeoutMs = 10_000, maximumBytes = MAX_RESPONSE_BYTES) {
  const parsed = new URL(url);
  assert(parsed.protocol === "http:" && parsed.hostname === "127.0.0.1" && parsed.port && !parsed.username && !parsed.password, "loopback-http-required");
  assert(Number.isSafeInteger(maximumBytes) && maximumBytes > 0 && maximumBytes <= MAX_RESPONSE_BYTES, "response-limit-invalid");
  const startedAt = now();
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response = null;
  let body = Buffer.alloc(0);
  let error = null;
  try {
    response = await fetch(url, {
      redirect: "manual", signal: controller.signal,
      headers: { "accept-encoding": "identity", "cache-control": "no-cache" },
    });
    const announced = Number(response.headers.get("content-length"));
    assert(!Number.isFinite(announced) || announced <= maximumBytes, "response-size-limit");
    const chunks = [];
    let size = 0;
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          size += next.value.byteLength;
          assert(size <= maximumBytes, "response-size-limit");
          chunks.push(Buffer.from(next.value));
        }
      } finally { await reader.cancel().catch(() => {}); }
    }
    body = Buffer.concat(chunks, size);
  } catch (failure) {
    error = controller.signal.aborted ? "request-timeout" : failure instanceof Error ? failure.message : "request-failed";
  } finally { clearTimeout(timer); }
  const finalUrl = response?.url || null;
  const redirected = Boolean(response && response.status >= 300 && response.status < 400);
  return {
    body,
    observation: {
      requestedUrl: url, startedAt, endedAt: now(), timeoutMs,
      timeout: controller.signal.aborted, elapsedMs: Number((performance.now() - started).toFixed(3)),
      httpStatus: response?.status ?? null, contentType: response?.headers.get("content-type") ?? null,
      finalUrl, redirected, location: response?.headers.get("location") ?? null,
      bytes: body.length, sha256: error ? null : hash(body), error,
    },
  };
}

function safeRoute(pathname) {
  assert(typeof pathname === "string" && pathname.startsWith("/") && !pathname.startsWith("//"), "asset-route-invalid");
  assert(!/[\\?#%\u0000-\u0020]/u.test(pathname) && !pathname.split("/").some((part) => part === "." || part === ".."), "asset-route-invalid");
  return pathname;
}

export function smokeScriptRoutesV636(html, origin) {
  const routes = [];
  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/giu)) {
    const url = new URL(match[1], origin);
    assert(url.origin === origin && !url.search && !url.hash && !url.username && !url.password, "script-off-origin-or-query");
    const pathname = safeRoute(url.pathname);
    assert(pathname.startsWith("/_next/static/"), "script-outside-next-static");
    routes.push(pathname);
  }
  assert(routes.length > 0 && routes.length <= 128, "script-count-invalid");
  return [...new Set(routes)];
}

async function pageBinding(response, input) {
  const html = response.body.toString("utf8");
  const build = input.build.value;
  const declaredShells = [...html.matchAll(/<[a-z][^>]*\bdata-atlas-app-shell\b[^>]*>/giu)];
  if (declaredShells.length > 0) {
    assert(declaredShells.length === 1, "page-app-shell-missing-or-duplicate");
    const shell = declaredShells[0][0];
    assert(/\bdata-atlas-app-shell=["'][^"']+["']/u.test(shell), "page-app-shell-invalid");
    const values = [...shell.matchAll(/\b(data-mainline-(?:build-id|branch|head))=["']([^"']*)["']/gu)];
    const attributes = new Map(values.map((match) => [match[1], match[2]]));
    assert(attributes.size === values.length, "page-build-attribute-duplicate");
    assert(attributes.get("data-mainline-build-id") === build.runtimeBuildId, "page-runtime-build-mismatch");
    assert(attributes.get("data-mainline-branch") === build.branch, "page-branch-mismatch");
    assert(attributes.get("data-mainline-head") === build.head, "page-head-mismatch");
    return {
      mode: "server-html-app-shell-attributes", serverHtmlBuildIdentityObserved: true,
      browserDomObserved: false, runtimeBuildId: build.runtimeBuildId, branch: build.branch, head: build.head,
    };
  }
  const payloadPath = ".next/server/app/index.html";
  const expected = input.files.get(payloadPath);
  assert(expected, "page-app-shell-absent-and-static-html-unpinned");
  const local = await regularFileInside(input.restored.absolute, payloadPath);
  const bytes = await readFile(local.absolute);
  assert(bytes.length === expected.bytes && hash(bytes) === expected.sha256, "static-html-local-sha256-mismatch");
  assert(response.body.length === expected.bytes && response.observation.sha256 === expected.sha256, "static-html-response-sha256-mismatch");
  return {
    mode: "static-html-bytes-client-render-pending", domBuildIdentityObserved: false,
    browserDomObserved: false, serverHtmlBuildIdentityObserved: false,
    expectedRuntimeBuildId: build.runtimeBuildId, expectedBranch: build.branch, expectedHead: build.head,
    staticHtml: { payloadPath, sha256: expected.sha256, bytes: expected.bytes },
  };
}

function healthBinding(body, build) {
  const health = JSON.parse(body.toString("utf8"));
  assert(health.schemaVersion === "v227-atlas-production-health-v1" && health.status === "ok", "health-schema-or-status-mismatch");
  assert(health.deliveryProfile === build.profile, "health-profile-mismatch");
  assert(health.defaultScientificKernel === "legacy-eih-1pn", "health-kernel-mismatch");
  assert(Number.isFinite(Date.parse(health.checkedAt)), "health-time-invalid");
  assert(health.commitSha === null || health.commitSha === build.head, "health-commit-mismatch");
  return {
    schemaVersion: health.schemaVersion, status: health.status, deliveryProfile: health.deliveryProfile,
    defaultScientificKernel: health.defaultScientificKernel, checkedAt: health.checkedAt,
    commitSha: health.commitSha, buildIdentitySuppliedByHealth: false,
  };
}

function successfulResponse(response, url, contentType) {
  const observed = response.observation;
  assert(!observed.error && !observed.timeout, observed.error ?? "request-timeout");
  assert(observed.httpStatus === 200 && !observed.redirected && observed.finalUrl === url, "http-status-or-final-url-mismatch");
  if (contentType) assert(contentType.test(observed.contentType ?? ""), "http-content-type-mismatch");
}

function observeChild(child) {
  const state = { pid: child.pid ?? null, exited: false, code: null, signal: null, error: null, stdoutBytes: 0, stderrBytes: 0, stderrTail: "" };
  const stdout = createHash("sha256");
  const stderr = createHash("sha256");
  child.stdout?.on("data", (bytes) => { state.stdoutBytes += bytes.length; stdout.update(bytes); });
  child.stderr?.on("data", (bytes) => {
    state.stderrBytes += bytes.length; stderr.update(bytes);
    state.stderrTail = (state.stderrTail + bytes.toString("utf8")).slice(-8192);
  });
  child.once("error", (error) => { state.error = error.code ?? error.name; });
  child.once("close", (code, signal) => { state.exited = true; state.code = code; state.signal = signal; });
  return { state, streams: () => ({ stdoutSha256: stdout.copy().digest("hex"), stderrSha256: stderr.copy().digest("hex") }) };
}

async function waitForExit(state, milliseconds) {
  const deadline = performance.now() + milliseconds;
  while (!state.exited && performance.now() < deadline) await delay(Math.min(25, Math.max(1, deadline - performance.now())));
  return state.exited;
}

export async function stopOwnedSmokeChildV636(child, observed, timeoutMs = 5_000) {
  const startedAt = now();
  const signals = [];
  assert(child && observed.state.pid === (child.pid ?? null), "owned-child-identity-mismatch");
  if (!observed.state.exited && child.pid) {
    signals.push({ signal: "SIGTERM", sent: child.kill("SIGTERM") });
    if (!await waitForExit(observed.state, Math.floor(timeoutMs / 2))) {
      signals.push({ signal: "SIGKILL", sent: child.kill("SIGKILL") });
      await waitForExit(observed.state, Math.ceil(timeoutMs / 2));
    }
  } else if (!observed.state.exited) await waitForExit(observed.state, timeoutMs);
  return { startedAt, endedAt: now(), ownedPid: observed.state.pid, signals, exited: observed.state.exited, exitCode: observed.state.code, exitSignal: observed.state.signal, error: observed.state.error };
}

async function waitForHealth(origin, childState, timeoutMs, requestTimeoutMs, probes) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    assert(!childState.exited && !childState.error, "owned-server-exited-before-ready");
    const remaining = Math.max(1, Math.floor(deadline - performance.now()));
    const response = await requestSmokeBytesV636(`${origin}/api/health`, Math.min(requestTimeoutMs, remaining), 1024 * 1024);
    if (probes.length < 64) probes.push(response.observation);
    if (response.observation.httpStatus !== null) return response;
    await delay(Math.min(100, Math.max(1, deadline - performance.now())));
  }
  throw new Error("server-startup-timeout");
}

async function verifyInputs(options) {
  const workspace = path.resolve(options.workspace ?? process.cwd());
  const restored = relativeInside(workspace, options.restoredDirectory);
  const manifest = await pinnedJson(workspace, options.payloadManifest);
  const build = await pinnedJson(workspace, options.buildReceipt);
  assert(manifest.value.schema === "mainline-a-runtime-payload-v636", "payload-schema-invalid");
  assert(build.value.status === "passed" && build.value.exitCode === 0 && build.value.sourceStable === true, "build-not-passed");
  for (const key of ["buildId", "runtimeBuildId", "branch", "head", "profile"]) {
    assert(typeof build.value[key] === "string" && build.value[key] && manifest.value.build[key] === build.value[key], `payload-build-${key}-mismatch`);
  }
  assert(manifest.value.build.receiptSha256 === build.sha256 && manifest.value.build.receiptPath === build.path, "payload-build-receipt-mismatch");
  const restoredManifest = await regularFileInside(restored.absolute, "runtime-payload-manifest.json");
  assert(hash(await readFile(restoredManifest.absolute)) === manifest.sha256, "restored-manifest-mismatch");
  const { verifyRuntimePayloadV636 } = await import("./mainline-a-runtime-payload-v636.mjs");
  const verification = await verifyRuntimePayloadV636({ workspace, directory: restored.relative, expectedManifestSha256: manifest.sha256, expectedBuild: manifest.value.build });
  assert(verification.status === "verified", "restored-payload-not-verified");
  const server = await regularFileInside(restored.absolute, "server.js");
  const files = new Map(manifest.value.files.map((file) => [file.path, file]));
  assert(files.has("server.js") && files.has(".next/BUILD_ID"), "payload-entrypoint-or-build-id-missing");
  const buildId = await readFile((await regularFileInside(restored.absolute, ".next/BUILD_ID")).absolute, "utf8");
  assert(buildId.trim() === build.value.buildId, "restored-build-id-mismatch");
  assert(Array.isArray(options.assets ?? []) && (options.assets ?? []).length <= 128, "assets-list-invalid");
  const assets = (options.assets ?? []).map((asset) => {
    const pathname = safeRoute(asset.pathname);
    assert(asset.payloadPath === `public${pathname}` && files.has(asset.payloadPath), "asset-not-in-public-payload");
    return { pathname, payloadPath: asset.payloadPath };
  });
  assert(new Set(assets.map((asset) => asset.pathname)).size === assets.length, "duplicate-asset-route");
  return { workspace, restored, manifest, build, server, files, assets, verification };
}

export async function smokeRestoredRuntimeV636(options) {
  const startedAt = now();
  const input = await verifyInputs(options);
  const startupTimeoutMs = boundedMilliseconds(options.startupTimeoutMs, 30_000, 120_000);
  const requestTimeoutMs = boundedMilliseconds(options.requestTimeoutMs, 10_000, 60_000);
  const cleanupTimeoutMs = boundedMilliseconds(options.cleanupTimeoutMs, 5_000, 30_000);
  const output = options.output ? relativeInside(input.workspace, options.output) : null;
  if (output) {
    const relativeToRestored = path.relative(input.restored.absolute, output.absolute);
    assert(relativeToRestored === ".." || relativeToRestored.startsWith(`..${path.sep}`), "receipt-must-be-outside-restored-payload");
    let cursor = input.workspace;
    const parts = output.relative.split("/");
    for (const part of parts.slice(0, -1)) {
      cursor = path.join(cursor, part);
      const stat = await lstat(cursor);
      assert(stat.isDirectory() && !stat.isSymbolicLink(), "receipt-parent-invalid");
    }
    try { await lstat(output.absolute); throw new Error("receipt-already-exists"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  const port = await unusedLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  const environment = smokeChildEnvironmentV636(port);
  assert(process.allowedNodeEnvironmentFlags.has("--permission") && process.allowedNodeEnvironmentFlags.has("--allow-fs-read"), "node-filesystem-permissions-unavailable");
  const childArguments = ["--permission", `--allow-fs-read=${input.restored.absolute}`, input.server.absolute];
  const child = spawn(process.execPath, childArguments, {
    cwd: input.restored.absolute, env: environment, windowsHide: true,
    shell: false, detached: false, stdio: ["ignore", "pipe", "pipe"],
  });
  const observed = observeChild(child);
  const probes = [];
  const routes = [];
  const issues = [];
  let page = null;
  let health = null;
  let pageIdentity = null;
  let healthIdentity = null;
  let inventoryAfter = null;
  let cleanup;
  try {
    health = await waitForHealth(origin, observed.state, startupTimeoutMs, requestTimeoutMs, probes);
    successfulResponse(health, `${origin}/api/health`, /^application\/json\b/iu);
    healthIdentity = healthBinding(health.body, input.build.value);
    page = await requestSmokeBytesV636(`${origin}/`, requestTimeoutMs);
    successfulResponse(page, `${origin}/`, /^text\/html\b/iu);
    const html = page.body.toString("utf8");
    pageIdentity = await pageBinding(page, input);
    const scripts = smokeScriptRoutesV636(html, origin).map((pathname) => ({ pathname, payloadPath: `.next/${pathname.slice("/_next/".length)}`, kind: "script" }));
    for (const asset of [...scripts, ...input.assets.map((entry) => ({ ...entry, kind: "public-asset" }))]) {
      const expected = input.files.get(asset.payloadPath);
      assert(expected, "requested-file-not-in-manifest");
      const local = await regularFileInside(input.restored.absolute, asset.payloadPath);
      const localBytes = await readFile(local.absolute);
      assert(hash(localBytes) === expected.sha256 && localBytes.length === expected.bytes, "restored-asset-changed-after-verification");
      const response = await requestSmokeBytesV636(`${origin}${asset.pathname}`, requestTimeoutMs);
      const matchesPayload = response.observation.sha256 === expected.sha256 && response.body.length === expected.bytes;
      routes.push({ ...asset, ...response.observation, expectedSha256: expected.sha256, expectedBytes: expected.bytes, matchesPayload });
      successfulResponse(response, `${origin}${asset.pathname}`, asset.kind === "script" ? /^(?:text|application)\/(?:java|ecma)script\b/iu : null);
      assert(matchesPayload, "served-asset-sha256-mismatch");
    }
    assert(!observed.state.exited && !observed.state.error, "owned-server-exited-during-smoke");
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "smoke-failed");
  } finally {
    cleanup = await stopOwnedSmokeChildV636(child, observed, cleanupTimeoutMs);
    if (!cleanup.exited) issues.push("owned-server-cleanup-timeout");
  }
  try {
    const { verifyRuntimePayloadV636 } = await import("./mainline-a-runtime-payload-v636.mjs");
    inventoryAfter = await verifyRuntimePayloadV636({ workspace: input.workspace, directory: input.restored.relative, expectedManifestSha256: input.manifest.sha256, expectedBuild: input.manifest.value.build });
    assert(inventoryAfter.status === "verified", "post-smoke-inventory-not-verified");
  } catch (error) { issues.push(`post-smoke-inventory:${error instanceof Error ? error.message : "failed"}`); }
  const report = {
    schema: "mainline-a-restored-runtime-http-smoke-v636", status: issues.length ? "blocked" : "passed",
    evidenceClass: "http", startedAt, endedAt: now(), origin,
    executionContext: input.manifest.value.fixtureOnly === true || input.build.value.fixtureOnly === true ? "test-fixture" : "restored-candidate-runtime",
    usableAsRealRuntimeEvidence: input.manifest.value.fixtureOnly !== true && input.build.value.fixtureOnly !== true,
    restoredDirectory: input.restored.relative,
    payloadManifest: { path: input.manifest.path, sha256: input.manifest.sha256 },
    buildReceipt: { path: input.build.path, sha256: input.build.sha256 },
    build: input.manifest.value.build, page: page?.observation ?? null, health: health?.observation ?? null,
    pageIdentity, healthIdentity, startupProbes: probes, requestedPublicAssets: input.assets, routes, issues,
    process: { executable: process.execPath, arguments: childArguments, entrypoint: "server.js", ownedPid: observed.state.pid, environmentKeys: Object.keys(environment).sort(), inheritedSecrets: false, stdoutBytes: observed.state.stdoutBytes, stderrBytes: observed.state.stderrBytes, failureStderrTail: issues.length ? observed.state.stderrTail : null, ...observed.streams() },
    permissions: { mechanism: "node-native-permission", readRoot: input.restored.relative, filesystemWrites: false, ancestorModuleReads: false, childProcess: false, workers: false, nativeAddons: false, networkSandbox: false },
    inventoryBefore: input.verification, inventoryAfter,
    cleanup, boundary: SMOKE_BOUNDARY_V636,
    limitations: ["HTTP bytes only; no browser or visual execution", "A static HTML byte match leaves client rendering and DOM build identity unobserved", "Request timings are not production performance", "Native Node permissions restrict filesystem and subprocess access, not all network activity", "Health identity is schema/profile/kernel; build identity is server markup or pinned static HTML plus BUILD_ID and script hashes", "Candidate payload restore is not release, rights, or scientific approval"],
  };
  if (output) await writeFile(output.absolute, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  return report;
}

export function parseSmokeArgumentsV636(args) {
  const values = {};
  const allowed = new Set(["--restored-directory", "--payload-manifest", "--payload-sha256", "--build-receipt", "--build-sha256", "--assets-json", "--output"]);
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    assert(allowed.has(flag) && !Object.hasOwn(values, flag) && args[index + 1] && !args[index + 1].startsWith("--"), "invalid-smoke-arguments");
    values[flag] = args[index + 1];
  }
  for (const flag of ["--restored-directory", "--payload-manifest", "--payload-sha256", "--build-receipt", "--build-sha256", "--output"]) assert(values[flag], `missing:${flag}`);
  return {
    restoredDirectory: values["--restored-directory"],
    payloadManifest: { path: values["--payload-manifest"], sha256: values["--payload-sha256"] },
    buildReceipt: { path: values["--build-receipt"], sha256: values["--build-sha256"] },
    assets: values["--assets-json"] ? JSON.parse(values["--assets-json"]) : [], output: values["--output"],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await smokeRestoredRuntimeV636(parseSmokeArgumentsV636(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === "passed" ? 0 : 1;
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; }
}
