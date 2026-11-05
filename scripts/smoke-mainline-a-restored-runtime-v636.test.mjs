import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import {
  parseSmokeArgumentsV636, requestSmokeBytesV636, smokeChildEnvironmentV636,
  smokeRestoredRuntimeV636, smokeScriptRoutesV636,
} from "./smoke-mainline-a-restored-runtime-v636.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const build = {
  status: "passed", sourceStable: true, exitCode: 0,
  buildId: "unit-fixture-not-production", runtimeBuildId: `mainline-a-${"2".repeat(16)}`,
  branch: "codex/solar-sim-mainline-a", head: "1".repeat(40), profile: "vercel-lite",
  inputAfterSha256: "2".repeat(64),
};
const staticFixtureHtml = '<!doctype html><html><body><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template><script src="/_next/static/chunk.js"></script></body></html>';

function fixtureServer(mode) {
  return `// Test fixture server: never production or browser evidence.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const mode = ${JSON.stringify(mode)};
if (mode === 'startup-failure') process.exit(23);
if (mode === 'permission-check') {
  const operations = [
    () => fs.readFileSync(path.resolve(__dirname,'..','ancestor-secret.txt')),
    () => require('ancestor-only'),
    () => fs.writeFileSync(path.join(__dirname,'unexpected-cache.txt'),'must-not-write'),
    () => require('node:child_process').spawnSync(process.execPath,['-e','process.exit(0)']),
  ];
  for (const operation of operations) {
    let denied = false;
    try { operation(); } catch(error) { denied = error.code === 'ERR_ACCESS_DENIED'; }
    if(!denied) process.exit(24);
  }
}
const build = ${JSON.stringify(build)};
const server = http.createServer((req,res) => {
  if(req.url === '/api/health') {
    if(mode === 'health-timeout') return;
    if(mode === 'health-redirect') { res.writeHead(302,{location:'https://example.invalid/never-follow'});res.end();return; }
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({schemaVersion:'v227-atlas-production-health-v1',status:'ok',
      deliveryProfile:mode === 'health-mismatch' ? 'wrong-profile' : build.profile,
      defaultScientificKernel:'legacy-eih-1pn',checkedAt:new Date().toISOString(),commitSha:null}));return;
  }
  if(req.url === '/') {
    res.setHeader('Content-Type','text/html');
    if(mode === 'static-html-match' || mode === 'static-html-unpinned') { res.end(${JSON.stringify(staticFixtureHtml)});return; }
    if(mode === 'static-html-drift') { res.end(${JSON.stringify(staticFixtureHtml)}+'<p>unexpected response bytes</p>');return; }
    if(mode === 'fake-bailout') { res.end('<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template><script src="/_next/static/chunk.js"></script>');return; }
    const runtime = mode === 'page-mismatch' ? 'unrelated-build' : build.runtimeBuildId;
    const script = mode === 'off-origin-script' ? 'https://example.invalid/never-follow.js' : '/_next/static/chunk.js';
    const shell = '<div data-atlas-app-shell="unit-test" data-mainline-build-id="'+runtime+'" data-mainline-branch="'+build.branch+'" data-mainline-head="'+build.head+'"></div>';
    res.end((mode === 'duplicate-shell' ? shell+shell : mode === 'empty-shell' ? '<div data-atlas-app-shell=""></div>' : shell)+'<script src="'+script+'"></script>');return;
  }
  if(req.url === '/_next/static/chunk.js') {
    res.setHeader('Content-Type','application/javascript');
    res.end(mode === 'script-drift' ? 'changed-response' : fs.readFileSync(path.join(__dirname,'.next/static/chunk.js')));return;
  }
  if(req.url === '/assets/fixture.bin') {
    res.setHeader('Content-Type','application/octet-stream');
    res.end(mode === 'asset-drift' ? 'changed-asset' : fs.readFileSync(path.join(__dirname,'public/assets/fixture.bin')));return;
  }
  res.writeHead(404);res.end();
});
server.listen(Number(process.env.PORT),process.env.HOSTNAME);
`;
}

