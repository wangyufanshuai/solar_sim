import { describe, expect, it } from "vitest";
import {
  AtlasApiPayloadTooLargeV270,
  atlasBoundedTextV270,
  atlasUtf8ByteLengthV270,
  readAtlasRequestTextV270,
  readAtlasResponseJsonV270,
} from "./atlasApiSecurityV270";

describe("v270 bounded API security helpers", () => {
  it("rejects declared and streamed bodies beyond the cap", async () => {
    await expect(readAtlasRequestTextV270(new Request("http://atlas.test", {
      method: "POST",
      headers: { "content-length": "9" },
      body: "{}",
    }), 8)).rejects.toBeInstanceOf(AtlasApiPayloadTooLargeV270);
    await expect(readAtlasRequestTextV270(new Request("http://atlas.test", {
      method: "POST",
      body: "123456789",
    }), 8)).rejects.toBeInstanceOf(AtlasApiPayloadTooLargeV270);
  });

  it("decodes bounded JSON and keeps UTF-8 accounting deterministic", async () => {
    await expect(readAtlasResponseJsonV270(new Response('{"ok":true}'), 32)).resolves.toEqual({ ok: true });
    expect(atlasUtf8ByteLengthV270("天")).toBe(3);
    expect(atlasBoundedTextV270("  observatory  ", 5)).toBe("obser");
  });
});
