/* v250 Evidence Ledger domain: workbench. */
import type { EvidenceClaim } from "../simulationDiagnosticsTypes";
import { createPassport, formula, metric, withPassport } from "./shared";
import type { EvidenceClaimWithoutPassport } from "./shared";

export function orbitVisualClaim(args: {
  orbitAtlasProfile: string;
  orbitAtlasRenderer: string;
  orbitAtlasReady: boolean;
  presentationMode: string;
}): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "orbit-visual-profile",
    group: "orbit-visual-layer",
    title: "Orbit Atlas visual layer",
    status: "informational",
    confidence: "visual",
    source: "Orbit Atlas presentation constants",
    model: `${args.orbitAtlasProfile} / ${args.orbitAtlasRenderer}`,
    metric: `${args.presentationMode}; atlas readiness ${args.orbitAtlasReady ? "ready" : "loading/fallback"}`,
    error: "No scientific error budget; this is the cold-body presentation renderer.",
    boundary: "Visual guide only. Live dynamics, validation diagnostics, and Kerr geodesics stay separate.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Orbit Atlas presentation constants",
        `profile=${args.orbitAtlasProfile}`,
        `renderer=${args.orbitAtlasRenderer}`,
      ],
      method: "Cold-body Universe Sandbox style renderer; it presents orbits and layers without becoming the dynamics source.",
      metrics: [
        metric("presentation-mode", "Presentation mode", args.presentationMode, claim.status),
        metric("profile", "Profile / renderer", `${args.orbitAtlasProfile} / ${args.orbitAtlasRenderer}`, claim.status),
        metric("readiness", "Atlas readiness", args.orbitAtlasReady ? "ready" : "loading/fallback", claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: this layer is deterministic UI presentation, while scientific validation is reported by separate diagnostics.",
      assumptions: [
        "Orbit Atlas v12 remains the presentation profile.",
        "The cold-body renderer is allowed to simplify appearance for legibility.",
      ],
      limitations: [
        "No physical error budget is assigned to the visual renderer.",
        "It is not a replacement for live N-body state, Horizons validation, Gaia catalog rows, or Kerr geodesic tracks.",
      ],
      relatedViews: ["evidence-ledger", "orbit-analysis", "telemetry"],
    }),
  );
}


