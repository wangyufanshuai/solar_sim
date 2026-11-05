import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v457 Science Cinematic V7 qualification console", () => {
  it("exposes the fail-closed, manually toggled, non-mutating boundary", () => {
    const source = readFileSync(
      "app/components/ScienceProductQualificationConsoleV457.tsx",
      "utf8",
    );
    expect(source).toContain('data-atlas-v457-profile="science-cinematic-v7-v457"');
    expect(source).toContain('data-atlas-v457-promotion-allowed="false"');
    expect(source).toContain('data-atlas-v457-fits-write-allowed="false"');
    expect(source).toContain('data-atlas-v457-png-write-allowed="false"');
    expect(source).toContain('data-atlas-v457-scientific-field-mutation="false"');
    expect(source).toContain("结构已经合格，像素仍未获得科学身份");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("Math.random");
  });

  it("keeps page and bounded API local-shadow-only", () => {
    const page = readFileSync("app/local-shadow-v457/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v457/science-product-gate/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "gate"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
  });
});
