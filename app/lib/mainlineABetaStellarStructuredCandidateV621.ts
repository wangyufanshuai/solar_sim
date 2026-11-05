export type StructuredParseStatusV621 = "parsed-candidate" | "parse-blocked";
export type ComponentIdentityStatusV621 = "unresolved" | "candidate" | "confirmed";
export type StructuredComponentHintV621 = Readonly<{
  catalog: "WDS" | "CCDM";
  identifier: string;
  sourceUrl: string;
  evidence: "identifier-only";
}>;

export type StructuredFieldEvidenceV621 = Readonly<{
  field: "coordinates" | "properMotion" | "parallax" | "spectralType";
  rawText: string;
  unit: "sexagesimal-degrees" | "mas/yr" | "mas" | null;
  quality: string | null;
  bibcodes: readonly string[];
  byteStart: number;
  byteEnd: number;
}>;

export type StructuredCandidateV621 = Readonly<{
  schema: "mainline-a-beta-stellar-structured-candidate-v621";
  id: "acrux" | "spica" | "regulus" | "polaris";
  planId: string;
  sourceArtifactPath: string;
  rawPageSha256: string;
  sourceLedger: Readonly<{ sourceUrl: string; capturedAt: string; rawPageSha256: string; citationStatus: "pending"; rightsStatus: "odbl-attribution-required" }>;
  sourceRefs: readonly string[];
  parseStatus: StructuredParseStatusV621;
  queryTitle: string | null;
  objectType: string | null;
  raDeg: number | null;
  decDeg: number | null;
  properMotionRaMasYr: number | null;
  properMotionDecMasYr: number | null;
  spectralType: string | null;
  parallaxMas?: number | null;
  parallaxErrorMas?: number | null;
  spectralQuality?: string | null;
  parserVersion?: "table-rows-v2";
  fieldEvidence?: readonly StructuredFieldEvidenceV621[];
  identifiers: readonly string[];
  /**
   * Explicit catalogue links found in the captured object page.  These are
   * candidate hints only: no component is inferred or admitted from them.
   */
  componentHints: readonly StructuredComponentHintV621[];
  componentIdentityStatus: ComponentIdentityStatusV621;
  componentSourceReference: string | null;
  decision: "hold";
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
  parserWarnings: readonly string[];
}>;

