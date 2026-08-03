/* v250 Evidence Ledger domain: catalog. */
import type { GaiaCatalogSource } from "../../data/gaiaStarCatalog";
import { CELESTIAL_DEEP_SKY_NAVIGATION_VERSION, CELESTIAL_OBJECT_PASSPORT_VERSION, createCelestialCatalogSummary } from "../celestialCatalog";
import type { EvidenceClaim, EvidenceClaimStatus, SimulationDiagnostics } from "../simulationDiagnosticsTypes";
import { createPassport, formatNumber, formula, mapReadyFailedStatus, metric, withPassport } from "./shared";
import type { EvidenceClaimWithoutPassport } from "./shared";

export function gaiaCatalogClaim(gaiaCatalogSource: GaiaCatalogSource): EvidenceClaim {
  const backedByGaia = gaiaCatalogSource === "gaia-dr3";
  const status: EvidenceClaimStatus = backedByGaia ? "ready" : "informational";
  const claim: EvidenceClaimWithoutPassport = {
    id: "gaia-dr3-catalog",
    group: "gaia-catalog",
    title: "Gaia DR3 bright-star catalog",
    status,
    confidence: backedByGaia ? "catalog-backed" : "visual",
    source: backedByGaia ? "Gaia DR3 bright 5000 local-star catalog" : "Placeholder procedural star fallback",
    model: "RA/Dec/parallax to galactic 3D starfield with BP-RP color mapping",
    metric: backedByGaia ? "Bright 5000 Gaia DR3 source rows loaded" : "Placeholder stars active",
    error: backedByGaia
      ? "Catalog filtering uses finite parallax and RUWE quality gates."
      : "No catalog error claim in placeholder mode.",
    boundary: "Bright local starfield and source HUD. Not the full Gaia archive or a stellar population solver.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        backedByGaia ? "Gaia DR3 source table" : "procedural fallback star table",
        "bright 5000 starfield loader",
        "Gaia source HUD / body sidebar",
      ],
      method:
        "Map catalog RA/Dec/parallax into a local 3D starfield and use BP-RP color as the visible stellar color cue.",
      formulas: [
        formula(
          "parallax-distance",
          "Parallax distance estimate",
          "distance_pc = 1000 / parallax_mas",
          "positive finite parallax in milliarcseconds",
          "Local bright-star visualization after quality filtering.",
        ),
      ],
      metrics: [
        metric("catalog-source", "Catalog source", gaiaCatalogSource, status),
        metric("row-count", "Loaded rows", backedByGaia ? "bright 5000" : "placeholder fallback", status),
        metric("quality-gates", "Quality gates", backedByGaia ? "finite parallax + RUWE gates" : "not claimed", status),
      ],
      confidenceRationale: backedByGaia
        ? "Catalog-backed: visible star sources come from the packaged Gaia DR3 bright-star subset."
        : "Visual only: fallback stars carry no Gaia catalog-backed evidence claim.",
      assumptions: [
        "The packaged subset is intentionally bright and local for browser rendering.",
        "BP-RP color mapping is a presentation approximation.",
      ],
      limitations: [
        "Not the full Gaia archive.",
        "Not a stellar-evolution or survey-selection-function solver.",
      ],
      relatedViews: ["body-sidebar", "evidence-ledger"],
    }),
  );
}


