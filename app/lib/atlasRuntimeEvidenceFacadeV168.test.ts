import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CURRENT_ATLAS_PRODUCT_RELEASE_V167 } from "./atlasProductReleaseV167";
import {
  ATLAS_RUNTIME_EVIDENCE_FACADE_V168_VERSION,
  ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168,
  BROWSER_OPERATIONS_KEYS,
  EXPERIENCE_KEYS,
  INTERACTION_RUNTIME_KEYS,
  MODERN_RUNTIME_KEYS,
  RELEASE_OPERATIONS_KEYS,
  SCIENCE_GATE_KEYS,
  VISUAL_KEYS,
  createAtlasRuntimeEvidenceRootAttributesV168,
  type AtlasRuntimeEvidenceFacadeV168Input,
} from "./atlasRuntimeEvidenceFacadeV168";

function sentinelValues<Keys extends readonly string[]>(keys: Keys): readonly string[] {
  return keys.map((key) => `sentinel:${key}`);
}

describe("v168 runtime evidence facade", () => {
  it("locks the complete ordered v167 controller root attribute contract", () => {
    expect(ATLAS_RUNTIME_EVIDENCE_FACADE_V168_VERSION).toBe("v168-runtime-evidence-facade");
    expect(ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168).toHaveLength(603);
    expect(new Set(ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168).size).toBe(603);
    expect(ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168[0]).toBe("data-presentation");
    expect(ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168.at(-1)).toBe("data-atlas-presentation-transform");
    expect(createHash("sha256")
      .update(ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168.join("\n"))
      .digest("hex"))
      .toBe("ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867");
  });

  it("zips every typed evidence group without dropping or renaming keys", () => {
    const input = {
      visual: sentinelValues(VISUAL_KEYS),
      experience: sentinelValues(EXPERIENCE_KEYS),
      scienceGate: sentinelValues(SCIENCE_GATE_KEYS),
      releaseOperations: sentinelValues(RELEASE_OPERATIONS_KEYS),
      browserOperations: sentinelValues(BROWSER_OPERATIONS_KEYS),
      interactionRuntime: sentinelValues(INTERACTION_RUNTIME_KEYS),
      modernRuntime: sentinelValues(MODERN_RUNTIME_KEYS),
    } as unknown as AtlasRuntimeEvidenceFacadeV168Input;

    const attributes = createAtlasRuntimeEvidenceRootAttributesV168(input);
    expect(Object.keys(attributes)).toEqual(ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168);
    for (const key of ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168) {
      expect(attributes[key]).toBe(`sentinel:${key}`);
    }
  });

  it("retains the v166/v167 product and scientific boundary on AtlasAppShell", () => {
    const shell = readFileSync("app/components/AtlasAppShell.tsx", "utf8");
    expect(CURRENT_ATLAS_PRODUCT_RELEASE_V167).toMatchObject({
      version: "v167-product-release-evidence-closure",
      predecessorVersion: "v160-v166-extreme-visual-runtime-convergence",
      releaseStatus: "product-rc-verified-science-shadow-retained",
      productReleaseStatus: "verified-web-standalone-release-candidate",
      scientificPromotionStatus: "shadow-retained-no-demonstrated-improvement",
      defaultScientificKernel: "legacy-eih-1pn",
      shadowScientificKernel: "eih-1pn-2pn-lt",
      promotionApplied: false,
    });
    expect(shell).toContain("data-atlas-extreme-release={CURRENT_RELEASE.version}");
    expect(shell).toContain("data-atlas-product-release-status={CURRENT_RELEASE.productReleaseStatus}");
    expect(shell).toContain("data-atlas-scientific-promotion-status={CURRENT_RELEASE.scientificPromotionStatus}");
    expect(shell).toContain("data-atlas-extreme-release-default-kernel={CURRENT_RELEASE.defaultScientificKernel}");
    expect(shell).toContain("data-atlas-scientific-shadow-kernel={CURRENT_RELEASE.shadowScientificKernel}");
  });

  it("keeps one root spread, one scene Canvas, and the Browser ROOT selector", () => {
    const controller = readFileSync("app/UniverseRuntimeController.tsx", "utf8");
    const host = readFileSync("app/components/AtlasSceneHost.tsx", "utf8");
    const browser = readFileSync("tests/atlas-browser/atlas-browser-acceptance.spec.ts", "utf8");
    const shellOpening = controller.slice(
      controller.indexOf("<AtlasAppShell"),
      controller.indexOf(">", controller.indexOf("<AtlasAppShell")) + 1,
    );

    expect(shellOpening).toContain("{...rootAttributes}");
    expect(shellOpening).not.toContain("data-atlas-");
    expect(controller.match(/<AtlasSceneHost/g)).toHaveLength(1);
    expect(host.match(/<UniverseCanvas/g)).toHaveLength(1);
    expect(browser).toContain(
      `const ROOT_SELECTOR = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';`,
    );
  });
});
