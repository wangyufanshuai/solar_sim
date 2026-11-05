import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import source from "../data/mainlineAWebSkyAtlasV656.generated.json";
import {
  verifyWebSkyResponseV656, WebSkyLoadErrorV656,
} from "./useMainlineAWebSkyV656";

function responseFor(value: unknown, overrides: Record<string, string> = {}) {
  const bytes = Buffer.from(JSON.stringify(value));
  const hash = createHash("sha256").update(bytes).digest("hex");
  return new Response(bytes, { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(bytes.length),
    "Cache-Control": "private, no-store, max-age=0",
    "X-Artifact-SHA256": hash,
    "X-Mainline-A-Candidate-Only": "true",
    "X-Mainline-A-Admission": "hold",
    "X-Scientific-Payload-Writeback": "false",
    ...overrides,
  } });
}

async function category(response: Response) {
  try { await verifyWebSkyResponseV656(response); return null; }
  catch (error) {
    expect(error).toBeInstanceOf(WebSkyLoadErrorV656);
    return (error as WebSkyLoadErrorV656).category;
  }
}

describe("Mainline A V656 web sky response verifier", () => {
  it("accepts the candidate manifest only with byte and boundary pins", async () => {
    const verified = await verifyWebSkyResponseV656(responseFor(source));
    expect(verified.pack.counts).toMatchObject({ stars: 24,
      runtimeExisting: 20, candidateHold: 4, constellations: 12 });
    expect(verified.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a response marked as admitted or writable", async () => {
    expect(await category(responseFor(source,
      { "X-Mainline-A-Admission": "admitted" }))).toBe("boundary");
    expect(await category(responseFor(source,
      { "X-Scientific-Payload-Writeback": "true" }))).toBe("boundary");
  });

  it("rejects changed bytes even with a plausible JSON body", async () => {
    expect(await category(responseFor(source,
      { "X-Artifact-SHA256": "0".repeat(64) }))).toBe("sha");
    expect(await category(responseFor(source,
      { "Content-Length": "101" }))).toBe("bytes");
  });

  it("rejects forged roster state even when the response hash is recomputed", async () => {
    const forged = structuredClone(source);
    const hold = forged.stars.find((row) => row.id === "polaris")!;
    Object.assign(hold, { phase: "runtime-existing", canFocusScene: true,
      focusCatalogId: "stellar-hero:polaris" });
    expect(await category(responseFor(forged))).toBe("boundary");
  });

  it("rejects HTTP errors and incorrect media type", async () => {
    const error = new Response("unavailable", { status: 503 });
    expect(await category(error)).toBe("http");
    expect(await category(responseFor(source,
      { "Content-Type": "text/html" }))).toBe("type");
  });
});
