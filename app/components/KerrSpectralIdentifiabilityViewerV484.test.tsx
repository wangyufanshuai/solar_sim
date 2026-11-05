import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v484 identifiability viewer surface", () => {
  it("makes the one-of-five identifiability structure explicit", () => {
    const source = readFileSync("app/components/KerrSpectralIdentifiabilityViewerV484.tsx", "utf8");
    expect(source).toContain("可辨识的只有一维，剩余四维必须承认沉默");
    expect(source).toContain("1<span");
    expect(source).toContain("inverse-noise covariance");
    expect(source).toContain("Fisher information");
    expect(source).toContain('data-atlas-v484-identifiable-dimension="1"');
    expect(source).toContain('data-atlas-v484-science-writeback="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps the page and API local-shadow-only and bounded", () => {
    const page = readFileSync("app/local-shadow-v484/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v484/spectral-identifiability/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "identifiability"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Spectral-Identifiability");
  });
});
