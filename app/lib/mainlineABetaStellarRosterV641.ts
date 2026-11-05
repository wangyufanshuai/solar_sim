export const MAINLINE_A_BETA_STELLAR_ROSTER_SCHEMA_V641 = "mainline-a-beta-stellar-roster-v641" as const;

export const MAINLINE_A_BETA_STELLAR_IDS_V641 = Object.freeze([
  "sirius-a",
  "canopus",
  "alpha-centauri-a",
  "alpha-centauri-b",
  "arcturus",
  "vega",
  "capella-a",
  "rigel",
  "procyon-a",
  "betelgeuse",
  "aldebaran",
  "antares",
  "achernar",
  "hadar",
  "altair",
  "acrux",
  "spica",
  "pollux",
  "fomalhaut",
  "deneb",
  "regulus",
  "polaris",
  "bellatrix",
  "alnilam",
] as const);

export const MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641 = Object.freeze([
  "acrux",
  "spica",
  "regulus",
  "polaris",
] as const);

export type MainlineABetaStellarIdV641 = (typeof MAINLINE_A_BETA_STELLAR_IDS_V641)[number];
export type MainlineABetaStellarPendingIdV641 = (typeof MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641)[number];
export type MainlineABetaStellarPhaseV641 = "runtime-existing" | "candidate-hold";
export type MainlineABetaStellarSourceClassV641 = "sealed-local-projection" | "raw-structured-candidate";
export type MainlineABetaStellarFieldV641 =
  | "coordinates"
  | "properMotion"
  | "spectralType"
  | "parallax"
  | "distance"
  | "component";
export type MainlineABetaStellarFieldStateV641 = "observed" | "catalog-derived" | "model" | "missing" | "candidate";

export type MainlineABetaStellarSourceRefV641 = Readonly<{
  id: string;
  url: string;
  path: string | null;
  role: "object-page" | "catalogue" | "raw-artifact" | "render-anchor" | "literature";
  sha256: string | null;
  evidenceClass: "external-source" | "artifact" | "static";
}>;

export type MainlineABetaStellarFieldLedgerV641 = Readonly<{
  field: MainlineABetaStellarFieldV641;
  state: MainlineABetaStellarFieldStateV641;
  value: string | number | null;
  unit: string | null;
  sourceRefIds: readonly string[];
  rawEvidence: string | null;
  confidence: "explicit" | "derived" | "candidate" | "unavailable";
}>;

export type MainlineABetaStellarComponentReviewV641 = Readonly<{
  status: "not-reviewed" | "unresolved";
  hints: readonly string[];
  sourceArtifactSha256: string | null;
  reason: string;
}>;

export type MainlineABetaStellarRosterRowV641 = Readonly<{
  id: MainlineABetaStellarIdV641;
  displayName: string;
  phase: MainlineABetaStellarPhaseV641;
  sourceClass: MainlineABetaStellarSourceClassV641;
  runtimeRoute: "existing-mainline-a-runtime" | "candidate-review-only";
  decision: "existing-reference" | "hold";
  sourceRefs: readonly MainlineABetaStellarSourceRefV641[];
  fieldLedger: readonly MainlineABetaStellarFieldLedgerV641[];
  componentReview: MainlineABetaStellarComponentReviewV641;
  rightsStatus: "catalogue-terms-review" | "odbl-attribution-required";
  sourceSnapshotSha256: string;
  fingerprint: string;
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
}>;

export type MainlineABetaStellarRosterPackV641 = Readonly<{
  schema: typeof MAINLINE_A_BETA_STELLAR_ROSTER_SCHEMA_V641;
  generatedAt: string;
  source: Readonly<{
    existingRoster: string;
    structuredCandidatePack: string;
    componentEvidencePack: string;
    snapshotSha256: string;
  }>;
  counts: Readonly<{
    total: number;
    runtimeExisting: number;
    candidateHold: number;
    sourceArtifactBacked: number;
    componentConfirmed: number;
  }>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    runtimeWrites: false;
    measurementWrites: false;
    scientificPayloadWriteback: false;
    snapshotMutation: false;
  }>;
  records: readonly MainlineABetaStellarRosterRowV641[];
}>;

export const MAINLINE_A_BETA_STELLAR_BOUNDARY_V641 = Object.freeze({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  runtimeWrites: false,
  measurementWrites: false,
  scientificPayloadWriteback: false,
  snapshotMutation: false,
} as const);

