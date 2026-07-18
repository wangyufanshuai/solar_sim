import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeUniversalSearchAlias,
  universalSearchPrefix,
} from "./stellarSearchCatalogV4";

describe("v125 universal catalog", () => {
  it("routes catalog names without loading full HYG documents", () => {
    expect(universalSearchPrefix("Sirius")).toBe("si");
    expect(universalSearchPrefix("HD 209458")).toBe("hd");
    expect(universalSearchPrefix("Gaia DR3 123456789")).toBe("ga");
    expect(normalizeUniversalSearchAlias("TRAPPIST-1")).toBe("trappist 1");
  });

  it("keeps v4 normalization while current offline coverage is supplied by Catalog V7", () => {
    const report = JSON.parse(
      readFileSync(
        join(process.cwd(), "dist/catalog-v7/catalog-v7.report.json"),
        "utf8",
      ),
    ) as {
      rowCount: number;
      parameterRichCount: number;
      priorityParameterRichCount: number;
      duplicateSourceIdCount: number;
      outputSha256: string;
      passed: boolean;
    };
    expect(report.rowCount).toBe(1_224_219);
    expect(report.parameterRichCount).toBe(218_617);
    expect(report.priorityParameterRichCount).toBe(63_091);
    expect(report.duplicateSourceIdCount).toBe(0);
    expect(report.outputSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.passed).toBe(true);
  });
});
