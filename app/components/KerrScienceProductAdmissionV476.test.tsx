import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v476 science product admission surface", () => {
  it("keeps admitted sparse products and blocked images explicit", () => {
    const source = readFileSync("app/components/KerrScienceProductAdmissionV476.tsx", "utf8");

    expect(source).toContain("科学信号可以停下，展示效果不能越过闸门");
    expect(source).toContain("placeholder");
    expect(source).toContain("presentation fallback");
    expect(source).toContain('data-atlas-v476-science-pixels="0"');
    expect(source).toContain('data-atlas-v476-placeholder-measurements="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps API and page local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v476/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v476/science-product-admission/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("将真实可读的稀疏观测量与尚无资格的探测器");
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "admission"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Science-Admission");
  });
});