const SHA256_V641 = /^[a-f0-9]{64}$/;
const URL_SCHEME_V641 = /^https:\/\//i;
const REQUIRED_FIELDS_V641: readonly MainlineABetaStellarFieldV641[] = [
  "coordinates",
  "properMotion",
  "spectralType",
  "parallax",
  "distance",
  "component",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asFiniteOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function exactIds(values: readonly string[], expected: readonly string[]): boolean {
  return values.length === expected.length && expected.every((id) => values.includes(id));
}

export function isMainlineABetaStellarIdV641(value: unknown): value is MainlineABetaStellarIdV641 {
  return typeof value === "string" && (MAINLINE_A_BETA_STELLAR_IDS_V641 as readonly string[]).includes(value);
}

export function isPendingMainlineABetaStellarIdV641(value: unknown): value is MainlineABetaStellarPendingIdV641 {
  return typeof value === "string" && (MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641 as readonly string[]).includes(value);
}

export function canonicalRosterValueV641(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalRosterValueV641);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalRosterValueV641(value[key])]),
    );
  }
  return value;
}

export function rosterRowFingerprintInputV641(row: MainlineABetaStellarRosterRowV641): unknown {
  const unsigned = Object.fromEntries(Object.entries(row).filter(([key]) => key !== "fingerprint"));
  return canonicalRosterValueV641(unsigned);
}

export function rosterFieldV641(
  row: MainlineABetaStellarRosterRowV641,
  field: MainlineABetaStellarFieldV641,
): MainlineABetaStellarFieldLedgerV641 | null {
  return row.fieldLedger.find((entry) => entry.field === field) ?? null;
}

export function rosterSummaryV641(pack: MainlineABetaStellarRosterPackV641) {
  const records = pack.records;
  return Object.freeze({
    total: records.length,
    runtimeExisting: records.filter((row) => row.phase === "runtime-existing").length,
    candidateHold: records.filter((row) => row.phase === "candidate-hold").length,
    sourceArtifactBacked: records.filter((row) => row.sourceRefs.some((ref) => ref.role === "raw-artifact" && Boolean(ref.sha256))).length,
    componentConfirmed: records.filter((row) => row.componentReview.status === "not-reviewed" && row.componentReview.sourceArtifactSha256 !== null).length,
    pendingIds: records.filter((row) => row.phase === "candidate-hold").map((row) => row.id),
    boundary: pack.boundary,
  });
}

export function filterMainlineABetaStellarRosterV641(
  pack: MainlineABetaStellarRosterPackV641,
  query: string,
): readonly MainlineABetaStellarRosterRowV641[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return pack.records;
  return pack.records.filter((row) => {
    const haystack = [
      row.id,
      row.displayName,
      row.phase,
      row.decision,
      row.componentReview.status,
      ...row.sourceRefs.map((source) => `${source.id} ${source.url}`),
      ...row.fieldLedger.map((field) => `${field.field} ${field.value ?? ""} ${field.unit ?? ""} ${field.state}`),
    ].join(" ").toLocaleLowerCase();
    return haystack.includes(needle);
  });
}

export function rosterPhaseLabelV641(phase: MainlineABetaStellarPhaseV641): string {
  return phase === "runtime-existing" ? "现有运行时参考" : "候选 hold";
}

export function rosterSourceLabelV641(sourceClass: MainlineABetaStellarSourceClassV641): string {
  return sourceClass === "sealed-local-projection" ? "封存本地投影" : "真实 raw 结构化候选";
}

export function rosterAdmissionLabelV641(row: MainlineABetaStellarRosterRowV641): string {
  if (row.phase === "candidate-hold") return "candidate-only · hold · not-admitted";
  return "existing reference · candidate-only · measurement not-admitted";
}

