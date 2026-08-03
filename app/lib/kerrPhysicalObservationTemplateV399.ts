import { createHash } from "node:crypto";

export const KERR_PHYSICAL_OBSERVATION_TEMPLATE_VERSION_V399 =
  "v399-kerr-physical-observation-template-v1" as const;
export const KERR_PHYSICAL_OBSERVATION_TEMPLATE_ARTIFACT_VERSION_V399 =
  "v399-kerr-physical-observation-template-diagnostic-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const PARAMETERS = Object.freeze([
  "ln-photon-radiance",
  "ln-redshift-factor",
  "ln-page-thorne-flux",
] as const);
const CROSS_PAIRS = Object.freeze([
  "photon-radiance--redshift",
  "photon-radiance--page-thorne-flux",
  "redshift--page-thorne-flux",
] as const);
const SLOT_DEFINITIONS = Object.freeze([
  Object.freeze({ role: "pack", ownerId: "observation-pack", targetRelativePath: "physical-observation-pack.json", mediaType: "application/json", requiredFields: Object.freeze(["version", "packId", "contentClass", "publicationIntent", "source", "parameterOrder", "observationSemantics", "sources", "crossLinks"]) }),
  ...PARAMETERS.flatMap((parameter) => [
    Object.freeze({ role: "source-data", ownerId: parameter, targetRelativePath: `sources/${parameter}.json`, mediaType: "application/json", requiredFields: Object.freeze(["sourceIdentity", "units", "coordinateFrame", "epochScale", "rows"]) }),
    Object.freeze({ role: "source-provenance", ownerId: parameter, targetRelativePath: `provenance/${parameter}.json`, mediaType: "application/json", requiredFields: Object.freeze(["sourceUrl", "retrievedAt", "sourceArtifactSha256", "processingParameters", "derivedArtifactSha256"]) }),
    Object.freeze({ role: "license-terms", ownerId: parameter, targetRelativePath: `terms/${parameter}.txt`, mediaType: "text/plain", requiredFields: Object.freeze(["verbatim-license-or-terms-snapshot"]) }),
  ]),
  ...CROSS_PAIRS.map((pair) => Object.freeze({ role: "cross-evidence", ownerId: pair, targetRelativePath: `cross/${pair}.json`, mediaType: "application/json", requiredFields: Object.freeze(["evidenceMode", "sourceArtifactSha256", "evidenceSha256", "correlationCoefficient", "independenceStatement"]) })),
]);
const SLOT_KEYS = SLOT_DEFINITIONS.map((slot) => `${slot.role}:${slot.ownerId}`);

type SlotRoleV399 = (typeof SLOT_DEFINITIONS)[number]["role"];
export type KerrPhysicalObservationTemplateSlotV399 = Readonly<{
  role: SlotRoleV399;
  ownerId: string;
  targetRelativePath: string;
  mediaType: string;
  requiredFields: readonly string[];
  valuePolicy: "user-supplied-only-no-template-value";
  required: true;
}>;

export type KerrPhysicalObservationTemplateV399 = Readonly<{
  version: typeof KERR_PHYSICAL_OBSERVATION_TEMPLATE_VERSION_V399;
  templateId: "orbit-atlas-v399-physical-observation-intake-template";
  contentClass: "template-only-not-observation";
  templateOnly: true;
  containsObservationValues: false;
  compileEligible: false;
  publicationAllowed: false;
  measuredAuthorityAllowed: false;
  source: Readonly<{
    v398IntakeArtifactSha256: string;
  }>;
  instructions: Readonly<{
    stagingRoot: "dist/staging/kerr-physical-observation-v398";
    manifestFilename: "manifest.json";
    explicitCompileRequired: true;
    independentValidationRequired: true;
    networkFetchPerformedByTemplate: false;
  }>;
  slots: readonly KerrPhysicalObservationTemplateSlotV399[];
}>;

export type KerrPhysicalObservationTemplateRejectionV399 =
  | "template-not-object"
  | "template-version"
  | "template-identity"
  | "intake-source-sha"
  | "template-boundary"
  | "slot-set"
  | "unsafe-target-path"
  | "required-fields"
  | "template-value-forbidden";

export type KerrPhysicalObservationTemplateValidationV399 = Readonly<{
  status: "qualified-template-only" | "rejected";
  rejectionReasons: readonly KerrPhysicalObservationTemplateRejectionV399[];
  checkedSlotCount: number;
}>;