export function celestialCatalogClaim(): EvidenceClaim {
  const summary = createCelestialCatalogSummary();
  const status: EvidenceClaimStatus =
    summary.qualityChecks.uniqueIds &&
    summary.qualityChecks.finiteCoordinates &&
    summary.qualityChecks.constellationCount === 88
      ? "ready"
      : "failed";
  const deepSkyCount =
    summary.kindBreakdown.nebula +
    summary.kindBreakdown["star-cluster"] +
    summary.kindBreakdown.galaxy +
    summary.kindBreakdown.pulsar;
  const sourceBreakdown = Object.entries(summary.sourceBreakdown)
    .map(([source, count]) => `${source} ${count}`)
    .join("; ");
  const kindBreakdown = Object.entries(summary.kindBreakdown)
    .map(([kind, count]) => `${kind} ${count}`)
    .join("; ");
  const qualityText = [
    `unique ids ${summary.qualityChecks.uniqueIds ? "pass" : "fail"}`,
    `finite coordinates ${summary.qualityChecks.finiteCoordinates ? "pass" : "fail"}`,
    `constellations ${summary.qualityChecks.constellationCount}/88`,
  ].join("; ");

  const claim: EvidenceClaimWithoutPassport = {
    id: "celestial-catalog-atlas",
    group: "celestial-catalog-atlas",
    title: "Celestial Catalog Atlas",
    status,
    confidence: "catalog-backed",
    source: "Curated Local v22, IAU constellation lines, Messier/NGC curated entries",
    model: "Presentation/navigation catalog in RA/Dec and Galactic coordinates",
    metric: `${summary.entryCount} entries; ${summary.qualityChecks.constellationCount} constellations; ${deepSkyCount} deep-sky objects`,
    error: `Quality checks: ${qualityText}. Entry values are static curated approximations.`,
    boundary: summary.trustedBoundary,
  };

  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "curated-local-v22 notable stars, galaxies, pulsars, nebulae and clusters",
        "IAU 88 constellation line metadata",
        "Messier/NGC curated deep-sky presentation entries",
        "Celestial Catalog Atlas browser and layer toggles",
        `${CELESTIAL_OBJECT_PASSPORT_VERSION} object drilldown`,
        `${CELESTIAL_DEEP_SKY_NAVIGATION_VERSION} selected-object focus and label-density layer`,
      ],
      method:
        "Aggregate curated local catalog rows into searchable navigation entries, deterministic object passports, and a v33 visual navigation layer with selected-object focus markers and bounded label density.",
      formulas: [
        formula(
          "equatorial-direction",
          "RA/Dec display direction",
          "unit = (cos(dec)*cos(ra), sin(dec), cos(dec)*sin(ra))",
          "right ascension ra and declination dec in J2000-style equatorial coordinates",
          "Camera focus and marker placement for catalog navigation.",
        ),
        formula(
          "galactic-conversion",
          "Galactic to equatorial conversion",
          "catalog l,b -> RA,Dec via fixed Galactic pole / node transform",
          "Galactic longitude l and latitude b",
          "Deep-sky presentation entries that are authored in Galactic coordinates.",
        ),
      ],
      metrics: [
        metric("entry-count", "Catalog entries", formatNumber(summary.entryCount, 0), status),
        metric("constellation-count", "IAU constellations", `${summary.qualityChecks.constellationCount}/88`, status),
        metric("deep-sky-count", "Deep-sky entries", formatNumber(deepSkyCount, 0), status),
        metric("kind-breakdown", "Kind breakdown", kindBreakdown, status),
        metric("source-breakdown", "Source breakdown", sourceBreakdown, status),
        metric("coordinate-frames", "Coordinate frames", summary.coordinateFrames.join(", "), status),
        metric("quality-checks", "Quality checks", qualityText, status),
        metric("object-passport-version", "Object passport drilldown", CELESTIAL_OBJECT_PASSPORT_VERSION, status),
        metric("deep-sky-navigation-version", "Deep-sky navigation layer", CELESTIAL_DEEP_SKY_NAVIGATION_VERSION, status),
        metric("catalog-expansion-v33", "v33 curated additions", "13 local deep-sky entries", status),
      ],
      confidenceRationale:
        "Catalog-backed for the local curated source chain and formula-checked for finite coordinate conversion; object passports inherit this claim but remain intentionally limited to a small presentation/navigation catalog.",
      assumptions: [
        "Curated local values are approximate static references for orientation and search.",
        "Constellation lines are used as navigation overlays, not as physical structures.",
        "Deep-sky objects are markers and labels only; they are not inserted into the SolarSystemIntegrator.",
        "Selected deep-sky focus rings and labels are presentation overlays only.",
      ],
      limitations: [
        "Not a complete SIMBAD or VizieR database.",
        "Not the full Gaia archive.",
        "Not a stellar, nebular, galactic, or cosmological evolution model.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function galacticDynamicsClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.galacticValidation;
  const status = mapReadyFailedStatus(validation?.status);
  const circularTarget = validation
    ? `${validation.localCircularVelocityTargetKmS[0]}-${validation.localCircularVelocityTargetKmS[1]} km/s`
    : "unavailable";
  const escapeTarget = validation
    ? `${validation.localEscapeVelocityTargetKmS[0]}-${validation.localEscapeVelocityTargetKmS[1]} km/s`
    : "unavailable";
  const claim: EvidenceClaimWithoutPassport = {
    id: "galactic-dynamics-validation",
    group: "galactic-dynamics",
    title: "Gaia DR3 galactic dynamics check",
    status,
    confidence: validation?.source === "gaia-dr3-kinematics" ? "catalog-backed" : "formula-checked",
    source: validation?.source === "gaia-dr3-kinematics" ? "Gaia DR3 kinematics 2000" : "Gaia kinematics validation pending",
    model: "Analytic Galactic potential with local velocity and rotation-curve diagnostics",
    metric: validation
      ? [
          `${validation.sampleCount} samples`,
          `v_c(R0) ${formatNumber(validation.circularVelocityAtR0KmS, 3, " km/s")}`,
          `v_esc(R0) ${formatNumber(validation.escapeSpeedAtR0KmS, 3, " km/s")}`,
        ].join("; ")
      : "Galactic diagnostics pending",
    error: validation
      ? validation.error ??
        `Targets v_c ${validation.localCircularVelocityTargetKmS[0]}-${validation.localCircularVelocityTargetKmS[1]} km/s; v_esc ${validation.localEscapeVelocityTargetKmS[0]}-${validation.localEscapeVelocityTargetKmS[1]} km/s.`
      : "Pending until the validation layer loads.",
    boundary: "Analytic potential validation and teaching diagnostics. Not a full galactic N-body simulation.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        validation?.source === "gaia-dr3-kinematics" ? "Gaia DR3 kinematics 2000" : "Gaia kinematics pending",
        "analytic Galactic potential validation",
        "Telemetry galactic diagnostics",
      ],
      method:
        "Use Gaia DR3 kinematic samples with an analytic Galactic potential to check local circular velocity, escape speed, and weak-field teaching values.",
      formulas: [
        formula(
          "circular-velocity",
          "Circular velocity",
          "v_c(R) = sqrt(R * dPhi/dR)",
          "Galactocentric radius R and analytic potential Phi",
          "Axisymmetric analytic-potential diagnostic near target radii.",
        ),
        formula(
          "escape-speed",
          "Escape speed",
          "v_esc(R) = sqrt(-2 * Phi(R))",
          "Analytic potential Phi with zero at infinity",
          "Teaching diagnostic, not a Milky Way mass-model fit.",
        ),
      ],
      metrics: [
        metric("sample-count", "Kinematic samples", formatNumber(validation?.sampleCount, 0), status),
        metric("vc-r0", "v_c(R0)", formatNumber(validation?.circularVelocityAtR0KmS, 3, " km/s"), status, circularTarget),
        metric("vesc-r0", "v_esc(R0)", formatNumber(validation?.escapeSpeedAtR0KmS, 3, " km/s"), status, escapeTarget),
        metric("median-speed", "Median speed", formatNumber(validation?.medianSpeedKmS, 3, " km/s"), status),
        metric("weak-field-clock", "Weak-field clock offset", formatNumber(validation?.weakFieldClockOffsetUsPerDay, 3, " us/day"), status),
      ],
      confidenceRationale:
        validation?.source === "gaia-dr3-kinematics"
          ? "Catalog-backed for sample input and formula-checked for the analytic-potential diagnostics."
          : "Formula-checked or pending until Gaia kinematics are available.",
      assumptions: [
        "The local sample is used as a validation and teaching set, not a full survey analysis.",
        "The analytic potential is fixed and deterministic.",
      ],
      limitations: [
        "Not a full galactic N-body simulation.",
        "Not a self-consistent Milky Way inference or cosmological structure-formation model.",
      ],
      relatedViews: ["telemetry", "evidence-ledger"],
    }),
  );
}
