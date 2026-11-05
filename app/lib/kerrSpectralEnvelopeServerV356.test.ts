import { describe, expect, it } from "vitest";
import { loadKerrSpectralEnvelopeV356, resetKerrSpectralEnvelopeServerV356CacheForTests } from "./kerrSpectralEnvelopeServerV356";

describe("v356 envelope server", () => {
  it("serves bounded provenance and reconstructable geometry", async () => {
    resetKerrSpectralEnvelopeServerV356CacheForTests();
    expect(await loadKerrSpectralEnvelopeV356()).toMatchObject({
      status: "qualified-synthetic-provenance-and-reconstructable-envelope-audit",
      counts: { envelope2DCount: 12, envelope3DPointCount: 168 },
      exports: { absolutePathsExcluded: true, generatedAtExcluded: true, pidExcluded: true },
    });
  });
});
