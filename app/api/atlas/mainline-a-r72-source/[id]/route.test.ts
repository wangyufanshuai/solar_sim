import { afterEach, describe, expect, it } from "vitest";
import overlayJson from "../../../../data/mainlineANebulaR72SourceV659.generated.json";
import { GET } from "./route";

const previous = process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES;
const makeRequest = (id: string, host = "127.0.0.1:3095") =>
  new Request(`http://${host}/api/atlas/mainline-a-r72-source/${id}`,
    { headers: { host } });
const context = (id: string) => ({ params: Promise.resolve({ id }) });

afterEach(() => {
  if (previous === undefined) {
    delete process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES;
  } else {
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = previous;
  }
});

describe("R72 expansion source-image route", () => {
  it("stays closed by default and rejects foreign hosts", async () => {
    delete process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES;
    expect((await GET(makeRequest("california-nebula"),
      context("california-nebula"))).status).toBe(404);
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = "1";
    const foreign = new Request(
      "https://example.com/api/atlas/mainline-a-r72-source/california-nebula",
      { headers: { host: "example.com" } });
    expect((await GET(foreign, context("california-nebula"))).status)
      .toBe(404);
  });

  it("refuses all five rights-blocked images even when local review is enabled", async () => {
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = "1";
    for (const id of ["ring-nebula", "dumbbell-nebula",
      "bubble-nebula", "cats-eye-nebula", "omega-nebula"])
      expect((await GET(makeRequest(id), context(id))).status).toBe(404);
    expect((await GET(makeRequest("../private"),
      context("../private"))).status).toBe(404);
  });

  it("serves only the SHA-pinned California candidate with hold headers", async () => {
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = "1";
    const response = await GET(makeRequest("california-nebula"),
      context("california-nebula"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-mainline-a-review-only"))
      .toBe("candidate-hold");
    expect(response.headers.get("x-mainline-a-rights")).toBe("pending");
    expect(response.headers.get("x-scientific-payload-writeback"))
      .toBe("false");
    expect(response.headers.get("x-nasa-id")).toBe("PIA23650");
    expect(response.headers.get("x-artifact-sha256"))
      .toBe(overlayJson.rows[2].imageRaw?.sha256);
    expect((await response.arrayBuffer()).byteLength)
      .toBe(overlayJson.rows[2].imageRaw?.bytes);
  });
});
