import {
  DEFAULT_KERR_GEODESIC_RENDER_MODE,
  DEFAULT_KERR_IMPACT_PARAMETER_M,
  DEFAULT_KERR_ORBIT_PRESET_ID,
  KERR_ORBIT_PRESETS,
  createKerrGeodesicTrackSet,
} from "./kerrGeodesicVisualization";
import {
  createKerrGeodesicValidationSummary,
  kerrEquatorialIscoRadiusM,
  normalizeKerrImpactParameterM,
} from "./kerrGeodesicKernel";
import type {
  EvidenceClaimStatus,
  KerrGeodesicRenderMode,
  KerrGeodesicTrackSet,
  KerrOrbitPresetId,
  KerrRelativityStudioMetric,
  KerrRelativityStudioMode,
  KerrRelativityStudioSection,
  KerrRelativityStudioSummary,
  KerrRelativityStudioVersion,
  StrongFieldRelativityValidationSummary,
} from "./simulationDiagnosticsTypes";

export const KERR_RELATIVITY_STUDIO_VERSION: KerrRelativityStudioVersion =
  "v35-kerr-relativity-studio";
export const KERR_RELATIVITY_STUDIO_BOUNDARY =
  "test-particle-null-geodesic-lab" as const;

export type CreateKerrRelativityStudioSummaryArgs = {
  spinA?: number | null;
  impactParameterM?: number | null;
  presetId?: KerrOrbitPresetId | null;
  renderMode?: KerrGeodesicRenderMode | null;
  mode?: KerrRelativityStudioMode | null;
  trackSet?: KerrGeodesicTrackSet | null;
  validationSummary?: StrongFieldRelativityValidationSummary | null;
};