async function fixture(mode = "success") {
  const { RUNTIME_PAYLOAD_BOUNDARY_V636, materializeRuntimePayloadV636 } = await import("./mainline-a-runtime-payload-v636.mjs");
  const root = path.join(process.cwd(), "tmp", `v636-smoke-test-${mode}-${process.pid}-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  await mkdir(path.join(root, "node_modules/ancestor-only"), { recursive: true });
  await writeFile(path.join(root, "node_modules/ancestor-only/index.js"), "module.exports='must-not-be-resolved';\n", { flag: "wx" });
  await writeFile(path.join(root, "ancestor-secret.txt"), "unit-only-access-denial-sentinel\n", { flag: "wx" });
  const content = {
    "server.js": fixtureServer(mode),
    "package.json": json({ name: "unit-fixture-not-production", type: "commonjs" }),
    ".next/BUILD_ID": build.buildId,
    ".next/static/chunk.js": "globalThis.fixtureOnly=true;\n",
    ...(mode === "static-html-unpinned" ? {} : { ".next/server/app/index.html": staticFixtureHtml }),
    "node_modules/next/package.json": json({ name: "unit-next-fixture" }),
    "node_modules/react/package.json": json({ name: "unit-react-fixture" }),
    "node_modules/react-dom/package.json": json({ name: "unit-react-dom-fixture" }),
    "public/assets/fixture.bin": "raw-fixture-not-astronomical-data\n",
  };
  for (const [file, bytes] of Object.entries(content)) {
    await mkdir(path.dirname(path.join(root, "source", file)), { recursive: true });
    await writeFile(path.join(root, "source", file), bytes, { flag: "wx" });
  }
  const receipt = { ...build, fixtureOnly: true };
  const receiptBytes = json(receipt);
  await writeFile(path.join(root, "build.json"), receiptBytes, { flag: "wx" });
  const buildReceipt = { path: "build.json", sha256: sha256(receiptBytes) };
  const files = Object.entries(content).map(([file, bytes]) => ({ path: file, sourcePath: `source/${file}`, bytes: Buffer.byteLength(bytes), sha256: sha256(bytes), role: "standalone" })).sort((a, b) => a.path < b.path ? -1 : 1);
  const manifest = {
    schema: "mainline-a-runtime-payload-v636", status: "candidate-materialization-plan", entrypoint: "server.js",
    fixtureOnly: true,
    build: { buildId: build.buildId, runtimeBuildId: build.runtimeBuildId, branch: build.branch, head: build.head, profile: build.profile, sourceSha256: build.inputAfterSha256, receiptPath: "build.json", receiptSha256: buildReceipt.sha256 },
    host: { platform: process.platform, arch: process.arch, node: process.versions.node },
    files, inventorySha256: sha256(JSON.stringify(files.map(({ path: file, bytes, sha256: digest }) => ({ path: file, bytes, sha256: digest })))),
    totals: { files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0) },
    publicScope: "complete-public-tree-except-explicit-private-files",
    boundary: RUNTIME_PAYLOAD_BOUNDARY_V636,
    claims: { portableAcrossHosts: false, browserValidation: false, copyrightApproval: false, productionPerformance: false },
  };
  const plan = { workspace: root, manifest, build: manifest.build, materialized: false };
  const payload = await materializeRuntimePayloadV636({ workspace: root, destination: "restored", plan });
  return {
    root,
    options: {
      workspace: root, restoredDirectory: "restored", buildReceipt,
      payloadManifest: { path: "restored/runtime-payload-manifest.json", sha256: payload.manifestSha256 },
      assets: [{ pathname: "/assets/fixture.bin", payloadPath: "public/assets/fixture.bin" }],
      output: "smoke.json", startupTimeoutMs: 3_000, requestTimeoutMs: 1_000, cleanupTimeoutMs: 1_000,
    },
  };
}

function assertClosedChild(report) {
  assert.equal(report.cleanup.exited, true);
  assert.equal(report.cleanup.ownedPid, report.process.ownedPid);
  assert.ok(Number.isInteger(report.process.ownedPid));
  assert.notEqual(report.process.ownedPid, process.pid);
  assert.throws(() => process.kill(report.process.ownedPid, 0), (error) => error.code === "ESRCH");
}

test("child environment excludes keys, proxies, module hooks, and user home", () => {
  const environment = smokeChildEnvironmentV636(43111, {
    API_KEY: "must-never-inherit", NODE_OPTIONS: "--require unsafe", HTTPS_PROXY: "http://unsafe",
    HOME: "private-home", USERPROFILE: "private-home", SystemRoot: process.env.SystemRoot,
  });
  assert.equal(environment.PORT, "43111");
  assert.equal(environment.HOSTNAME, "127.0.0.1");
  for (const name of ["API_KEY", "NODE_OPTIONS", "HTTPS_PROXY", "HOME", "USERPROFILE"]) assert.equal(environment[name], undefined);
  assert.equal(environment.NODE_ENV, "production");
  assert.equal(environment.PATH, path.dirname(process.execPath));
});

test("script routes reject external origins, traversal, queries, and empty documents", () => {
  assert.deepEqual(smokeScriptRoutesV636('<script src="/_next/static/a.js"></script><script src="/_next/static/a.js"></script>', "http://127.0.0.1:34567"), ["/_next/static/a.js"]);
  for (const source of ["https://example.invalid/a.js", "//example.invalid/a.js", "/assets/a.js", "/_next/static/a.js?x=1", "/_next/static/%2e%2e/a.js"]) {
    assert.throws(() => smokeScriptRoutesV636(`<script src="${source}"></script>`, "http://127.0.0.1:34567"));
  }
  assert.throws(() => smokeScriptRoutesV636("<div></div>", "http://127.0.0.1:34567"), /script-count-invalid/);
});

test("HTTP request records redirect without contacting destination", async () => {
  let destinationRequests = 0;
  const destination = createServer((_request, response) => { destinationRequests++; response.end("must-not-follow"); });
  await new Promise((resolve) => destination.listen(0, "127.0.0.1", resolve));
  const server = createServer((_request, response) => { response.writeHead(302, { location: `http://127.0.0.1:${destination.address().port}/` }); response.end("redirect-body"); });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    const result = await requestSmokeBytesV636(url, 1_000);
    assert.equal(result.observation.httpStatus, 302);
    assert.equal(result.observation.redirected, true);
    assert.equal(result.observation.finalUrl, url);
    assert.equal(destinationRequests, 0);
    assert.equal(result.observation.sha256, sha256("redirect-body"));
  } finally {
    server.closeAllConnections(); destination.closeAllConnections();
    await Promise.all([new Promise((resolve) => server.close(resolve)), new Promise((resolve) => destination.close(resolve))]);
  }
});

