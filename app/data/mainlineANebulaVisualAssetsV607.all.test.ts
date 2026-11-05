import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "./mainlineANebulaVisualAssetsV607.all.generated";
import { resolveMainlineANebulaSceneTargetV607 } from "../lib/mainlineANebulaSceneV607";

describe("Mainline A3 combined nebula registry", () => {
  it("contains the six original and six extension assets with exact local bytes", () => {
    expect(MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL).toHaveLength(12);
    expect(new Set(MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL.map((asset) => asset.objectId)).size).toBe(12);
    expect(MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL.reduce((sum, asset) => sum + asset.byteSize, 0)).toBe(3_324_626);
    for (const asset of MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL) {
      const bytes = readFileSync(new URL(`../../${asset.localPath}`, import.meta.url));
      expect(bytes.byteLength, asset.objectId).toBe(asset.byteSize);
      expect(createHash("sha256").update(bytes).digest("hex"), asset.objectId).toBe(asset.sha256);
      expect(asset.license).toBe("CC BY 4.0");
      expect(asset.rightsStatus).toBe("cleared");
      expect(asset.nakedEyeRepresentationClaimed).toBe(false);
    }
  });

  it("exposes extension records through the scene resolver", () => {
    for (const objectId of ["ngc7293", "ngc6543", "ngc2237", "ngc6960", "carina", "b33"]) {
      const target = resolveMainlineANebulaSceneTargetV607(`nebula:${objectId}`);
      expect(target?.asset.objectId).toBe(objectId);
      expect(target?.asset.rightsStatus).toBe("cleared");
    }
  });
});
