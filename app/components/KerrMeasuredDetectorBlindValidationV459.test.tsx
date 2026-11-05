import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v459 blind validation observatory", () => {
  it("exposes protocol-only, fail-closed UTF-8 UI", () => {
    const source = readFileSync(
      "app/components/KerrMeasuredDetectorBlindValidationV459.tsx",
      "utf8",
    );
    expect(source).toContain("先锁住盲区，再谈像素可信度");
    expect(source).toContain('data-atlas-v459-protocol-qualified="true"');
    expect(source).toContain('data-atlas-v459-measured-validation="false"');
    expect(source).toContain('data-atlas-v459-authority="false"');
    expect(source).toContain('data-atlas-v459-scientific-field-mutation="false"');
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("Math.random");
  });

  it("keeps page and API local-shadow-only", () => {
    const page = readFileSync("app/local-shadow-v459/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v459/measured-detector-blind-validation/route.ts",
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
