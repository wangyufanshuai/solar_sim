import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAINLINE_A_CURRENT_STARS } from "./mainlineAMetadataV607";

const receipt = JSON.parse(readFileSync(new URL("../../docs/release/v607/visuals/stellar-portraits-render.json", import.meta.url), "utf8")) as {
  objects: string[];
  image: { width: number; height: number; bytes: number; sha256: string };
  scope: string;
};

describe("Mainline A4 portrait render receipt", () => {
  it("binds the static contact sheet to the current twenty-star roster", () => {
    expect(receipt.objects).toEqual(MAINLINE_A_CURRENT_STARS.map((star) => star.id));
    expect(receipt.image.width).toBe(1160);
    expect(receipt.image.height).toBe(2632);
    expect(receipt.image.bytes).toBeGreaterThan(100000);
    expect(receipt.image.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.scope).toContain("not-browser");
  });
});