export function createKerrRelativityStudioSummary({
  spinA,
  impactParameterM,
  presetId,
  renderMode,
  mode,
  trackSet,
  validationSummary,
}: CreateKerrRelativityStudioSummaryArgs = {}): KerrRelativityStudioSummary {
  const normalizedPresetId = isKerrOrbitPresetId(presetId)
    ? presetId
    : DEFAULT_KERR_ORBIT_PRESET_ID;
  const preset = KERR_ORBIT_PRESETS.find((candidate) => candidate.id === normalizedPresetId);
  const normalizedSpinA = clampSpin(
    typeof spinA === "number" && Number.isFinite(spinA)
      ? spinA
      : preset?.spinA ?? 0.88,
  );
  const normalizedImpactParameterM = normalizeKerrImpactParameterM(
    typeof impactParameterM === "number" && Number.isFinite(impactParameterM)
      ? impactParameterM
      : preset?.impactParameterM ?? DEFAULT_KERR_IMPACT_PARAMETER_M,
  );
  const normalizedRenderMode = isKerrRenderMode(renderMode)
    ? renderMode
    : DEFAULT_KERR_GEODESIC_RENDER_MODE;
  const normalizedMode = isKerrRelativityStudioMode(mode) ? mode : "overview";
  const normalizedTrackSet =
    trackSet ??
    createKerrGeodesicTrackSet({
      spinA: normalizedSpinA,
      impactParameterM: normalizedImpactParameterM,
      presetId: normalizedPresetId,
    });
  const validation =
    validationSummary ??
    createKerrGeodesicValidationSummary({
      spinA: normalizedSpinA,
      impactParameterM: normalizedImpactParameterM,
      presetId: normalizedPresetId,
    });
  const progradeIscoRadiusM = finiteOr(
    validation.kerr.progradeIscoRadiusM,
    kerrEquatorialIscoRadiusM(normalizedSpinA, "prograde"),
  );
  const retrogradeIscoRadiusM = finiteOr(
    validation.kerr.retrogradeIscoRadiusM,
    kerrEquatorialIscoRadiusM(normalizedSpinA, "retrograde"),
  );
  const iscoSplitM = Math.max(0, retrogradeIscoRadiusM - progradeIscoRadiusM);
  const probe = normalizedTrackSet.probe ?? validation.probe;
  const maxHamiltonianDrift = maxFinite([
    normalizedTrackSet.maxHamiltonianConstraintAbs,
    validation.integration.nullHamiltonianDrift,
    validation.integration.timelikeHamiltonianDrift,
    validation.integration.probeHamiltonianDrift,
    probe.maxHamiltonianConstraintAbs,
  ]);
  const probeHamiltonianDrift = finiteOr(
    probe.maxHamiltonianConstraintAbs,
    validation.integration.probeHamiltonianDrift,
  );
  const weakFieldDeflectionRad = finiteOr(
    probe.weakFieldDeflectionRad,
    validation.weakFieldLightDeflection.formulaRad,
  );
  const weakFieldDeflectionArcsec = finiteOr(
    probe.weakFieldDeflectionArcsec,
    validation.weakFieldLightDeflection.formulaArcsec,
  );
  const radialRangeMinM = finiteOr(probe.radialRangeMinM, 0);
  const radialRangeMaxM = finiteOr(probe.radialRangeMaxM, 0);
  const probeStatus = probe.probeStatus ?? validation.integration.probeStatus;
  const sampleCount = Math.max(0, Math.round(finiteOr(probe.sampleCount, 0)));
  const trackCount = Math.max(0, Math.round(finiteOr(normalizedTrackSet.trackCount, 0)));
  const weakFieldReference = `4M/b = ${weakFieldDeflectionRad.toExponential(2)} rad (${weakFieldDeflectionArcsec.toFixed(1)} arcsec)`;
  const trustedBoundary =
    "Independent test-particle/null geodesic experiment deck. It is not full numerical relativity, not an Einstein field-equation solver, and it does not replace the solar-system EIH 1PN integrator.";

  const sections = studioSections({
    presetId: normalizedPresetId,
    spinA: normalizedSpinA,
    impactParameterM: normalizedImpactParameterM,
    renderMode: normalizedRenderMode,
    probeStatus,
    weakFieldReference,
    progradeIscoRadiusM,
    retrogradeIscoRadiusM,
    iscoSplitM,
    maxHamiltonianDrift,
    probeHamiltonianDrift,
    radialRangeMinM,
    radialRangeMaxM,
    trackCount,
    sampleCount,
    trustedBoundary,
    validationStatus: validation.status,
  });

  return {
    version: KERR_RELATIVITY_STUDIO_VERSION,
    mode: normalizedMode,
    presetId: normalizedPresetId,
    spinA: normalizedSpinA,
    impactParameterM: normalizedImpactParameterM,
    renderMode: normalizedRenderMode,
    probeStatus,
    weakFieldReference,
    weakFieldDeflectionRad,
    weakFieldDeflectionArcsec,
    progradeIscoRadiusM,
    retrogradeIscoRadiusM,
    iscoSplitM,
    maxHamiltonianDrift,
    probeHamiltonianDrift,
    radialRangeMinM,
    radialRangeMaxM,
    trackCount,
    sampleCount,
    boundary: KERR_RELATIVITY_STUDIO_BOUNDARY,
    trustedBoundary,
    sections,
  };
}

export function isKerrRelativityStudioMode(
  value: unknown,
): value is KerrRelativityStudioMode {
  return (
    value === "overview" ||
    value === "probe" ||
    value === "isco" ||
    value === "error" ||
    value === "boundary"
  );
}

