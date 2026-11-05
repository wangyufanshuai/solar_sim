import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = "docs/release/v607/mainline-a-r69-build-20261012v656web03.json";
const MANIFEST = "app/data/mainlineAWebSkyAtlasV656.generated.json";
const OUTPUT = "docs/release/v607/mainline-a-r69-v656-http-20261012v656web03.json";
const ORIGIN = "http://127.0.0.1:3100";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ensure = (condition, code) => {
  if (!condition) throw new Error(`web-sky-http-v656:${code}`);
};

async function request(route, options = {}) {
  const started = performance.now();
  const response = await fetch(new URL(route, ORIGIN), {
    signal: AbortSignal.timeout(20_000), redirect: "manual", ...options,
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { route, method: options.method ?? "GET", status: response.status,
    contentType: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control"),
    contentLength: response.headers.get("content-length"),
    artifactSha: response.headers.get("x-artifact-sha256"),
    candidateOnly: response.headers.get("x-mainline-a-candidate-only"),
    admission: response.headers.get("x-mainline-a-admission"),
    writeback: response.headers.get("x-scientific-payload-writeback"),
    cors: response.headers.get("access-control-allow-origin"),
    bytes: bytes.byteLength, sha256: sha(bytes),
    elapsedMs: performance.now() - started, body: bytes };
}

const [build, manifestBytes, current] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, MANIFEST)),
  captureBuildInputs(),
]);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
ensure(build.status === "passed" && build.sourceStable === true
  && build.round === 69 && build.inputBefore?.sha256 === current.sha256
  && build.inputAfterSha256 === current.sha256,
"build-not-current-source");
ensure(manifest.counts.stars === 24
  && manifest.counts.runtimeExisting === 20
  && manifest.counts.candidateHold === 4
  && manifest.counts.constellations === 12
  && manifest.boundary.scientificPayloadWriteback === false,
"manifest-count-or-boundary");
for (const pin of Object.values(manifest.generatedFrom)) {
  const source = await readFile(path.join(ROOT, pin.path));
  ensure(source.byteLength === pin.bytes && sha(source) === pin.sha256,
  `source-pin-drift:${pin.path}`);
}

const [home, health, atlas, wrongMethod, unknown] = await Promise.all([
  request("/"), request("/api/health"),
  request("/api/atlas/mainline-a-web-sky"),
  request("/api/atlas/mainline-a-web-sky", { method: "POST" }),
  request("/api/atlas/mainline-a-web-sky/unknown"),
]);
const expected = Buffer.from(JSON.stringify(manifest));
ensure(home.status === 200 && health.status === 200,
"home-or-health-failed");
ensure(atlas.status === 200
  && atlas.contentType?.startsWith("application/json")
  && atlas.cacheControl?.includes("no-store")
  && atlas.contentLength === String(expected.byteLength)
  && atlas.bytes === expected.byteLength
  && atlas.sha256 === sha(expected)
  && atlas.artifactSha === atlas.sha256
  && atlas.body.equals(expected)
  && atlas.candidateOnly === "true"
  && atlas.admission === "hold"
  && atlas.writeback === "false"
  && atlas.cors === null,
"manifest-http-byte-or-boundary-mismatch");
ensure(wrongMethod.status === 405 && unknown.status === 404,
"negative-routes-not-rejected");
ensure(!/raDeg|parallaxMas|distancePc|luminositySolar/.test(
  atlas.body.toString("utf8")),
"science-fields-leaked-into-navigation-manifest");

const report = {
  schema: "mainline-a-r69-web-sky-http-v656",
  status: "passed-local-http",
  observedAt: new Date().toISOString(),
  origin: ORIGIN, buildReceipt: BUILD,
  buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
  sourceSha256: current.sha256, currentSourceEqualsBuild: true,
  manifest: { path: MANIFEST, bytes: manifestBytes.byteLength,
    sha256: sha(manifestBytes), inputPinsRecomputed: 4,
    rows: { stars: manifest.stars.length,
      constellations: manifest.constellations.length },
    response: { status: atlas.status, bytes: atlas.bytes,
      sha256: atlas.sha256, elapsedMs: atlas.elapsedMs,
      cacheControl: atlas.cacheControl } },
  home: { status: home.status, bytes: home.bytes,
    sha256: home.sha256 },
  health: { status: health.status, bytes: health.bytes,
    sha256: health.sha256 },
  negative: { postStatus: wrongMethod.status,
    unknownStatus: unknown.status },
  claims: { realUserValidation: false,
    productionPerformance: false, scientificValidity: false,
    copyrightApproval: false, publicWebReleaseApproved: false },
};
await writeFile(path.join(ROOT, OUTPUT),
  `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ status: report.status,
  buildId: report.buildId, manifest: report.manifest,
  negative: report.negative, output: OUTPUT }, null, 2));
