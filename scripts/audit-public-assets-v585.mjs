import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve("dist/release/orbit-atlas-visual-freeze-v585/public-asset-head-observation.json");
const args = process.argv.slice(2);
const targetArgs = args.filter((entry) => entry.startsWith("--target=")).map((entry) => entry.slice("--target=".length));
const requiredLabel = args.find((entry) => entry.startsWith("--require-label="))?.slice("--require-label=".length) ?? null;
if (targetArgs.length === 0) throw new Error("Usage: node scripts/audit-public-assets-v585.mjs --target=label=https://host [--require-label=label]");

const candidateCatalog = JSON.parse(await readFile(resolve("app/data/atlasVisualCandidateAssetsV562.json"), "utf8"));
const stable = [
  "orbit-atlas-v9-base-8k.jpg",
  "orbit-atlas-v9-base-4k.jpg",
  "orbit-atlas-v9-stars-4k.jpg",
  "orbit-atlas-v9-stars-2k.jpg",
  "orbit-atlas-v9-dust-2k.jpg",
].map((name) => ({ lane: "stable-v263-legacy-v9", id: name, path: `/atlas-lite/textures/sky/${name}`, required: true }));
const candidateResolved = candidateCatalog.map((asset) => ({ lane: "candidate-v562", id: `${asset.id}:lite`, path: `/atlas-lite${asset.url}`, required: true }));
const candidateDirect = candidateCatalog.map((asset) => ({ lane: "candidate-v562", id: `${asset.id}:direct`, path: asset.url, required: true }));
const paths = [
  { lane: "deployment", id: "root", path: "/", required: true },
  { lane: "deployment", id: "health", path: "/api/health", required: true },
  ...stable,
  ...candidateResolved,
  ...candidateDirect,
];

function allowedRedirectHost(initialHost, finalHost) {
  return finalHost === initialHost || finalHost.endsWith(".vercel.app");
}

async function headOnce(baseUrl, entry) {
  const initial = new URL(entry.path, baseUrl);
  let current = initial;
  const redirects = [];
  let response;
  for (let hop = 0; hop <= 5; hop += 1) {
    response = await fetch(current, { method: "HEAD", redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(12_000), headers: { "user-agent": "Orbit-Atlas-v585-HEAD-audit" } });
    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get("location");
    if (!location) break;
    const next = new URL(location, current);
    redirects.push({ status: response.status, from: current.href, to: next.href });
    current = next;
  }
  if (!response) throw new Error(`v585-head-no-response:${entry.id}`);
  return {
    ...entry,
    requestMethod: "HEAD",
    attemptCount: 1,
    initialUrl: initial.href,
    finalUrl: current.href,
    redirects,
    finalHostAllowed: allowedRedirectHost(initial.host, current.host),
    status: response.status,
    ok: response.status === 200 && allowedRedirectHost(initial.host, current.host),
    bytes: Number(response.headers.get("content-length") ?? "NaN"),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
    contentType: response.headers.get("content-type"),
  };
}

const targets = [];
for (const encoded of targetArgs) {
  const separator = encoded.indexOf("=");
  if (separator < 1) throw new Error(`Invalid target: ${encoded}`);
  const label = encoded.slice(0, separator);
  const baseUrl = encoded.slice(separator + 1).replace(/\/$/, "");
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:") throw new Error(`HTTPS required: ${baseUrl}`);
  const observations = [];
  for (let offset = 0; offset < paths.length; offset += 6) {
    observations.push(...await Promise.all(paths.slice(offset, offset + 6).map(async (entry) => {
      try {
        return await headOnce(baseUrl, entry);
      } catch (error) {
        return { ...entry, requestMethod: "HEAD", attemptCount: 1, initialUrl: new URL(entry.path, baseUrl).href, finalUrl: null, redirects: [], finalHostAllowed: false, status: null, ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    })));
  }
  const required = observations.filter((entry) => entry.required);
  targets.push({ label, baseUrl, host: parsed.host, observations, requiredCount: required.length, passedCount: required.filter((entry) => entry.ok).length, qualified: required.every((entry) => entry.ok) });
}

const unsigned = {
  version: "v585-public-asset-head-observation-v1",
  generatedAt: new Date().toISOString(),
  automaticRetry: false,
  automaticTargetReplacement: false,
  payloadDownloaded: false,
  method: "HEAD",
  targets,
  requiredLabel,
  requiredLabelQualified: requiredLabel === null ? null : targets.find((target) => target.label === requiredLabel)?.qualified === true,
};
const artifactSha256 = createHash("sha256").update(JSON.stringify(unsigned)).digest("hex");
const artifact = { ...unsigned, artifactSha256 };
await mkdir(dirname(output), { recursive: true });
const partial = `${output}.${process.pid}.part`;
await writeFile(partial, `${JSON.stringify(artifact, null, 2)}\n`);
await rename(partial, output);
console.log(JSON.stringify({ output: output.replaceAll("\\", "/"), artifactSha256, targets: targets.map(({ label, qualified, passedCount, requiredCount }) => ({ label, qualified, passedCount, requiredCount })), requiredLabelQualified: artifact.requiredLabelQualified }, null, 2));
if (requiredLabel && artifact.requiredLabelQualified !== true) process.exitCode = 1;
