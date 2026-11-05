import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v451 detector admission surface", () => {
  it("shows the six-file admission firewall and no detector image claim", () => {
    const source = readFileSync(
      "app/components/KerrDetectorInputAdmissionV451.tsx",
      "utf8",
    );
    expect(source).toContain('data-atlas-v451-measured-authority="false"');
    expect(source).toContain('data-atlas-v451-runtime-projection="false"');
    expect(source).toContain('data-atlas-v451-science-raster="false"');
    expect(source).toContain("六项仪器输入");
    expect(source).toContain("独立 v372–v374");
    expect(source).toContain("fixture join allowed");
    expect(source).not.toContain("Math.random");
  });

  it("keeps page and route local-shadow-only", () => {
    const page = readFileSync("app/local-shadow-v451/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v451/detector-admission/route.ts",
      "utf8",
    );
    expect(page).toContain(
      'process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"',
    );
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain("128 * 1024");
    expect(route).toContain("unsupported-export");
  });
});