const ALLOWLIST = new Set(["acrux", "spica", "regulus", "polaris"]);
const HASH = /^[a-f0-9]{64}$/i;
const HTML_TAG = /<(?:[^>"']|"[^"]*"|'[^']*')*>/g;
const WS = /\s+/g;

/**
 * Decode the small entity vocabulary emitted by SIMBAD before field
 * normalization.  Keeping this local and deterministic avoids depending on
 * a browser DOM when the collector/replay runs in Node.
 */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function text(value: string): string { return decodeHtmlEntities(value.replace(HTML_TAG, " ")).replace(WS, " ").trim(); }

/**
 * A title and a coordinate-looking pair are insufficient evidence by
 * themselves: a copied or forged HTML fragment could contain both.  The
 * parser therefore requires the stable SIMBAD page markers that are present
 * in the captured object pages and absent from the negative fixtures.
 */
export function isSimbadObjectPageV621(html: string): boolean {
  const normalized = normalizeSimbadHtmlV621(html);
  return /<meta[^>]+name\s*=\s*["']description["'][^>]+The SIMBAD astronomical database/i.test(normalized)
    && /The astronomical object called\s+[^<]+\s+is\s+[^<]+/i.test(normalized)
    && /<b>\s*ICRS\s*<\/b>/i.test(normalized);
}
type DataCell = Readonly<{ html: string; start: number; end: number }>;

function withoutTooltip(value: string): string {
  return value.replace(/<DIV\b[^>]*>[\s\S]*?<\/DIV>/gi, "");
}

// Work against the original string, retaining exact UTF-8 byte locations.
// Mask comments without changing offsets so commented rows cannot become data.
function tableRows(html: string): readonly { label: string; cell: DataCell }[] {
  const visible = html.replace(/<!--[\s\S]*?-->/g, (comment) => " ".repeat(comment.length));
  const rows: { label: string; cell: DataCell }[] = [];
  for (const row of visible.matchAll(/<TR\b[^>]*>([\s\S]*?)<\/TR>/gi)) {
    const cells = [...row[0].matchAll(/<TD\b[^>]*>([\s\S]*?)<\/TD>/gi)];
    if (cells.length !== 2) continue;
    const label = text(withoutTooltip(cells[0][1]));
    const value = cells[1];
    const start = row.index! + value.index!;
    rows.push({ label, cell: { html: html.slice(start, start + value[0].length), start, end: start + value[0].length } });
  }
  return rows;
}

function uniqueCell(rows: ReturnType<typeof tableRows>, label: RegExp, name: string, warnings: string[]): DataCell | null {
  const matches = rows.filter((row) => label.test(row.label));
  if (matches.length > 1) warnings.push(`${name}-ambiguous`);
  return matches.length === 1 ? matches[0].cell : null;
}

function primaryText(cell: DataCell | null): string {
  const value = cell?.html.match(/<TT\b[^>]*>([\s\S]*?)<\/TT>/i)?.[1];
  return value === undefined ? "" : text(value);
}

function fieldEvidence(html: string, cell: DataCell | null, field: StructuredFieldEvidenceV621["field"], unit: StructuredFieldEvidenceV621["unit"], quality: string | null): StructuredFieldEvidenceV621 | null {
  if (!cell) return null;
  const bibcodes = [...cell.html.matchAll(/<SPAN\b[^>]*class=["']bibcode["'][^>]*>([\s\S]*?)<\/SPAN>/gi)]
    .map((match) => text(match[1])).filter(Boolean);
  return Object.freeze({
    field, rawText: primaryText(cell), unit, quality,
    bibcodes: Object.freeze([...new Set(bibcodes)]),
    byteStart: new TextEncoder().encode(html.slice(0, cell.start)).length,
    byteEnd: new TextEncoder().encode(html.slice(0, cell.end)).length,
  });
}

function parseIcrsCoordinates(cell: DataCell | null): [number | null, number | null] {
  const match = primaryText(cell).match(/^(\d{1,2})\s+(\d{1,2})\s+(\d+(?:\.\d+)?)\s+([+-]?\d{1,3})\s+(\d{1,2})\s+(\d+(?:\.\d+)?)(?:\s|$)/);
  if (!match) return [null, null];
  const [hours, minutes, seconds, degrees, arcminutes, arcseconds] = match.slice(1).map(Number);
  if (hours >= 24 || minutes >= 60 || seconds >= 60 || Math.abs(degrees) > 90 || arcminutes >= 60 || arcseconds >= 60) return [null, null];
  if (Math.abs(degrees) === 90 && (arcminutes !== 0 || arcseconds !== 0)) return [null, null];
  const ra = (Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600) * 15;
  const sign = match[4].startsWith("-") ? -1 : 1;
  const dec = sign * (Math.abs(Number(match[4])) + Number(match[5]) / 60 + Number(match[6]) / 3600);
  return [ra, dec];
}

function parseMotion(cell: DataCell | null): { values: [number | null, number | null]; quality: string | null } {
  const match = primaryText(cell).match(/^([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+\[[^\]]*\]\s+([A-E~∼])(?:\s|$)/);
  return match ? { values: [Number(match[1]), Number(match[2])], quality: match[3] } : { values: [null, null], quality: null };
}

function parseParallax(cell: DataCell | null): { value: number | null; error: number | null; quality: string | null } {
  const match = primaryText(cell).match(/^([+-]?\d+(?:\.\d+)?)\s+\[(\d+(?:\.\d+)?)\]\s+([A-E~∼])(?:\s|$)/);
  return match ? { value: Number(match[1]), error: Number(match[2]), quality: match[3] } : { value: null, error: null, quality: null };
}

function parseSpectral(cell: DataCell | null): { value: string | null; quality: string | null } {
  const match = primaryText(cell).match(/^(.+?)\s+([A-E~∼])$/);
  return match ? { value: match[1], quality: match[2] } : { value: null, quality: null };
}

function parseIdentifiers(html: string, warnings: string[]): readonly string[] {
  const anchors = [...html.matchAll(/<A\b[^>]*NAME=["']lab_ident["'][^>]*>/gi)];
  if (anchors.length !== 1) { warnings.push("identifier-section-missing-or-ambiguous"); return []; }
  const tail = html.slice(anchors[0].index!);
  const tables = [...tail.matchAll(/<TABLE\b[^>]*>([\s\S]*?)<\/TABLE>/gi)];
  const heading = tables[0]?.[1].match(/Identifiers\s*\((\d+)\)\s*:/i);
  if (!heading || !tables[1]) { warnings.push("identifier-table-not-found"); return []; }
  const values = [...tables[1][1].matchAll(/<TT\b[^>]*>([\s\S]*?)<\/TT>/gi)].map((match) => text(match[1])).filter(Boolean);
  const unique = [...new Set(values)];
  if (values.length !== Number(heading[1]) || unique.length !== values.length) warnings.push("identifier-count-mismatch");
  return Object.freeze(unique);
}

function parseComponentHints(html: string): readonly StructuredComponentHintV621[] {
  const hints = new Map<string, StructuredComponentHintV621>();
  const linkPattern = /<A\b[^>]*HREF\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/A>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const sourceUrl = decodeHtmlEntities(match[1]).trim();
    const label = text(match[2]);
    const catalogMatch = label.match(/^(WDS|CCDM)\s+(.+)$/i);
    if (!catalogMatch) continue;
    let parsed: URL;
    try { parsed = new URL(sourceUrl, "https://simbad.cds.unistra.fr/"); } catch { continue; }
    if (parsed.protocol !== "https:" || !["vizier.cds.unistra.fr", "cds.unistra.fr"].includes(parsed.hostname)) continue;
    const catalog = catalogMatch[1].toUpperCase() as "WDS" | "CCDM";
    const identifier = `${catalog} ${catalogMatch[2].trim()}`;
    const key = `${catalog}|${identifier}|${parsed.toString()}`;
    hints.set(key, Object.freeze({ catalog, identifier, sourceUrl: parsed.toString(), evidence: "identifier-only" }));
  }
  return Object.freeze([...hints.values()].sort((left, right) => `${left.catalog}|${left.identifier}|${left.sourceUrl}`.localeCompare(`${right.catalog}|${right.identifier}|${right.sourceUrl}`)));
}

export function normalizeSimbadHtmlV621(html: string): string {
  return html.replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, " ");
}

export function parseSimbadHtmlV621(htmlInput: string, identity: { id: StructuredCandidateV621["id"]; planId: string; artifactPath: string; rawPageSha256: string; sourceUrl?: string; capturedAt?: string; expectedQueryIdentifier?: string }): StructuredCandidateV621 {
  const html = htmlInput;
  const visible = html.replace(/<!--[\s\S]*?-->/g, (comment) => " ".repeat(comment.length));
  const warnings: string[] = [];
  const sourceSignature = isSimbadObjectPageV621(html);
  if (!sourceSignature) warnings.push("simbad-source-signature-missing");
  const titleMatch = visible.match(/<TITLE[^>]*>([\s\S]*?)<\/TITLE>/i);
  const queryTitle = titleMatch ? text(titleMatch[1]) : null;
  if (identity.expectedQueryIdentifier && queryTitle !== identity.expectedQueryIdentifier) warnings.push("query-identifier-mismatch");
  const description = visible.match(/CONTENT=["']The astronomical object called ([^"']+)/i)?.[1] ?? "";
  const objectType = description.match(/\bis\s+(?:a|an)\s+([^.,<]+)/i)?.[1]?.trim() ?? null;
  const rows = tableRows(html);
  const coordinateCell = uniqueCell(rows, /^ICRS coord\. \(ep=J2000\)\s*:/i, "coordinates", warnings);
  const motionCell = uniqueCell(rows, /^Proper motions mas\/yr\s*:/i, "proper-motion", warnings);
  const parallaxCell = uniqueCell(rows, /^Parallaxes \(mas\)\s*:/i, "parallax", warnings);
  const spectralCell = uniqueCell(rows, /^Spectral type\s*:/i, "spectral-type", warnings);
  const [raDeg, decDeg] = parseIcrsCoordinates(coordinateCell);
  if (raDeg === null || decDeg === null) warnings.push("coordinates-not-found");
  const motion = parseMotion(motionCell);
  const [properMotionRaMasYr, properMotionDecMasYr] = motion.values;
  if (properMotionRaMasYr === null || properMotionDecMasYr === null) warnings.push("proper-motion-not-found");
  const parallax = parseParallax(parallaxCell);
  if (parallax.value === null) warnings.push("parallax-not-found");
  const spectral = parseSpectral(spectralCell);
  const spectralType = spectral.value;
  if (!spectralType) warnings.push("spectral-type-not-found");
  const identifiers = parseIdentifiers(visible, warnings);
  const componentHints = parseComponentHints(visible);
  const evidence = [
    fieldEvidence(html, coordinateCell, "coordinates", "sexagesimal-degrees", text(coordinateCell?.html.match(/<SPAN\b[^>]*title=["']quality flag[^"']*["'][^>]*>([\s\S]*?)<\/SPAN>/i)?.[1] ?? "") || null),
    fieldEvidence(html, motionCell, "properMotion", "mas/yr", motion.quality),
    fieldEvidence(html, parallaxCell, "parallax", "mas", parallax.quality),
    fieldEvidence(html, spectralCell, "spectralType", null, spectral.quality),
  ].filter((entry): entry is StructuredFieldEvidenceV621 => entry !== null);
  if (identifiers.length === 0) warnings.push("identifiers-not-found");
  const parseStatus: StructuredParseStatusV621 = sourceSignature && !warnings.includes("query-identifier-mismatch") && queryTitle && objectType && raDeg !== null && decDeg !== null ? "parsed-candidate" : "parse-blocked";
  if (parseStatus === "parse-blocked") warnings.push("minimum-identity-fields-missing");
  const sourceUrl = identity.sourceUrl ?? "https://simbad.cds.unistra.fr/";
  const capturedAt = identity.capturedAt ?? new Date().toISOString();
  return Object.freeze({ schema: "mainline-a-beta-stellar-structured-candidate-v621", id: identity.id, planId: identity.planId, sourceArtifactPath: identity.artifactPath, rawPageSha256: identity.rawPageSha256, sourceLedger: Object.freeze({ sourceUrl, capturedAt, rawPageSha256: identity.rawPageSha256, citationStatus: "pending", rightsStatus: "odbl-attribution-required" }), sourceRefs: Object.freeze([sourceUrl, identity.artifactPath]), parseStatus, queryTitle, objectType, raDeg, decDeg, properMotionRaMasYr, properMotionDecMasYr, spectralType, parallaxMas: parallax.value, parallaxErrorMas: parallax.error, spectralQuality: spectral.quality, parserVersion: "table-rows-v2", fieldEvidence: Object.freeze(evidence), identifiers, componentHints, componentIdentityStatus: "unresolved", componentSourceReference: null, decision: "hold", runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false, parserWarnings: Object.freeze(warnings) });
}

export function validateStructuredCandidateV621(candidate: StructuredCandidateV621): readonly string[] {
  const errors: string[] = [];
  if (candidate.schema !== "mainline-a-beta-stellar-structured-candidate-v621") errors.push("schema-invalid");
  if (!ALLOWLIST.has(candidate.id)) errors.push("id-not-allowlisted");
  if (!candidate.planId || !candidate.sourceArtifactPath) errors.push("source-identity-missing");
  if (!HASH.test(candidate.rawPageSha256)) errors.push("raw-hash-invalid");
  if (!candidate.sourceLedger.sourceUrl.startsWith("https://simbad.cds.unistra.fr/")) errors.push("source-url-invalid");
  if (candidate.sourceLedger.rawPageSha256 !== candidate.rawPageSha256) errors.push("source-hash-mismatch");
  if (candidate.sourceLedger.citationStatus !== "pending" || candidate.sourceLedger.rightsStatus !== "odbl-attribution-required") errors.push("source-review-opened");
  if (candidate.parseStatus === "parsed-candidate" && (candidate.queryTitle === null || candidate.objectType === null || candidate.raDeg === null || candidate.decDeg === null)) errors.push("parsed-fields-incomplete");
  if (candidate.raDeg !== null && (!Number.isFinite(candidate.raDeg) || candidate.raDeg < 0 || candidate.raDeg >= 360)) errors.push("ra-out-of-range");
  if (candidate.decDeg !== null && (!Number.isFinite(candidate.decDeg) || candidate.decDeg < -90 || candidate.decDeg > 90)) errors.push("dec-out-of-range");
  for (const name of ["properMotionRaMasYr", "properMotionDecMasYr", "parallaxMas", "parallaxErrorMas"] as const) {
    const value = candidate[name];
    if (value !== null && value !== undefined && !Number.isFinite(value)) errors.push(`${name}-not-finite`);
  }
  if (candidate.parallaxErrorMas != null && candidate.parallaxErrorMas < 0) errors.push("parallax-error-negative");
  const evidenceFields = new Set<string>();
  for (const evidence of candidate.fieldEvidence ?? []) {
    if (evidenceFields.has(evidence.field)) errors.push("field-evidence-duplicate");
    evidenceFields.add(evidence.field);
    if (!Number.isSafeInteger(evidence.byteStart) || !Number.isSafeInteger(evidence.byteEnd) || evidence.byteStart < 0 || evidence.byteEnd <= evidence.byteStart) errors.push("field-evidence-range-invalid");
    if (evidence.quality !== null && !/^[A-E~∼]$/.test(evidence.quality)) errors.push("field-evidence-quality-invalid");
  }
  if (candidate.componentIdentityStatus === "confirmed" && !candidate.componentSourceReference) errors.push("confirmed-component-source-missing");
  for (const hint of candidate.componentHints ?? []) {
    if (!["WDS", "CCDM"].includes(hint.catalog) || !hint.identifier.startsWith(`${hint.catalog} `)) errors.push("component-hint-invalid");
    try {
      const parsed = new URL(hint.sourceUrl);
      if (parsed.protocol !== "https:" || !["vizier.cds.unistra.fr", "cds.unistra.fr"].includes(parsed.hostname)) errors.push("component-hint-source-invalid");
    } catch { errors.push("component-hint-source-invalid"); }
    if (hint.evidence !== "identifier-only") errors.push("component-hint-evidence-invalid");
  }
  if (candidate.decision !== "hold" || candidate.runtimeAdmission !== "candidate-only" || candidate.measurementAdmission !== "not-admitted" || candidate.scientificPayloadWriteback) errors.push("admission-boundary-opened");
  return Object.freeze(errors);
}

export function structuredCandidateSummaryV621(candidate: StructuredCandidateV621): string {
  const coords = candidate.raDeg === null || candidate.decDeg === null ? "坐标待解析" : `${candidate.raDeg.toFixed(5)}°, ${candidate.decDeg.toFixed(5)}°`;
  return `${candidate.id} · ${candidate.parseStatus} · ${coords} · component ${candidate.componentIdentityStatus} · hold`;
}

export function structuredCandidateNeedsReviewV621(candidate: StructuredCandidateV621): boolean {
  return candidate.decision === "hold" || candidate.componentIdentityStatus !== "confirmed" || candidate.parserWarnings.length > 0;
}

export function componentIdentityLabelV621(status: ComponentIdentityStatusV621): string {
  return ({ unresolved: "组件身份未解析", candidate: "组件身份候选", confirmed: "组件身份已确认" })[status];
}

export function sourceCitationLabelV621(candidate: StructuredCandidateV621): string {
  return candidate.sourceLedger.citationStatus === "pending" ? "引用待复核" : "引用已复核";
}

export function sourceRightsLabelV621(candidate: StructuredCandidateV621): string {
  return candidate.sourceLedger.rightsStatus === "odbl-attribution-required" ? "ODbL 署名要求" : "权利状态待确认";
}

export function structuredCandidateCoordinatePairV621(candidate: StructuredCandidateV621): readonly [number | null, number | null] {
  return Object.freeze([candidate.raDeg, candidate.decDeg]);
}

export function structuredCandidateHasMinimumIdentityV621(candidate: StructuredCandidateV621): boolean {
  return candidate.parseStatus === "parsed-candidate" && candidate.queryTitle !== null && candidate.objectType !== null && candidate.raDeg !== null && candidate.decDeg !== null;
}

export function structuredCandidateSourceFingerprintV621(candidate: StructuredCandidateV621): string {
  return [candidate.id, candidate.planId, candidate.sourceLedger.sourceUrl, candidate.sourceLedger.capturedAt, candidate.rawPageSha256].join("|");
}

export function validateStructuredCandidateBatchV621(candidates: readonly StructuredCandidateV621[]): Readonly<{ valid: boolean; errors: readonly string[] }> {
  const errors = candidates.flatMap((candidate) => validateStructuredCandidateV621(candidate).map((error) => `${candidate.id}:${error}`));
  const ids = candidates.map((candidate) => candidate.id);
  if (new Set(ids).size !== ids.length) errors.push("duplicate-id");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function structuredCandidateAdmissionLabelV621(candidate: StructuredCandidateV621): string {
  return `${candidate.decision} · ${candidate.runtimeAdmission} · ${candidate.measurementAdmission} · scientificPayloadWriteback=false`;
}

export function structuredCandidateWarningsLabelV621(candidate: StructuredCandidateV621): string {
  return candidate.parserWarnings.length === 0 ? "解析器无警告" : candidate.parserWarnings.join("、");
}

export function parseStructuredCandidateBatchV621(rows: readonly { id: StructuredCandidateV621["id"]; planId: string; artifactPath: string; rawPageSha256: string; html: string }[]): readonly StructuredCandidateV621[] {
  return Object.freeze(rows.map((row) => parseSimbadHtmlV621(row.html, row)));
}
