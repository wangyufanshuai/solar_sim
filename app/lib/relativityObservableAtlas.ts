import {
  KERR_RELATIVITY_STUDIO_BOUNDARY,
  KERR_RELATIVITY_STUDIO_VERSION,
  createKerrRelativityStudioSummary,
} from "./kerrRelativityStudio";
import {
  MERCURY_GR_TARGET_ARCSEC_PER_CENTURY,
  SOLAR_LIMB_DEFLECTION_TARGET_ARCSEC,
} from "./relativityValidation";
import type {
  EvidenceClaimStatus,
  KerrRelativityStudioSummary,
  RelativityObservableAtlasSummary,
  RelativityObservableAtlasVersion,
  RelativityObservableExplainerCard,
  RelativityObservableExplainerSummary,
  RelativityObservableExplainerVersion,
  RelativityObservableKind,
  RelativityObservableRow,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";

export const RELATIVITY_OBSERVABLE_ATLAS_VERSION: RelativityObservableAtlasVersion =
  "v37-relativity-observable-atlas";

export const RELATIVITY_OBSERVABLE_ATLAS_BOUNDARY =
  "Read-only formula-backed observable atlas over existing weak-field diagnostics and Kerr Studio summaries; not a physics integrator, not full numerical relativity, not an Einstein field-equation solver, not cosmological N-body, and not online astronomy database validation.";

export const RELATIVITY_OBSERVABLE_EXPLAINER_VERSION: RelativityObservableExplainerVersion =
  "v39-relativity-observable-explainer";

export const RELATIVITY_OBSERVABLE_EXPLAINER_BOUNDARY =
  "Read-only derivation cards over the existing v37 observable rows; local explanation metadata only, not scientific certification, not full numerical relativity, not an Einstein field-equation solver, not cosmological N-body, not online validation, and not a physics mutation.";

export type CreateRelativityObservableAtlasSummaryArgs = {
  diagnostics?: SimulationDiagnostics | null;
  kerrStudioSummary?: KerrRelativityStudioSummary | null;
};

export type CreateRelativityObservableExplainerSummaryArgs =
  CreateRelativityObservableAtlasSummaryArgs & {
    observableAtlasSummary?: RelativityObservableAtlasSummary | null;
  };

export function createRelativityObservableAtlasSummary({
  diagnostics = null,
  kerrStudioSummary = null,
}: CreateRelativityObservableAtlasSummaryArgs = {}): RelativityObservableAtlasSummary {
  const relativity = diagnostics?.relativityValidation ?? null;
  const kerr = kerrStudioSummary ?? createKerrRelativityStudioSummary();
  const rows: readonly RelativityObservableRow[] = [
    observableRow({
      id: "mercury-perihelion-advance",
      kind: "weak-field",
      title: "Mercury perihelion advance",
      formula: "Delta omega = 6*pi*GM/(a(1-e^2)c^2)",
      measuredValue: formatFixed(
        relativity?.mercuryPrecession.onePnArcsecPerCentury,
        2,
        " arcsec/century",
      ),
      referenceValue: `${formatFixed(
        relativity?.mercuryPrecession.targetArcsecPerCentury ??
          MERCURY_GR_TARGET_ARCSEC_PER_CENTURY,
        2,
        "",
      )} arcsec/century`,
      source: "Relativity Validation weak-field diagnostics",
      confidence: "formula-checked",
      status:
        relativity?.mercuryPrecession.status === "ready" &&
        relativity.mercuryPrecession.onePnArcsecPerCentury != null
          ? "ready"
          : "pending",
      scaleBand: "weak-field-precision",
      scaleNote:
        "Small accumulated solar-system correction: precision observable, not visible orbit reshaping.",
      boundary:
        "Analytic 1PN weak-field check from existing diagnostics; no SolarSystemIntegrator or EIH 1PN mutation.",
    }),
    observableRow({
      id: "solar-limb-light-deflection",
      kind: "weak-field",
      title: "Solar-limb light deflection",
      formula: "alpha = 4GM/(c^2 b)",
      measuredValue: formatFixed(relativity?.lightDeflection.formulaArcsec, 3, " arcsec"),
      referenceValue: `${formatFixed(
        relativity?.lightDeflection.targetArcsec ?? SOLAR_LIMB_DEFLECTION_TARGET_ARCSEC,
        3,
        "",
      )} arcsec`,
      source: "Relativity Validation solar-limb formula check",
      confidence: "formula-checked",
      status: relativity?.lightDeflection.status === "ready" ? "ready" : "pending",
      scaleBand: "weak-field-precision",
      scaleNote:
        "Weak-field null-path reference near the solar limb; angle-scale teaching cue only.",
      boundary:
        "Weak-field closed-form light deflection reference only; not ray-traced full numerical relativity.",
    }),
    observableRow({
      id: "shapiro-radar-delay",
      kind: "weak-field",
      title: "Shapiro radar delay",
      formula: "Delta t = 2GM/c^3 ln((rE+rT+R)/(rE+rT-R))",
      measuredValue: formatFixed(relativity?.shapiroDelay.microseconds, 2, " microseconds"),
      referenceValue: formatFixed(
        relativity?.shapiroDelay.formulaMicroseconds,
        2,
        " microseconds formula reference",
      ),
      source: "Relativity Validation radar-delay diagnostic",
      confidence: "formula-checked",
      status:
        relativity?.shapiroDelay.status === "ready" &&
        relativity.shapiroDelay.microseconds != null
          ? "ready"
          : "pending",
      scaleBand: "weak-field-precision",
      scaleNote:
        "Microsecond-scale weak-field light-time delay from local diagnostic geometry.",
      boundary:
        "Local weak-field delay diagnostic only; no online ephemeris refresh or radar observation ingest.",
    }),
    observableRow({
      id: "gravitational-kinematic-time-dilation",
      kind: "weak-field",
      title: "Gravitational/kinematic time dilation",
      formula: "d tau / dt ~= 1 + Phi/c^2 - v^2/(2c^2)",
      measuredValue: formatFixed(
        relativity?.timeDilation.gravitationalPlusKinematicUsPerDay,
        3,
        " microseconds/day",
      ),
      referenceValue: relativity?.timeDilation.bodyId
        ? `selected body ${relativity.timeDilation.bodyId}`
        : "selected-body weak-field clock reference",
      source: "Relativity Validation clock-rate diagnostic",
      confidence: "formula-checked",
      status:
        relativity?.timeDilation.status === "ready" &&
        relativity.timeDilation.gravitationalPlusKinematicUsPerDay != null
          ? "ready"
          : "pending",
      scaleBand: "weak-field-precision",
      scaleNote:
        "Daily clock-rate scale from potential plus kinetic terms; local selected-body cue only.",
      boundary:
        "Weak-field clock-rate explanation over selected local body diagnostics; not precision timing certification.",
    }),
    observableRow({
      id: "kerr-null-probe-4m-over-b",
      kind: "strong-field",
      title: "Kerr null-probe 4M/b",
      formula: "alpha_weak ~= 4M/b",
      measuredValue: kerr.weakFieldReference,
      referenceValue: `b/M ${formatFixed(kerr.impactParameterM, 2, "")}; weak-field reference`,
      source: `${KERR_RELATIVITY_STUDIO_VERSION} / eih-1pn+kerr-geodesic-v17`,
      confidence: "formula-checked",
      status: "ready",
      scaleBand: "strong-field-geometry",
      scaleNote:
        "Impact-parameter scale for the Kerr null-probe lab; geodesic teaching context.",
      boundary: `${KERR_RELATIVITY_STUDIO_BOUNDARY}; ${kerr.trustedBoundary}`,
    }),
    observableRow({
      id: "kerr-isco-split",
      kind: "strong-field",
      title: "Kerr ISCO split",
      formula: "Delta r_ISCO = r_retrograde - r_prograde",
      measuredValue: `${formatFixed(kerr.iscoSplitM, 3, "")}M`,
      referenceValue: `prograde ${formatFixed(kerr.progradeIscoRadiusM, 3, "")}M; retrograde ${formatFixed(kerr.retrogradeIscoRadiusM, 3, "")}M`,
      source: `${KERR_RELATIVITY_STUDIO_VERSION} / ${KERR_RELATIVITY_STUDIO_BOUNDARY}`,
      confidence: "formula-checked",
      status: "ready",
      scaleBand: "strong-field-geometry",
      scaleNote:
        "Spin-dependent orbital-geometry scale in mass units; independent from solar-system 1PN.",
      boundary:
        "Kerr test-particle geodesic lab observable; independent from solar-system EIH 1PN dynamics.",
    }),
    observableRow({
      id: "kerr-hamiltonian-drift",
      kind: "numerical-health",
      title: "Kerr Hamiltonian drift",
      formula: "max |H - H_target| along sampled geodesics",
      measuredValue: formatExponential(kerr.maxHamiltonianDrift, 2),
      referenceValue: "numerical stability metric; not an astrophysical observable",
      source: `${KERR_RELATIVITY_STUDIO_VERSION} numerical-health summary`,
      confidence: "formula-checked",
      status: "informational",
      scaleBand: "numerical-health-boundary",
      scaleNote:
        "Solver-health magnitude for displayed tracks only; not a physical observable.",
      boundary:
        "Numerical health only; not an astrophysical observable, not a new physics claim, and not a mutation of the Kerr kernel.",
    }),
  ];
  const readyCount = rows.filter((row) => row.status === "ready").length;
  return {
    version: RELATIVITY_OBSERVABLE_ATLAS_VERSION,
    status: summaryStatus(rows),
    observableCount: rows.length,
    readyCount,
    weakFieldCount: countKind(rows, "weak-field"),
    strongFieldCount: countKind(rows, "strong-field"),
    numericalHealthCount: countKind(rows, "numerical-health"),
    boundary: RELATIVITY_OBSERVABLE_ATLAS_BOUNDARY,
    rows,
  };
}

export function createRelativityObservableExplainerSummary({
  diagnostics = null,
  kerrStudioSummary = null,
  observableAtlasSummary = null,
}: CreateRelativityObservableExplainerSummaryArgs = {}): RelativityObservableExplainerSummary {
  const atlas =
    observableAtlasSummary ??
    createRelativityObservableAtlasSummary({
      diagnostics,
      kerrStudioSummary,
    });
  const cards = atlas.rows.map((row) => explainerCard(row));
  return {
    version: RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
    status: summaryStatus(cards),
    cardCount: cards.length,
    totalStepCount: cards.reduce((sum, card) => sum + card.derivationSteps.length, 0),
    totalVariableCount: cards.reduce((sum, card) => sum + card.variables.length, 0),
    boundary: RELATIVITY_OBSERVABLE_EXPLAINER_BOUNDARY,
    cards,
  };
}

function observableRow(row: RelativityObservableRow): RelativityObservableRow {
  return row;
}

function summaryStatus(rows: readonly { status: EvidenceClaimStatus }[]): EvidenceClaimStatus {
  if (rows.some((row) => row.status === "failed")) return "failed";
  if (rows.some((row) => row.status === "pending")) return "pending";
  if (rows.some((row) => row.status === "ready")) return "ready";
  return "informational";
}

function explainerCard(row: RelativityObservableRow): RelativityObservableExplainerCard {
  switch (row.id) {
    case "mercury-perihelion-advance":
      return card(row, {
        formulaTitle: "1PN bound-orbit perihelion advance",
        variables: [
          variable("Delta omega", "perihelion advance", "arcsec/century", "Accumulated shift of Mercury's closest approach direction.", "v37 Mercury weak-field row"),
          variable("GM", "solar gravitational parameter", "m^3/s^2", "Central solar mass parameter used by the local weak-field diagnostic.", "Relativity Validation diagnostics"),
          variable("a", "semimajor axis", "m", "Mercury orbital scale in the analytic 1PN reference.", "Local osculating-state diagnostic"),
          variable("e", "eccentricity", "unitless", "Orbit shape factor that amplifies the precession through 1 - e^2.", "Local osculating-state diagnostic"),
          variable("c", "speed of light", "m/s", "Relativistic scale that suppresses the correction.", "Physical constant"),
        ],
        derivationSteps: [
          step("orbit-scale", "Start from the weak-field bound orbit", "Use the local osculating semimajor axis and eccentricity as the orbit geometry for the analytic 1PN reference."),
          step("pn-correction", "Apply the 1PN correction term", "The Schwarzschild weak-field correction adds a small precession proportional to GM/(a(1-e^2)c^2) per orbit."),
          step("accumulate", "Convert per-orbit shift to century scale", "The local diagnostic reports the accumulated precession as arcseconds per century so it can be compared with the standard Mercury target."),
          step("compare", "Compare local row value to reference", `The row currently reports ${row.measuredValue} against ${row.referenceValue}.`),
        ],
        scaleInterpretation:
          "The effect is tiny on each orbit but accumulates to about 43 arcseconds per century, making it a weak-field precision observable rather than a visible orbital reshaping.",
        applicability:
          "Applies to bound weak-field solar orbits represented by local diagnostics. It is not a new integration step and does not alter EIH 1PN dynamics.",
      });
    case "solar-limb-light-deflection":
      return card(row, {
        formulaTitle: "Weak-field solar-limb light bending",
        variables: [
          variable("alpha", "deflection angle", "arcsec or rad", "Apparent angular bend for a ray passing near the Sun.", "v37 light-deflection row"),
          variable("GM", "solar gravitational parameter", "m^3/s^2", "Mass scale that bends the null path in the weak-field formula.", "Relativity Validation diagnostics"),
          variable("b", "impact parameter", "m or solar radii", "Closest approach distance of the light path; solar-limb reference uses b near one solar radius.", "Solar-limb formula check"),
          variable("c", "speed of light", "m/s", "Relativistic scale in the denominator.", "Physical constant"),
        ],
        derivationSteps: [
          step("impact", "Choose the limb impact parameter", "Use the local solar-limb reference where the ray passes at approximately one solar radius."),
          step("weak-field", "Use the GR weak-field coefficient", "The factor 4GM/(c^2 b) is the GR result for the leading-order deflection, twice the Newtonian-style half coefficient."),
          step("angle", "Convert to angular display units", "The formula value is displayed in arcseconds because the effect is small for solar-system geometry."),
          step("compare", "Bind explanation to the row value", `The row currently reports ${row.measuredValue} against ${row.referenceValue}.`),
        ],
        scaleInterpretation:
          "The solar-limb reference is roughly 1.75 arcseconds, large enough for classic eclipse tests but still far below naked-eye angular resolution.",
        applicability:
          "Applies only to the closed-form weak-field solar-limb reference. It is not a ray-traced strong-field image or full numerical relativity.",
      });
    case "shapiro-radar-delay":
      return card(row, {
        formulaTitle: "Weak-field logarithmic radar time delay",
        variables: [
          variable("Delta t", "extra light-time", "microseconds", "Round-trip or path-dependent delay from solar gravitational potential.", "v37 Shapiro row"),
          variable("GM", "solar gravitational parameter", "m^3/s^2", "Solar mass parameter in the logarithmic delay scale.", "Relativity Validation diagnostics"),
          variable("rE", "observer range", "m", "Observer distance from the Sun in the local diagnostic geometry.", "Radar-delay diagnostic"),
          variable("rT", "target range", "m", "Target distance from the Sun in the local diagnostic geometry.", "Radar-delay diagnostic"),
          variable("R", "observer-target separation", "m", "Baseline between observer and target.", "Radar-delay diagnostic"),
          variable("c", "speed of light", "m/s", "Converts geometric path delay into time.", "Physical constant"),
        ],
        derivationSteps: [
          step("geometry", "Set observer-target geometry", "Use the existing diagnostic's observer range, target range and baseline rather than fetching a fresh ephemeris."),
          step("log-term", "Evaluate the logarithmic path factor", "The logarithm grows as the ray path approaches solar conjunction geometry."),
          step("time-scale", "Apply the solar mass time scale", "The 2GM/c^3 coefficient converts the dimensionless logarithmic factor into seconds."),
          step("compare", "Display in microseconds", `The row currently reports ${row.measuredValue} with ${row.referenceValue}.`),
        ],
        scaleInterpretation:
          "The delay is a microsecond-scale timing effect, meaningful for radar ranging and spacecraft navigation but not a visible spatial displacement in the scene.",
        applicability:
          "Applies to the local weak-field radar-delay diagnostic only. It does not ingest observations or refresh online ephemerides.",
      });
    case "gravitational-kinematic-time-dilation":
      return card(row, {
        formulaTitle: "Weak-field clock-rate approximation",
        variables: [
          variable("d tau / dt", "proper-time ratio", "unitless", "Clock-rate ratio between the moving local body frame and coordinate time.", "v37 clock-rate row"),
          variable("Phi", "gravitational potential", "m^2/s^2", "Weak gravitational potential at the selected body.", "Relativity Validation diagnostics"),
          variable("v", "orbital speed", "m/s", "Kinematic contribution from local body motion.", "Relativity Validation diagnostics"),
          variable("c", "speed of light", "m/s", "Relativistic scale for both gravitational and kinematic terms.", "Physical constant"),
        ],
        derivationSteps: [
          step("potential", "Start with weak gravitational potential", "Use Phi/c^2 as the first-order gravitational clock-rate contribution."),
          step("kinematic", "Subtract the special-relativistic speed term", "The v^2/(2c^2) term captures kinematic time dilation in the weak-field approximation."),
          step("combine", "Combine the two small corrections", "The row reports the combined gravitational plus kinematic offset as microseconds per day."),
          step("compare", "Bind to selected-body diagnostic", `The row currently reports ${row.measuredValue}; reference context is ${row.referenceValue}.`),
        ],
        scaleInterpretation:
          "The displayed microseconds-per-day scale is small but operationally important for precision timing and navigation systems.",
        applicability:
          "Applies to local weak-field body diagnostics. It is not a precision timing certification or a general relativistic clock solver.",
      });
    case "kerr-null-probe-4m-over-b":
      return card(row, {
        formulaTitle: "Kerr null-probe weak-field reference",
        variables: [
          variable("alpha_weak", "weak-field bend estimate", "rad", "Reference bend angle used to compare the Kerr probe scale.", "v35 Kerr Studio summary"),
          variable("M", "geometric mass unit", "M", "Black-hole mass unit used by the Kerr geodesic lab.", "Kerr Studio"),
          variable("b", "impact parameter", "M", "Null-probe impact parameter in mass units.", "Kerr Studio controls"),
          variable("a/M", "dimensionless spin", "unitless", "Kerr spin context for the visual geodesic lab.", "Kerr Studio controls"),
        ],
        derivationSteps: [
          step("probe", "Use the current null-probe setup", "Take the existing Kerr Studio impact parameter rather than creating a new ray-tracing run."),
          step("reference", "Compute the weak-field 4M/b estimate", "The estimate gives a scale reference for bending when the probe is not in the deepest strong-field region."),
          step("contrast", "Contrast with geodesic-lab behavior", "The Kerr Studio tracks remain the source for capture, scatter and frame-dragging behavior."),
          step("compare", "Bind to the current row", `The row currently reports ${row.measuredValue}; reference context is ${row.referenceValue}.`),
        ],
        scaleInterpretation:
          "The 4M/b value is a teaching reference for impact-parameter scale, not a replacement for the sampled Kerr geodesic tracks.",
        applicability:
          "Applies inside the v35 test-particle/null-geodesic lab boundary. It is not a full ray tracer or Einstein field-equation solver.",
      });
    case "kerr-isco-split":
      return card(row, {
        formulaTitle: "Kerr prograde/retrograde ISCO separation",
        variables: [
          variable("Delta r_ISCO", "ISCO split", "M", "Difference between retrograde and prograde innermost stable circular orbit radii.", "v35 Kerr Studio summary"),
          variable("r_prograde", "prograde ISCO radius", "M", "ISCO radius for orbit aligned with spin.", "Kerr Studio summary"),
          variable("r_retrograde", "retrograde ISCO radius", "M", "ISCO radius for orbit counter-aligned with spin.", "Kerr Studio summary"),
          variable("a/M", "dimensionless spin", "unitless", "Spin parameter that separates the two ISCO radii.", "Kerr Studio controls"),
        ],
        derivationSteps: [
          step("spin", "Read the current Kerr spin context", "The existing Studio summary supplies spin and the two ISCO radii."),
          step("radii", "Separate aligned and counter-aligned orbits", "Frame dragging moves the prograde ISCO inward and the retrograde ISCO outward."),
          step("difference", "Subtract the two radii", "The row displays r_retrograde - r_prograde as the ISCO split in M units."),
          step("compare", "Bind to the current row", `The row currently reports ${row.measuredValue}; component radii are ${row.referenceValue}.`),
        ],
        scaleInterpretation:
          "A larger split is a clear strong-field teaching cue for spin-dependent orbital structure in the local Kerr lab.",
        applicability:
          "Applies to the v35 Kerr test-particle geodesic summary only. It is independent from solar-system EIH 1PN dynamics.",
      });
    case "kerr-hamiltonian-drift":
      return card(row, {
        formulaTitle: "Kerr geodesic numerical-health drift",
        variables: [
          variable("H", "sampled Hamiltonian", "geometric units", "Hamiltonian value along sampled geodesic tracks.", "Kerr Studio numerical summary"),
          variable("H_target", "target Hamiltonian", "geometric units", "Expected null/timelike Hamiltonian class for the sampled track.", "Kerr geodesic kernel"),
          variable("max |H - H_target|", "maximum drift", "unitless", "Worst sampled deviation used as a stability cue.", "v35 Kerr Studio summary"),
          variable("samples", "track samples", "count", "Finite visualization samples used to summarize numerical health.", "Kerr Studio tracks"),
        ],
        derivationSteps: [
          step("target", "Choose the Hamiltonian target", "Use the existing geodesic class target from the Kerr validation/kernel summary."),
          step("sample", "Inspect sampled track values", "The Studio summary checks finite samples already produced for the local visual lab."),
          step("max", "Report the worst finite deviation", "The row shows the maximum absolute drift as a numerical stability indicator."),
          step("classify", "Keep it out of astrophysical observables", `The row currently reports ${row.measuredValue}; reference context is ${row.referenceValue}.`),
        ],
        scaleInterpretation:
          "Small drift supports visual-lab numerical stability, but it is not an observed astrophysical quantity.",
        applicability:
          "Numerical health only. It must not be presented as a physical observable, scientific certification or new Kerr physics claim.",
      });
  }
}

function card(
  row: RelativityObservableRow,
  details: Omit<
    RelativityObservableExplainerCard,
    "id" | "observableId" | "kind" | "title" | "formulaExpression" | "source" | "status" | "confidence" | "trustedBoundary"
  >,
): RelativityObservableExplainerCard {
  return {
    id: row.id,
    observableId: row.id,
    kind: row.kind,
    title: row.title,
    formulaExpression: row.formula,
    source: explainerSource(row),
    status: row.status,
    confidence: row.confidence,
    trustedBoundary: `${row.boundary} ${RELATIVITY_OBSERVABLE_EXPLAINER_BOUNDARY}`,
    ...details,
  };
}

function explainerSource(row: RelativityObservableRow): string {
  const kerrKernel = "eih-1pn+kerr-geodesic-v17";
  const kernelSuffix =
    row.id.startsWith("kerr-") && !row.source.includes(kerrKernel)
      ? ` / ${kerrKernel}`
      : "";
  return `${row.source}${kernelSuffix} / ${RELATIVITY_OBSERVABLE_EXPLAINER_VERSION}`;
}

function variable(
  symbol: string,
  label: string,
  unit: string,
  meaning: string,
  source: string,
): RelativityObservableExplainerCard["variables"][number] {
  return { symbol, label, unit, meaning, source };
}

function step(
  id: string,
  title: string,
  body: string,
): RelativityObservableExplainerCard["derivationSteps"][number] {
  return { id, title, body };
}

function countKind(
  rows: readonly RelativityObservableRow[],
  kind: RelativityObservableKind,
): number {
  return rows.filter((row) => row.kind === kind).length;
}

function formatFixed(
  value: number | null | undefined,
  digits: number,
  suffix: string,
): string {
  if (value == null || !Number.isFinite(value)) return "unavailable";
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}${suffix}`;
}

function formatExponential(value: number | null | undefined, digits: number): string {
  if (value == null || !Number.isFinite(value)) return "unavailable";
  return value.toExponential(digits);
}