export function validateMainlineABetaStellarRosterV641(pack: unknown): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(pack)) return ["pack-not-object"];
  if (pack.schema !== MAINLINE_A_BETA_STELLAR_ROSTER_SCHEMA_V641) errors.push("schema-invalid");
  if (!asNonEmptyString(pack.generatedAt) || !Number.isFinite(Date.parse(pack.generatedAt))) errors.push("generatedAt-invalid");
  const boundary = pack.boundary;
  for (const [key, expected] of Object.entries(MAINLINE_A_BETA_STELLAR_BOUNDARY_V641)) {
    if (!isRecord(boundary) || boundary[key] !== expected) errors.push(`boundary:${key}`);
  }
  const source = pack.source;
  if (!isRecord(source)) errors.push("source-missing");
  else {
    for (const key of ["existingRoster", "structuredCandidatePack", "componentEvidencePack"] as const) {
      if (!asNonEmptyString(source[key])) errors.push(`source:${key}`);
    }
    if (!SHA256_V641.test(String(source.snapshotSha256 ?? ""))) errors.push("source:snapshot-sha-invalid");
  }
  const records = Array.isArray(pack.records) ? pack.records : [];
  if (records.length !== MAINLINE_A_BETA_STELLAR_IDS_V641.length) errors.push("record-count-invalid");
  const ids = records.map((row) => isRecord(row) ? String(row.id) : "");
  if (!unique(ids)) errors.push("record-ids-duplicate");
  if (!exactIds(ids, MAINLINE_A_BETA_STELLAR_IDS_V641)) errors.push("record-roster-mismatch");
  const runtimeIds = records.filter((row) => isRecord(row) && row.phase === "runtime-existing").map((row) => String(row.id));
  const pendingIds = records.filter((row) => isRecord(row) && row.phase === "candidate-hold").map((row) => String(row.id));
  if (runtimeIds.length !== 20) errors.push("runtime-count-invalid");
  if (!exactIds(pendingIds, MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641)) errors.push("pending-roster-invalid");
  if (!isRecord(pack.counts)) errors.push("counts-missing");
  else {
    if (pack.counts.total !== records.length) errors.push("counts:total");
    if (pack.counts.runtimeExisting !== runtimeIds.length) errors.push("counts:runtimeExisting");
    if (pack.counts.candidateHold !== pendingIds.length) errors.push("counts:candidateHold");
  }
  for (const rowValue of records) {
    if (!isRecord(rowValue)) {
      errors.push("row-not-object");
      continue;
    }
    const id = String(rowValue.id);
    if (!isMainlineABetaStellarIdV641(id)) {
      errors.push(`${id}:id-invalid`);
      continue;
    }
    if (!asNonEmptyString(rowValue.displayName)) errors.push(`${id}:display-name-invalid`);
    const pending = isPendingMainlineABetaStellarIdV641(id);
    if (rowValue.phase !== (pending ? "candidate-hold" : "runtime-existing")) errors.push(`${id}:phase-invalid`);
    if (rowValue.decision !== (pending ? "hold" : "existing-reference")) errors.push(`${id}:decision-invalid`);
    if (rowValue.runtimeRoute !== (pending ? "candidate-review-only" : "existing-mainline-a-runtime")) errors.push(`${id}:runtime-route-invalid`);
    if (rowValue.sourceClass !== (pending ? "raw-structured-candidate" : "sealed-local-projection")) errors.push(`${id}:source-class-invalid`);
    if (rowValue.runtimeAdmission !== "candidate-only" || rowValue.measurementAdmission !== "not-admitted" || rowValue.scientificPayloadWriteback !== false) errors.push(`${id}:admission-opened`);
    if (!SHA256_V641.test(String(rowValue.sourceSnapshotSha256 ?? ""))) errors.push(`${id}:snapshot-sha-invalid`);
    if (!SHA256_V641.test(String(rowValue.fingerprint ?? ""))) errors.push(`${id}:fingerprint-invalid`);
    const refs = Array.isArray(rowValue.sourceRefs) ? rowValue.sourceRefs : [];
    if (refs.length === 0) errors.push(`${id}:source-refs-empty`);
    const refIds = refs.map((ref) => isRecord(ref) ? String(ref.id) : "");
    if (!unique(refIds)) errors.push(`${id}:source-ref-duplicates`);
    for (const ref of refs) {
      if (!isRecord(ref) || !asNonEmptyString(ref.id) || !asNonEmptyString(ref.url) || !URL_SCHEME_V641.test(ref.url)) errors.push(`${id}:source-ref-invalid`);
      if (isRecord(ref) && ref.role === "raw-artifact" && !asNonEmptyString(ref.path)) errors.push(`${id}:raw-artifact-path-missing`);
      if (isRecord(ref) && ref.sha256 !== null && !SHA256_V641.test(String(ref.sha256))) errors.push(`${id}:source-ref-sha-invalid`);
    }
    const fields = Array.isArray(rowValue.fieldLedger) ? rowValue.fieldLedger : [];
    const fieldNames = fields.map((field) => isRecord(field) ? String(field.field) : "");
    if (!exactIds(fieldNames, REQUIRED_FIELDS_V641)) errors.push(`${id}:field-ledger-incomplete`);
    if (!unique(fieldNames)) errors.push(`${id}:field-ledger-duplicates`);
    for (const field of fields) {
      if (!isRecord(field) || !REQUIRED_FIELDS_V641.includes(field.field as MainlineABetaStellarFieldV641)) {
        errors.push(`${id}:field-invalid`);
        continue;
      }
      if (!asFiniteOrNull(field.value) && !asNonEmptyString(field.value)) errors.push(`${id}:${field.field}:value-invalid`);
      if (field.state === "observed" && field.confidence !== "explicit") errors.push(`${id}:${field.field}:observed-confidence`);
      if (!Array.isArray(field.sourceRefIds) || field.sourceRefIds.some((refId) => !refIds.includes(refId))) errors.push(`${id}:${field.field}:source-binding`);
      if (field.state === "missing" && field.value !== null) errors.push(`${id}:${field.field}:missing-value`);
    }
    const component = rowValue.componentReview;
    if (!isRecord(component) || !["not-reviewed", "unresolved"].includes(String(component.status))) errors.push(`${id}:component-status-invalid`);
    if (pending && (!isRecord(component) || component.status !== "unresolved" || !Array.isArray(component.hints) || component.hints.length === 0)) errors.push(`${id}:component-hold-missing`);
    if (!pending && isRecord(component) && component.status === "unresolved") errors.push(`${id}:runtime-component-unexpected-unresolved`);
    if (isRecord(component) && component.sourceArtifactSha256 !== null && !SHA256_V641.test(String(component.sourceArtifactSha256))) errors.push(`${id}:component-artifact-sha-invalid`);
    if (pending && refs.filter((ref) => isRecord(ref) && ref.role === "raw-artifact" && ref.sha256 !== null).length === 0) errors.push(`${id}:raw-artifact-binding-missing`);
    if (!pending && refs.some((ref) => isRecord(ref) && ref.role === "raw-artifact")) errors.push(`${id}:unexpected-raw-artifact`);
    if (refs.some((ref) => isRecord(ref) && /synthetic|fixture|example\.com/i.test(String(ref.url)))) errors.push(`${id}:synthetic-source`);
  }
  return [...new Set(errors)];
}

