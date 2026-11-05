import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  COMPONENT_BOUNDARY_V634, COMPONENT_IDS_V634,
  buildComponentEvidenceRecordV634, describeWdsPairV634, isWdsRequestV634,
  parseWdsTsvV634, summarizeComponentEvidenceV634, validateComponentEvidencePackV634,
  type ComponentCaptureRecordV634, type ComponentEvidencePackV634,
  type ComponentEvidenceRecordV634, type ComponentIdV634,
} from "./mainlineAStellarComponentEvidenceV634";

// In-memory test-only catalogue shapes. These are never written as captured
// responses, never sent to a server, and do not constitute component evidence.
const SYSTEMS: Record<ComponentIdV634, string> = {
  acrux: "12266-6306", spica: "13252-1110", regulus: "10084+1158", polaris: "02318+8916",
};
const COLUMNS = ["WDS", "Disc", "Comp", "Obs1", "Obs2", "Nobs", "sep2", "RAJ2000", "DEJ2000", "n_RAh", "Notes"];
const UNITS = ["", "", "", "yr", "yr", "", "arcsec", '"h:m:s"', '"d:m:s"', "", ""];
const ENCODER = new TextEncoder();
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const request = (system = SYSTEMS.acrux) => `https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=B%2Fwds%2Fwds&WDS=${encodeURIComponent(system)}&-out.max=1000`;
const row = (override: Record<string, string> = {}) => ({
  WDS: SYSTEMS.acrux, Disc: "TEST 1", Comp: "AB", Obs1: "1900", Obs2: "2020", Nobs: "10",
  sep2: "4.2", RAJ2000: "12 26 35.89", DEJ2000: "-63 05 56.7", n_RAh: "", Notes: "TEST-ONLY",
  ...override,
});

function testOnlyTsv(options: {
  rows?: Record<string, string>[]; columns?: string[]; units?: string[];
  system?: string; requestUrl?: string; newline?: string; prefix?: string[]; footer?: string[];
} = {}) {
  const columns = options.columns ?? COLUMNS;
  const system = options.system ?? SYSTEMS.acrux;
  return [
    "# Test-only fixture: no network collection or scientific authority",
    "# VizieR Astronomical Server", "# UTF-8: 测试用目录 é",
    `#INFO\trequest=${options.requestUrl ?? request(system)}`,
    "#INFO\tpublication_date=2026-01-01", "#INFO\tcites=bibcode:TEST-ONLY-REFERENCE",
    "#INFO\trights_uri=https://example.invalid/test-only-rights",
    ...(options.prefix ?? []), "#Table\tB_wds_wds:", "#Name: B/wds/wds",
    ...columns.map((column) => `#Column\t${column}\t(A20)\tTest-only column description`),
    columns.join("\t"), (options.units ?? UNITS).join("\t"), columns.map(() => "-----").join("\t"),
    ...(options.rows ?? [row({ WDS: system })]).map((values) => columns.map((column) => values[column] ?? "").join("\t")),
    ...(options.footer ?? []), "",
  ].join(options.newline ?? "\n");
}

function testOnlyCapture(id: ComponentIdV634 = "acrux", raw?: Uint8Array): ComponentCaptureRecordV634 {
  const bytes = raw ?? ENCODER.encode(testOnlyTsv({ system: SYSTEMS[id] }));
  const artifact = { path: `test-only-not-on-disk/${id}.tsv`, sha256: digest(bytes), bytes: bytes.byteLength,
    contentType: "text/tab-separated-values; charset=UTF-8", finalUrl: request(SYSTEMS[id]) };
  return {
    id, sourceCandidateId: id, sourceQueryIdentifier: `TEST-ONLY ${id}`, sourceRawPageSha256: "a".repeat(64),
    wdsSystemId: SYSTEMS[id], sourceHintIdentifiers: [`WDS J${SYSTEMS[id]}A`],
    plan: { requestUrl: request(SYSTEMS[id]), requestFingerprint: "b".repeat(64) }, responseCaptured: 1,
    artifact,
    attempts: [{ startedAt: "2026-01-01T00:00:00Z", endedAt: "2026-01-01T00:00:01Z", timeout: false,
      retryCount: 0, httpStatus: 200, errorCategory: null, responseCaptured: 1,
      responseBytes: bytes.byteLength, rawArtifact: artifact, transport: "https" }],
  };
}

