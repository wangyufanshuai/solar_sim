import type { KerrProductUncertaintyEligibilitySummaryV513 } from "./kerrProductUncertaintyEligibilityV513";

export const KERR_UNCERTAINTY_VISUAL_PROFILE_ID_V514 =
  "science-cinematic-v7r1-v514" as const;
export type KerrUncertaintyVisualModeV514 = "science" | "cinematic";
export type KerrUncertaintyStatusV514 =
  | "qualified"
  | "validation-only"
  | "unavailable"
  | "unquantified"
  | "not-run";

export type KerrUncertaintyVisualStatusTokenV514 = Readonly<{
  ink: string;
  border: string;
  wash: string;
  marker: "circle" | "diamond" | "bar" | "triangle" | "square";
  borderPattern: "solid" | "double" | "dashed" | "dotted" | "dash-dot";
  glowOpacity: number;
}>;

export type KerrUncertaintyVisualProfileV514 = Readonly<{
  id: typeof KERR_UNCERTAINTY_VISUAL_PROFILE_ID_V514;
  mode: KerrUncertaintyVisualModeV514;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  railOpacity: number;
  status: Readonly<Record<KerrUncertaintyStatusV514, KerrUncertaintyVisualStatusTokenV514>>;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    animationDrivenByUncertainty: false;
    numericStyleInputCount: 0;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

export type KerrUncertaintyVisualRowV514 = Readonly<{
  id: string;
  status: KerrUncertaintyStatusV514;
  applicability: string;
  displayMaximum: string;
  reason: string;
  styleKey: KerrUncertaintyStatusV514;
  marker: KerrUncertaintyVisualStatusTokenV514["marker"];
  borderPattern: KerrUncertaintyVisualStatusTokenV514["borderPattern"];
  confidenceInterpretationAllowed: false;
}>;

export type KerrUncertaintyVisualEncodingV514 = Readonly<{
  version: "v514-kerr-uncertainty-visual-encoding-v1";
  profileId: typeof KERR_UNCERTAINTY_VISUAL_PROFILE_ID_V514;
  mode: KerrUncertaintyVisualModeV514;
  scientificPayloadKey: string;
  rowCount: 9;
  rows: readonly KerrUncertaintyVisualRowV514[];
  numericStyleInputCount: 0;
  scientificFieldMutation: false;
  uncertaintyDrivesColor: false;
  uncertaintyDrivesBloom: false;
  uncertaintyDrivesExposure: false;
  uncertaintyDrivesAnimation: false;
}>;

const statusScience = Object.freeze({
  qualified: Object.freeze({ ink: "#93f4ff", border: "#4bdbe8", wash: "rgba(75,219,232,.08)", marker: "circle" as const, borderPattern: "solid" as const, glowOpacity: 0.12 }),
  "validation-only": Object.freeze({ ink: "#d8c7ff", border: "#9b87f5", wash: "rgba(155,135,245,.07)", marker: "diamond" as const, borderPattern: "double" as const, glowOpacity: 0.08 }),
  unavailable: Object.freeze({ ink: "#ffcf8b", border: "#f3a950", wash: "rgba(243,169,80,.06)", marker: "bar" as const, borderPattern: "dashed" as const, glowOpacity: 0.04 }),
  unquantified: Object.freeze({ ink: "#ff9fae", border: "#ef7184", wash: "rgba(239,113,132,.06)", marker: "triangle" as const, borderPattern: "dash-dot" as const, glowOpacity: 0.04 }),
  "not-run": Object.freeze({ ink: "#a8b3c2", border: "#667386", wash: "rgba(102,115,134,.05)", marker: "square" as const, borderPattern: "dotted" as const, glowOpacity: 0 }),
}) satisfies Readonly<Record<KerrUncertaintyStatusV514, KerrUncertaintyVisualStatusTokenV514>>;
const statusCinematic = Object.freeze({
  qualified: Object.freeze({ ...statusScience.qualified, ink: "#fff0c9", border: "#ffc66d", wash: "rgba(255,198,109,.10)", glowOpacity: 0.22 }),
  "validation-only": Object.freeze({ ...statusScience["validation-only"], ink: "#eadbff", border: "#c6a5ff", wash: "rgba(198,165,255,.09)", glowOpacity: 0.16 }),
  unavailable: Object.freeze({ ...statusScience.unavailable, ink: "#ffb98e", border: "#f58a5a", wash: "rgba(245,138,90,.08)", glowOpacity: 0.1 }),
  unquantified: Object.freeze({ ...statusScience.unquantified, ink: "#ff9eb5", border: "#fb6f92", wash: "rgba(251,111,146,.08)", glowOpacity: 0.12 }),
  "not-run": Object.freeze({ ...statusScience["not-run"], ink: "#bdc4cf", border: "#7b8798", wash: "rgba(123,135,152,.06)", glowOpacity: 0.04 }),
}) satisfies Readonly<Record<KerrUncertaintyStatusV514, KerrUncertaintyVisualStatusTokenV514>>;

const science: KerrUncertaintyVisualProfileV514 = Object.freeze({
  id: KERR_UNCERTAINTY_VISUAL_PROFILE_ID_V514,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#030a0d",
  panelRaised: "#071116",
  ink: "#dffcff",
  muted: "#78929a",
  grid: "rgba(105,229,240,.08)",
  railOpacity: 0.72,
  status: statusScience,
  scienceBoundary: Object.freeze({ linearDisplay: true, bloomIntensity: 0, colorGradeIntensity: 0, animationDrivenByUncertainty: false, numericStyleInputCount: 0, scientificFieldMutation: false }),
  cinematicSeed: null,
});
const cinematic: KerrUncertaintyVisualProfileV514 = Object.freeze({
  id: KERR_UNCERTAINTY_VISUAL_PROFILE_ID_V514,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#0d0807",
  panelRaised: "#15100d",
  ink: "#fff1d5",
  muted: "#aa9074",
  grid: "rgba(255,190,105,.075)",
  railOpacity: 0.58,
  status: statusCinematic,
  scienceBoundary: Object.freeze({ linearDisplay: false, bloomIntensity: 0.16, colorGradeIntensity: 0.1, animationDrivenByUncertainty: false, numericStyleInputCount: 0, scientificFieldMutation: false }),
  cinematicSeed: "orbit-atlas-v514-uncertainty-cinematic-seed-01",
});

export const resolveKerrUncertaintyVisualProfileV514 = (
  mode: KerrUncertaintyVisualModeV514,
): KerrUncertaintyVisualProfileV514 => (mode === "science" ? science : cinematic);

export function createKerrUncertaintyVisualEncodingV514(
  summary: KerrProductUncertaintyEligibilitySummaryV513,
  mode: KerrUncertaintyVisualModeV514,
): KerrUncertaintyVisualEncodingV514 {
  if (summary.layers.length !== 9 || !/^[a-f0-9]{64}$/.test(summary.artifactSha256)) {
    throw new Error("v514-uncertainty-source-boundary");
  }
  const profile = resolveKerrUncertaintyVisualProfileV514(mode);
  const rows = summary.layers.map((layer) => {
    const token = profile.status[layer.status];
    return Object.freeze({
      id: layer.id,
      status: layer.status,
      applicability: layer.applicability,
      displayMaximum: layer.maximumRelative === null ? "unavailable" : layer.maximumRelative.toExponential(4),
      reason: layer.reason,
      styleKey: layer.status,
      marker: token.marker,
      borderPattern: token.borderPattern,
      confidenceInterpretationAllowed: false as const,
    });
  });
  return Object.freeze({
    version: "v514-kerr-uncertainty-visual-encoding-v1",
    profileId: KERR_UNCERTAINTY_VISUAL_PROFILE_ID_V514,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    rowCount: 9,
    rows: Object.freeze(rows),
    numericStyleInputCount: 0,
    scientificFieldMutation: false,
    uncertaintyDrivesColor: false,
    uncertaintyDrivesBloom: false,
    uncertaintyDrivesExposure: false,
    uncertaintyDrivesAnimation: false,
  });
}

export function compareKerrUncertaintyVisualEncodingsV514(
  scienceEncoding: KerrUncertaintyVisualEncodingV514,
  cinematicEncoding: KerrUncertaintyVisualEncodingV514,
) {
  const sameScientificRows = scienceEncoding.rows.every((row, index) => {
    const other = cinematicEncoding.rows[index];
    return row.id === other?.id && row.status === other.status && row.applicability === other.applicability && row.displayMaximum === other.displayMaximum && row.reason === other.reason;
  });
  if (
    scienceEncoding.mode !== "science" ||
    cinematicEncoding.mode !== "cinematic" ||
    scienceEncoding.scientificPayloadKey !== cinematicEncoding.scientificPayloadKey ||
    !sameScientificRows ||
    scienceEncoding.numericStyleInputCount !== 0 ||
    cinematicEncoding.numericStyleInputCount !== 0
  ) throw new Error("v514-science-cinematic-data-boundary");
  return Object.freeze({
    scientificPayloadStable: true as const,
    scientificRowsStable: true as const,
    numericStyleInputCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}
