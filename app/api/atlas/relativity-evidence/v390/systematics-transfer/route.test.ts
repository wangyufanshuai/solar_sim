import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrTemperatureSystematicsTransferServerV390CacheForTests } from "../../../../../lib/kerrTemperatureSystematicsTransferServerV390";
import { GET } from "./route";

describe("v390 systematics transfer route", () => {
  beforeEach(() => {
    resetKerrTemperatureSystematicsTransferServerV390CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v390-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
      artifact: null,
    });
  });

  it("serves only the local-shadow operator with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v390", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(
      response.headers.get("x-atlas-temperature-systematics-transfer"),
    ).toBe("v390");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const body = JSON.parse(text);
    expect(body.artifact.counts.coefficientCount).toBe(72);
    expect(body.artifact.admission).toMatchObject({
      physicalSystematicVectorAdmitted: false,
      covarianceProjectionExecuted: false,
      confidenceInterval: false,
    });
  });
});
