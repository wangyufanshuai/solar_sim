import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/api/atlas/relativity-evidence/v519/radiometry-oracle/route.ts",
  "utf8",
);

describe("v519 radiometry oracle route", () => {
  it("is local-shadow-only, no-store, bounded and export-whitelisted", () => {
    expect(source).toContain('delivery !== "local-shadow"');
    expect(source).toContain("consumeAtlasApiPolicyV275");
    expect(source).toContain('download !== "oracle"');
    expect(source).toContain("unsupported-export");
    expect(source).toContain("128 * 1024");
    expect(source).toContain('"Cache-Control": "no-store"');
  });
});
