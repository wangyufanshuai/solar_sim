import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { MAINLINE_A_CURRENT_STARS } from "../app/data/mainlineAMetadataV607";
import { MAINLINE_A_BETA_HERO_ROSTER } from "../app/data/mainlineABetaHeroRosterV607";
import { STELLAR_HEROES_V592 } from "../app/data/stellarHeroesV592.generated";
import structuredCandidatePack from "../app/data/mainlineABetaStellarStructuredCandidateV621.generated.json";
import componentEvidencePack from "../app/data/mainlineAStellarComponentEvidenceV634.generated.json";
import {
  assertMainlineABetaStellarRosterV641,
  canonicalRosterValueV641,
  MAINLINE_A_BETA_STELLAR_ROSTER_SCHEMA_V641,
  type MainlineABetaStellarFieldLedgerV641,
  type MainlineABetaStellarRosterPackV641,
  type MainlineABetaStellarRosterRowV641,
  type MainlineABetaStellarSourceRefV641,
} from "../app/lib/mainlineABetaStellarRosterV641";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(ROOT, "app/data/mainlineABetaStellarRosterV641.generated.json");
const RECEIPT_PATH = path.join(ROOT, "docs/release/v607/mainline-a-b3-stellar-roster-v641.json");
const SNAPSHOT_SHA256 = "be5e2956350d7d81f19e29d6f98529702b4cf018cd1c3b6d47b392be82db5061";
const SOURCE_PATHS = Object.freeze({
  existingRoster: "app/data/mainlineABetaHeroRosterV607.ts",
  structuredCandidatePack: "app/data/mainlineABetaStellarStructuredCandidateV621.generated.json",
  componentEvidencePack: "app/data/mainlineAStellarComponentEvidenceV634.generated.json",
});
const PENDING_IDS = new Set(["acrux", "spica", "regulus", "polaris"]);

// The source JSON is intentionally treated as an untyped boundary; all emitted rows are typed below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

function canonical(value: unknown): unknown {
  return canonicalRosterValueV641(value);
}

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function jsonFingerprint(value: unknown): string {
  return sha256(JSON.stringify(canonical(value)));
}

