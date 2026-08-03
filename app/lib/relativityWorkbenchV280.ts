export const RELATIVITY_WORKBENCH_V280_VERSION = "v280-relativity-research-workbench" as const;

export type RelativityWorkbenchTabV280 =
  | "weak-field-reference"
  | "kerr-geodesics"
  | "observer-tetrad"
  | "ray-image"
  | "error-budget"
  | "campaign-evidence";

export type RelativityWorkbenchScenarioV280 = {
  version: typeof RELATIVITY_WORKBENCH_V280_VERSION;
  tab: RelativityWorkbenchTabV280;
  kernel: "legacy-eih-1pn" | "barycentric-nbody-eih-1pn-v276" | "v277-corrected-kerr-optics";
  spinA: number;
  observerRadiusM: number;
  observerThetaRad: number;
  renderMode: "science" | "cinematic";
  campaignId: string | null;
  artifactSha256: string | null;
};

export type RelativityWorkbenchJobStateV280 = {
  status: "idle" | "queued" | "running" | "complete" | "failed" | "unavailable";
  progress: number;
  source: "immutable-artifact" | "bounded-preview-worker" | "webgpu-shadow" | "none";
  error: string | null;
  noArbitraryCodeExecution: true;
};

export function createDefaultRelativityWorkbenchScenarioV280(): RelativityWorkbenchScenarioV280 {
  return {
    version: RELATIVITY_WORKBENCH_V280_VERSION,
    tab: "weak-field-reference",
    kernel: "legacy-eih-1pn",
    spinA: 0.9,
    observerRadiusM: 50,
    observerThetaRad: Math.PI * 0.39,
    renderMode: "science",
    campaignId: null,
    artifactSha256: null,
  };
}

export function normalizeRelativityWorkbenchScenarioV280(
  input: Partial<RelativityWorkbenchScenarioV280> = {},
): RelativityWorkbenchScenarioV280 {
  const base = createDefaultRelativityWorkbenchScenarioV280();
  return {
    ...base,
    ...input,
    spinA: Math.max(-0.998, Math.min(0.998, input.spinA ?? base.spinA)),
    observerRadiusM: Math.max(3, input.observerRadiusM ?? base.observerRadiusM),
    observerThetaRad: Math.max(1e-6, Math.min(Math.PI - 1e-6, input.observerThetaRad ?? base.observerThetaRad)),
    artifactSha256: /^[a-f0-9]{64}$/.test(input.artifactSha256 ?? "") ? input.artifactSha256! : null,
  };
}

export function createWorkbenchProvenanceV280(args: {
  scenario: RelativityWorkbenchScenarioV280;
  v276EvidenceSha256: string | null;
  v277EvidenceSha256: string | null;
  v278EvidenceSha256: string | null;
}) {
  return {
    version: RELATIVITY_WORKBENCH_V280_VERSION,
    scenario: args.scenario,
    references: {
      v276: args.v276EvidenceSha256,
      v277: args.v277EvidenceSha256,
      v278: args.v278EvidenceSha256,
    },
    defaultKernel: "legacy-eih-1pn" as const,
    scienceStatus: "science-failed-shadow-retained" as const,
    surveyCompleteness: "unavailable" as const,
    boundary: "read-only-artifact-and-bounded-preview-no-arbitrary-code-or-runtime-physics-promotion" as const,
  };
}
