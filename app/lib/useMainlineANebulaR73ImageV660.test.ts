import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import catalogJson from "../data/mainlineANebulaR73CatalogV660.generated.json";
import { r73ImageRequestAllowedV660, retrieveR73ImageV660,
  sameR73LocalResponseV660 } from "./useMainlineANebulaR73ImageV660";
import type { R73CatalogV660, R73GalleryRowV660 } from
  "./mainlineANebulaR73CatalogV660";

const catalog = catalogJson as R73CatalogV660;
const origin = "http://127.0.0.1:3121";

function fakeResponse(row: R73GalleryRowV660, bytes: Buffer,
  changed: Record<string, string> = {}) {
  const asset = row.delivery!;
  const headers = new Headers({
    "content-type": asset.mimeType,
    "content-length": String(bytes.length),
    "x-mainline-a-review-only": "candidate-hold",
    "x-mainline-a-rights": "pending",
    "x-scientific-payload-writeback": "false",
    "x-artifact-sha256": asset.sha256,
    ...(row.cohort === "B1" || row.cohort === "B2"
      ? { "x-candidate-raw-sha256": row.rawEvidence.find((item) =>
        item.role === "candidate-raw")!.sha256 }
      : { "x-nasa-id": row.nasaId }),
    ...changed,
  });
  const response = new Response(new Uint8Array(bytes), { status: 200, headers });
  Object.defineProperty(response, "url", { configurable: true,
    value: `${origin}${asset.route}` });
  return response;
}

describe("R73 guarded image lifecycle request", () => {
  it("only permits the 19 registered local review routes", () => {
    expect(catalog.rows.filter(r73ImageRequestAllowedV660)).toHaveLength(19);
    expect(catalog.rows.filter((row) => !r73ImageRequestAllowedV660(row)))
      .toHaveLength(5);
    const held = catalog.rows.find((row) => row.id === "omega-nebula")!;
    expect(r73ImageRequestAllowedV660({ ...held,
      delivery: catalog.rows[20].delivery,
      imageState: "review-image" })).toBe(false);
  });

  it("rejects a foreign or redirected final URL", () => {
    const row = catalog.rows[0];
    const bytes = Buffer.alloc(128, 2);
    const response = fakeResponse(row, bytes);
    expect(sameR73LocalResponseV660(response, row.delivery!.route,
      origin)).toBe(true);
    Object.defineProperty(response, "url", { configurable: true,
      value: "https://example.invalid/image.webp" });
    expect(sameR73LocalResponseV660(response, row.delivery!.route,
      origin)).toBe(false);
  });

  it("does not issue any HTTP request for a policy-held item", async () => {
    const held = catalog.rows.find((row) => row.id === "ring-nebula")!;
    const fetcher = vi.fn();
    await expect(retrieveR73ImageV660(held,
      new AbortController().signal, fetcher as typeof fetch, origin))
      .rejects.toThrow("policy");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("checks response boundary and SHA before returning image bytes", async () => {
    const fixture = Buffer.alloc(128, 7);
    const hash = createHash("sha256").update(fixture).digest("hex");
    const original = catalog.rows[0];
    const row: R73GalleryRowV660 = { ...original,
      delivery: { ...original.delivery!, bytes: fixture.length, sha256: hash },
      rawEvidence: [...original.rawEvidence.slice(0, 3),
        { ...original.rawEvidence[3], bytes: fixture.length,
          sha256: hash }] };
    const response = fakeResponse(row, fixture);
    const fetcher = vi.fn(async () => response);
    const loaded = await retrieveR73ImageV660(row,
      new AbortController().signal, fetcher as typeof fetch, origin);
    expect(loaded.buffer.byteLength).toBe(fixture.length);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const broken = fakeResponse(row, fixture,
      { "x-scientific-payload-writeback": "true" });
    await expect(retrieveR73ImageV660(row,
      new AbortController().signal,
      vi.fn(async () => broken) as typeof fetch, origin))
      .rejects.toThrow("headers");
  });

  it("rejects a substituted payload even with an expected SHA header", async () => {
    const fixture = Buffer.alloc(128, 7);
    const original = catalog.rows[12];
    const row: R73GalleryRowV660 = { ...original,
      delivery: { ...original.delivery!, bytes: fixture.length } };
    await expect(retrieveR73ImageV660(row,
      new AbortController().signal,
      vi.fn(async () => fakeResponse(row, fixture)) as typeof fetch,
      origin)).rejects.toThrow("sha");
  });
});