function testOnlyPack(): ComponentEvidencePackV634 {
  return {
    schema: "mainline-a-stellar-component-evidence-v634", generatedAt: "2026-01-01T00:00:01Z",
    captureLedger: { path: "test-only-not-on-disk/ledger.json", sha256: "c".repeat(64) },
    sourceCandidatePack: { path: "test-only-not-on-disk/candidates.json", sha256: "d".repeat(64) },
    readme: null, boundary: { ...COMPONENT_BOUNDARY_V634 },
    records: COMPONENT_IDS_V634.map((id) => {
      const bytes = ENCODER.encode(testOnlyTsv({ system: SYSTEMS[id] }));
      return buildComponentEvidenceRecordV634(testOnlyCapture(id, bytes), bytes);
    }),
  };
}

function replaceFirst(pack: ComponentEvidencePackV634, values: Record<string, unknown>): ComponentEvidencePackV634 {
  return { ...pack, records: pack.records.map((record, index) => index === 0
    ? { ...record, ...values } as ComponentEvidenceRecordV634 : record) };
}

describe("V634 WDS pair semantics", () => {
  it.each([
    { hints: [] }, { hints: ["CCDM J12266-6306A"] }, { hints: ["WDS J13252-1110A"] },
    { hints: ["WDS J12266-6306A", "WDS J12266-6306A"] },
  ])("rejects forged or cross-system source hints %j", ({ hints }) => {
    const bytes = ENCODER.encode(testOnlyTsv());
    const capture = { ...testOnlyCapture("acrux", bytes), sourceHintIdentifiers: hints };
    expect(buildComponentEvidenceRecordV634(capture, bytes).status).toBe("parse-blocked");
    expect(validateComponentEvidencePackV634(replaceFirst(testOnlyPack(), { sourceHintIdentifiers: hints })).length).toBeGreaterThan(0);
  });
  it.each(["AB", "AC", "Aa,Ab", "Ba,Bb"])("describes %s as a relative pair only", (components) => {
    const result = describeWdsPairV634(components);
    expect(result.relation).toBe("explicit-pair");
    expect(result.members).toHaveLength(2);
    expect(result).not.toHaveProperty("componentConfirmed");
  });
  it.each(["AB,C", "AB-C", "Aa1,Aa2", "AA", "Aa,Aa", "A", "primary-secondary"])("preserves composite or unsupported %s without inventing members", (components) => {
    expect(describeWdsPairV634(components)).toEqual({ relation: "composite-or-unparsed", members: [] });
  });
  it("keeps an empty component field as an unlabelled pair", () => {
    expect(describeWdsPairV634("")).toEqual({ relation: "unlabelled-pair", members: [] });
  });
});