function studioSections(args: {
  presetId: KerrOrbitPresetId;
  spinA: number;
  impactParameterM: number;
  renderMode: KerrGeodesicRenderMode;
  probeStatus: string;
  weakFieldReference: string;
  progradeIscoRadiusM: number;
  retrogradeIscoRadiusM: number;
  iscoSplitM: number;
  maxHamiltonianDrift: number;
  probeHamiltonianDrift: number;
  radialRangeMinM: number;
  radialRangeMaxM: number;
  trackCount: number;
  sampleCount: number;
  trustedBoundary: string;
  validationStatus: "ready" | "failed";
}): readonly KerrRelativityStudioSection[] {
  const status: EvidenceClaimStatus =
    args.validationStatus === "ready" ? "ready" : "failed";
  return [
    section(
      "overview",
      "Experiment overview",
      "Curated strong-field experiment deck over the existing Kerr geodesic tracks and weak-field reference.",
      [
        metric("preset", "Preset", args.presetId, status),
        metric("spin", "Spin a/M", args.spinA.toFixed(3), status),
        metric("render-mode", "Render mode", args.renderMode, "informational"),
        metric("track-count", "Visible geodesic tracks", String(args.trackCount), status),
      ],
    ),
    section(
      "probe",
      "Null probe",
      "The interactive null probe is driven by b/M and classified as capture, scatter or escape against the local geodesic result.",
      [
        metric("probe-status", "Probe status", args.probeStatus, status),
        metric("impact-parameter", "Impact parameter b/M", args.impactParameterM.toFixed(2), status),
        metric("weak-field-reference", "Weak-field 4M/b", args.weakFieldReference, status),
        metric(
          "radial-range",
          "Radial range",
          `${args.radialRangeMinM.toFixed(2)}-${args.radialRangeMaxM.toFixed(2)}M`,
          status,
        ),
        metric("sample-count", "Probe samples", String(args.sampleCount), status),
      ],
    ),
    section(
      "isco",
      "ISCO split",
      "Spin separates prograde and retrograde equatorial ISCO radii; the split is a readable frame-dragging cue.",
      [
        metric("isco-prograde", "Prograde ISCO", `${args.progradeIscoRadiusM.toFixed(3)}M`, status),
        metric("isco-retrograde", "Retrograde ISCO", `${args.retrogradeIscoRadiusM.toFixed(3)}M`, status),
        metric("isco-split", "ISCO split", `${args.iscoSplitM.toFixed(3)}M`, status),
      ],
    ),
    section(
      "error",
      "Error monitor",
      "Hamiltonian drift is exposed as the local numerical stability metric for the displayed geodesic tracks.",
      [
        metric("max-hamiltonian-drift", "Max Hamiltonian drift", args.maxHamiltonianDrift.toExponential(2), status),
        metric("probe-hamiltonian-drift", "Probe H drift", args.probeHamiltonianDrift.toExponential(2), status),
        metric("validation-status", "Validation status", args.validationStatus, status),
      ],
    ),
    section(
      "boundary",
      "Trusted boundary",
      args.trustedBoundary,
      [
        metric("boundary", "Boundary", KERR_RELATIVITY_STUDIO_BOUNDARY, "informational"),
        metric("solar-dynamics", "Solar dynamics", "EIH 1PN unchanged", "informational"),
        metric("claim", "Claim scope", "test-particle/null geodesic lab", "informational"),
      ],
    ),
  ];
}

function section(
  id: KerrRelativityStudioMode,
  title: string,
  body: string,
  metrics: readonly KerrRelativityStudioMetric[],
): KerrRelativityStudioSection {
  return { id, title, body, metrics };
}

function metric(
  id: string,
  label: string,
  value: string,
  status: EvidenceClaimStatus,
): KerrRelativityStudioMetric {
  return { id, label, value, status };
}

function isKerrOrbitPresetId(value: unknown): value is KerrOrbitPresetId {
  return KERR_ORBIT_PRESETS.some((preset) => preset.id === value);
}

function isKerrRenderMode(value: unknown): value is KerrGeodesicRenderMode {
  return value === "geodesic-tracks" || value === "teaching-particles" || value === "both";
}

function clampSpin(value: number): number {
  return Math.max(0, Math.min(0.998, value));
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function maxFinite(values: readonly number[]): number {
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length > 0 ? Math.max(...finite) : 0;
}
