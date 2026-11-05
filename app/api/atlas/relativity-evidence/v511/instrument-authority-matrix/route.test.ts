import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/api/atlas/relativity-evidence/v511/instrument-authority-matrix/route.ts",
  "utf8",
);

describe("v511 instrument authority matrix route", () => {
  it("is local-shadow-only, no-store, bounded, rate-limited, and export-whitelisted", () => {
    expect(source).toContain('delivery !== "local-shadow"');
    expect(source).toContain('delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only"');
    expect(source).toContain("consumeAtlasApiPolicyV275");
    expect(source).toContain('download !== "matrix"');
    expect(source).toContain("unsupported-export");
    expect(source).toContain("128 * 1024");
    expect(source).toContain('"Cache-Control": "no-store"');
    expect(source).not.toContain("absolutePath");
    expect(source).not.toContain("process.pid");
  });
});