describe("V634 exact table parsing", () => {
  it("retains distinct pair rows and exact UTF-8 byte spans across CRLF and Unicode", () => {
    const text = testOnlyTsv({ newline: "\r\n", rows: [row(), row({ Comp: "Aa,Ab", Notes: "测试 α" }), row({ Comp: "AB,C" })] });
    const bytes = ENCODER.encode(text);
    const parsed = parseWdsTsvV634(bytes, SYSTEMS.acrux);
    expect(parsed.status).toBe("parsed");
    expect(parsed.rows.map((value) => value.components)).toEqual(["AB", "Aa,Ab", "AB,C"]);
    expect(new Set(parsed.rows.map((value) => value.key)).size).toBe(3);
    for (const value of parsed.rows) {
      const { byteStart, byteEnd, rawText, line } = value.source;
      expect(new TextDecoder().decode(bytes.slice(byteStart, byteEnd))).toBe(rawText);
      expect(text.split("\r\n")[line - 1]).toBe(rawText);
      expect(new TextDecoder().decode(bytes.slice(byteEnd, byteEnd + 2))).toBe("\r\n");
    }
    expect(parsed.rows[1].source.byteStart).toBeGreaterThan(text.indexOf(parsed.rows[1].source.rawText));
    expect(parsed.rows[2].members).toEqual([]);
  });
  it("normalizes optional catalogue scalars while preserving null separately from zero", () => {
    const parsed = parseWdsTsvV634(ENCODER.encode(testOnlyTsv({ rows: [row({ sep2: "", Nobs: "", Obs1: "" }), row({ Comp: "AC", sep2: "0", Nobs: "0" }), row({ Comp: "AD", sep2: "-1", Nobs: "-2" })] })), SYSTEMS.acrux);
    expect(parsed.status).toBe("parsed");
    expect(parsed.rows.map((value) => value.separationArcsec)).toEqual([null, 0, null]);
    expect(parsed.rows.map((value) => value.observationCount)).toEqual([null, 0, null]);
    expect(parsed.rows[0].firstObservationYear).toBeNull();
    expect(parsed.rows[2].warnings).toContain("separation-missing-or-invalid");
  });
  it("converts supplied sexagesimal coordinates and flags coordinates derived from the WDS name", () => {
    const parsed = parseWdsTsvV634(ENCODER.encode(testOnlyTsv({ rows: [row({ RAJ2000: "12 00 00.00", DEJ2000: "-00 30 00.0", n_RAh: "!" })] })), SYSTEMS.acrux);
    expect(parsed.rows[0].position).toEqual({ raDeg: 180, decDeg: -0.5, derivedFromName: true });
    expect(parsed.rows[0].warnings).toContain("coordinates-derived-from-system-name");
  });
  it.each([
    ["24 00 00.0", "+91 00 00.0"], ["12 60 00.0", "+90 00 01.0"],
    ["-12 00 00.0", "+12 00 60.0"], ["180.0", "-63.0"],
  ])("does not reinterpret invalid coordinate cells %s / %s as valid astrometry", (ra, dec) => {
    const parsed = parseWdsTsvV634(ENCODER.encode(testOnlyTsv({ rows: [row({ RAJ2000: ra, DEJ2000: dec })] })), SYSTEMS.acrux);
    expect(parsed.rows[0].position.raDeg).toBeNull();
    expect(parsed.rows[0].position.decDeg).toBeNull();
    expect(parsed.rows[0].warnings).toContain("coordinates-missing-or-invalid");
  });
  it("allows different discovery designations without merging their measurements", () => {
    const parsed = parseWdsTsvV634(ENCODER.encode(testOnlyTsv({ rows: [row(), row({ Disc: "TEST 2" })] })), SYSTEMS.acrux);
    expect(parsed.status).toBe("parsed");
    expect(parsed.rows).toHaveLength(2);
  });
});

