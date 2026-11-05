import { describe, expect, it } from "vitest";
import {
  ATLAS_TLE_MAX_RESPONSE_BYTES,
  atlasTleSourceUrl,
  readAtlasTleResponseLimited,
} from "./atlasTleFetchPolicy";

describe("Atlas TLE fetch policy", () => {
  it("constructs only the frozen CelesTrak endpoint", () => {
    const url = atlasTleSourceUrl("stations");
    expect(url.origin).toBe("https://celestrak.org");
    expect(url.pathname).toBe("/NORAD/elements/gp.php");
    expect(url.searchParams.get("GROUP")).toBe("stations");
  });

  it("rejects an oversized response before reading it", async () => {
    const response = new Response("small", {
      headers: { "content-length": String(ATLAS_TLE_MAX_RESPONSE_BYTES + 1) },
    });
    await expect(readAtlasTleResponseLimited(response)).rejects.toThrow("declared size limit");
  });
});
