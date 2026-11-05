import { describe, expect, it } from "vitest";
import {
  ATLAS_NAVIGATOR_VERSION,
  createAtlasNavigatorSummary,
} from "./atlasNavigator";
import { createEvidenceLedgerSummary } from "./evidenceLedger";
import type { AtlasNavigatorItemKind, EvidenceLedgerSummary } from "./simulationDiagnosticsTypes";

const REQUIRED_KINDS: readonly AtlasNavigatorItemKind[] = [
  "solar-body",
  "celestial-object",
  "evidence-claim",
  "panel-action",
];

describe("Atlas Navigator v24", () => {
  it("aggregates solar bodies, catalog objects, evidence claims and panel actions", () => {
    const summary = createAtlasNavigatorSummary({
      evidenceLedgerSummary: evidenceSummary(),
      orbitAnalysisAvailable: true,
    });
    const kinds = new Set(summary.items.map((item) => item.kind));

    expect(summary.version).toBe(ATLAS_NAVIGATOR_VERSION);
    expect(summary.itemCount).toBeGreaterThan(100);
    for (const kind of REQUIRED_KINDS) expect(kinds.has(kind)).toBe(true);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "solar-body:mars", action: "focus-body" }),
        expect.objectContaining({
          id: "celestial-object:galaxy:m31",
          action: "focus-catalog-object",
        }),
        expect.objectContaining({
          id: "evidence-claim:frw-planck2018-lcdm",
          action: "open-evidence-claim",
        }),
        expect.objectContaining({
          id: "panel:mission-hub",
          action: "open-panel",
          panelId: "mission-hub",
        }),
        expect.objectContaining({
          id: "panel:scientific-report",
          action: "open-panel",
          panelId: "scientific-report",
        }),
        expect.objectContaining({
          id: "panel:observatory-deck",
          action: "open-panel",
          panelId: "observatory-deck",
        }),
        expect.objectContaining({
          id: "panel:validation-console",
          action: "open-panel",
          panelId: "validation-console",
        }),
        expect.objectContaining({
          id: "panel:kerr-relativity-lab",
          action: "open-panel",
          panelId: "kerr-lab",
        }),
        expect.objectContaining({
          id: "panel:relativity-observables",
          action: "open-panel",
          panelId: "relativity-observables",
        }),
        expect.objectContaining({
          id: "panel:atlas-workflows",
          action: "open-panel",
          panelId: "atlas-workflows",
        }),
      ]),
    );
  });

  it("keeps result ids unique and stable", () => {
    const summary = createAtlasNavigatorSummary({
      evidenceLedgerSummary: evidenceSummary(),
      orbitAnalysisAvailable: false,
      maxResults: 2000,
    });
    const ids = summary.items.map((item) => item.id);
    const resultIds = summary.results.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(resultIds).toEqual(
      createAtlasNavigatorSummary({
        evidenceLedgerSummary: evidenceSummary(),
        orbitAnalysisAvailable: false,
        maxResults: 2000,
      }).results.map((item) => item.id),
    );
  });

  it.each([
    ["Mars", "solar-body:mars"],
    ["Sirius", "celestial-object:nearby-star:sirius"],
    ["Orion Nebula", "celestial-object:nebula:m42"],
    ["California Nebula", "celestial-object:nebula:ngc1499"],
    ["Cocoon Nebula", "celestial-object:nebula:ic5146"],
    ["Pleiades", "celestial-object:star-cluster:m45"],
    ["M11", "celestial-object:star-cluster:m11"],
    ["M67", "celestial-object:star-cluster:m67"],
    ["Andromeda", "celestial-object:galaxy:m31"],
    ["M83", "celestial-object:galaxy:m83"],
    ["M106", "celestial-object:galaxy:m106"],
    ["Kerr", "panel:kerr-relativity-lab"],
    ["Kerr Relativity Studio", "panel:kerr-relativity-lab"],
    ["strong field", "panel:kerr-relativity-lab"],
    ["relativity observables", "panel:relativity-observables"],
    ["observable atlas", "panel:relativity-observables"],
    ["relativity explainer", "panel:relativity-observables"],
    ["formula steps", "panel:relativity-observables"],
    ["derivation cards", "panel:relativity-observables"],
    ["variable glossary", "panel:relativity-observables"],
    ["Mercury precession", "panel:relativity-observables"],
    ["Shapiro", "panel:relativity-observables"],
    ["time dilation", "panel:relativity-observables"],
    ["ISCO", "panel:relativity-observables"],
    ["mission", "panel:mission-hub"],
    ["recent", "panel:mission-hub"],
    ["pinned", "panel:mission-hub"],
    ["observatory", "panel:observatory-deck"],
    ["observatory deck", "panel:observatory-deck"],
    ["deck", "panel:observatory-deck"],
    ["workbench", "panel:observatory-deck"],
    ["control room", "panel:observatory-deck"],
    ["dashboard", "panel:observatory-deck"],
    ["report", "panel:scientific-report"],
    ["dossier", "panel:scientific-report"],
    ["evidence report", "panel:scientific-report"],
    ["report studio", "panel:scientific-report"],
    ["html report", "panel:scientific-report"],
    ["printable dossier", "panel:scientific-report"],
    ["validation", "panel:validation-console"],
    ["trust matrix", "panel:validation-console"],
    ["quality console", "panel:validation-console"],
    ["readiness", "panel:validation-console"],
    ["browser acceptance", "panel:validation-console"],
    ["playwright smoke", "panel:validation-console"],
    ["desktop mobile", "panel:validation-console"],
    ["regression gate", "panel:validation-console"],
    ["accessibility", "panel:validation-console"],
    ["keyboard navigation", "panel:validation-console"],
    ["reduced motion", "panel:validation-console"],
    ["WCAG", "panel:validation-console"],
    ["AA audit", "panel:validation-console"],
    ["visual polish", "panel:validation-console"],
    ["cinematic ui", "panel:validation-console"],
    ["art direction", "panel:validation-console"],
    ["universe sandbox", "panel:validation-console"],
    ["aaa visual", "panel:validation-console"],
    ["planet closeup", "panel:validation-console"],
    ["planet realism", "panel:validation-console"],
    ["earth detail", "panel:validation-console"],
    ["sun surface", "panel:validation-console"],
    ["deep space backdrop", "panel:validation-console"],
    ["sky fidelity", "panel:validation-console"],
    ["universe background", "panel:validation-console"],
    ["cinematic lighting", "panel:validation-console"],
    ["filmic exposure", "panel:validation-console"],
    ["post fx", "panel:validation-console"],
    ["color grading", "panel:validation-console"],
    ["closeup composition", "panel:validation-console"],
    ["planet lighting", "panel:validation-console"],
    ["中文界面", "panel:validation-console"],
    ["中文 UI", "panel:validation-console"],
    ["星空背景", "panel:validation-console"],
    ["银河背景", "panel:validation-console"],
    ["星云", "panel:validation-console"],
    ["星座", "panel:validation-console"],
    ["深空美术", "panel:validation-console"],
    ["deep space fidelity", "panel:validation-console"],
    ["3A画质", "panel:validation-console"],
    ["电影级构图", "panel:validation-console"],
    ["深空镜头", "panel:validation-console"],
    ["宇宙沙盒质感", "panel:validation-console"],
    ["背景降噪", "panel:validation-console"],
    ["目标分离", "panel:validation-console"],
    ["cinematic camera", "panel:validation-console"],
    ["deep space camera", "panel:validation-console"],
    ["宇宙沙盒背景", "panel:validation-console"],
    ["背景对比", "panel:validation-console"],
    ["3A背景", "panel:validation-console"],
    ["星空标杆", "panel:validation-console"],
    ["银河质感", "panel:validation-console"],
    ["深空层次", "panel:validation-console"],
    ["reference backdrop", "panel:validation-console"],
    ["sandbox reference", "panel:validation-console"],
    ["sky benchmark", "panel:validation-console"],
    ["3A美术", "panel:validation-console"],
    ["科研模拟画质", "panel:validation-console"],
    ["背景合成", "panel:validation-console"],
    ["银河暗带", "panel:validation-console"],
    ["星噪控制", "panel:validation-console"],
    ["主体负空间", "panel:validation-console"],
    ["reference grade", "panel:validation-console"],
    ["space art direction", "panel:validation-console"],
    ["cinematic composite", "panel:validation-console"],
    ["星体材质", "panel:validation-console"],
    ["行星近景", "panel:validation-console"],
    ["土星环", "panel:validation-console"],
    ["木星条带", "panel:validation-console"],
    ["地球云层", "panel:validation-console"],
    ["太阳颗粒", "panel:validation-console"],
    ["planet material", "panel:validation-console"],
    ["body closeup", "panel:validation-console"],
    ["ring fidelity", "panel:validation-console"],
    ["closeup director", "panel:validation-console"],
    ["planet composition", "panel:validation-console"],
    ["saturn showcase", "panel:validation-console"],
    ["gas giant portrait", "panel:validation-console"],
    ["subject composition", "panel:validation-console"],
    ["key light", "panel:validation-console"],
    ["phase director", "panel:validation-console"],
    ["gas giant lighting", "panel:validation-console"],
    ["saturn lighting", "panel:validation-console"],
    ["ring exposure", "panel:validation-console"],
    ["planet depth lighting", "panel:validation-console"],
    ["terminator depth", "panel:validation-console"],
    ["atmosphere rim", "panel:validation-console"],
    ["saturn ring shadow", "panel:validation-console"],
    ["gas band depth", "panel:validation-console"],
    ["planet color grade", "panel:validation-console"],
    ["gas layer color", "panel:validation-console"],
    ["saturn occlusion tone", "panel:validation-console"],
    ["jupiter color depth", "panel:validation-console"],
    ["numerical integrity", "panel:validation-console"],
    ["physics benchmark", "panel:validation-console"],
    ["time reversal", "panel:validation-console"],
    ["timestep sensitivity", "panel:validation-console"],
    ["energy drift", "panel:validation-console"],
    ["angular momentum drift", "panel:validation-console"],
    ["3A星体", "panel:validation-console"],
    ["3A背景", "panel:validation-console"],
    ["宇宙沙盒对比", "panel:validation-console"],
    ["气态巨行星", "panel:validation-console"],
    ["土星环质感", "panel:validation-console"],
    ["地球夜面", "panel:validation-console"],
    ["太阳表面", "panel:validation-console"],
    ["整体调色", "panel:validation-console"],
    ["planetary art direction", "panel:validation-console"],
    ["cinematic planet grade", "panel:validation-console"],
    ["universe sandbox look", "panel:validation-console"],
    ["宇宙背景", "panel:validation-console"],
    ["3A宇宙背景", "panel:validation-console"],
    ["深空背景", "panel:validation-console"],
    ["银河暗带", "panel:validation-console"],
    ["背景星噪", "panel:validation-console"],
    ["NASA星图", "panel:validation-console"],
    ["星云背景", "panel:validation-console"],
    ["电影级背景", "panel:validation-console"],
    ["universe sandbox backdrop", "panel:validation-console"],
    ["deep-space backdrop", "panel:validation-console"],
    ["NASA star map", "panel:validation-console"],
    ["3A深空", "panel:validation-console"],
    ["稀疏星空", "panel:validation-console"],
    ["宇宙沙盒背景升级", "panel:validation-console"],
    ["NASA 16K星图", "panel:validation-console"],
    ["银河暗带增强", "panel:validation-console"],
    ["主体负空间", "panel:validation-console"],
    ["sparse deep space", "panel:validation-console"],
    ["16k star map", "panel:validation-console"],
    ["starfield director", "panel:validation-console"],
    ["近景一致性", "panel:validation-console"],
    ["右侧预览", "panel:validation-console"],
    ["太阳背景修复", "panel:validation-console"],
    ["行星可读性", "panel:validation-console"],
    ["closeup preview", "panel:validation-console"],
    ["solar backdrop fix", "panel:validation-console"],
    ["planet readability", "panel:validation-console"],
    ["数值审计", "panel:validation-console"],
    ["时间步敏感性", "panel:validation-console"],
    ["时间反演", "panel:validation-console"],
    ["守恒漂移", "panel:validation-console"],
    ["猎户座大星云", "celestial-object:nebula:m42"],
    ["仙女座星系", "celestial-object:galaxy:m31"],
    ["昴星团", "celestial-object:star-cluster:m45"],
    ["workflow", "panel:atlas-workflows"],
    ["relativity tour", "panel:atlas-workflows"],
    ["guided relativity", "panel:atlas-workflows"],
    ["science story", "panel:atlas-workflows"],
    ["observable walkthrough", "panel:atlas-workflows"],
    ["Kerr workflow", "panel:atlas-workflows"],
    ["Deep sky", "panel:atlas-workflows"],
    ["FRW", "evidence-claim:frw-planck2018-lcdm"],
    ["Evidence", "panel:evidence-ledger"],
  ])("searches %s deterministically", (query, expectedId) => {
    const summary = createAtlasNavigatorSummary({
      query,
      evidenceLedgerSummary: evidenceSummary(),
      orbitAnalysisAvailable: true,
      maxResults: 8,
    });

    expect(summary.resultCount).toBeGreaterThan(0);
    expect(summary.results.map((item) => item.id)).toContain(expectedId);
    for (const item of summary.results) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.source).toBeTruthy();
      expect(item.primaryMetric).toBeTruthy();
      expect(Number.isFinite(item.priority)).toBe(true);
    }
  });

  it("returns prioritized defaults for an empty query", () => {
    const summary = createAtlasNavigatorSummary({
      query: "",
      evidenceLedgerSummary: evidenceSummary(),
    });

    expect(summary.resultCount).toBeGreaterThan(0);
    expect(summary.resultCount).toBeLessThanOrEqual(18);
    expect(summary.selectedDefaultId).toBe(summary.results[0]?.id);
    expect(summary.results.slice(0, 4).map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "panel:mission-hub",
        "panel:observatory-deck",
        "panel:scientific-report",
        "panel:validation-console",
      ]),
    );
  });

  it("handles invalid and unmatched queries without throwing", () => {
    expect(() => createAtlasNavigatorSummary({ query: null })).not.toThrow();
    expect(() => createAtlasNavigatorSummary({ query: "   " })).not.toThrow();
    const unmatched = createAtlasNavigatorSummary({
      query: "no-such-local-atlas-object-000",
      evidenceLedgerSummary: evidenceSummary(),
    });

    expect(unmatched.resultCount).toBe(0);
    expect(unmatched.results).toEqual([]);
    expect(unmatched.selectedDefaultId).toBe("");
  });
});

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