export function assertMainlineABetaStellarRosterV641(pack: unknown): asserts pack is MainlineABetaStellarRosterPackV641 {
  const errors = validateMainlineABetaStellarRosterV641(pack);
  if (errors.length > 0) throw new Error(`Mainline A Beta stellar roster V641 invalid: ${errors.join(", ")}`);
}

export function rosterNegativeMutationV641(pack: MainlineABetaStellarRosterPackV641, mutation: "duplicate" | "admit" | "synthetic" | "component-confirm") {
  const records = pack.records.map((row) => ({
    ...row,
    sourceRefs: row.sourceRefs.map((ref) => ({ ...ref })),
    fieldLedger: row.fieldLedger.map((field) => ({ ...field, sourceRefIds: [...field.sourceRefIds] })),
    componentReview: { ...row.componentReview, hints: [...row.componentReview.hints] },
  }));
  if (mutation === "duplicate") records[1] = { ...records[1], id: records[0].id };
  const pendingIndex = records.findIndex((row) => row.id === "polaris");
  if (mutation === "admit") records[pendingIndex] = { ...records[pendingIndex], decision: "existing-reference", runtimeRoute: "existing-mainline-a-runtime" };
  if (mutation === "synthetic") records[pendingIndex] = { ...records[pendingIndex], sourceRefs: [{ ...records[pendingIndex].sourceRefs[0], url: "https://example.com/fixture.html" }] };
  if (mutation === "component-confirm") records[pendingIndex] = { ...records[pendingIndex], componentReview: { ...records[pendingIndex].componentReview, status: "not-reviewed" } };
  return { ...pack, records };
}
