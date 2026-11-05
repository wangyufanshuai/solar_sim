import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist/science/ixpe-metadata-probe-v563/metadata-probe.json");
const liveProbePath = process.env.ORBIT_IXPE_METADATA_PROBE_RESULT ?? "../../orbit-relativity-engine/dist/metadata-live-v563/metadata-probe.json";
const liveManifestPath = process.env.ORBIT_IXPE_METADATA_SOURCE_MANIFEST ?? "../../orbit-relativity-engine/examples/ixpe-cyg-x1-metadata-v563.json";
const transient = new Set(["generatedAt", "artifactSha256", "resultSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
const canonicalSha = (value) => sha(JSON.stringify(canonical(value)));
const upstream = { intake: "dist/science/ixpe-measured-intake-v562/intake.json", revalidation: "dist/science/orbit-atlas-current-worktree-revalidation-v561.json", engine: "dist/science/orbit-relativity-engine-v561/import-manifest.json", dense: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json" };
const intake = read(upstream.intake);
const revalidation = read(upstream.revalidation);
const engine = read(upstream.engine);
const dense = read(upstream.dense);
const formal = read(upstream.formal);
if (intake.qualification?.measuredAuthorityGranted !== false || revalidation.currentWorktree?.sourceAudit?.mismatchCount !== 0 || engine.qualification?.measuredAuthority !== false || dense.status !== "incomplete-0-of-49" || formal.version !== "v263-current-product-evidence-pointer") throw new Error("v563-upstream-boundary");

const liveAvailable = existsSync(resolve(root, liveProbePath)) && existsSync(resolve(root, liveManifestPath));
const live = liveAvailable ? read(liveProbePath) : null;
if (live && (live.version !== "v563-ixpe-metadata-probe-v1" || live.target !== "Cyg X-1" || live.payloadRead !== false || live.automaticRetry !== false || live.automaticTargetReplacement !== false || live.measuredAuthorityGranted !== false || live.networkAttempted !== true || !["metadata-probe-complete", "blocked-metadata-identity-conflict"].includes(live.status) || !Array.isArray(live.sources) || live.sources.length !== 2)) throw new Error("v563-live-probe-boundary");
for (const source of live?.sources ?? []) {
  const host = new URL(source.url).hostname;
  if (!new Set(["heasarc.gsfc.nasa.gov", "heasarc.nasa.gov"]).has(host) || source.payloadRead !== false) throw new Error("v563-live-probe-host");
}
const sources = live?.sources ?? [];
const networkAttempted = live?.networkAttempted === true;
const mirrorIdentityConflict = live?.mirrorIdentityConflict === true;
const metadataAvailable = sources.length === 2 && sources.every((source) => source.status === "metadata-ready");
const status = live?.status ?? "blocked-no-metadata-manifest";
const sourcePaths = Object.values(upstream).concat(["scripts/probe-ixpe-metadata-v563.py", "scripts/build-ixpe-metadata-probe-v563.mjs", "app/lib/ixpeMetadataProbeV563.ts"], liveAvailable ? [liveProbePath, liveManifestPath] : []);
const sourceManifest = sourcePaths.map((path) => ({ path, bytes: bytes(path).byteLength, sha256: sha(bytes(path)) })).sort((left, right) => left.path.localeCompare(right.path));
const reasons = live ? [
  ...(mirrorIdentityConflict ? ["heasarc-nasa-mirror-metadata-identity-conflict"] : []),
  ...sources.filter((source) => source.status !== "metadata-ready").map((source) => `${source.id}:${source.status}`),
  "archive-master-metadata-is-not-a-complete-cyg-x-1-observation-package",
] : ["metadata-manifest-not-provided", "network-probe-not-executed"];
const unsigned = {
  version: "v563-ixpe-metadata-probe-v1",
  generatedAt: "2026-08-03T00:00:00Z",
  status,
  target: "Cyg X-1",
  allowedHosts: ["heasarc.gsfc.nasa.gov", "heasarc.nasa.gov"],
  probe: { method: "HEAD-only", metadataOnly: true, sourceCount: sources.length, networkAttempted, payloadRead: false, automaticRetry: false, automaticTargetReplacement: false, mirrorIdentityConflict },
  source: { v562IntakeSha256: intake.artifactSha256, v561RevalidationSha256: revalidation.artifactSha256, v561EngineImportSha256: engine.artifactSha256, v314StateSha256: dense.stateSha256, formalProductPointer: "v263", liveProbeArtifactSha256: live?.artifactSha256 ?? null, liveSourceManifestSha256: live?.sourceManifestSha256 ?? null },
  qualification: { metadataContractQualified: true, metadataAvailable, payloadCompletenessConfirmed: false, measuredAuthorityGranted: false, sciencePayloadWritebackAllowed: false },
  boundary: { eventPayloadRead: false, responsePayloadRead: false, attitudePayloadRead: false, backgroundPayloadRead: false, expectedCountsWritten: false, syntheticRowsWritten: false, publicDeploymentAllowed: false, denseCampaignStatus: "incomplete-0-of-49" },
  reasons,
  sources,
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
mkdirSync(dirname(output), { recursive: true });
const part = `${output}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
renameSync(part, output);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, target: artifact.target, sources: `${sources.length}/2`, metadataOnly: true, payloadRead: false, networkAttempted, mirrorIdentityConflict, measuredAuthorityGranted: false, formalProductPointer: "v263" }, null, 2));
