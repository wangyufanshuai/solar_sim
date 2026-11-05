import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3094";
const BUILD = "docs/release/v607/mainline-a-r67-build-20261012v654b1web01.json";
const OUTPUT = "docs/release/v607/mainline-a-r67-v654-http-20261012v654b1web01.json";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, code) => {
  if (!condition) throw new Error(`b1-http-v654:${code}`);
};

async function get(route) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const response = await fetch(new URL(route, ORIGIN), {
    redirect: "manual", signal: AbortSignal.timeout(15_000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { route, startedAt, endedAt: new Date().toISOString(),
    elapsedMs: performance.now() - started,
    status: response.status, contentType: response.headers.get("content-type"),
    finalUrl: response.url,
    redirect: response.headers.get("location"),
    bytes: bytes.byteLength, sha256: hash(bytes), body: bytes };
}

const build = JSON.parse(await readFile(path.join(ROOT, BUILD), "utf8"));
assert(build.status === "passed" && build.sourceStable === true
  && build.exitCode === 0 && build.round === 67,
"build-not-passed");
const home = await get("/");
assert(home.status === 200
  && /^text\/html/.test(home.contentType ?? "")
  && home.finalUrl === `${ORIGIN}/`
  && home.redirect === null,
"home-http-invalid");
const html = home.body.toString("utf8");
assert(html.includes(build.buildId)
  && html.includes("/_next/static/"),
"home-build-identity-invalid");
const health = await get("/api/health");
assert(health.status === 200
  && /^application\/json/.test(health.contentType ?? ""),
"health-http-invalid");
const healthJson = JSON.parse(health.body.toString("utf8"));
assert(healthJson.status === "ok", "health-payload-invalid");
const scripts = [...html.matchAll(/src="(\/_next\/static\/[^"?]+\.js)"/g)]
  .map((match) => match[1]);
assert(scripts.length >= 3 && new Set(scripts).size === scripts.length,
"static-script-links-missing");
const assets = [];
for (const route of scripts.slice(0, 4)) {
  const actual = await get(route);
  const relative = route.replace(/^\/_next\//, "");
  const local = path.resolve(ROOT, build.distDir, relative);
  const base = path.resolve(ROOT, build.distDir, "static");
  assert(local.startsWith(`${base}${path.sep}`), "static-path-escaped");
  const expected = await readFile(local);
  assert(actual.status === 200 && actual.redirect === null
    && /^text\/javascript|^application\/javascript/.test(
      actual.contentType ?? "")
    && actual.sha256 === hash(expected)
    && actual.bytes === expected.byteLength,
  `static-asset-mismatch:${route}`);
  assets.push({ route, status: actual.status,
    contentType: actual.contentType, bytes: actual.bytes,
    httpSha256: actual.sha256, localSha256: hash(expected),
    elapsedMs: actual.elapsedMs });
}
const report = { schema: "mainline-a-r67-b1-http-v654",
  status: "passed-local-http", observedAt: new Date().toISOString(),
  origin: ORIGIN, buildReceipt: BUILD, buildId: build.buildId,
  runtimeBuildId: build.runtimeBuildId,
  sourceSha256: build.inputBefore.sha256,
  home: { status: home.status, contentType: home.contentType,
    bytes: home.bytes, sha256: home.sha256,
    elapsedMs: home.elapsedMs },
  health: { status: health.status, contentType: health.contentType,
    bytes: health.bytes, sha256: health.sha256,
    elapsedMs: health.elapsedMs, healthStatus: healthJson.status },
  staticScripts: assets,
  limits: { localOnly: true, productionPerformance: false,
    realUserValidation: false, copyrightApproval: false,
    scientificValidity: false } };
await writeFile(path.join(ROOT, OUTPUT),
  `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ status: report.status,
  buildId: report.buildId,
  homeStatus: report.home.status,
  healthStatus: report.health.status,
  staticScriptsMatched: assets.length,
  output: OUTPUT }, null, 2));
