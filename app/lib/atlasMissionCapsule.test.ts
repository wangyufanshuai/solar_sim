import { describe, expect, it } from "vitest";
import { createAtlasNavigatorSummary } from "./atlasNavigator";
import {
  ATLAS_MISSION_CAPSULE_VERSION,
  createAtlasMissionCapsule,
  missionCapsuleToHash,
  parseAtlasMissionCapsule,
  restoreAtlasMissionCapsule,
  serializeAtlasMissionCapsule,
} from "./atlasMissionCapsule";
import { createAtlasWorkflowSummary } from "./atlasWorkflows";
import { createEvidenceLedgerSummary } from "./evidenceLedger";
import type { EvidenceLedgerSummary } from "./simulationDiagnosticsTypes";

describe("Atlas Mission Capsules v27", () => {
  it("round-trips deterministic compact session state", () => {
    const capsule = fixtureCapsule();
    const encoded = serializeAtlasMissionCapsule(capsule);
    const parsed = parseAtlasMissionCapsule(encoded);
    const parsedFromJson = parseAtlasMissionCapsule(JSON.stringify(capsule));

    expect(capsule.version).toBe(ATLAS_MISSION_CAPSULE_VERSION);
    expect(encoded).toBe(serializeAtlasMissionCapsule(capsule));
    expect(parsed.warnings).toEqual([]);
    expect(parsed.capsule).toEqual(capsule);
    expect(parsedFromJson.capsule).toEqual(capsule);
    expect(missionCapsuleToHash(capsule)).toBe(`#atlas-capsule=${encoded}`);
  });

  it("handles invalid json, malformed base64 and unsupported versions safely", () => {
    expect(parseAtlasMissionCapsule("{bad").warnings[0]).toEqual(
      expect.objectContaining({ code: "invalid-json" }),
    );
    expect(parseAtlasMissionCapsule("%%%").warnings[0]).toEqual(
      expect.objectContaining({ code: "invalid-base64" }),
    );
    expect(
      parseAtlasMissionCapsule(
        JSON.stringify({ ...fixtureCapsule(), version: "v99-future" }),
      ).warnings[0],
    ).toEqual(expect.objectContaining({ code: "unsupported-version" }));
  });

  it("reports stale ids without blocking valid restore fields", () => {
    const { navigatorSummary, workflowSummary } = baseSummaries();
    const capsule = {
      ...fixtureCapsule(),
      selected: {
        ...fixtureCapsule().selected,
        bodyId: "missing-body",
        catalogObjectId: "nearby-star:sirius",
        evidenceClaimId: "missing-claim",
      },
      missionHub: {
        recentActions: [{ id: "panel:missing", kind: "panel-action" as const, timestamp: 1 }],
        pinnedItems: fixtureCapsule().missionHub.pinnedItems,
      },
    };
    const summary = restoreAtlasMissionCapsule({
      capsule,
      source: "json-import",
      navigatorSummary,
      workflowSummary,
    });

    expect(summary.active).toBe(true);
    expect(summary.restoredCount).toBeGreaterThan(3);
    expect(summary.warningCount).toBeGreaterThanOrEqual(2);
    expect(summary.warnings.map((warning) => warning.code)).toContain("stale-id");
  });

  it("does not include physics buffers, telemetry, large catalogs or snapshots", () => {
    const json = JSON.stringify(fixtureCapsule());

    expect(json).not.toContain("posM");
    expect(json).not.toContain("velM");
    expect(json).not.toContain("telemetry");
    expect(json).not.toContain("gaiaRows");
    expect(json).not.toContain("ephemeris");
    expect(json).not.toContain("screenshot");
    expect(json.length).toBeLessThan(5000);
  });

  it("restores Kerr, selected evidence, selected catalog and Mission Hub pins", () => {
    const { navigatorSummary, workflowSummary } = baseSummaries();
    const capsule = fixtureCapsule();
    const parsed = parseAtlasMissionCapsule(serializeAtlasMissionCapsule(capsule));
    const summary = restoreAtlasMissionCapsule({
      capsule: parsed.capsule,
      warnings: parsed.warnings,
      source: "url-hash",
      navigatorSummary,
      workflowSummary,
    });

    expect(summary.active).toBe(true);
    expect(summary.warningCount).toBe(0);
    expect(summary.restoredCount).toBeGreaterThanOrEqual(9);
    expect(parsed.capsule?.selected.catalogObjectId).toBe("nearby-star:sirius");
    expect(parsed.capsule?.selected.evidenceClaimId).toBe("frw-planck2018-lcdm");
    expect(parsed.capsule?.kerrLab.orbitPresetId).toBe("capture-cone");
    expect(parsed.capsule?.kerrLab.impactParameterM).toBe(4.2);
    expect(parsed.capsule?.kerrLab.studioMode).toBe("probe");
    expect(parsed.capsule?.missionHub.pinnedItems).toHaveLength(3);
  });

  it("keeps old capsules without studioMode compatible", () => {
    const legacy = fixtureCapsule();
    const raw = JSON.parse(JSON.stringify(legacy));
    delete raw.kerrLab.studioMode;

    const parsed = parseAtlasMissionCapsule(JSON.stringify(raw));

    expect(parsed.warnings).toEqual([]);
    expect(parsed.capsule?.kerrLab.studioMode).toBe("overview");
  });
});

function fixtureCapsule() {
  return createAtlasMissionCapsule({
    presentationMode: "orbit-atlas",
    scaleMode: "compressed",
    renderBudget: "balanced",
    viewSettings: {
      showConstellationLines: true,
      showDeepSkyObjects: true,
      showCatalogLabels: false,
      ignoredString: "no",
    },
    selectedCatalogObjectId: "nearby-star:sirius",
    selectedEvidenceClaimId: "frw-planck2018-lcdm",
    selectedWorkflowId: "relativity-lab",
    activeWorkflowStepId: "open-kerr-lab",
    missionHubStoredState: {
      recentActions: [
        { id: "panel:kerr-relativity-lab", kind: "panel-action", timestamp: 20 },
        { id: "evidence-claim:frw-planck2018-lcdm", kind: "evidence-claim", timestamp: 10 },
      ],
      pinnedItems: [
        { id: "celestial-object:nearby-star:sirius", kind: "celestial-object", timestamp: 30 },
        { id: "evidence-claim:frw-planck2018-lcdm", kind: "evidence-claim", timestamp: 31 },
        { id: "panel:kerr-relativity-lab", kind: "panel-action", timestamp: 32 },
      ],
    },
    kerrLab: {
      showKerrBlackHole: true,
      spinA: 0.73,
      impactParameterM: 4.2,
      orbitPresetId: "capture-cone",
      renderMode: "both",
      studioMode: "probe",
    },
    createdAt: "2026-06-25T12:00:00.000Z",
  });
}

function baseSummaries() {
  const navigatorSummary = createAtlasNavigatorSummary({
    evidenceLedgerSummary: evidenceSummary(),
    orbitAnalysisAvailable: true,
    maxResults: 2000,
  });
  return {
    navigatorSummary,
    workflowSummary: createAtlasWorkflowSummary({ navigatorSummary }),
  };
}

function evidenceSummary(): EvidenceLedgerSummary {
  return createEvidenceLedgerSummary({
    diagnostics: null,
    orbitAtlasProfile: "orbit-atlas-v12",
    orbitAtlasRenderer: "cold-body-web-v12",
    gaiaCatalogSource: "gaia-dr3",
    orbitAtlasReady: true,
    presentationMode: "orbit-atlas",
  });
}