describe("V634 request and response rejection", () => {
  it.each([
    "http://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=B%2Fwds%2Fwds&WDS=12266-6306",
    request().replace("vizier.cds.unistra.fr", "example.invalid"),
    request().replace("/asu-tsv", "/asu-html"), request().replace("12266-6306", "13252-1110"),
    `${request()}&WDS=12266-6306`, `${request()}&-source=B%2Fwds%2Fwds`, `${request()}#fragment`,
    request().replace("https://", "https://user:secret@"),
  ])("rejects an altered catalogue request", (url) => expect(isWdsRequestV634(url, SYSTEMS.acrux)).toBe(false));
  it.each([
    ["HTML response", () => "<html><body>Unavailable</body></html>"],
    ["wrong returned system", () => testOnlyTsv({ rows: [row({ WDS: SYSTEMS.spica })] })],
    ["wrong query system", () => testOnlyTsv({ requestUrl: request(SYSTEMS.spica) })],
    ["wrong table", () => testOnlyTsv().replace("#Table\tB_wds_wds:", "#Table\tB_other:")],
    ["wrong catalogue name", () => testOnlyTsv().replace("#Name: B/wds/wds", "#Name: B/other")],
    ["missing required column", () => testOnlyTsv().replaceAll("RAJ2000", "WrongRa")],
    ["missing column metadata", () => testOnlyTsv().replace(/^#Column\tWDS.*\n/m, "")],
    ["duplicate columns", () => testOnlyTsv({ columns: [...COLUMNS, "WDS"], units: [...UNITS, ""] })],
    ["duplicate pairs", () => testOnlyTsv({ rows: [row(), row()] })],
    ["duplicate response query", () => testOnlyTsv({ prefix: [`#INFO\trequest=${request()}`] })],
    ["overflow", () => testOnlyTsv({ footer: ["#INFO\tQUERY_STATUS=OVERFLOW"] })],
    ["query error", () => testOnlyTsv({ footer: ["#INFO\tQUERY_STATUS=ERROR"] })],
    ["catalogue error text", () => testOnlyTsv({ footer: ["#INFO\tError=unknown catalogue"] })],
    ["truncation message", () => testOnlyTsv({ footer: ["# response truncated"] })],
    ["record limit reached", () => testOnlyTsv({ requestUrl: request().replace("1000", "1") })],
    ["empty table", () => testOnlyTsv({ rows: [] })],
    ["truncated data row", () => testOnlyTsv().replace(/\tTEST-ONLY\n$/, "\n")],
    ["missing separator cell", () => testOnlyTsv().replace("-----\t-----", "-----")],
    ["RA unit is degrees", () => testOnlyTsv({ units: UNITS.map((value, index) => index === 7 ? "deg" : value) })],
    ["Dec unit is radians", () => testOnlyTsv({ units: UNITS.map((value, index) => index === 8 ? "rad" : value) })],
    ["separation unit is arcmin", () => testOnlyTsv({ units: UNITS.map((value, index) => index === 6 ? "arcmin" : value) })],
    ["observation epoch unit is days", () => testOnlyTsv({ units: UNITS.map((value, index) => index === 3 ? "d" : value) })],
  ] as const)("blocks %s without admitting a component", (_name, text) => {
    expect(parseWdsTsvV634(ENCODER.encode(text()), SYSTEMS.acrux).status).toBe("blocked");
  });
  it("returns blocked rather than throwing on a malformed request URL", () => {
    const bytes = ENCODER.encode(testOnlyTsv({ requestUrl: "https://[malformed" }));
    expect(() => parseWdsTsvV634(bytes, SYSTEMS.acrux)).not.toThrow();
    expect(parseWdsTsvV634(bytes, SYSTEMS.acrux).status).toBe("blocked");
  });
  it.each([new Uint8Array(), new Uint8Array([0xc3, 0x28]), ENCODER.encode(`\ufeff${testOnlyTsv()}`), new Uint8Array(2 * 1024 * 1024 + 1)])("rejects empty, invalid UTF-8, BOM, and oversized raw bytes", (bytes) => {
    expect(parseWdsTsvV634(bytes, SYSTEMS.acrux).status).toBe("blocked");
  });
});

describe("V634 actual run 056 raw regression", () => {
  const ledgerPath = "docs/release/v607/mainline-a-stellar-components-v634-20260927-056.json";
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8")) as { records: ComponentCaptureRecordV634[] };
  const expectedPairs = { acrux: 11, spica: 4, regulus: 4, polaris: 6 };
  it.each(COMPONENT_IDS_V634)("replays actual %s bytes without component admission", (id) => {
    const capture = ledger.records.find((value) => value.id === id)!;
    const raw = readFileSync(capture.artifact!.path);
    expect(raw.length).toBe(capture.artifact!.bytes);
    expect(digest(raw)).toBe(capture.artifact!.sha256);
    const result = buildComponentEvidenceRecordV634(capture, raw);
    expect(result.status).toBe("catalogue-candidate");
    expect(result.table!.rows).toHaveLength(expectedPairs[id]);
    expect(result.table!.metadata.bibcodes).toContain("2001AJ....122.3466M");
    expect(result.componentIdentityStatus).toBe("unresolved");
    expect(result.scientificPayloadWriteback).toBe(false);
    for (const pair of result.table!.rows) {
      expect(raw.subarray(pair.source.byteStart, pair.source.byteEnd).toString("utf8")).toBe(pair.source.rawText);
      expect(raw.toString("utf8").split(/\r?\n/)[pair.source.line - 1]).toBe(pair.source.rawText);
    }
  });
});

describe("V634 candidate and pack boundaries", () => {
  it("reports a parsed test-only contract without claiming component or rights approval", () => {
    const pack = testOnlyPack();
    expect(validateComponentEvidencePackV634(pack)).toEqual([]);
    expect(summarizeComponentEvidenceV634(pack)).toMatchObject({ valid: true, captured: 4, parsed: 4, pairs: 4, pending: 0, componentConfirmed: 0, rightsApproved: 0, scientificPayloadWriteback: false });
    expect(pack.records.every((value) => value.componentIdentityStatus === "unresolved")).toBe(true);
  });
  it("retains timeout attempts while reporting an uncaptured response as pending", () => {
    const base = testOnlyCapture();
    const capture = { ...base, responseCaptured: 0, artifact: null, attempts: [{ ...base.attempts[0], timeout: true, httpStatus: null, errorCategory: "timeout", responseCaptured: 0, responseBytes: null, rawArtifact: null }] };
    const result = buildComponentEvidenceRecordV634(capture, null);
    expect(result.status).toBe("capture-pending");
    expect(result.lastAttempt?.timeout).toBe(true);
    expect(result.table).toBeNull();
    expect(result.componentIdentityStatus).toBe("unresolved");
  });
  it.each(["missing-artifact", "missing-bytes", "wrong-byte-count", "bad-sha", "wrong-content-type", "wrong-final-url", "wrong-source-id", "failed-capture-has-bytes", "missing-attempt", "failed-attempt"])("rejects %s as a captured candidate", (fault) => {
    const bytes = ENCODER.encode(testOnlyTsv());
    const base = testOnlyCapture("acrux", bytes);
    let capture = base;
    let raw: Uint8Array | null = bytes;
    if (fault === "missing-artifact") capture = { ...base, artifact: null };
    if (fault === "missing-bytes") raw = null;
    if (fault === "wrong-byte-count") capture = { ...base, artifact: { ...base.artifact!, bytes: bytes.length + 1 } };
    if (fault === "bad-sha") capture = { ...base, artifact: { ...base.artifact!, sha256: "not-a-digest" } };
    if (fault === "wrong-content-type") capture = { ...base, artifact: { ...base.artifact!, contentType: "text/html" } };
    if (fault === "wrong-final-url") capture = { ...base, artifact: { ...base.artifact!, finalUrl: request(SYSTEMS.spica) } };
    if (fault === "wrong-source-id") capture = { ...base, sourceCandidateId: "polaris" };
    if (fault === "failed-capture-has-bytes") capture = { ...base, responseCaptured: 0 };
    if (fault === "missing-attempt") capture = { ...base, attempts: [] };
    if (fault === "failed-attempt") capture = { ...base, attempts: [{ ...base.attempts[0], timeout: true, httpStatus: 500, errorCategory: "timeout" }] };
    expect(buildComponentEvidenceRecordV634(capture, raw).status).not.toBe("catalogue-candidate");
  });
  it.each([
    { componentIdentityStatus: "confirmed" }, { scientificPayloadWriteback: true },
    { status: "admitted" }, { blockers: [] }, { artifact: null },
    { wdsSystemId: SYSTEMS.spica }, { requestFingerprint: "" },
  ])("rejects forged record promotion or broken evidence binding %j", (patch) => {
    expect(validateComponentEvidencePackV634(replaceFirst(testOnlyPack(), patch)).length).toBeGreaterThan(0);
  });
  it.each([
    { responseCaptured: 0 }, { responseBytes: null }, { responseBytes: 1 }, { rawArtifact: null },
    { httpStatus: 500 }, { timeout: true }, { errorCategory: "body-read-failed" }, { transport: "file" },
    { startedAt: "not-a-time" }, { endedAt: "not-a-time" }, { endedAt: "2025-01-01T00:00:00Z" },
  ])("rejects an attempt inconsistent with a complete HTTPS response %j", (patch) => {
    const bytes = ENCODER.encode(testOnlyTsv());
    const capture = testOnlyCapture("acrux", bytes);
    const invalid = { ...capture, attempts: [{ ...capture.attempts[0], ...patch }] };
    expect(buildComponentEvidenceRecordV634(invalid, bytes).status).toBe("parse-blocked");
  });
  it.each(["path", "sha256", "bytes", "contentType", "finalUrl"] as const)("rejects an attempt artifact whose %s differs from the persisted artifact", (key) => {
    const bytes = ENCODER.encode(testOnlyTsv());
    const capture = testOnlyCapture("acrux", bytes);
    const values = { path: "test-only-not-on-disk/other.tsv", sha256: "e".repeat(64), bytes: 1,
      contentType: "text/html", finalUrl: request(SYSTEMS.spica) };
    const invalid = { ...capture, attempts: [{ ...capture.attempts[0], rawArtifact: { ...capture.artifact!, [key]: values[key] } }] };
    expect(buildComponentEvidenceRecordV634(invalid, bytes).status).toBe("parse-blocked");
  });
  it("allows a failed attempt followed by one successful capture while retaining both", () => {
    const bytes = ENCODER.encode(testOnlyTsv());
    const capture = testOnlyCapture("acrux", bytes);
    const failed = { ...capture.attempts[0], timeout: true, httpStatus: null, errorCategory: "timeout",
      responseCaptured: 0, responseBytes: null, rawArtifact: null };
    const result = buildComponentEvidenceRecordV634({ ...capture, attempts: [failed, { ...capture.attempts[0], retryCount: 1 }] }, bytes);
    expect(result.status).toBe("catalogue-candidate");
    expect(result.attemptCount).toBe(2);
    expect(result.lastAttempt?.retryCount).toBe(1);
  });
  it("does not silently select one of two claimed successful captures", () => {
    const bytes = ENCODER.encode(testOnlyTsv());
    const capture = testOnlyCapture("acrux", bytes);
    expect(buildComponentEvidenceRecordV634({ ...capture, attempts: [...capture.attempts, ...capture.attempts] }, bytes).status).toBe("parse-blocked");
  });
  it.each(["request", "source-sha", "artifact-sha", "artifact-size", "artifact-query", "attempt", "table-query", "missing-table-query"])("rejects a forged pack with broken %s binding", (fault) => {
    const pack = testOnlyPack();
    const original = pack.records[0];
    const patch: Record<string, unknown> = {};
    if (fault === "request") patch.requestUrl = request(SYSTEMS.spica);
    if (fault === "source-sha") patch.sourceRawPageSha256 = "";
    if (fault === "artifact-sha") patch.artifact = { ...original.artifact, sha256: "bad" };
    if (fault === "artifact-size") patch.artifact = { ...original.artifact, bytes: 0 };
    if (fault === "artifact-query") patch.artifact = { ...original.artifact, finalUrl: request(SYSTEMS.spica) };
    if (fault === "attempt") patch.lastAttempt = { ...original.lastAttempt, httpStatus: 500 };
    if (fault === "table-query") patch.table = { ...original.table, metadata: { ...original.table!.metadata, requestUrl: request(SYSTEMS.spica) } };
    if (fault === "missing-table-query") patch.table = { ...original.table, metadata: { ...original.table!.metadata, requestUrl: null } };
    expect(validateComponentEvidencePackV634(replaceFirst(pack, patch)).length).toBeGreaterThan(0);
  });
  it.each(["path", "sha256", "bytes", "contentType", "finalUrl"] as const)("rejects saved attempt artifact %s tampering even when lastAttempt and history agree", (key) => {
    const pack = testOnlyPack();
    const record = pack.records[0];
    const values = { path: "test-only-not-on-disk/forged.tsv", sha256: "f".repeat(64), bytes: 1,
      contentType: "text/html", finalUrl: request(SYSTEMS.spica) };
    const attempt = { ...record.lastAttempt!, rawArtifact: { ...record.artifact!, [key]: values[key] } };
    expect(validateComponentEvidencePackV634(replaceFirst(pack, { attempts: [attempt], lastAttempt: attempt })).length).toBeGreaterThan(0);
  });
  it("rejects a parsed label when the table still contains errors", () => {
    const pack = testOnlyPack();
    const invalid = replaceFirst(pack, { table: { ...pack.records[0].table!, errors: ["query-error-or-truncated"] } });
    expect(validateComponentEvidencePackV634(invalid).length).toBeGreaterThan(0);
  });
  it.each([
    { components: "AB,C", relation: "explicit-pair", members: ["A", "B"] },
    { components: "", relation: "explicit-pair", members: ["A", "B"] },
    { components: "Aa,Ab", relation: "explicit-pair", members: ["A", "B"] },
  ])("rejects invented or simplified members in a saved pair %j", (patch) => {
    const pack = testOnlyPack();
    const table = pack.records[0].table!;
    const forged = replaceFirst(pack, { table: { ...table, rows: [{ ...table.rows[0], ...patch }] } });
    expect(validateComponentEvidencePackV634(forged).length).toBeGreaterThan(0);
  });
  it.each([
    { attemptCount: 0 }, { attempts: [] }, { lastAttempt: null },
  ])("rejects removal of the retained successful attempt %j", (patch) => {
    expect(validateComponentEvidencePackV634(replaceFirst(testOnlyPack(), patch)).length).toBeGreaterThan(0);
  });
  it.each(["source", "separationArcsec", "position"])("rejects an invalid normalized pair %s", (fault) => {
    const pack = testOnlyPack();
    const table = pack.records[0].table!;
    const pair = table.rows[0];
    const patch = fault === "source" ? { source: { ...pair.source, byteStart: -1 } }
      : fault === "separationArcsec" ? { separationArcsec: -1 }
        : { position: { ...pair.position, decDeg: 91 } };
    const forged = replaceFirst(pack, { table: { ...table, rows: [{ ...pair, ...patch }] } });
    expect(validateComponentEvidencePackV634(forged).length).toBeGreaterThan(0);
  });
  it("rejects duplicate roster members and missing input pins", () => {
    const pack = testOnlyPack();
    expect(validateComponentEvidencePackV634({ ...pack, records: [pack.records[0], pack.records[0], ...pack.records.slice(2)] }).length).toBeGreaterThan(0);
    expect(validateComponentEvidencePackV634({ ...pack, captureLedger: { ...pack.captureLedger, sha256: "" } })).toContain("pack-source-digest-missing");
  });
  it.each(Object.keys(COMPONENT_BOUNDARY_V634))("rejects opening the %s boundary", (key) => {
    const pack = testOnlyPack();
    const forged = { ...pack, boundary: { ...pack.boundary, [key]: !pack.boundary[key as keyof typeof COMPONENT_BOUNDARY_V634] } } as ComponentEvidencePackV634;
    expect(validateComponentEvidencePackV634(forged)).toContain(`boundary:${key}`);
  });
});
