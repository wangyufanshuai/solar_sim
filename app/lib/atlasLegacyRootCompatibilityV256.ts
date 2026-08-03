import {
  createAtlasRuntimeEvidenceRootAttributesV190,
  type AtlasRuntimeEvidenceCompositionScopeV190,
} from "./atlasRuntimeEvidenceCompositionV190";
import {
  ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168,
  type AtlasRuntimeEvidenceRootAttributesV168,
} from "./atlasRuntimeEvidenceFacadeV168";

/**
 * The 603 DOM attributes are a frozen browser-compatibility snapshot. New
 * runtime/evidence state must use the v256 structured surface instead of
 * extending this contract.
 */
export const ATLAS_LEGACY_ROOT_COMPATIBILITY_V256 = {
  version: "v256-read-only-legacy-root-adapter",
  attributeCount: 603,
  keySha256: "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867",
  growthPolicy: "frozen-no-new-root-attributes",
} as const;

export type AtlasLegacyRootAttributesV256 =
  AtlasRuntimeEvidenceRootAttributesV168;

export function createAtlasLegacyRootAttributesV256(
  scope: AtlasRuntimeEvidenceCompositionScopeV190,
): AtlasLegacyRootAttributesV256 {
  return createAtlasRuntimeEvidenceRootAttributesV190(scope);
}

export function atlasLegacyRootKeysV256(): readonly string[] {
  return ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168;
}