export type KerrPhysicalObservationDiagnosticV399 = Readonly<{
  status: "staging-unavailable";
  readyForCompile: false;
  presentFileCount: 0;
  missingFileCount: 13;
  invalidFileCount: 0;
  slots: readonly Readonly<{
    role: SlotRoleV399;
    ownerId: string;
    targetRelativePath: string;
    status: "missing";
    reason: "staging-manifest-unavailable";
  }>[];
}>;

export type KerrPhysicalObservationProvenanceTopologyV399 = Readonly<{
  semantics: "required-provenance-topology-only-no-physical-sources";
  nodeCount: 16;
  edgeCount: 15;
  actualSourceCount: 0;
  nodes: readonly Readonly<{
    id: string;
    kind: "source-data" | "source-provenance" | "license-terms" | "cross-evidence" | "observation-pack" | "admission-gate" | "compiler" | "science-boundary";
    actual: false;
  }>[];
  edges: readonly Readonly<{
    from: string;
    to: string;
    relation: "documents" | "licenses" | "constrains" | "aggregates" | "admits" | "compiles" | "guards";
  }>[];
}>;

export type KerrPhysicalObservationTemplateArtifactV399 = Readonly<{
  version: typeof KERR_PHYSICAL_OBSERVATION_TEMPLATE_ARTIFACT_VERSION_V399;
  generatedAt: string;
  status: "template-diagnostic-topology-qualified-physical-input-unavailable";
  source: Readonly<{
    v398IntakeArtifactSha256: string;
    v398EvidenceSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  template: KerrPhysicalObservationTemplateV399;
  diagnostic: KerrPhysicalObservationDiagnosticV399;
  topology: KerrPhysicalObservationProvenanceTopologyV399;
  validator: Readonly<{
    qualified: true;
    rejectedAdversarialFixtureCount: 8;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrPhysicalObservationTemplateRejectionV399;
      observedReason: KerrPhysicalObservationTemplateRejectionV399;
      rejected: true;
    }>[];
  }>;
  integrity: Readonly<{
    templateCanonicalSha256: string;
    topologyCanonicalSha256: string;
    downloadableTemplatePath: "dist/templates/kerr-physical-observation-v399/intake-template.json";
  }>;
  productionAdmission: Readonly<{
    physicalStagingAvailable: false;
    physicalObservationValuesAvailable: false;
    templateUsedAsObservation: false;
    compileExecuted: false;
    candidatePublished: false;
    measuredAuthorityGranted: false;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

type MutableRecord = Record<string, unknown>;
const isObject = (value: unknown): value is MutableRecord => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const addReason = (target: KerrPhysicalObservationTemplateRejectionV399[], reason: KerrPhysicalObservationTemplateRejectionV399) => { if (!target.includes(reason)) target.push(reason); };
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrPhysicalObservationTemplateShaV399 = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const safePath = (value: string) => value.length > 0 && !value.includes("\\") && !value.startsWith("/") && !/^[A-Za-z]:/.test(value) && value.split("/").every((segment) => segment.length > 0 && segment !== "." && segment !== "..");

export function createKerrPhysicalObservationTemplateV399(v398IntakeArtifactSha256: string): KerrPhysicalObservationTemplateV399 {
  return Object.freeze({
    version: KERR_PHYSICAL_OBSERVATION_TEMPLATE_VERSION_V399,
    templateId: "orbit-atlas-v399-physical-observation-intake-template",
    contentClass: "template-only-not-observation",
    templateOnly: true,
    containsObservationValues: false,
    compileEligible: false,
    publicationAllowed: false,
    measuredAuthorityAllowed: false,
    source: Object.freeze({ v398IntakeArtifactSha256 }),
    instructions: Object.freeze({ stagingRoot: "dist/staging/kerr-physical-observation-v398", manifestFilename: "manifest.json", explicitCompileRequired: true, independentValidationRequired: true, networkFetchPerformedByTemplate: false }),
    slots: Object.freeze(SLOT_DEFINITIONS.map((slot) => Object.freeze({ ...slot, valuePolicy: "user-supplied-only-no-template-value" as const, required: true as const }))),
  });
}

export function validateKerrPhysicalObservationTemplateV399(value: unknown, v398IntakeArtifactSha256: string): KerrPhysicalObservationTemplateValidationV399 {
  if (!isObject(value)) return Object.freeze({ status: "rejected", rejectionReasons: Object.freeze(["template-not-object" as const]), checkedSlotCount: 0 });
  const source = value;
  const reasons: KerrPhysicalObservationTemplateRejectionV399[] = [];
  if (source.version !== KERR_PHYSICAL_OBSERVATION_TEMPLATE_VERSION_V399) addReason(reasons, "template-version");
  if (source.templateId !== "orbit-atlas-v399-physical-observation-intake-template" || source.contentClass !== "template-only-not-observation") addReason(reasons, "template-identity");
  if (!isObject(source.source) || source.source.v398IntakeArtifactSha256 !== v398IntakeArtifactSha256) addReason(reasons, "intake-source-sha");
  if (source.templateOnly !== true || source.containsObservationValues !== false || source.compileEligible !== false || source.publicationAllowed !== false || source.measuredAuthorityAllowed !== false) addReason(reasons, "template-boundary");
  const slots = Array.isArray(source.slots) ? source.slots : [];
  const keys = new Set<string>();
  for (const slotValue of slots) {
    if (!isObject(slotValue)) { addReason(reasons, "slot-set"); continue; }
    keys.add(`${slotValue.role}:${slotValue.ownerId}`);
    if (!safePath(String(slotValue.targetRelativePath ?? ""))) addReason(reasons, "unsafe-target-path");
    if (!Array.isArray(slotValue.requiredFields) || slotValue.requiredFields.length === 0 || slotValue.requiredFields.some((entry) => typeof entry !== "string" || entry.length === 0)) addReason(reasons, "required-fields");
    if (slotValue.valuePolicy !== "user-supplied-only-no-template-value" || slotValue.required !== true || "value" in slotValue || "exampleValue" in slotValue || "sampleValue" in slotValue) addReason(reasons, "template-value-forbidden");
  }
  if (slots.length !== 13 || keys.size !== 13 || SLOT_KEYS.some((key) => !keys.has(key))) addReason(reasons, "slot-set");
  return Object.freeze({ status: reasons.length === 0 ? "qualified-template-only" : "rejected", rejectionReasons: Object.freeze(reasons), checkedSlotCount: slots.length });
}

export function createKerrPhysicalObservationDiagnosticV399(template: KerrPhysicalObservationTemplateV399): KerrPhysicalObservationDiagnosticV399 {
  return Object.freeze({ status: "staging-unavailable", readyForCompile: false, presentFileCount: 0, missingFileCount: 13, invalidFileCount: 0, slots: Object.freeze(template.slots.map((slot) => Object.freeze({ role: slot.role, ownerId: slot.ownerId, targetRelativePath: slot.targetRelativePath, status: "missing" as const, reason: "staging-manifest-unavailable" as const }))) });
}

export function createKerrPhysicalObservationProvenanceTopologyV399(): KerrPhysicalObservationProvenanceTopologyV399 {
  const nodes = [
    ...PARAMETERS.flatMap((parameter) => [
      { id: `data:${parameter}`, kind: "source-data" as const, actual: false as const },
      { id: `provenance:${parameter}`, kind: "source-provenance" as const, actual: false as const },
      { id: `license:${parameter}`, kind: "license-terms" as const, actual: false as const },
    ]),
    ...CROSS_PAIRS.map((pair) => ({ id: `cross:${pair}`, kind: "cross-evidence" as const, actual: false as const })),
    { id: "pack:observation", kind: "observation-pack" as const, actual: false as const },
    { id: "gate:v397", kind: "admission-gate" as const, actual: false as const },
    { id: "compiler:v398", kind: "compiler" as const, actual: false as const },
    { id: "boundary:science", kind: "science-boundary" as const, actual: false as const },
  ];
  const edges = [
    ...PARAMETERS.flatMap((parameter) => [
      { from: `provenance:${parameter}`, to: `data:${parameter}`, relation: "documents" as const },
      { from: `license:${parameter}`, to: `data:${parameter}`, relation: "licenses" as const },
      { from: `data:${parameter}`, to: "pack:observation", relation: "aggregates" as const },
    ]),
    ...CROSS_PAIRS.map((pair) => ({ from: `cross:${pair}`, to: "pack:observation", relation: "constrains" as const })),
    { from: "pack:observation", to: "gate:v397", relation: "admits" as const },
    { from: "gate:v397", to: "compiler:v398", relation: "compiles" as const },
    { from: "compiler:v398", to: "boundary:science", relation: "guards" as const },
  ];
  return Object.freeze({ semantics: "required-provenance-topology-only-no-physical-sources", nodeCount: 16, edgeCount: 15, actualSourceCount: 0, nodes: Object.freeze(nodes.map((entry) => Object.freeze(entry))), edges: Object.freeze(edges.map((entry) => Object.freeze(entry))) });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function createKerrPhysicalObservationTemplateAdversarialFixturesV399(v398IntakeArtifactSha256: string) {
  const control = createKerrPhysicalObservationTemplateV399(v398IntakeArtifactSha256);
  const fixture = (id: string, expectedReason: KerrPhysicalObservationTemplateRejectionV399, mutate: (value: MutableRecord) => void) => { const value = clone(control) as unknown as MutableRecord; mutate(value); return Object.freeze({ id, expectedReason, value }); };
  return Object.freeze([
    fixture("wrong-intake-sha", "intake-source-sha", (value) => { (value.source as MutableRecord).v398IntakeArtifactSha256 = "0".repeat(64); }),
    fixture("compile-enabled", "template-boundary", (value) => { value.compileEligible = true; }),
    fixture("publication-enabled", "template-boundary", (value) => { value.publicationAllowed = true; }),
    fixture("observation-values-claimed", "template-boundary", (value) => { value.containsObservationValues = true; }),
    fixture("slot-missing", "slot-set", (value) => { (value.slots as unknown[]).pop(); }),
    fixture("path-traversal", "unsafe-target-path", (value) => { ((value.slots as MutableRecord[])[1]).targetRelativePath = "../data.json"; }),
    fixture("required-fields-empty", "required-fields", (value) => { ((value.slots as MutableRecord[])[2]).requiredFields = []; }),
    fixture("sample-value-injected", "template-value-forbidden", (value) => { ((value.slots as MutableRecord[])[3]).sampleValue = 1; }),
  ]);
}

export function parseKerrPhysicalObservationTemplateArtifactV399(value: unknown): KerrPhysicalObservationTemplateArtifactV399 {
  const source = isObject(value) ? value as Partial<KerrPhysicalObservationTemplateArtifactV399> : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures) ? source.validator.adversarialFixtures : [];
  if (!source || source.version !== KERR_PHYSICAL_OBSERVATION_TEMPLATE_ARTIFACT_VERSION_V399 || source.status !== "template-diagnostic-topology-qualified-physical-input-unavailable" || !source.source || !Object.values(source.source).every((entry) => SHA256.test(entry)) || !source.template || validateKerrPhysicalObservationTemplateV399(source.template, source.source.v398IntakeArtifactSha256).status !== "qualified-template-only" || source.diagnostic?.status !== "staging-unavailable" || source.diagnostic.readyForCompile !== false || source.diagnostic.presentFileCount !== 0 || source.diagnostic.missingFileCount !== 13 || source.diagnostic.invalidFileCount !== 0 || source.diagnostic.slots.length !== 13 || source.topology?.semantics !== "required-provenance-topology-only-no-physical-sources" || source.topology.nodeCount !== 16 || source.topology.edgeCount !== 15 || source.topology.actualSourceCount !== 0 || source.topology.nodes.length !== 16 || source.topology.edges.length !== 15 || source.validator?.qualified !== true || source.validator.rejectedAdversarialFixtureCount !== 8 || fixtures.length !== 8 || fixtures.some((entry) => entry.rejected !== true || entry.expectedReason !== entry.observedReason) || source.integrity?.templateCanonicalSha256 !== canonicalKerrPhysicalObservationTemplateShaV399(source.template) || source.integrity.topologyCanonicalSha256 !== canonicalKerrPhysicalObservationTemplateShaV399(source.topology) || source.integrity.downloadableTemplatePath !== "dist/templates/kerr-physical-observation-v399/intake-template.json" || source.productionAdmission?.physicalStagingAvailable !== false || source.productionAdmission.physicalObservationValuesAvailable !== false || source.productionAdmission.templateUsedAsObservation !== false || source.productionAdmission.compileExecuted !== false || source.productionAdmission.candidatePublished !== false || source.productionAdmission.measuredAuthorityGranted !== false || source.networkAttempted !== false || source.sciencePayloadMutationAllowed !== false || source.cinematicConsumerAllowed !== false || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run" || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v399-template-artifact-identity");
  return value as KerrPhysicalObservationTemplateArtifactV399;
}
