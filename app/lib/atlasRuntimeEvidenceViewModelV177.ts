import {
  ATLAS_RUNTIME_EVIDENCE_FACADE_V168_VERSION,
  ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168,
  createAtlasRuntimeEvidenceRootAttributesV168,
  type AtlasRuntimeEvidenceFacadeV168Input,
  type AtlasRuntimeEvidenceRootAttributesV168,
} from "./atlasRuntimeEvidenceFacadeV168";

export const ATLAS_RUNTIME_EVIDENCE_VIEW_MODEL_V177_VERSION =
  "v177-runtime-evidence-view-model" as const;

export type AtlasRuntimeEvidenceViewModelV177 = {
  version: typeof ATLAS_RUNTIME_EVIDENCE_VIEW_MODEL_V177_VERSION;
  facadeVersion: typeof ATLAS_RUNTIME_EVIDENCE_FACADE_V168_VERSION;
  rootAttributeCount: number;
  rootAttributes: AtlasRuntimeEvidenceRootAttributesV168;
};

const EVIDENCE_GROUPS = [
  "visual",
  "experience",
  "scienceGate",
  "releaseOperations",
  "browserOperations",
  "interactionRuntime",
  "modernRuntime",
] as const satisfies readonly (keyof AtlasRuntimeEvidenceFacadeV168Input)[];

let previousInput: AtlasRuntimeEvidenceFacadeV168Input | null = null;
let previousViewModel: AtlasRuntimeEvidenceViewModelV177 | null = null;

function evidenceInputsEqual(
  left: AtlasRuntimeEvidenceFacadeV168Input,
  right: AtlasRuntimeEvidenceFacadeV168Input,
): boolean {
  for (const group of EVIDENCE_GROUPS) {
    const leftValues = left[group];
    const rightValues = right[group];
    if (leftValues.length !== rightValues.length) return false;
    for (let index = 0; index < leftValues.length; index += 1) {
      if (!Object.is(leftValues[index], rightValues[index])) return false;
    }
  }
  return true;
}

/**
 * Runtime-facing evidence seam. The v168 facade remains the frozen ordered
 * compatibility contract; this view model keeps the controller concerned
 * only with dynamic values and gives report/panel code a compact descriptor.
 */
export function createAtlasRuntimeEvidenceViewModelV177(
  input: AtlasRuntimeEvidenceFacadeV168Input,
): AtlasRuntimeEvidenceViewModelV177 {
  if (previousInput && previousViewModel && evidenceInputsEqual(previousInput, input)) {
    return previousViewModel;
  }
  const viewModel: AtlasRuntimeEvidenceViewModelV177 = {
    version: ATLAS_RUNTIME_EVIDENCE_VIEW_MODEL_V177_VERSION,
    facadeVersion: ATLAS_RUNTIME_EVIDENCE_FACADE_V168_VERSION,
    rootAttributeCount: ATLAS_RUNTIME_EVIDENCE_ROOT_KEYS_V168.length,
    rootAttributes: createAtlasRuntimeEvidenceRootAttributesV168(input),
  };
  previousInput = input;
  previousViewModel = viewModel;
  return viewModel;
}
