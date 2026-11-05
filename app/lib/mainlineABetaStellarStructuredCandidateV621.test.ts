import fs from "node:fs";
import { describe, expect, it } from "vitest";
import structuredJson from "../data/mainlineABetaStellarStructuredCandidateV621.generated.json";
import { isSimbadObjectPageV621, parseSimbadHtmlV621, structuredCandidateNeedsReviewV621, structuredCandidateSummaryV621, validateStructuredCandidateV621, type StructuredCandidateV621 } from "./mainlineABetaStellarStructuredCandidateV621";

const pack = structuredJson as { records: StructuredCandidateV621[]; counts: Record<string, number>; boundary: Record<string, boolean> };
const expected = [
  { id: "acrux", file: "acrux-6283e0cf5cb9.raw", pm: [-35.4, -14.7], spectral: "B0.5IV", quality: "E", parallax: null, parallaxError: null, identifiers: 22 },
  { id: "spica", file: "spica-81276ed6687b.raw", pm: [-42.35, -30.67], spectral: "B1V", quality: "C", parallax: 13.06, parallaxError: 0.7, identifiers: 55 },
  { id: "regulus", file: "regulus-a30e3e314621.raw", pm: [-248.73, 5.59], spectral: "B8IVn", quality: "C", parallax: 41.13, parallaxError: 0.35, identifiers: 56 },
  { id: "polaris", file: "polaris-5c70e01ec2c0.raw", pm: [44.48, -11.85], spectral: "F8Ib", quality: "C", parallax: 7.54, parallaxError: 0.11, identifiers: 46 },
] as const;
const rawAcrux = () => fs.readFileSync("docs/release/v607/raw-artifacts/r60/acrux-6283e0cf5cb9.raw", "utf8");
const parseAcrux = (html: string) => parseSimbadHtmlV621(html, { id: "acrux", planId: "p", artifactPath: "a.raw", rawPageSha256: "a".repeat(64) });
describe("V621 SIMBAD structured candidate parser", () => {
  it("parses all four captured HTML pages into candidate fields", () => {
    expect(pack.counts).toMatchObject({ total: 4, parsedCandidate: 4, componentConfirmed: 0 });
    expect(pack.records.every((record) => validateStructuredCandidateV621(record).length === 0)).toBe(true);
    expect(pack.records.map((record) => record.id)).toEqual(["acrux", "spica", "regulus", "polaris"]);
  });
  it("keeps component identity unresolved and admission closed", () => {
    for (const record of pack.records) {
      expect(record.componentIdentityStatus).toBe("unresolved");
      expect(record.componentSourceReference).toBeNull();
      expect(record.sourceLedger.sourceUrl).toMatch(/^https:\/\/simbad\.cds\.unistra\.fr\//);
      expect(record.sourceLedger.rawPageSha256).toBe(record.rawPageSha256);
      expect(record.sourceLedger.citationStatus).toBe("pending");
      expect(record.sourceRefs).toContain(record.sourceArtifactPath);
      expect(record.componentHints.length).toBeGreaterThanOrEqual(2);
      expect(record.componentHints.every((hint) => hint.evidence === "identifier-only")).toBe(true);
      expect(record.componentHints.every((hint) => /^https:\/\/(vizier\.cds\.unistra\.fr|cds\.unistra\.fr)\//.test(hint.sourceUrl))).toBe(true);
      expect(record.decision).toBe("hold");
      expect(structuredCandidateNeedsReviewV621(record)).toBe(true);
    }
  });
  it("extracts title, object type and coordinates from real SIMBAD HTML", () => {
    const html = fs.readFileSync("docs/release/v607/raw-artifacts/r60/acrux-6283e0cf5cb9.raw", "utf8");
    const parsed = parseSimbadHtmlV621(html, { id: "acrux", planId: "p", artifactPath: "a.raw", rawPageSha256: "a".repeat(64) });
    expect(parsed.queryTitle).toBe("* alf01 Cru");
    expect(parsed.objectType).toBe("Star");
    expect(parsed.raDeg).toBeCloseTo(186.6495667, 5);
    expect(parsed.decDeg).toBeCloseTo(-63.0990917, 5);
    expect(isSimbadObjectPageV621(html)).toBe(true);
    expect(parsed.componentHints.some((hint) => hint.catalog === "WDS")).toBe(true);
    expect(structuredCandidateSummaryV621(parsed)).toContain("component unresolved");
  });
  it("fails closed for forged SIMBAD-looking fragments and query mismatches", () => {
    const forged = `<html><title>* alf01 Cru</title><meta name="description" content="The astronomical object called * alf01 Cru is a Star"><b>ICRS</b><tt>12 26 35.896 -63 05 56.73</tt></html>`;
    const parsed = parseSimbadHtmlV621(forged, { id: "acrux", planId: "p", artifactPath: "a.raw", rawPageSha256: "a".repeat(64), expectedQueryIdentifier: "* alf01 Cru" });
    expect(isSimbadObjectPageV621(forged)).toBe(false);
    expect(parsed.parseStatus).toBe("parse-blocked");
    expect(parsed.parserWarnings).toContain("simbad-source-signature-missing");
    const raw = fs.readFileSync("docs/release/v607/raw-artifacts/r60/acrux-6283e0cf5cb9.raw", "utf8");
    const mismatch = parseSimbadHtmlV621(raw, { id: "acrux", planId: "p", artifactPath: "a.raw", rawPageSha256: "a".repeat(64), expectedQueryIdentifier: "* forged Cru" });
    expect(mismatch.parseStatus).toBe("parse-blocked");
    expect(mismatch.parserWarnings).toContain("query-identifier-mismatch");
  });
  it("fails closed for malformed HTML and unsafe promotion", () => {
    const parsed = parseSimbadHtmlV621("<html><title>forged</title></html>", { id: "acrux", planId: "p", artifactPath: "a.raw", rawPageSha256: "a".repeat(64) });
    expect(parsed.parseStatus).toBe("parse-blocked");
    expect(validateStructuredCandidateV621({ ...parsed, componentIdentityStatus: "confirmed" })).toContain("confirmed-component-source-missing");
    expect(validateStructuredCandidateV621({ ...parsed, scientificPayloadWriteback: true } as never)).toContain("admission-boundary-opened");
  });
});

describe("V621 table row field provenance", () => {
  it.each(expected)("extracts $id measured fields without tooltip or neighboring table leakage", (row) => {
    const raw = fs.readFileSync(`docs/release/v607/raw-artifacts/r60/${row.file}`);
    const parsed = parseSimbadHtmlV621(raw.toString("utf8"), { id: row.id, planId: "p", artifactPath: row.file, rawPageSha256: "a".repeat(64) });
    expect([parsed.properMotionRaMasYr, parsed.properMotionDecMasYr]).toEqual(row.pm);
    expect(parsed.spectralType).toBe(row.spectral);
    expect(parsed.spectralQuality).toBe(row.quality);
    expect(parsed.parallaxMas).toBe(row.parallax);
    expect(parsed.parallaxErrorMas).toBe(row.parallaxError);
    expect(parsed.identifiers).toHaveLength(row.identifiers);
    expect(parsed.identifiers).not.toEqual(expect.arrayContaining(["Velocities", "Rot", "PM", "SpT", "IUE"]));
    expect(parsed.identifiers.every((id) => !["Velocities", "Rot", "PM", "SpT", "IUE"].includes(id))).toBe(true);
    expect(parsed.fieldEvidence?.length).toBe(row.parallax === null ? 3 : 4);
    for (const evidence of parsed.fieldEvidence ?? []) {
      const cell = raw.subarray(evidence.byteStart, evidence.byteEnd).toString("utf8");
      expect(cell).toMatch(/^<TD\b[\s\S]*<\/TD>$/i);
      expect(evidence.rawText).not.toContain('E)">');
      for (const bibcode of evidence.bibcodes) expect(cell).toContain(bibcode);
    }
    const pmEvidence = parsed.fieldEvidence?.find((entry) => entry.field === "properMotion");
    expect(pmEvidence?.unit).toBe("mas/yr");
    expect(pmEvidence?.bibcodes).toEqual([row.id === "acrux" ? "2002A&A...384..180F" : "2007A&A...474..653V"]);
    expect(parsed.componentIdentityStatus).toBe("unresolved");
    expect(parsed.scientificPayloadWriteback).toBe(false);
  });

  it("keeps absent Acrux parallax null without borrowing a coordinate or nearby magnitude", () => {
    const result = parseAcrux(rawAcrux());
    expect(result.parallaxMas).toBeNull();
    expect(result.parallaxErrorMas).toBeNull();
    expect(result.parserWarnings).toContain("parallax-not-found");
    expect(result.fieldEvidence?.some((entry) => entry.field === "parallax")).toBe(false);
  });

  it("does not read proper motion from a coordinate tooltip when its real row is absent", () => {
    const html = rawAcrux().replace(/<TR\b[^>]*>(?:(?!<TR)[\s\S])*?Proper motions <i>mas\/yr<\/i>(?:(?!<\/TR>)[\s\S])*?<\/TR>/i, "");
    expect(html).not.toContain("Proper motions <i>mas/yr</i>");
    const result = parseAcrux(html);
    expect(result.raDeg).not.toBeNull();
    expect(result.properMotionRaMasYr).toBeNull();
    expect(result.properMotionDecMasYr).toBeNull();
    expect(result.parserWarnings).toContain("proper-motion-not-found");
  });

  it("rejects duplicate measured rows instead of silently choosing one", () => {
    const html = rawAcrux();
    const duplicate = '<TR><TD>Proper motions <i>mas/yr</i> :</TD><TD><TT>900 901 [1 1 0] A</TT></TD></TR>';
    const result = parseAcrux(`${html}${duplicate}`);
    expect(result.properMotionRaMasYr).toBeNull();
    expect(result.parserWarnings).toContain("proper-motion-ambiguous");
  });

  it("does not accept the correct numeric pair under the wrong unit", () => {
    const result = parseAcrux(rawAcrux().replace("Proper motions <i>mas/yr</i>", "Proper motions <i>arcsec/yr</i>"));
    expect(result.properMotionRaMasYr).toBeNull();
    expect(result.parserWarnings).toContain("proper-motion-not-found");
  });

  it.each(["24 00 00.0 -63 05 56.73", "12 60 00.0 -63 05 56.73", "12 26 60.0 -63 05 56.73", "12 26 35.896 +90 00 00.1", "12 26 35.896 -63 60 56.73"])("rejects invalid sexagesimal coordinate %s", (value) => {
    const result = parseAcrux(rawAcrux().replace("12 26 35.896 -63 05 56.73", value));
    expect(result.raDeg).toBeNull();
    expect(result.decDeg).toBeNull();
    expect(result.parseStatus).toBe("parse-blocked");
  });

  it("retains the sign of a negative-zero declination degree", () => {
    const result = parseAcrux(rawAcrux().replace("12 26 35.896 -63 05 56.73", "12 26 35.896 -00 30 00.0"));
    expect(result.decDeg).toBe(-0.5);
  });

  it("binds offsets to original UTF-8 bytes despite Unicode prefix and CRLF", () => {
    const html = `<!-- 测试前缀 🔭 -->\r\n${rawAcrux().replaceAll("\n", "\r\n")}`;
    const raw = Buffer.from(html, "utf8");
    const result = parseAcrux(html);
    expect(result.properMotionRaMasYr).toBe(-35.4);
    for (const entry of result.fieldEvidence ?? []) expect(raw.subarray(entry.byteStart, entry.byteEnd).toString("utf8")).toMatch(/^<TD\b[\s\S]*<\/TD>$/i);
  });

  it("ignores commented counterfeit rows but keeps the real field", () => {
    const fake = '<!-- <TR><TD>Proper motions mas/yr :</TD><TD><TT>777 888 [0 0 0] A</TT></TD></TR> -->';
    const result = parseAcrux(fake + rawAcrux());
    expect(result.properMotionRaMasYr).toBe(-35.4);
    expect(result.parserWarnings).not.toContain("proper-motion-ambiguous");
  });

  it("rejects unsafe numeric and evidence metadata when validating a candidate", () => {
    const parsed = parseAcrux(rawAcrux());
    expect(validateStructuredCandidateV621({ ...parsed, raDeg: Number.NaN })).toContain("ra-out-of-range");
    expect(validateStructuredCandidateV621({ ...parsed, properMotionRaMasYr: Infinity })).toContain("properMotionRaMasYr-not-finite");
    const evidence = parsed.fieldEvidence![0];
    expect(validateStructuredCandidateV621({ ...parsed, fieldEvidence: [{ ...evidence, byteEnd: evidence.byteStart }] })).toContain("field-evidence-range-invalid");
  });
});
