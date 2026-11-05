import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resetAtlasApiRateLimitsForTestsV270 } from "./atlasApiRateLimitV270";
import {
  atlasJsonResponseV275,
  atlasNotModifiedV275,
  consumeAtlasApiPolicyV275,
  readImmutableAtlasFileV275,
  resetAtlasImmutableFileCacheForTestsV275,
} from "./atlasApiPolicyV275";

afterEach(() => {
  resetAtlasApiRateLimitsForTestsV270();
  resetAtlasImmutableFileCacheForTestsV275();
});

describe("v275 unified API policy", () => {
  it("enforces service-specific response and rate limits", () => {
    expect(atlasJsonResponseV275("locations", { value: "x".repeat(300 * 1024) }).status).toBe(413);
    const request = new Request("http://atlas.test/api");
    for (let index = 0; index < 12; index += 1) expect(consumeAtlasApiPolicyV275(request, "weather")).toBeNull();
    expect(consumeAtlasApiPolicyV275(request, "weather")?.status).toBe(429);
  });

  it("loads immutable files asynchronously once and supports strong ETag revalidation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlas-v275-"));
    const path = join(directory, "fixture.bin");
    try {
      await writeFile(path, Buffer.from("immutable-atlas"));
      const first = await readImmutableAtlasFileV275(path, "openngc");
      const second = await readImmutableAtlasFileV275(path, "openngc");
      expect(second.bytes).toBe(first.bytes);
      expect(first.etag).toMatch(/^"sha256-/);
      expect(atlasNotModifiedV275(new Request("http://atlas.test", { headers: { "if-none-match": first.etag } }), first.etag)?.status).toBe(304);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
