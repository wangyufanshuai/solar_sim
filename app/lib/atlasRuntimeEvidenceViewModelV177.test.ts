import { describe, expect, it } from "vitest";
import {
  ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168,
  BROWSER_OPERATIONS_KEYS,
  EXPERIENCE_KEYS,
  INTERACTION_RUNTIME_KEYS,
  MODERN_RUNTIME_KEYS,
  RELEASE_OPERATIONS_KEYS,
  SCIENCE_GATE_KEYS,
  VISUAL_KEYS,
  type AtlasRuntimeEvidenceFacadeV168Input,
} from "./atlasRuntimeEvidenceFacadeV168";
import {
  ATLAS_RUNTIME_EVIDENCE_VIEW_MODEL_V177_VERSION,
  createAtlasRuntimeEvidenceViewModelV177,
} from "./atlasRuntimeEvidenceViewModelV177";

const sentinels = (keys: readonly string[]) => keys.map((key) => `v177:${key}`);

describe("v177 runtime evidence view model", () => {
  it("preserves every ordered v168 root attribute and value", () => {
    const input = {
      visual: sentinels(VISUAL_KEYS),
      experience: sentinels(EXPERIENCE_KEYS),
      scienceGate: sentinels(SCIENCE_GATE_KEYS),
      releaseOperations: sentinels(RELEASE_OPERATIONS_KEYS),
      browserOperations: sentinels(BROWSER_OPERATIONS_KEYS),
      interactionRuntime: sentinels(INTERACTION_RUNTIME_KEYS),
      modernRuntime: sentinels(MODERN_RUNTIME_KEYS),
    } as unknown as AtlasRuntimeEvidenceFacadeV168Input;
    const model = createAtlasRuntimeEvidenceViewModelV177(input);

    expect(model.version).toBe(ATLAS_RUNTIME_EVIDENCE_VIEW_MODEL_V177_VERSION);
    expect(model.facadeVersion).toBe("v168-runtime-evidence-facade");
    expect(model.rootAttributeCount).toBe(603);
    expect(Object.keys(model.rootAttributes)).toEqual(ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168);
    for (const key of ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168) {
      expect(model.rootAttributes[key]).toBe(`v177:${key}`);
    }
    const equalFreshInput = Object.fromEntries(
      Object.entries(input).map(([key, values]) => [key, [...values]]),
    ) as unknown as AtlasRuntimeEvidenceFacadeV168Input;
    expect(createAtlasRuntimeEvidenceViewModelV177(equalFreshInput)).toBe(model);
  });
});