export function missionCapsuleClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "mission-capsule-reproducibility",
    group: "mission-capsule-reproducibility",
    title: "Mission Capsule reproducibility",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Mission Capsule v27 local URL hash / JSON export",
    model: "Deterministic UI/session provenance capsule",
    metric: "Stores presentation, layer toggles, selections, pins/recents, workflow context, and Kerr Lab UI parameters.",
    error: "No physical error budget; capsule restore is UI/session state reproducibility only.",
    boundary: "Not a simulation data archive, not a Horizons refresh, not telemetry storage, and not a scientific publication archive.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Mission Hub v26 local session state",
        "Mission Capsule v27 deterministic serializer/parser",
        "URL hash payload or exported JSON file",
        "Evidence Ledger provenance statement",
      ],
      method:
        "Serialize only compact, reproducible Atlas UI state into a local JSON capsule and restore it against the current Navigator, Evidence, Workflow, Catalog, and Kerr Lab indexes.",
      formulas: [
        formula(
          "capsule-round-trip",
          "Deterministic capsule round trip",
          "restore(parse(serialize(capsule))) -> UI/session state",
          "stable ids, layer toggles, selected panels, Mission Hub pins/recents, Kerr Lab controls",
          "Local browser reproducibility for Atlas navigation and provenance, not physics replay.",
        ),
      ],
      metrics: [
        metric("capsule-version", "Capsule version", "v27-mission-capsules", "informational"),
        metric("saved-state", "Saved state categories", "presentation, view settings, selections, pins, recents, workflow, Kerr Lab UI", "informational"),
        metric("excluded-state", "Excluded state", "physics buffers, ephemeris arrays, telemetry samples, screenshots, large catalogs", "informational"),
        metric("restore-boundary", "Restore boundary", "readable warnings for invalid or stale ids", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: capsule round trips are deterministic and restore is validated against local stable indexes before applying UI state.",
      assumptions: [
        "Capsule ids refer to the same local Atlas build or a compatible future build.",
        "URL hash payloads remain browser-local and are never uploaded by the app.",
        "JSON export is the fallback when a URL hash would be impractically large.",
      ],
      limitations: [
        "Does not store live N-body buffers, ephemeris arrays, telemetry series, or screenshots.",
        "Does not refresh external validation data.",
        "Does not guarantee scientific archival completeness.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function scientificReportClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-report-dossier",
    group: "scientific-report-dossier",
    title: "Report Studio evidence dossier",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Report Studio v29 / Scientific Report v28 exporter",
    model: "Template-controlled deterministic evidence dossier over Mission Capsule, Mission Hub and Evidence Ledger",
    metric:
      "Exports selected sections as Markdown, JSON or self-contained printable HTML.",
    error: "No physical error budget; report is provenance/session documentation only.",
    boundary:
      "Not a scientific publication archive, not telemetry export, not ephemeris storage, not PDF generation, and not an external publishing pipeline.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Evidence Ledger v21 claim passports",
        "Object Passport v23 selected catalog target",
        "Mission Hub v26 session context",
        "Mission Capsule v27 reproducible UI state",
        "Scientific Report v28 summary serializer",
        "Report Studio v29 template and section controls",
      ],
      method:
        "Create a deterministic report summary from local Atlas provenance surfaces, apply a fixed template/section selection, then serialize it as readable Markdown, machine-readable JSON or self-contained printable HTML.",
      formulas: [
        formula(
          "report-serialization",
          "Deterministic report export",
          "report = serialize(template, sections, createReport(capsule, missionHub, evidence, object, workflow, kerr))",
          "Template id, included section ids, Mission Capsule, Mission Hub summary, Evidence Ledger summary, selected Object Passport, Workflow context, Kerr Lab parameters",
          "UI/session and evidence provenance only; no physics replay or data archival claim.",
        ),
      ],
      metrics: [
        metric("report-version", "Report version", "v28-scientific-report", "informational"),
        metric("studio-version", "Studio version", "v29-report-studio", "informational"),
        metric("export-formats", "Export formats", "Markdown, JSON and self-contained printable HTML", "informational"),
        metric(
          "templates",
          "Templates",
          "mission-dossier, evidence-audit, object-brief, relativity-lab-brief, catalog-provenance",
          "informational",
        ),
        metric(
          "included-surfaces",
          "Included surfaces",
          "Mission Capsule, Mission Hub, Evidence Ledger, Object Passport, Workflows, Kerr Lab",
          "informational",
        ),
        metric(
          "excluded-state",
          "Excluded state",
          "physics buffers, telemetry samples, ephemeris arrays, screenshots, large catalog rows",
          "informational",
        ),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the report is generated by pure deterministic helpers from existing local provenance summaries.",
      assumptions: [
        "The current Atlas build exposes stable local ids for claims, objects, workflows and panels.",
        "Markdown, JSON and printable HTML exports are intended for review and reproducible provenance, not publication-grade archives.",
      ],
      limitations: [
        "Does not store live N-body buffers, ephemeris arrays, telemetry series, screenshots or full catalog rows.",
        "Does not refresh JPL Horizons, Gaia, Planck, SIMBAD or VizieR data.",
        "Does not produce PDF in v29.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function validationConsoleClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "validation-console-readiness",
    group: "validation-console-readiness",
    title: "Validation Console trust matrix",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Validation Console v30 local status matrix",
    model: "Read-only aggregation of Evidence Ledger, Mission Hub, Mission Capsule, Report Studio, Navigator and Workflows",
    metric:
      "Displays ready, pending, failed and informational domains with blocker/warning/info issue counts.",
    error: "No physical error budget; the console summarizes current local provenance state only.",
    boundary:
      "Not a scientific accuracy score, not a certification system, not an online validation service, and not a new physics model.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Evidence Ledger v21 claim passports",
        "Mission Hub v26 current context",
        "Mission Capsule v27 restore summary",
        "Report Studio v29 template state",
        "Navigator v24 and Workflows v25 local indexes",
        "Validation Console v30 status matrix",
      ],
      method:
        "Aggregate existing local provenance summaries into a conservative status matrix and issue list without assigning a numerical trust score.",
      formulas: [
        formula(
          "status-matrix",
          "Conservative readiness matrix",
          "status = failed if any domain failed; else pending if any domain pending; else ready/informational",
          "Evidence claims, capsule warnings, report section state, navigator/workflow availability and current UI context",
          "Product readiness/provenance review only; not scientific accuracy scoring.",
        ),
      ],
      metrics: [
        metric("console-version", "Console version", "v30-validation-console", "informational"),
        metric("status-model", "Status model", "ready / pending / failed / informational", "informational"),
        metric("issue-model", "Issue model", "blocker / warning / info", "informational"),
        metric("trust-score", "Trust score", "not generated", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the console derives counts and issues from deterministic local summaries and intentionally avoids a single trust score.",
      assumptions: [
        "The console reads the current local Atlas session state.",
        "Evidence Ledger claim ids, Navigator item ids and Workflow ids are stable within the build.",
      ],
      limitations: [
        "Does not rerun JPL Horizons, Gaia, Planck, FRW or Kerr validation.",
        "Does not fetch online data or certify scientific publication readiness.",
        "Does not change solar-system dynamics or Kerr geodesic integration.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function observatoryDeckClaim(): EvidenceClaim {
  const claim: EvidenceClaimWithoutPassport = {
    id: "observatory-deck-workbench",
    group: "observatory-deck-workbench",
    title: "Atlas Observatory Deck workbench",
    status: "informational",
    confidence: "formula-checked",
    source: "Atlas Observatory Deck v31 local control workbench",
    model:
      "Four-zone UI orchestration over Mission Hub, Validation Console, Workflows, Report Studio and Evidence Ledger",
    metric:
      "Displays Current target, Trust matrix, Mission path and Report/export zones with existing Navigator actions.",
    error:
      "No physical error budget; Observatory Deck summarizes local UI/provenance state only.",
    boundary:
      "Not a new validation run, not online search, not a physics model, not an N-body body creator, and not a replacement for the underlying panels.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Navigator v24 action index",
        "Workflows v25 guided mission paths",
        "Mission Hub v26 session memory",
        "Mission Capsule v27 restore state",
        "Report Studio v29 export state",
        "Validation Console v30 status matrix",
        "Observatory Deck v31 four-zone control workbench",
      ],
      method:
        "Aggregate existing local Atlas summaries into four deterministic workbench zones and route every button through existing Navigator, Workflow or panel action handlers.",
      formulas: [
        formula(
          "deck-zones",
          "Deterministic four-zone deck",
          "deck = zones(currentTarget, trustMatrix, missionPath, reportExport)",
          "Mission Hub summary, Validation Console summary, Report Studio summary, Navigator index, Workflow summary, Evidence Ledger summary, selected ids, Kerr Lab UI parameters",
          "UI orchestration and provenance review only; no new physics, data download or validation refresh.",
        ),
      ],
      metrics: [
        metric("deck-version", "Deck version", "v31-observatory-deck", "informational"),
        metric("zone-count", "Workbench zones", "4: target / trust / mission / report", "informational"),
        metric("action-routing", "Action routing", "Navigator and Workflow executors reused", "informational"),
        metric(
          "included-surfaces",
          "Included surfaces",
          "Mission Hub, Validation Console, Report Studio, Workflows, Evidence Ledger, Kerr Lab UI parameters",
          "informational",
        ),
        metric(
          "excluded-behavior",
          "Excluded behavior",
          "no physics mutation, online validation, catalog download, body creation, trust score or default screen takeover",
          "informational",
        ),
      ],
      confidenceRationale:
        "Formula-checked at the product layer: the deck is generated by pure deterministic aggregation and intentionally reuses existing action routers.",
      assumptions: [
        "Navigator item ids, workflow ids and evidence claim ids stay stable within the current build.",
        "The deck is opened explicitly and does not replace the Sandbox or Orbit Atlas first screen.",
      ],
      limitations: [
        "Does not rerun JPL Horizons, Gaia, FRW, Kerr or catalog validation.",
        "Does not create physical bodies or change EIH 1PN solar-system dynamics.",
        "Does not replace the detailed Evidence Ledger, Mission Hub, Validation Console or Report Studio panels.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}
