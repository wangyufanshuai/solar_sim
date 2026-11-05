import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v325 Science uncertainty HUD", () => {
  it("loads only through the bounded fixed-band client and keeps the audit interpretation explicit", () => {
    const source = readFileSync("app/components/KerrScienceBandUncertaintyV325.tsx", "utf8");
    expect(source).toContain("useSyncExternalStore");
    expect(source).toContain("retainKerrScienceObservatoryV329");
    expect(source).toContain("mode !== \"science\"");
    expect(source).toContain("linear sum · no independence claim · no RSS");
    expect(source).toContain("not a statistical CI");
    expect(source).toContain("observatory.provenance");
    expect(source).toContain("science-band-uncertainty-provenance-v326");
    expect(source).toContain("acquireAtlasResource(\"object-url\"");
    expect(source).toContain("URL.revokeObjectURL(url)");
    expect(source).toContain("12-row sanitized provenance");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("fetch(");
  });
});
