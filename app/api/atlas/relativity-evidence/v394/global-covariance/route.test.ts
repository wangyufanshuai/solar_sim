import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrGlobalCovariancePropagationServerV394CacheForTests } from "../../../../../lib/kerrGlobalCovariancePropagationServerV394";
import { GET } from "./route";

describe("v394 global covariance route", () => {
  beforeEach(() => {
    resetKerrGlobalCovariancePropagationServerV394CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v394-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
      artifact: null,
    });
  });

  it("serves only the local-shadow bounded artifact with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v394", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-global-covariance")).toBe("v394");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const body = JSON.parse(text);
    expect(body.artifact.dimensions).toMatchObject({
      inputDimension: 36,
      outputDimension: 24,
    });
    expect(body.artifact.productionAdmission).toMatchObject({
      globalCovarianceModelAvailable: false,
      blockIndependenceAssumed: false,
      covariancePropagationExecuted: false,
    });
  });
});
