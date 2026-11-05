import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });
describe("v364 calibration pack file route", () => {
  it("serves only manifest-listed IDs and keeps templates empty", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/file"), { params: Promise.resolve({ file: "throughput-template" }) });
    expect(response.status).toBe(200); expect(response.headers.get("x-atlas-artifact-sha256")).toMatch(/^[a-f0-9]{64}$/); expect((await response.text()).trim().split(/\r?\n/)).toHaveLength(1);
    expect((await GET(new Request("http://localhost/file"), { params: Promise.resolve({ file: "../pack.json" }) })).status).toBe(404);
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full"; expect((await GET(new Request("http://localhost/file"), { params: Promise.resolve({ file: "readme" }) })).status).toBe(404);
  });
});
