import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v382r1 visible source forensic route", () => {
  it("is local-shadow only and never promotes the partial source", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v382-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v382", {
        headers: { "x-forwarded-for": "127.0.0.382" },
      }),
    );
    const body = await response.text();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-visible-source-forensic")).toBe(
      "v382r1",
    );
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      artifact: {
        progress: {
          qualifiedSourceCount: 1,
          plannedSourceCount: 7,
          sourceDossierAvailable: false,
        },
        authorityGranted: false,
        runtimePackagingAllowed: false,
      },
    });
  });
});
