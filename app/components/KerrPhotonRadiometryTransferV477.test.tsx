import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v477 photon radiometry surface", () => {
  it("distinguishes transfer coefficients from measured radiance", () => {
    const source = readFileSync("app/components/KerrPhotonRadiometryTransferV477.tsx", "utf8");

    expect(source).toContain("追踪光如何缩放，不假装已经测到光");
    expect(source).toContain("transfer coefficient ≠ measured radiance");
    expect(source).toContain('data-atlas-v477-measured-radiance-rows="0"');
    expect(source).toContain('data-atlas-v477-presentation-inputs="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("�");
  });

  it("keeps API and page local-shadow-only, bounded and no-store", () => {
    const page = readFileSync("app/local-shadow-v477/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v477/photon-radiometry-transfer/route.ts",
      "utf8",
    );

    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("用四条权威 disk ray 验证 g、g³、g⁴");
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain('download !== "transfer-payload"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).toContain("X-Atlas-Kerr-Photon-Radiometry");
  });
});
