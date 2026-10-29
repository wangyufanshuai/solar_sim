export const COMPONENT_IDS_V634 = ["acrux", "spica", "regulus", "polaris"] as const;
export type ComponentIdV634 = (typeof COMPONENT_IDS_V634)[number];
export const COMPONENT_BOUNDARY_V634 = {
  candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false,
} as const;

export type ComponentArtifactV634 = Readonly<{
  path: string; sha256: string; bytes: number; contentType: string; finalUrl: string;
}>;
export type ComponentSourceSpanV634 = Readonly<{
  line: number; byteStart: number; byteEnd: number; rawText: string;
}>;
export type ComponentAttemptV634 = Readonly<{
  startedAt: string; endedAt: string; timeout: boolean; retryCount: number;
  httpStatus: number | null; errorCategory: string | null;
  responseCaptured: number; responseBytes: number | null;
  rawArtifact: ComponentArtifactV634 | null; transport: string;
  timeoutMs?: number; requestUrl?: string; requestFingerprint?: string;
  finalUrl?: string | null; contentType?: string | null;
  redirectChain?: readonly Readonly<{ from: string; to: string; status: number }>[];
  errorClass?: string | null; errorMessage?: string | null;
}>;
export type WdsPairV634 = Readonly<{
  key: string; wds: string; discoverer: string; components: string;
  relation: "explicit-pair" | "unlabelled-pair" | "composite-or-unparsed";
  members: readonly string[];
  firstObservationYear: number | null; lastObservationYear: number | null;
  observationCount: number | null;
  separationArcsec: number | null;
  position: Readonly<{ raDeg: number | null; decDeg: number | null; derivedFromName: boolean }>;
  notes: string;
  source: ComponentSourceSpanV634;
  warnings: readonly string[];
}>;
export type WdsTableV634 = Readonly<{
  status: "parsed" | "blocked";
  errors: readonly string[]; warnings: readonly string[];
  metadata: Readonly<{
    table: string | null; requestUrl: string | null; publicationDate: string | null;
    rightsUrl: string | null; bibcodes: readonly string[];
  }>;
  columns: readonly string[]; units: readonly string[];
  rows: readonly WdsPairV634[];
}>;
export type ComponentCaptureRecordV634 = Readonly<{
  id: ComponentIdV634; sourceCandidateId: string; sourceQueryIdentifier: string;
  sourceRawPageSha256: string; wdsSystemId: string;
  sourceHintIdentifiers: readonly string[];
  plan: Readonly<{ requestUrl: string; requestFingerprint: string }>;
  responseCaptured: number; artifact: ComponentArtifactV634 | null;
  attempts: readonly ComponentAttemptV634[];
}>;
export type ComponentEvidenceRecordV634 = Readonly<{
  id: ComponentIdV634; wdsSystemId: string; sourceQueryIdentifier: string;
  sourceRawPageSha256: string; sourceHintIdentifiers: readonly string[];
  status: "catalogue-candidate" | "capture-pending" | "parse-blocked";
  artifact: ComponentArtifactV634 | null;
  requestUrl: string; requestFingerprint: string;
  attemptCount: number; attempts: readonly ComponentAttemptV634[];
  lastAttempt: ComponentAttemptV634 | null;
  table: WdsTableV634 | null;
  blockers: readonly string[];
  componentIdentityStatus: "unresolved";
  scientificPayloadWriteback: false;
}>;
export type ComponentEvidencePackV634 = Readonly<{
  schema: "mainline-a-stellar-component-evidence-v634";
  generatedAt: string;
  captureLedger: Readonly<{ path: string; sha256: string }>;
  sourceCandidatePack: Readonly<{ path: string; sha256: string }>;
  readme: ComponentArtifactV634 | null;
  boundary: typeof COMPONENT_BOUNDARY_V634;
  records: readonly ComponentEvidenceRecordV634[];
}>;

const SHA = /^[a-f0-9]{64}$/;
const WDS = /^\d{5}[+-]\d{4}$/;
const encoder = new TextEncoder();
const REQUIRED_COLUMNS = ["WDS", "Disc", "Comp", "RAJ2000", "DEJ2000"];

