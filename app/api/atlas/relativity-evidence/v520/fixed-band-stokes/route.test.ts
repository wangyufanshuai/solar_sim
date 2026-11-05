import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/api/atlas/relativity-evidence/v520/fixed-band-stokes/route.ts",
  "utf8",
);

describe("v520 fixed-band Stokes route", () => {
  it("is local-shadow-only, bounded, no-store and export-whitelisted", () => {
    expect(source).toContain('delivery !== "local-shadow"');
    expect(source).toContain("consumeAtlasApiPolicyV275");
    expect(source).toContain('download !== "stokes"');
    expect(source).toContain("unsupported-export");
    expect(source).toContain("128 * 1024");
    expect(source).toContain('"Cache-Control": "no-store"');
  });
});
