import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const path = "dist/science/ixpe-metadata-probe-v563/metadata-probe.json";
const transient = new Set(["generatedAt", "artifactSha256", "resultSha256"]);
const bytes = (file) => readFileSync(resolve(root, file));
const fileSha = (file) => createHash("sha256").update(bytes(file)).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
const artifact = JSON.parse(bytes(path).toString("utf8"));
if (canonicalSha(artifact) !== artifact.artifactSha256 || artifact.version !== "v563-ixpe-metadata-probe-v1" || !["blocked-no-metadata-manifest", "dry-run-no-network", "metadata-probe-complete", "blocked-metadata-identity-conflict"].includes(artifact.status) || artifact.target !== "Cyg X-1" || artifact.probe.method !== "HEAD-only" || artifact.probe.metadataOnly !== true || artifact.probe.payloadRead !== false || artifact.probe.automaticRetry !== false || artifact.probe.automaticTargetReplacement !== false || artifact.qualification.payloadCompletenessConfirmed !== false || artifact.qualification.measuredAuthorityGranted !== false || artifact.boundary.eventPayloadRead !== false || artifact.boundary.responsePayloadRead !== false || artifact.boundary.attitudePayloadRead !== false || artifact.boundary.backgroundPayloadRead !== false || artifact.boundary.expectedCountsWritten !== false || artifact.boundary.syntheticRowsWritten !== false || artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" || artifact.source.formalProductPointer !== "v263") throw new Error("v563-metadata-boundary");
if (artifact.status === "blocked-metadata-identity-conflict" && (artifact.probe.networkAttempted !== true || artifact.probe.mirrorIdentityConflict !== true || artifact.sources.length !== 2)) throw new Error("v563-metadata-conflict");
if (canonicalSha(artifact.sourceManifest) !== artifact.sourceSha256) throw new Error("v563-metadata-source-manifest");
for (const entry of artifact.sourceManifest) if (!statSync(resolve(root, entry.path)).isFile() || statSync(resolve(root, entry.path)).size !== entry.bytes || fileSha(entry.path) !== entry.sha256) throw new Error(`v563-metadata-source:${entry.path}`);
console.log(JSON.stringify({ status: "passed-v563-ixpe-metadata-blocked-negative-evidence", artifactSha256: artifact.artifactSha256, probeStatus: artifact.status, target: artifact.target, metadataOnly: true, payloadRead: false, networkAttempted: artifact.probe.networkAttempted, mirrorIdentityConflict: artifact.probe.mirrorIdentityConflict, measuredAuthorityGranted: false }, null, 2));
