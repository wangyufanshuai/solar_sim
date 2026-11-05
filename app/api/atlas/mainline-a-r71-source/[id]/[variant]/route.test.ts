import { afterEach, describe, expect, it } from "vitest";
import overlayJson from "../../../../../data/mainlineANebulaR71SourceV658.generated.json";
import { GET } from "./route";

const previous = process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES;
const makeRequest = (id: string, host = "127.0.0.1:3095") =>
  new Request(`http://${host}/api/atlas/mainline-a-r71-source/${id}/image`, {
    headers: { host },
  });
const context = (id: string, variant = "image") => ({
  params: Promise.resolve({ id, variant }),
});

afterEach(() => {
  if (previous === undefined) {
    delete process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES;
  } else {
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = previous;
  }
});

describe("R71 local source-image route", () => {
  it("stays closed by default and on foreign origins", async () => {
    delete process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES;
    expect((await GET(makeRequest("w40-nebula"),
      context("w40-nebula"))).status).toBe(404);
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = "1";
    const remote = new Request(
      "https://example.com/api/atlas/mainline-a-r71-source/w40-nebula/image",
      { headers: { host: "example.com" } });
    expect((await GET(remote, context("w40-nebula"))).status).toBe(404);
    expect((await GET(makeRequest("w40-nebula"),
      context("w40-nebula", "science-payload"))).status).toBe(404);
  });

  it("serves only pinned bytes with candidate-only and pending-rights headers", async () => {
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = "1";
    const response = await GET(makeRequest("w40-nebula"),
      context("w40-nebula"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-mainline-a-review-only"))
      .toBe("candidate-hold");
    expect(response.headers.get("x-mainline-a-rights")).toBe("pending");
    expect(response.headers.get("x-scientific-payload-writeback"))
      .toBe("false");
    expect(response.headers.get("x-artifact-sha256"))
      .toBe(overlayJson.rows[0].imageRaw?.sha256);
    expect((await response.arrayBuffer()).byteLength)
      .toBe(overlayJson.rows[0].imageRaw?.bytes);
    expect((await GET(makeRequest("../private"),
      context("../private"))).status).toBe(404);
  });
});
