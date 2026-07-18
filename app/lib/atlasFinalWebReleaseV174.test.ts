import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ATLAS_FINAL_WEB_CAPABILITY_MATRIX,
  CURRENT_ATLAS_FINAL_WEB_RELEASE_V174,
} from "./atlasFinalWebReleaseV174";

describe("v174 final Web RC contract", () => {
  it("keeps the released scientific kernel and V2 shadow boundary", () => {
    expect(CURRENT_ATLAS_FINAL_WEB_RELEASE_V174.defaultScientificKernel).toBe("legacy-eih-1pn");
    expect(CURRENT_ATLAS_FINAL_WEB_RELEASE_V174.shadowScientificKernel).toBe("eih-1pn-2pn-lt");
    expect(CURRENT_ATLAS_FINAL_WEB_RELEASE_V174.promotionApplied).toBe(false);
  });

  it("publishes honest standalone and Lite capabilities", () => {
    expect(ATLAS_FINAL_WEB_CAPABILITY_MATRIX["standalone-full"].millionStarCatalog).toBe(true);
    expect(ATLAS_FINAL_WEB_CAPABILITY_MATRIX["vercel-lite"].interactiveAtlas).toBe(true);
    expect(ATLAS_FINAL_WEB_CAPABILITY_MATRIX["vercel-lite"].millionStarCatalog).toBe(false);
    expect(ATLAS_FINAL_WEB_CAPABILITY_MATRIX["vercel-lite"].fullObservationFixtures).toBe(false);
    expect(CURRENT_ATLAS_FINAL_WEB_RELEASE_V174.desktopInstallerReleased).toBe(false);
    expect(CURRENT_ATLAS_FINAL_WEB_RELEASE_V174.cloudDeploymentPerformed).toBe(false);
  });

  it("locks the verified Next 15 App Router renderer pairing", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    expect(packageJson.dependencies.next).toBe("15.5.18");
    expect(packageJson.dependencies.react).toBe("19.2.7");
    expect(packageJson.dependencies["react-dom"]).toBe("19.2.7");
    expect(packageJson.dependencies["@react-three/fiber"]).toBe("9.6.1");
    expect(packageJson.dependencies["@react-three/drei"]).toBe("10.7.7");
  });
});
