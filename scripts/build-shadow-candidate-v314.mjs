import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  plan: "dist/science/kerr-campaign-v314/ray-plan.json",
  envelope: "dist/science/kerr-reference-v313/portable-envelope.json",
  legacyState: "dist/science/kerr-campaign-v298r1/campaign-state.json",
  v311: "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v314-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v314.json",
};
const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const fileSha = (relative) => createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const state = read(paths.state);
const plan = read(paths.plan);
const envelope = read(paths.envelope);
const legacy = read(paths.legacyState);
const v311 = read(paths.v311);
const formal = read(paths.formal);
if (state.version !== "v314-kerr-corrected-dense-campaign-state-v1" || state.status !== "incomplete-0-of-49" || state.plannedRayCount !== 3097 || state.plannedShardCount !== 49 || state.completedShardCount !== 0 || state.nextShardIndex !== 0 || state.attemptConsumed !== false || state.runNextAuthorized !== false || state.runNextAvailable !== false || state.controllerImplementation !== "v312-v313-locked-streaming-ndjson-v1" || state.aggregateAvailable !== false) throw new Error("v314 state boundary mismatch");
if (plan.version !== "v314-kerr-corrected-dense-ray-plan-v1" || plan.rayCount !== 3097 || plan.shardCount !== 49 || plan.executionsPerRay !== 8 || plan.rays?.length !== 3097 || plan.shards?.length !== 49 || plan.shards.some((shard) => shard.rayCount > 64) || state.rayPlanSha256 !== plan.planSha256 || state.rayPlanFileSha256 !== fileSha(paths.plan)) throw new Error("v314 plan conservation failed");
if (envelope.status !== "full-kerr-short-authority-qualified" || state.authority?.fullShortAuthoritySha256 !== "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6" || state.authority?.geometryCanonicalSha256 !== "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e" || state.authority?.polarizationCanonicalSha256 !== "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f") throw new Error("v314 scientific authority identity mismatch");
if (legacy.stateSha256 !== "2bb8fbd88f66c2064fb93152f13d73f879174ad53f2c409050f9876a49597fe2" || v311.status !== "failed-tolerance-ladder-degenerate") throw new Error("historical campaign quarantine drift");
if (formal.version !== "v263-current-product-evidence-pointer") throw new Error("formal pointer drift");

const sourcePaths = ["scripts/run-kerr-dense-campaign-v314.py", "scripts/test-kerr-dense-campaign-v314.py", "scripts/build-shadow-candidate-v314.mjs", "scripts/atlas.mjs", "app/lib/kerrCampaignV314.ts", "app/lib/kerrCampaignV314.test.ts", "app/lib/atlasShadowCapabilityPointerV314.ts", "app/lib/atlasShadowCapabilityPointerV314.test.ts", "app/lib/relativityWorkbenchEvidenceV285.ts", "app/lib/relativityEvidenceServerV285R1.ts"];
const sourceManifest = sourcePaths.map((source) => ({ path: source, sha256: fileSha(source) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v314-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "corrected-dense-initialized-0-of-49-awaiting-explicit-shard-authorization",
  authority: { envelope: { path: paths.envelope, evidenceSha256: envelope.evidenceSha256, fileSha256: fileSha(paths.envelope) }, sourceManifest, sourceSha256: sha(sourceManifest) },
  correctedCampaign: { state: { path: paths.state, stateSha256: state.stateSha256, fileSha256: fileSha(paths.state) }, plan: { path: paths.plan, planSha256: plan.planSha256, fileSha256: fileSha(paths.plan) }, plannedRayCount: 3097, plannedShardCount: 49, completedShardCount: 0, nextShardIndex: 0, attemptConsumed: false, runNextAuthorized: false, runNextAvailable: false, aggregateAvailable: false, aggregatePrecondition: "refused-partial-aggregate" },
  historicalCampaign: { namespace: "kerr-campaign-v298r1", status: "quarantined-1-of-49-tolerance-ladder-degenerate", stateSha256: legacy.stateSha256, truthAuditSha256: v311.truthAuditSha256, stateMutationApplied: false },
  science: { defaultKernel: "legacy-eih-1pn", workerPhysicsMutation: "not-applied", legacyKerrMutation: "not-applied" },
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "corrected-dense-plan-state-only-no-shard-execution-no-partial-aggregate-no-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v314",
  generatedAt: new Date().toISOString(),
  status: "full-kerr-short-qualified-corrected-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: { v312GeometryTolerance: "corrected-authority-qualified", v313Polarization: "qualified-against-v312", fullKerrShortAuthority: "qualified-v312-v313-envelope", historicalV298r1: "quarantined-1-of-49-tolerance-ladder-degenerate", v314CorrectedDense: "incomplete-0-of-49", runNext: "implemented-disabled-awaiting-explicit-authorization", denseAggregate: "unavailable", browserQualification: "not-run" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, correctedDense: pointer.capabilities.v314CorrectedDense, runNext: pointer.capabilities.runNext }, null, 2));