function sameArtifact(left: ComponentArtifactV634 | null | undefined, right: ComponentArtifactV634 | null): boolean {
  return !!left && !!right && ["path", "sha256", "bytes", "contentType", "finalUrl"].every((field) => left[field as keyof ComponentArtifactV634] === right[field as keyof ComponentArtifactV634]);
}

function validateSystemHints(systemId: string, hints: readonly string[]): string[] {
  const errors: string[] = [];
  if (!WDS.test(systemId)) errors.push("hint-system-invalid");
  if (!Array.isArray(hints) || hints.length === 0) return [...errors, "system-hints-missing"];
  const seen = new Set<string>();
  for (const hint of hints) {
    if (typeof hint !== "string") { errors.push("system-hint-invalid"); continue; }
    const match = hint.match(/^WDS J(\d{5}[+-]\d{4})([A-Za-z0-9,]+)$/);
    if (!match) errors.push("system-hint-invalid");
    else if (match[1] !== systemId) errors.push("system-hint-cross-match");
    if (seen.has(hint)) errors.push("system-hint-duplicate");
    seen.add(hint);
  }
  return [...new Set(errors)];
}

function linesWithSpans(text: string): ComponentSourceSpanV634[] {
  let offset = 0;
  return text.split("\n").map((raw, index) => {
    const rawText = raw.replace(/\r$/, "");
    const span = { line: index + 1, byteStart: offset, byteEnd: offset + encoder.encode(rawText).length, rawText };
    offset += encoder.encode(raw).length + 1;
    return span;
  });
}

function fieldNumber(value: string | undefined, integer = false): number | null {
  if (!value || !/^[-+]?\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const result = Number(value);
  return Number.isFinite(result) && (!integer || Number.isInteger(result)) ? result : null;
}

function nonnegativeField(value: string | undefined, integer = false): number | null {
  const number = fieldNumber(value, integer);
  return number !== null && number >= 0 ? number : null;
}

function yearField(value: string | undefined): number | null {
  const number = fieldNumber(value, true);
  return number !== null && number >= 1000 && number <= 3000 ? number : null;
}

function sexagesimal(value: string, rightAscension: boolean): number | null {
  const match = value.trim().match(/^([+-]?)(\d{1,2})[ :](\d{2})[ :](\d{2}(?:\.\d+)?)$/);
  if (!match || (rightAscension && match[1])) return null;
  const [major, minutes, seconds] = match.slice(2).map(Number);
  const limit = rightAscension ? 24 : 90;
  if (minutes >= 60 || seconds >= 60 || major > limit) return null;
  if (rightAscension && major === 24) return null;
  if (!rightAscension && major === 90 && (minutes !== 0 || seconds !== 0)) return null;
  const magnitude = major + minutes / 60 + seconds / 3600;
  return magnitude * (rightAscension ? 15 : 1) * (match[1] === "-" ? -1 : 1);
}

export function describeWdsPairV634(components: string): Pick<WdsPairV634, "relation" | "members"> {
  if (!components) return { relation: "unlabelled-pair", members: [] };
  const simple = components.match(/^([A-Z])([A-Z])$/);
  const resolved = components.match(/^([A-Z][a-z]*),([A-Z][a-z]*)$/);
  const matched = simple ?? resolved;
  if (!matched || matched[1] === matched[2]) return { relation: "composite-or-unparsed", members: [] };
  return { relation: "explicit-pair", members: [matched[1], matched[2]] };
}

export function isWdsRequestV634(url: string, systemId: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "vizier.cds.unistra.fr"
      && !parsed.port && !parsed.username && !parsed.password && !parsed.hash
      && parsed.pathname === "/viz-bin/asu-tsv"
      && parsed.searchParams.getAll("WDS").length === 1 && parsed.searchParams.get("WDS") === systemId
      && parsed.searchParams.getAll("-source").length === 1 && parsed.searchParams.get("-source") === "B/wds/wds";
  } catch { return false; }
}

