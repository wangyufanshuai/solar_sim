import { describe, expect, it } from "vitest";
import {
  buildAtlasOnlineCatalogAdqlV259,
  parseAtlasOnlineCatalogQueryV259,
  parseSimpleCsvV259,
} from "./atlasOnlineCatalogQueryV259";

describe("v259 structured Gaia online query", () => {
  it("accepts only source-id and bounded cone contracts", () => {
    expect(parseAtlasOnlineCatalogQueryV259({ kind: "source-id", sourceId: "4267180339403392768" })).toEqual({ kind: "source-id", sourceId: "4267180339403392768" });
    expect(parseAtlasOnlineCatalogQueryV259({ kind: "cone", raDeg: 12, decDeg: -5, radiusDeg: 2, limit: 2_000 })).toMatchObject({ kind: "cone", limit: 2_000 });
    expect(() => parseAtlasOnlineCatalogQueryV259({ kind: "cone", raDeg: 12, decDeg: -5, radiusDeg: 2.1 })).toThrow();
    expect(() => parseAtlasOnlineCatalogQueryV259({ kind: "adql", query: "DROP TABLE" })).toThrow();
  });

  it("builds server-owned ADQL without accepting arbitrary text", () => {
    const adql = buildAtlasOnlineCatalogAdqlV259({ kind: "cone", raDeg: 12, decDeg: -5, radiusDeg: 0.5, limit: 20 });
    expect(adql).toContain("SELECT TOP 20");
    expect(adql).toContain("CIRCLE('ICRS', 12, -5, 0.5)");
    expect(adql).toContain("ORDER BY source_id");
  });

  it("parses quoted CSV deterministically", () => {
    expect(parseSimpleCsvV259('source_id,label\r\n42,"alpha, beta"\r\n')).toEqual([{ source_id: "42", label: "alpha, beta" }]);
  });
});
