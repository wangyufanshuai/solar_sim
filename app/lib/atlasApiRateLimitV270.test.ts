import { afterEach, describe, expect, it } from "vitest";
import { atlasApiRateLimitWindowCountForTestsV270, consumeAtlasApiRateLimitV270, resetAtlasApiRateLimitsForTestsV270 } from "./atlasApiRateLimitV270";

afterEach(resetAtlasApiRateLimitsForTestsV270);

describe("v270 bounded API rate limiter", () => {
  it("fails closed after a fixed same-origin window without trusting spoofed proxy headers", () => {
    const request = new Request("http://localhost/api", { headers: { "x-forwarded-for": "203.0.113.1" } });
    expect(consumeAtlasApiRateLimitV270({ request, service: "science", limit: 2, now: 0 }).allowed).toBe(true);
    expect(consumeAtlasApiRateLimitV270({ request, service: "science", limit: 2, now: 1 }).allowed).toBe(true);
    const blocked = consumeAtlasApiRateLimitV270({ request, service: "science", limit: 2, now: 2 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("caps the global window map and isolates services", () => {
    const request = new Request("http://localhost/api");
    for (let index = 0; index < 1_500; index += 1) {
      consumeAtlasApiRateLimitV270({ request, service: `service-${index}`, limit: 2, now: index });
    }
    expect(atlasApiRateLimitWindowCountForTestsV270()).toBeLessThanOrEqual(1_024);
    expect(consumeAtlasApiRateLimitV270({ request, service: "catalog", limit: 1, now: 2_000 }).allowed).toBe(true);
    expect(consumeAtlasApiRateLimitV270({ request, service: "weather", limit: 1, now: 2_000 }).allowed).toBe(true);
  });
});