function parseTableRow(cells: readonly string[], columns: readonly string[], span: ComponentSourceSpanV634): WdsPairV634 {
  const values = Object.fromEntries(columns.map((name, index) => [name, cells[index]?.trim() ?? ""]));
  const warnings: string[] = [];
  const raDeg = sexagesmalOrMissing(values.RAJ2000, true);
  const decDeg = sexagesmalOrMissing(values.DEJ2000, false);
  const derivedFromName = /[!P]/.test(values.n_RAh ?? "");
  const separationArcsec = nonnegativeField(values.sep2);
  if (raDeg === null || decDeg === null) warnings.push("coordinates-missing-or-invalid");
  if (derivedFromName) warnings.push("coordinates-derived-from-system-name");
  if (values.sep2 && separationArcsec === null) warnings.push("separation-missing-or-invalid");
  const pair = describeWdsPairV634(values.Comp);
  if (pair.relation !== "explicit-pair") warnings.push("pair-members-not-expanded");
  return {
    key: `${values.WDS}|${values.Disc}|${values.Comp}`,
    wds: values.WDS, discoverer: values.Disc, components: values.Comp,
    ...pair,
    firstObservationYear: yearField(values.Obs1), lastObservationYear: yearField(values.Obs2),
    observationCount: nonnegativeField(values.Nobs, true), separationArcsec,
    position: { raDeg, decDeg, derivedFromName }, notes: values.Notes ?? "", source: span, warnings,
  };
}

function sexagesmalOrMissing(value: string | undefined, ra: boolean): number | null {
  return value ? sexagesimal(value, ra) : null;
}

