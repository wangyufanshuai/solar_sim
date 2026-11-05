import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  executeMeasuredAuthorityAdversarialCampaignV380,
  parseMeasuredAuthorityAdversarialCampaignV380,
} from "../app/lib/measuredAuthorityAdversarialV380";

const root = process.cwd();
const output = "dist/science/measured-authority-adversarial-v380/campaign.json";
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const readiness = read("dist/science/measured-authority-readiness-v379/readiness.json");
const photon = read("dist/science/kerr-science-photon-bands-v328/photon-radiance.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
if (readiness.status !== "readiness-matrix-qualified-contracts-7-of-7-inputs-0-of-7" || readiness.presentInputCount !== 0 || readiness.schemaContractQualifiedCount !== 7 || readiness.boundedReadQualifiedCount !== 7 || photon.version !== "v328-kerr-science-photon-bands-artifact-v1" || !photon.view || sha(photon) !== photon.artifactSha256 || dense.status !== "incomplete-0-of-49" || dense.attemptConsumed !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true) throw new Error("v380-campaign-source-boundary");
const first = executeMeasuredAuthorityAdversarialCampaignV380(photon.view);
const second = executeMeasuredAuthorityAdversarialCampaignV380(photon.view);
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("v380-campaign-nondeterministic");
const unsigned = { version: "v380-measured-authority-adversarial-campaign-v1" as const, generatedAt: new Date().toISOString(), status: "adversarial-campaign-qualified-12-of-12-fail-closed" as const, caseCount: 12 as const, passedCaseCount: 12 as const, rejectedCaseCount: 10 as const, unavailableCaseCount: 2 as const, deterministicReplay: true as const, fixtureOnly: true as const, publishableAsMeasuredAuthority: false as const, cases: first, sourcePhotonArtifactSha256: photon.artifactSha256, attemptConsumed: false as const, networkAttempted: false as const, formalProductPointer: "v263" as const, denseCampaignStatus: "incomplete-0-of-49" as const, browserQualification: "not-run" as const };
const artifact = parseMeasuredAuthorityAdversarialCampaignV380({ ...unsigned, artifactSha256: sha(unsigned) });
const target = resolve(root, output); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`); renameSync(temporary, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, cases: `${artifact.passedCaseCount}/${artifact.caseCount}`, rejected: artifact.rejectedCaseCount, unavailable: artifact.unavailableCaseCount, deterministic: artifact.deterministicReplay, measuredPromotion: artifact.publishableAsMeasuredAuthority, dense: artifact.denseCampaignStatus }, null, 2));
