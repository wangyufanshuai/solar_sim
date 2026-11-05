import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrPhysicalObservationTemplateServerV399CacheForTests } from "../../../../../lib/kerrPhysicalObservationTemplateServerV399";
import { GET } from "./route";

describe("v399 intake template download", () => {
  beforeEach(() => resetKerrPhysicalObservationTemplateServerV399CacheForTests());
  it("downloads a value-free template only in local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v399-template", { headers: { "x-forwarded-for": "127.0.0.1" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("x-atlas-template-sha256")).toMatch(/^[a-f0-9]{64}$/);
    const template = JSON.parse(await response.text());
    expect(template).toMatchObject({ contentClass: "template-only-not-observation", containsObservationValues: false, compileEligible: false, publicationAllowed: false });
    expect(JSON.stringify(template)).not.toMatch(/"(?:value|exampleValue|sampleValue)"\s*:/);
  });
});
