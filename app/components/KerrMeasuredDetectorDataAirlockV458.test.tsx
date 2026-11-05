import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v458 measured detector data airlock", () => {
  it("renders UTF-8 truth without creating a science image or mutation path", () => {
    const source = readFileSync(
      "app/components/KerrMeasuredDetectorDataAirlockV458.tsx",
      "utf8",
    );
    expect(source).toContain("六把钥匙，一把都不能由模板冒充");
    expect(source).toContain('data-atlas-v458-ready-files="0"');
    expect(source).toContain('data-atlas-v458-measured-authority="false"');
    expect(source).toContain('data-atlas-v458-runtime-projection="false"');
    expect(source).toContain('data-atlas-v458-science-raster="false"');
    expect(source).toContain('data-atlas-v458-fits-write="false"');
    expect(source).toContain('data-atlas-v458-png-write="false"');
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("Math.random");
  });

  it("keeps the page and bounded API local-shadow-only", () => {
    const page = readFileSync("app/local-shadow-v458/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v458/measured-detector-intake/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain("unsupported-export");
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
  });
});
