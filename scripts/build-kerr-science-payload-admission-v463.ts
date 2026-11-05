import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrSciencePayloadAdmissionPayloadV463,
  evaluateKerrSciencePayloadAdmissionV463,
  KERR_SCIENCE_PAYLOAD_ADMISSION_ARTIFACT_VERSION_V463,
  parseKerrSciencePayloadAdmissionArtifactV463,
  type KerrSciencePayloadAdmissionInputV463,
} from "../app/lib/kerrSciencePayloadAdmissionV463";

const root = process.cwd();
const paths = {
  join: "dist/science/kerr-scientific-measurement-join-v462/measurement-join.json",
  output: "dist/science/kerr-science-payload-admission-v463/payload-admission.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
};
type JsonRecord = Record<string, unknown>;
const read = (path: string): JsonRecord => JSON.parse(readFileSync(resolve(root, path), "utf8")) as JsonRecord;
const record = (value: unknown): JsonRecord => value as JsonRecord;
const canonicalSha = (value: unknown) => createHash("sha256").update(canonicalKerrSciencePayloadAdmissionPayloadV463(value)).digest("hex");
const fileSha = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const join = read(paths.join);
const joinJoin = record(join.join);
const joinInspect = record(join.inspect);
const joinQualification = record(join.qualification);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source as string);
const formalScience = record(formalEvidence.science);
const formalContracts = record(formalEvidence.contracts);
if (join.version !== "v462-kerr-scientific-measurement-join-artifact-v1"
  || join.status !== "join-protocol-qualified-inputs-unavailable"
  || joinJoin.joinAllowed !== false
  || joinJoin.authorityGranted !== false
  || joinInspect.committed !== false
  || joinInspect.productionPixelRows !== 0
  || joinQualification.scienceProductJoinQualified !== false
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalScience.defaultKernel !== "legacy-eih-1pn"
  || formalContracts.singleCanvas !== true
  || formalContracts.legacyRootAttributes !== 603
  || formalContracts.evidenceLedgerClaims !== 84) {
  throw new Error("v463-upstream-boundary");
}

const joinArtifactSha256 = fileSha(paths.join);
const joinSource = join.source as JsonRecord;
const admission = evaluateKerrSciencePayloadAdmissionV463({
  measurementJoinArtifactSha256: join.artifactSha256 as string,
  measurementJoinFileSha256: joinArtifactSha256,
  measurementJoin: join as unknown as KerrSciencePayloadAdmissionInputV463["measurementJoin"],
});
if (admission.status !== "blocked" || admission.reason !== "measurement-join-incomplete" || admission.sciencePayloadAllowed || admission.authorityGranted) throw new Error("v463-admission-firewall");

const unsigned = {
  version: KERR_SCIENCE_PAYLOAD_ADMISSION_ARTIFACT_VERSION_V463,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "payload-admission-protocol-qualified-join-blocked" as const,
  source: {
    measurementJoinArtifactSha256: join.artifactSha256 as string,
    measurementJoinFileSha256: joinArtifactSha256,
    uncertaintyLedgerArtifactSha256: joinSource.v461LedgerArtifactSha256 as string,
  },
  contract: {
    v462AtomicJoinIsOnlyUpstream: true as const,
    completeJoinRequired: true as const,
    detectorAuthorityRequired: true as const,
    residualLedgerClosedRequired: true as const,
    sourceShaRequired: true as const,
    applicabilityExplicit: true as const,
    scienceCinematicWritebackForbidden: true as const,
  },
  schema: {
    version: "kerr-science-payload-row-v1" as const,
    fields: ["classification", "detectorPixel", "redshift", "evpa", "intensity", "uncertaintyLedgerSha256", "measurementJoinSha256", "provenanceSourceSha256"] as const,
    classifications: ["capture", "escape", "disk-hit"] as const,
    unavailableValuesAreExplicit: true as const,
    finiteNumericValuesRequired: true as const,
  },
  admission,
  inspect: { evaluated: true as const, committed: false as const, productionPayloadRows: 0 as const, payloadSha256: null, fitsWriteAllowed: false as const, pngWriteAllowed: false as const, authorityGranted: false as const },
  payload: { rows: [] as const, rowCount: 0 as const, payloadSha256: null },
  qualification: { protocolQualified: true as const, sciencePayloadQualified: false as const, detectorAuthorityGranted: false as const, browserQualification: "not-run" as const },
  boundary: { partialPayloadPublish: false as const, sciencePayloadMutationAllowed: false as const, fitsWriteAllowed: false as const, pngWriteAllowed: false as const, cinematicScienceWritebackAllowed: false as const, networkAttempted: false as const, automaticRetryApplied: false as const },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
};
const artifact = parseKerrSciencePayloadAdmissionArtifactV463({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
atomic(paths.output, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, admission: artifact.admission, productionPayloadRows: 0, sciencePayloadAllowed: false, fitsWriteAllowed: false, pngWriteAllowed: false, cinematicScienceWritebackAllowed: false, authorityGranted: false }, null, 2));