export function parseWdsTsvV634(bytes: Uint8Array, expectedSystemId: string): WdsTableV634 {
  const errors: string[] = [];
  const warnings: string[] = [];
  let text = "";
  try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { errors.push("invalid-utf8"); }
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) errors.push("raw-size-invalid");
  if (text.charCodeAt(0) === 0xfeff) errors.push("unexpected-bom");
  if (!WDS.test(expectedSystemId)) errors.push("system-id-invalid");
  const lines = linesWithSpans(text);
  const metaValues = (key: string) => lines.flatMap(({ rawText }) => {
    const prefix = `#INFO\t${key}=`;
    return rawText.startsWith(prefix) ? [rawText.slice(prefix.length).split("\t")[0].trim()] : [];
  });
  const requestUrls = metaValues("request");
  const tables = lines.filter(({ rawText }) => rawText.startsWith("#Table\t"));
  const names = lines.filter(({ rawText }) => rawText === "#Name: B/wds/wds");
  if (!text.includes("VizieR Astronomical Server") || tables.length !== 1 || names.length !== 1) errors.push("catalogue-signature-invalid");
  if (!tables[0]?.rawText.match(/^#Table\tB_wds_wds:$/)) errors.push("unexpected-table");
  if (requestUrls.length !== 1 || !isWdsRequestV634(requestUrls[0], expectedSystemId)) errors.push("response-query-mismatch");
  if (/^#(?:INFO\t(?:Error|error)=|INFO.*QUERY_STATUS.*(?:ERROR|OVERFLOW)|Error)/m.test(text) || /truncated|truncation|QUERY_STATUS=OVERFLOW/i.test(text)) errors.push("query-error-or-truncated");
  const data = lines.filter(({ rawText }) => rawText.trim() && !rawText.startsWith("#"));
  const columns = data[0]?.rawText.split("\t").map((name) => name.trim()) ?? [];
  const units = data[1]?.rawText.split("\t").map((unit) => unit.trim()) ?? [];
  const separators = data[2]?.rawText.split("\t") ?? [];
  if (new Set(columns).size !== columns.length || REQUIRED_COLUMNS.some((column) => !columns.includes(column))) errors.push("columns-invalid");
  if (units.length !== columns.length || separators.length !== columns.length || separators.some((value) => !/^-+$/.test(value))) errors.push("table-layout-invalid");
  const descriptions = lines.filter(({ rawText }) => rawText.startsWith("#Column\t")).map(({ rawText }) => rawText.split("\t")[1]);
  if (REQUIRED_COLUMNS.some((column) => !descriptions.includes(column))) errors.push("column-metadata-missing");
  const expectedUnits: Record<string, string> = {
    RAJ2000: '"h:m:s"', DEJ2000: '"d:m:s"', sep2: "arcsec", Obs1: "yr", Obs2: "yr",
  };
  for (const [column, unit] of Object.entries(expectedUnits)) {
    const index = columns.indexOf(column);
    if (index >= 0 && units[index] !== unit) errors.push(`unit-mismatch:${column}`);
  }
  const rows: WdsPairV634[] = [];
  const seen = new Set<string>();
  for (const span of data.slice(3)) {
    const cells = span.rawText.split("\t");
    if (cells.length !== columns.length) { errors.push(`row-${span.line}:cell-count`); continue; }
    const row = parseTableRow(cells, columns, span);
    if (row.wds !== expectedSystemId) errors.push(`row-${span.line}:system-mismatch`);
    if (!row.discoverer) errors.push(`row-${span.line}:discoverer-missing`);
    if (seen.has(row.key)) errors.push(`row-${span.line}:duplicate-pair`);
    seen.add(row.key);
    rows.push(row);
  }
  if (rows.length === 0) errors.push("catalogue-no-rows");
  let maximum = 0;
  try { maximum = Number(new URL(requestUrls[0]).searchParams.get("-out.max")); }
  catch { /* The query mismatch is reported above; malformed metadata cannot throw. */ }
  if (maximum > 0 && rows.length >= maximum) errors.push("row-limit-reached");
  if (rows.some((row) => row.warnings.length)) warnings.push("some-catalogue-fields-unresolved");
  return {
    status: errors.length ? "blocked" : "parsed", errors: [...new Set(errors)], warnings,
    metadata: {
      table: names.length === 1 ? "B/wds/wds" : null,
      requestUrl: requestUrls.length === 1 ? requestUrls[0] : null,
      publicationDate: metaValues("publication_date")[0] ?? null,
      rightsUrl: metaValues("rights_uri")[0] ?? null,
      bibcodes: metaValues("cites").filter((value) => value.startsWith("bibcode:")).map((value) => value.slice(8)),
    }, columns, units, rows,
  };
}

export function buildComponentEvidenceRecordV634(capture: ComponentCaptureRecordV634, raw: Uint8Array | null): ComponentEvidenceRecordV634 {
  const blockers: string[] = ["component-identity-review-required", "rights-review-pending"];
  blockers.push(...validateSystemHints(capture.wdsSystemId, capture.sourceHintIdentifiers));
  if (capture.sourceCandidateId !== capture.id || !COMPONENT_IDS_V634.includes(capture.id)) blockers.push("source-identity-invalid");
  if (!SHA.test(capture.sourceRawPageSha256) || !SHA.test(capture.plan.requestFingerprint)) blockers.push("source-binding-invalid");
  if (!isWdsRequestV634(capture.plan.requestUrl, capture.wdsSystemId)) blockers.push("capture-query-invalid");
  const captured = capture.responseCaptured === 1 && capture.artifact !== null && raw !== null;
  const success = capture.attempts.filter((attempt) => attempt.responseCaptured === 1 && attempt.httpStatus === 200 && attempt.timeout === false && attempt.errorCategory === null && attempt.transport === "https");
  if (captured && (success.length !== 1 || capture.attempts.at(-1) !== success[0])) blockers.push("successful-attempt-missing-or-ambiguous");
  if (captured && (success[0]?.responseBytes !== capture.artifact!.bytes || !sameArtifact(success[0]?.rawArtifact, capture.artifact))) blockers.push("attempt-artifact-mismatch");
  if (capture.attempts.some((attempt) => !Number.isFinite(Date.parse(attempt.startedAt)) || !Number.isFinite(Date.parse(attempt.endedAt)) || Date.parse(attempt.endedAt) < Date.parse(attempt.startedAt))) blockers.push("attempt-time-invalid");
  if (capture.responseCaptured === 1 && !captured) blockers.push("captured-raw-missing");
  if (!captured) blockers.push("catalogue-response-missing");
  if (capture.responseCaptured !== 1 && (capture.artifact !== null || raw !== null)) blockers.push("failed-capture-has-raw");
  if (captured && (capture.artifact!.bytes !== raw!.byteLength || !SHA.test(capture.artifact!.sha256))) blockers.push("artifact-metadata-invalid");
  if (captured && !isWdsRequestV634(capture.artifact!.finalUrl, capture.wdsSystemId)) blockers.push("artifact-query-invalid");
  if (captured && !/^text\/(tab-separated-values|plain)(?:;|$)/i.test(capture.artifact!.contentType)) blockers.push("artifact-content-type-invalid");
  const table = captured ? parseWdsTsvV634(raw!, capture.wdsSystemId) : null;
  if (table) blockers.push(...table.errors);
  const valid = blockers.length === 2;
  return {
    id: capture.id, wdsSystemId: capture.wdsSystemId, sourceQueryIdentifier: capture.sourceQueryIdentifier,
    sourceRawPageSha256: capture.sourceRawPageSha256, sourceHintIdentifiers: capture.sourceHintIdentifiers,
    status: captured && valid ? "catalogue-candidate" : captured ? "parse-blocked" : "capture-pending",
    artifact: capture.artifact, requestUrl: capture.plan.requestUrl, requestFingerprint: capture.plan.requestFingerprint,
    attemptCount: capture.attempts.length, attempts: capture.attempts, lastAttempt: capture.attempts.at(-1) ?? null,
    table, blockers: [...new Set(blockers)], componentIdentityStatus: "unresolved", scientificPayloadWriteback: false,
  };
}

export function validateComponentEvidencePackV634(pack: ComponentEvidencePackV634): readonly string[] {
  const errors: string[] = [];
  if (pack.schema !== "mainline-a-stellar-component-evidence-v634") errors.push("schema-invalid");
  for (const [name, value] of Object.entries(COMPONENT_BOUNDARY_V634)) {
    if ((pack.boundary as Record<string, unknown>)?.[name] !== value) errors.push(`boundary:${name}`);
  }
  if (!SHA.test(pack.captureLedger?.sha256 ?? "") || !SHA.test(pack.sourceCandidatePack?.sha256 ?? "")) errors.push("pack-source-digest-missing");
  if (pack.records.length !== 4 || new Set(pack.records.map((row) => row.id)).size !== 4) errors.push("roster-invalid");
  for (const id of COMPONENT_IDS_V634) if (!pack.records.some((row) => row.id === id)) errors.push(`roster-missing:${id}`);
  for (const row of pack.records) {
    if (!["catalogue-candidate", "capture-pending", "parse-blocked"].includes(row.status)) errors.push(`${row.id}:status-invalid`);
    if (row.componentIdentityStatus !== "unresolved" || row.scientificPayloadWriteback !== false) errors.push(`${row.id}:admission-opened`);
    if (!row.blockers.includes("component-identity-review-required") || !row.blockers.includes("rights-review-pending")) errors.push(`${row.id}:review-boundary-missing`);
    if (row.status === "catalogue-candidate" && (!row.artifact || row.table?.status !== "parsed" || row.table.rows.length === 0 || row.blockers.length !== 2)) errors.push(`${row.id}:unsupported-candidate`);
    if (row.table?.status === "parsed" && row.table.errors.length > 0) errors.push(`${row.id}:table-errors-hidden`);
    if (row.table?.rows.some((pair) => pair.wds !== row.wdsSystemId)) errors.push(`${row.id}:cross-system-row`);
    errors.push(...validateRecordMetadata(row).map((error) => `${row.id}:${error}`));
  }
  return errors;
}

function validateRecordMetadata(row: ComponentEvidenceRecordV634): string[] {
  const errors = validateSystemHints(row.wdsSystemId, row.sourceHintIdentifiers);
  if (!SHA.test(row.requestFingerprint) || !SHA.test(row.sourceRawPageSha256)) errors.push("source-digest-invalid");
  if (!isWdsRequestV634(row.requestUrl, row.wdsSystemId)) errors.push("request-url-invalid");
  if (!row.sourceQueryIdentifier?.trim() || !row.sourceHintIdentifiers?.length) errors.push("source-identity-missing");
  if (!Number.isInteger(row.attemptCount) || row.attemptCount < 0 || row.attemptCount !== row.attempts?.length) errors.push("attempt-count-invalid");
  const last = row.attempts?.at(-1) ?? null;
  if (JSON.stringify(row.lastAttempt) !== JSON.stringify(last)) errors.push("last-attempt-mismatch");
  if (row.artifact) {
    if (!SHA.test(row.artifact.sha256) || !row.artifact.path || !Number.isInteger(row.artifact.bytes) || row.artifact.bytes <= 0) errors.push("artifact-metadata-invalid");
    if (!isWdsRequestV634(row.artifact.finalUrl, row.wdsSystemId)) errors.push("artifact-url-invalid");
  }
  if (row.status === "catalogue-candidate") {
    if (!last || last.responseCaptured !== 1 || last.httpStatus !== 200 || last.timeout !== false || last.errorCategory !== null || last.transport !== "https") errors.push("successful-attempt-missing");
    if (!sameArtifact(last?.rawArtifact, row.artifact) || last?.responseBytes !== row.artifact?.bytes) errors.push("attempt-artifact-mismatch");
    if (!row.table?.metadata.requestUrl || !isWdsRequestV634(row.table.metadata.requestUrl, row.wdsSystemId)) errors.push("table-query-invalid");
  }
  for (const [index, attempt] of (row.attempts ?? []).entries()) {
    if (attempt.retryCount !== index) errors.push("retry-sequence-invalid");
    if (!Number.isFinite(Date.parse(attempt.startedAt)) || !Number.isFinite(Date.parse(attempt.endedAt)) || Date.parse(attempt.endedAt) < Date.parse(attempt.startedAt)) errors.push("attempt-time-invalid");
    if (attempt.requestFingerprint && attempt.requestFingerprint !== row.requestFingerprint) errors.push("attempt-request-mismatch");
    if (attempt.responseCaptured === 0 && (attempt.rawArtifact !== null || attempt.responseBytes !== null)) errors.push("failed-attempt-claims-raw");
  }
  const keys = new Set<string>();
  for (const pair of row.table?.rows ?? []) {
    if (keys.has(pair.key)) errors.push("duplicate-pair");
    keys.add(pair.key);
    const described = describeWdsPairV634(pair.components);
    if (pair.relation !== described.relation || JSON.stringify(pair.members) !== JSON.stringify(described.members)) errors.push("pair-members-mismatch");
    if (pair.source.byteStart < 0 || pair.source.byteEnd <= pair.source.byteStart || pair.source.byteEnd > (row.artifact?.bytes ?? 0)) errors.push("pair-span-invalid");
    if (pair.source.byteEnd - pair.source.byteStart !== encoder.encode(pair.source.rawText).length) errors.push("pair-span-length-invalid");
    if (pair.separationArcsec !== null && (!Number.isFinite(pair.separationArcsec) || pair.separationArcsec < 0)) errors.push("pair-separation-invalid");
    for (const [value, min, max] of [[pair.position.raDeg, 0, 360], [pair.position.decDeg, -90, 90]]) {
      if (value !== null && (!Number.isFinite(value) || value < min! || value > max!)) errors.push("pair-coordinate-invalid");
    }
  }
  return [...new Set(errors)];
}

export function summarizeComponentEvidenceV634(pack: ComponentEvidencePackV634) {
  const errors = validateComponentEvidencePackV634(pack);
  return {
    valid: errors.length === 0, errors,
    captured: pack.records.filter((row) => row.artifact !== null).length,
    parsed: pack.records.filter((row) => row.status === "catalogue-candidate").length,
    pairs: pack.records.reduce((total, row) => total + (row.table?.rows.length ?? 0), 0),
    pending: pack.records.filter((row) => row.status !== "catalogue-candidate").length,
    componentConfirmed: 0, rightsApproved: 0, scientificPayloadWriteback: false,
  };
}
