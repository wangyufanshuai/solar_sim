import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrPhysicalObservationTemplateShaV399,
  createKerrPhysicalObservationDiagnosticV399,
  createKerrPhysicalObservationProvenanceTopologyV399,
  createKerrPhysicalObservationTemplateAdversarialFixturesV399,
  createKerrPhysicalObservationTemplateV399,
  parseKerrPhysicalObservationTemplateArtifactV399,
  validateKerrPhysicalObservationTemplateV399,
} from "../app/lib/kerrPhysicalObservationTemplateV399";

const root = process.cwd();
const paths = {
  intake: "dist/science/kerr-physical-observation-intake-v398/intake-inspect.json",
  v398Evidence: "dist/science/orbit-atlas-shadow-v398-evidence.json",
  stagingManifest: "dist/staging/kerr-physical-observation-v398/manifest.json",
  candidate: "dist/science/kerr-physical-observation-intake-v398/physical-observation.candidate.json",
  template: "dist/templates/kerr-physical-observation-v399/intake-template.json",
  artifact: "dist/science/kerr-physical-observation-template-v399/template-diagnostic.json",
};
const bounded = (path: string, maximum: number) => { const target = resolve(root, path); const metadata = statSync(target); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error(`v399-input-size:${path}`); return readFileSync(target); };
const read = (path: string, maximum = 128 * 1024) => JSON.parse(bounded(path, maximum).toString("utf8"));
const shaBytes = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => shaBytes(JSON.stringify(canonicalize(value)));
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const intake = read(paths.intake) as { artifactSha256?: string; status?: string; source?: { fullShortAuthoritySha256?: string } };
const v398Evidence = read(paths.v398Evidence) as { evidenceSha256?: string };
if (intake.status !== "local-intake-compiler-qualified-physical-staging-unavailable-compile-not-run" || typeof intake.artifactSha256 !== "string" || typeof intake.source?.fullShortAuthoritySha256 !== "string" || typeof v398Evidence.evidenceSha256 !== "string" || existsSync(resolve(root, paths.stagingManifest)) || existsSync(resolve(root, paths.candidate))) throw new Error("v399-dependency-boundary");
const intakeSha256 = intake.artifactSha256;
const v398EvidenceSha256 = v398Evidence.evidenceSha256;
const fullShortAuthoritySha256 = intake.source.fullShortAuthoritySha256;
const template = createKerrPhysicalObservationTemplateV399(intakeSha256);
const validation = validateKerrPhysicalObservationTemplateV399(template, intakeSha256);
if (validation.status !== "qualified-template-only" || validation.checkedSlotCount !== 13) throw new Error("v399-template-validation");
const fixtures = createKerrPhysicalObservationTemplateAdversarialFixturesV399(intakeSha256).map((fixture) => { const result = validateKerrPhysicalObservationTemplateV399(fixture.value, intakeSha256); if (result.status !== "rejected" || !result.rejectionReasons.includes(fixture.expectedReason)) throw new Error(`v399-attack:${fixture.id}`); return Object.freeze({ id: fixture.id, expectedReason: fixture.expectedReason, observedReason: fixture.expectedReason, rejected: true as const }); });
const diagnostic = createKerrPhysicalObservationDiagnosticV399(template);
const topology = createKerrPhysicalObservationProvenanceTopologyV399();
atomic(paths.template, template);
const unsigned = {
  version: "v399-kerr-physical-observation-template-diagnostic-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "template-diagnostic-topology-qualified-physical-input-unavailable" as const,
  source: Object.freeze({ v398IntakeArtifactSha256: intakeSha256, v398EvidenceSha256, fullShortAuthoritySha256 }),
  template,
  diagnostic,
  topology,
  validator: Object.freeze({ qualified: true as const, rejectedAdversarialFixtureCount: 8 as const, adversarialFixtures: Object.freeze(fixtures) }),
  integrity: Object.freeze({ templateCanonicalSha256: canonicalKerrPhysicalObservationTemplateShaV399(template), topologyCanonicalSha256: canonicalKerrPhysicalObservationTemplateShaV399(topology), downloadableTemplatePath: paths.template as "dist/templates/kerr-physical-observation-v399/intake-template.json" }),
  productionAdmission: Object.freeze({ physicalStagingAvailable: false as const, physicalObservationValuesAvailable: false as const, templateUsedAsObservation: false as const, compileExecuted: false as const, candidatePublished: false as const, measuredAuthorityGranted: false as const }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseKerrPhysicalObservationTemplateArtifactV399({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
atomic(paths.artifact, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, templateSha256: artifact.integrity.templateCanonicalSha256, topologySha256: artifact.integrity.topologyCanonicalSha256, slots: artifact.template.slots.length, missing: artifact.diagnostic.missingFileCount, topology: `${artifact.topology.nodeCount}-nodes-${artifact.topology.edgeCount}-edges`, physicalValuesAvailable: false }, null, 2));