test("HTTP body overflow and timeout remain explicit failed observations", async () => {
  const server = createServer((request, response) => {
    if (request.url === "/large") response.end("too-large-body");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const large = await requestSmokeBytesV636(`${origin}/large`, 1_000, 3);
    assert.equal(large.observation.error, "response-size-limit");
    assert.equal(large.observation.sha256, null);
    const timeout = await requestSmokeBytesV636(`${origin}/wait`, 60);
    assert.equal(timeout.observation.timeout, true);
    assert.equal(timeout.observation.error, "request-timeout");
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});

test("restored fixture server gives HTTP-only receipt and actual owned child exits", async () => {
  const f = await fixture();
  const report = await smokeRestoredRuntimeV636(f.options);
  assert.equal(report.status, "passed", JSON.stringify(report.issues));
  assert.equal(report.routes.length, 2);
  assert.ok(report.routes.every((route) => route.matchesPayload));
  assert.equal(report.pageIdentity.runtimeBuildId, build.runtimeBuildId);
  assert.equal(report.pageIdentity.mode, "server-html-app-shell-attributes");
  assert.equal(report.pageIdentity.browserDomObserved, false);
  assert.equal(report.healthIdentity.buildIdentitySuppliedByHealth, false);
  assert.equal(report.evidenceClass, "http");
  assert.equal(report.executionContext, "test-fixture");
  assert.equal(report.usableAsRealRuntimeEvidence, false);
  assert.equal(report.boundary.browserExecuted, false);
  assert.equal(report.boundary.performanceClaim, false);
  assert.equal(report.boundary.scientificPayloadWriteback, false);
  assert.equal(report.permissions.ancestorModuleReads, false);
  assert.equal(report.permissions.filesystemWrites, false);
  assert.equal(report.inventoryAfter.status, "verified");
  assert.deepEqual(report.process.arguments.slice(0, 2), ["--permission", `--allow-fs-read=${path.join(f.root, "restored")}`]);
  assertClosedChild(report);
  assert.deepEqual(JSON.parse(await readFile(path.join(f.root, "smoke.json"), "utf8")), report);
  await assert.rejects(smokeRestoredRuntimeV636(f.options), /receipt-already-exists/);
});

test("actual child cannot read ancestor module or file, write cache, or spawn grandchildren", async () => {
  const f = await fixture("permission-check");
  const report = await smokeRestoredRuntimeV636(f.options);
  assert.equal(report.status, "passed", JSON.stringify(report.issues));
  assert.equal(report.inventoryAfter.status, "verified");
  assertClosedChild(report);
});

test("exact pinned static HTML is HTTP identity only and leaves client DOM pending", async () => {
  const f = await fixture("static-html-match");
  const report = await smokeRestoredRuntimeV636(f.options);
  assert.equal(report.status, "passed", JSON.stringify(report.issues));
  assert.equal(report.pageIdentity.mode, "static-html-bytes-client-render-pending");
  assert.equal(report.pageIdentity.domBuildIdentityObserved, false);
  assert.equal(report.pageIdentity.expectedRuntimeBuildId, build.runtimeBuildId);
  assert.equal(report.pageIdentity.staticHtml.sha256, sha256(staticFixtureHtml));
  assert.equal(report.pageIdentity.staticHtml.bytes, Buffer.byteLength(staticFixtureHtml));
  assert.equal(report.routes.length, 2);
  assert.ok(report.routes.every((route) => route.matchesPayload));
  assert.equal(report.inventoryAfter.status, "verified");
  assertClosedChild(report);
});

for (const [mode, issue] of [
  ["startup-failure", "owned-server-exited-before-ready"],
  ["health-mismatch", "health-profile-mismatch"],
  ["health-redirect", "http-status-or-final-url-mismatch"],
  ["page-mismatch", "page-runtime-build-mismatch"],
  ["duplicate-shell", "page-app-shell-missing-or-duplicate"],
  ["empty-shell", "page-app-shell-invalid"],
  ["static-html-unpinned", "page-app-shell-absent-and-static-html-unpinned"],
  ["static-html-drift", "static-html-response-sha256-mismatch"],
  ["fake-bailout", "static-html-response-sha256-mismatch"],
  ["off-origin-script", "script-off-origin-or-query"],
  ["script-drift", "served-asset-sha256-mismatch"],
  ["asset-drift", "served-asset-sha256-mismatch"],
]) {
  test(`${mode} cannot pass and cleans the actual spawned child`, async () => {
    const f = await fixture(mode);
    const report = await smokeRestoredRuntimeV636(f.options);
    assert.equal(report.status, "blocked");
    assert.ok(report.issues.includes(issue), JSON.stringify(report.issues));
    assertClosedChild(report);
    if (["script-drift", "asset-drift"].includes(mode)) assert.equal(report.routes.at(-1).matchesPayload, false);
  });
}

test("server that never responds reaches bounded startup timeout and is stopped", async () => {
  const f = await fixture("health-timeout");
  const started = performance.now();
  const report = await smokeRestoredRuntimeV636({ ...f.options, startupTimeoutMs: 500, requestTimeoutMs: 100 });
  assert.equal(report.status, "blocked");
  assert.ok(report.issues.includes("server-startup-timeout"));
  assert.ok(report.startupProbes.some((probe) => probe.timeout));
  assert.ok(performance.now() - started < 5_000);
  assertClosedChild(report);
});

test("pin drift and changed restore bytes fail before starting a process", async () => {
  const f = await fixture();
  await assert.rejects(smokeRestoredRuntimeV636({ ...f.options, buildReceipt: { ...f.options.buildReceipt, sha256: "0".repeat(64) } }), /pinned-json-sha256-mismatch/);
  await writeFile(path.join(f.root, "restored/public/assets/fixture.bin"), "changed");
  await assert.rejects(smokeRestoredRuntimeV636(f.options), /sha|hash|bytes|mismatch/i);
});

test("asset list and output destination must belong to the declared smoke contract", async () => {
  const f = await fixture();
  await assert.rejects(smokeRestoredRuntimeV636({ ...f.options, assets: [{ pathname: "/assets/missing.bin", payloadPath: "public/assets/missing.bin" }] }), /asset-not-in-public-payload/);
  await assert.rejects(smokeRestoredRuntimeV636({ ...f.options, assets: [...f.options.assets, ...f.options.assets] }), /duplicate-asset-route/);
  await assert.rejects(smokeRestoredRuntimeV636({ ...f.options, output: "restored/smoke.json" }), /receipt-must-be-outside-restored-payload/);
});

test("CLI requires explicit pins and rejects repeated or unknown flags", () => {
  const args = ["--restored-directory", "restore", "--payload-manifest", "manifest.json", "--payload-sha256", "a".repeat(64), "--build-receipt", "build.json", "--build-sha256", "b".repeat(64), "--output", "smoke.json"];
  const parsed = parseSmokeArgumentsV636(args);
  assert.equal(parsed.restoredDirectory, "restore");
  assert.equal(parsed.payloadManifest.sha256, "a".repeat(64));
  assert.deepEqual(parsed.assets, []);
  assert.throws(() => parseSmokeArgumentsV636(args.slice(0, -2)), /missing:--output/);
  assert.throws(() => parseSmokeArgumentsV636([...args, "--output", "second.json"]), /invalid-smoke-arguments/);
  assert.throws(() => parseSmokeArgumentsV636([...args, "--origin", "https://example.invalid"]), /invalid-smoke-arguments/);
});