function fileSha256(relativePath: string): string {
  return sha256(fs.readFileSync(path.join(ROOT, relativePath)));
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sourceRef(
  id: string,
  url: string,
  role: MainlineABetaStellarSourceRefV641["role"],
  sha: string | null,
  evidenceClass: MainlineABetaStellarSourceRefV641["evidenceClass"],
  artifactPath: string | null = null,
): MainlineABetaStellarSourceRefV641 {
  return { id, url, path: artifactPath, role, sha256: sha, evidenceClass };
}

function field(
  name: MainlineABetaStellarFieldLedgerV641["field"],
  state: MainlineABetaStellarFieldLedgerV641["state"],
  value: string | number | null,
  unit: string | null,
  sourceRefIds: readonly string[],
  rawEvidence: string | null,
  confidence: MainlineABetaStellarFieldLedgerV641["confidence"],
): MainlineABetaStellarFieldLedgerV641 {
  return { field: name, state, value, unit, sourceRefIds: [...sourceRefIds], rawEvidence, confidence };
}

function provenanceRefs(star: AnyRecord): MainlineABetaStellarSourceRefV641[] {
  const refs: MainlineABetaStellarSourceRefV641[] = [];
  for (const [index, provenance] of (star.provenance ?? []).entries()) {
    const url = asString(provenance.sourceUrl);
    if (!url || !url.startsWith("https://")) continue;
    const role = String(provenance.sourceId ?? "").includes("gaia") ? "render-anchor" : String(provenance.sourceId ?? "").includes("simbad") ? "object-page" : "literature";
    refs.push(sourceRef(`${star.id}-source-${index}`, url, role, null, "external-source"));
  }
  if (refs.length === 0) refs.push(sourceRef(`${star.id}-catalogue`, "https://gea.esac.esa.int/archive/", "render-anchor", null, "external-source"));
  return refs;
}

function currentFields(star: AnyRecord, refs: readonly MainlineABetaStellarSourceRefV641[]): MainlineABetaStellarFieldLedgerV641[] {
  const ids = refs.map((ref) => ref.id);
  const science = star.science ?? {};
  const evidence = star.evidence?.referenceDistance ?? {};
  const componentState = star.id === "capella-a" ? "candidate" : "missing";
  return [
    field("coordinates", "catalog-derived", asNumber(science.raDeg) === null || asNumber(science.decDeg) === null ? null : `${science.raDeg}, ${science.decDeg}`, "deg", ids, "ICRS-J2000 catalogue coordinates", "derived"),
    field("properMotion", "missing", null, "mas/yr", ids, null, "unavailable"),
    field("spectralType", "catalog-derived", asString(science.spectralType), null, ids, null, "derived"),
    field("parallax", evidence.parallaxMas === undefined ? "missing" : "catalog-derived", asNumber(evidence.parallaxMas), "mas", ids, evidence.parallaxMas === undefined ? null : `SIMBAD compilation ${evidence.parallaxMas} mas`, evidence.parallaxMas === undefined ? "unavailable" : "derived"),
    field("distance", "catalog-derived", asNumber(science.distancePc), "pc", ids, null, "derived"),
    field("component", componentState, null, null, ids, star.id === "capella-a" ? "system-level source; component A identity is not independently confirmed" : null, componentState === "missing" ? "unavailable" : "candidate"),
  ];
}

function candidateFields(candidate: AnyRecord, refs: readonly MainlineABetaStellarSourceRefV641[]): MainlineABetaStellarFieldLedgerV641[] {
  const ids = refs.map((ref) => ref.id);
  const evidence = new Map<string, AnyRecord>((candidate.fieldEvidence ?? []).map((entry: AnyRecord) => [entry.field, entry]));
  const raw = (name: string) => asString(evidence.get(name)?.rawText);
  const candidateValue = (value: unknown) => value === null || value === undefined ? null : typeof value === "number" ? value : asString(value);
  return [
    field("coordinates", "candidate", candidateValue(candidate.raDeg) === null || candidateValue(candidate.decDeg) === null ? null : `${candidate.raDeg}, ${candidate.decDeg}`, "deg", ids, raw("coordinates"), "candidate"),
    field("properMotion", "candidate", candidateValue(candidate.properMotionRaMasYr) === null || candidateValue(candidate.properMotionDecMasYr) === null ? null : `${candidate.properMotionRaMasYr}, ${candidate.properMotionDecMasYr}`, "mas/yr", ids, raw("properMotion"), "candidate"),
    field("spectralType", "candidate", candidateValue(candidate.spectralType), null, ids, raw("spectralType"), "candidate"),
    field("parallax", candidate.parallaxMas === null ? "missing" : "candidate", candidateValue(candidate.parallaxMas), "mas", ids, raw("parallax"), candidate.parallaxMas === null ? "unavailable" : "candidate"),
    field("distance", "missing", null, "pc", ids, null, "unavailable"),
    field("component", "candidate", null, null, ids, "catalogue hints identify a WDS/CCDM system; component identity remains unresolved", "candidate"),
  ];
}

function candidateRefs(id: string, candidate: AnyRecord, component: AnyRecord): MainlineABetaStellarSourceRefV641[] {
  const refs: MainlineABetaStellarSourceRefV641[] = [];
  const sourceUrl = asString(candidate.sourceLedger?.sourceUrl);
  if (sourceUrl) refs.push(sourceRef(`${id}-simbad`, sourceUrl, "object-page", asString(candidate.rawPageSha256), "artifact"));
  const rawPath = asString(candidate.sourceArtifactPath);
  if (rawPath && asString(candidate.rawPageSha256)) refs.push(sourceRef(`${id}-simbad-raw`, sourceUrl ?? "https://simbad.cds.unistra.fr/simbad/", "raw-artifact", asString(candidate.rawPageSha256), "artifact", rawPath.replaceAll("\\", "/")));
  const componentUrl = asString(component.requestUrl);
  if (componentUrl) refs.push(sourceRef(`${id}-wds`, componentUrl, "catalogue", asString(component.artifact?.sha256), "external-source"));
  const componentPath = asString(component.artifact?.path);
  if (componentPath && asString(component.artifact?.sha256)) refs.push(sourceRef(`${id}-wds-raw`, componentUrl ?? "https://vizier.cds.unistra.fr/", "raw-artifact", asString(component.artifact.sha256), "artifact", componentPath.replaceAll("\\", "/")));
  return refs;
}

function buildRow(id: string): MainlineABetaStellarRosterRowV641 {
  const hero = (STELLAR_HEROES_V592 as readonly AnyRecord[]).find((row) => row.id === id);
  if (!hero) throw new Error(`Missing hero ${id}`);
  const current = (MAINLINE_A_CURRENT_STARS as readonly AnyRecord[]).find((row) => row.id === id);
  const candidate = (structuredCandidatePack as AnyRecord).records?.find((row: AnyRecord) => row.id === id);
  const component = (componentEvidencePack as AnyRecord).records?.find((row: AnyRecord) => row.id === id);
  const pending = PENDING_IDS.has(id);
  if (pending && (!candidate || !component)) throw new Error(`${id}: missing structured/component evidence`);
  const refs = pending ? candidateRefs(id, candidate, component) : provenanceRefs(current ?? {});
  const componentHints = pending ? (candidate.componentHints ?? []).map((hint: AnyRecord) => `${hint.catalog}: ${hint.identifier}`) : [];
  const rowWithoutFingerprint = {
    id,
    displayName: asString(hero.name) ?? id,
    phase: pending ? "candidate-hold" : "runtime-existing",
    sourceClass: pending ? "raw-structured-candidate" : "sealed-local-projection",
    runtimeRoute: pending ? "candidate-review-only" : "existing-mainline-a-runtime",
    decision: pending ? "hold" : "existing-reference",
    sourceRefs: refs,
    fieldLedger: pending ? candidateFields(candidate, refs) : currentFields(current ?? {}, refs),
    componentReview: {
      status: pending ? "unresolved" : "not-reviewed",
      hints: componentHints,
      sourceArtifactSha256: pending ? asString(component.artifact?.sha256) : null,
      reason: pending ? "WDS/CCDM rows are real catalogue candidates; a human identity review is still required" : "existing runtime reference is preserved; this batch does not promote a component identity",
    },
    rightsStatus: pending ? "odbl-attribution-required" : "catalogue-terms-review",
    sourceSnapshotSha256: SNAPSHOT_SHA256,
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
  } as Omit<MainlineABetaStellarRosterRowV641, "fingerprint">;
  return { ...rowWithoutFingerprint, fingerprint: jsonFingerprint(rowWithoutFingerprint) } as MainlineABetaStellarRosterRowV641;
}

export function buildRosterV641(generatedAt = new Date().toISOString()): MainlineABetaStellarRosterPackV641 {
  const records = (MAINLINE_A_BETA_HERO_ROSTER as readonly AnyRecord[]).map((entry) => buildRow(String(entry.id)));
  const pack: MainlineABetaStellarRosterPackV641 = {
    schema: MAINLINE_A_BETA_STELLAR_ROSTER_SCHEMA_V641,
    generatedAt,
    source: {
      existingRoster: SOURCE_PATHS.existingRoster,
      structuredCandidatePack: SOURCE_PATHS.structuredCandidatePack,
      componentEvidencePack: SOURCE_PATHS.componentEvidencePack,
      snapshotSha256: SNAPSHOT_SHA256,
    },
    counts: {
      total: records.length,
      runtimeExisting: records.filter((row) => row.phase === "runtime-existing").length,
      candidateHold: records.filter((row) => row.phase === "candidate-hold").length,
      sourceArtifactBacked: records.filter((row) => row.sourceRefs.some((ref) => ref.role === "raw-artifact" && ref.sha256)).length,
      componentConfirmed: 0,
    },
    boundary: {
      candidateOnly: true,
      hold: true,
      notAdmitted: true,
      runtimeWrites: false,
      measurementWrites: false,
      scientificPayloadWriteback: false,
      snapshotMutation: false,
    },
    records,
  };
  assertMainlineABetaStellarRosterV641(pack);
  return pack;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function receipt(pack: MainlineABetaStellarRosterPackV641) {
  return {
    schema: "mainline-a-b3-stellar-roster-receipt-v641",
    round: "B3",
    generatedAt: new Date().toISOString(),
    status: "candidate-only",
    output: "app/data/mainlineABetaStellarRosterV641.generated.json",
    outputSha256: sha256(fs.readFileSync(OUTPUT_PATH)),
    sourceFiles: Object.fromEntries(Object.entries(SOURCE_PATHS).map(([key, file]) => [key, { path: file, sha256: fileSha256(file) }])),
    counts: pack.counts,
    gates: {
      roster24: pack.counts.total === 24 ? "verified" : "blocked",
      existingRuntimeReferences: pack.counts.runtimeExisting === 20 ? "observed" : "blocked",
      pendingCandidates: pack.counts.candidateHold === 4 ? "held" : "blocked",
      componentIdentity: "pending",
      rights: "pending",
      scientificPayloadWriteback: false,
    },
    boundary: pack.boundary,
    claims: {
      scientificValidity: false,
      copyrightApproval: false,
      productionPerformance: false,
      realUserValidation: false,
    },
  };
}

export function runV641(check = false): MainlineABetaStellarRosterPackV641 {
  const pack = buildRosterV641("2026-09-29T00:00:00.000Z");
  if (check) {
    if (!fs.existsSync(OUTPUT_PATH)) throw new Error("V641 roster output is missing");
    const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
    assertMainlineABetaStellarRosterV641(existing);
    if (JSON.stringify(existing) !== JSON.stringify(pack)) throw new Error("V641 roster output is stale");
    return existing;
  }
  writeJson(OUTPUT_PATH, pack);
  writeJson(RECEIPT_PATH, receipt(pack));
  return pack;
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  try {
    const pack = runV641(process.argv.includes("--check"));
    console.log(JSON.stringify({ schema: pack.schema, counts: pack.counts, check: process.argv.includes("--check") }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
