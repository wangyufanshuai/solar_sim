import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/api/atlas/relativity-evidence/v526/calibration-uncertainty-transfer/route.ts", "utf8");
describe("v526 calibration uncertainty transfer route", () => {
  it("is local-shadow-only, bounded, no-store and export-whitelisted", () => {
    expect(source).toContain('delivery !== "local-shadow"');
    expect(source).toContain("consumeAtlasApiPolicyV275");
    expect(source).toContain('download !== "transfer"');
    expect(source).toContain('"Cache-Control": "no-store"');
    expect(source).toContain("128 * 1024");
    expect(source).not.toContain("process.cwd()");
  });
});
