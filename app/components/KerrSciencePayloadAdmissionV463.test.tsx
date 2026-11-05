import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v463 science payload observatory", () => {
  it("renders an explicit fail-closed Science/Cinematic boundary", () => {
    const source = readFileSync("app/components/KerrSciencePayloadAdmissionV463.tsx", "utf8");
    expect(source).toContain("科学载荷准入协议");
    expect(source).toContain("v462 原子 join 是唯一上游");
    expect(source).toContain("cinematic science writeback");
    expect(source).toContain("production rows = 0");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("Math.random");
  });
  it("keeps the API and page local-shadow-only and bounded", () => {
    const page = readFileSync("app/local-shadow-v463/page.tsx", "utf8");
    const route = readFileSync("app/api/atlas/relativity-evidence/v463/science-payload-admission/route.ts", "utf8");
    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(route).toContain('delivery !== "local-shadow"');
    expect(route).toContain("unsupported-export");
    expect(route).toContain("128 * 1024");
    expect(route).toContain('"Cache-Control": "no-store"');
  });
});
