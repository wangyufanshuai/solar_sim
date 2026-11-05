import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MainlineANebulaAtlasV609 from "../components/MainlineANebulaAtlasV609";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import {
  MAINLINE_A_NEBULA_ATLAS_CANDIDATES,
  MAINLINE_A_NEBULA_ATLAS_CURRENT,
  MAINLINE_A_NEBULA_ATLAS_ENTRIES,
  filterNebulaAtlasEntries,
  nebulaAtlasAspect,
  nebulaAtlasSourceLabel,
  nebulaAtlasSummary,
  sortNebulaAtlasEntries,
  betaNebulaSourceMapping,
  MAINLINE_A_BETA_NEBULA_SOURCE_MAP,
  nebulaAtlasCandidateEntry,
  type CandidateAsset,
} from "./mainlineANebulaAtlasV609";

describe("Mainline A9 nebula atlas evidence boundary", () => {
  it("keeps the current twelve separate from the eighteen candidate records", () => {
    expect(MAINLINE_A_NEBULA_ATLAS_CURRENT).toHaveLength(12);
    expect(MAINLINE_A_NEBULA_ATLAS_CANDIDATES).toHaveLength(18);
    expect(MAINLINE_A_NEBULA_ATLAS_ENTRIES).toHaveLength(30);
    expect(MAINLINE_A_NEBULA_ATLAS_CURRENT.every((entry) => entry.runtimeAdmission === "current")).toBe(true);
    expect(MAINLINE_A_NEBULA_ATLAS_CANDIDATES.every((entry) => entry.runtimeAdmission === "candidate-only")).toBe(true);
    expect(MAINLINE_A_NEBULA_ATLAS_ENTRIES.every((entry) => entry.scienceAuthority === false)).toBe(true);
  });

  it("preserves source byte, dimension, hash, and credit fields on every candidate", () => {
    for (const entry of MAINLINE_A_NEBULA_ATLAS_CANDIDATES) {
      expect(entry.sourceTarget).toBeTruthy();
      expect(entry.sourcePage).toMatch(/^https:\/\//);
      expect(entry.sourceCredit).toBeTruthy();
      expect(entry.sourceBytes).toBeGreaterThan(0);
      expect(entry.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.sourceDimensions?.width).toBeGreaterThan(0);
      expect(entry.sourceDimensions?.height).toBeGreaterThan(0);
      expect(entry.rights).toBe("review");
      expect(nebulaAtlasSourceLabel(entry)).toContain("待复核");
    }
  });

  it("does not mistake a candidate source for runtime admission", () => {
    const candidate = MAINLINE_A_NEBULA_ATLAS_CANDIDATES[0];
    expect(candidate.tier).toBe("candidate");
    expect(candidate.runtimeAdmission).toBe("candidate-only");
    expect(nebulaAtlasSourceLabel(candidate)).toContain("NASA");
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "rights-review")).toHaveLength(30);
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "rights-cleared")).toHaveLength(0);
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "license-recorded")).toHaveLength(12);
  });

  it("supports catalog, Chinese, kind, and source-target searches", () => {
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "all", "M42").map((entry) => entry.id)).toContain("m42");
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "all", "猎户座").length).toBeGreaterThan(0);
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "emission").every((entry) => entry.kind === "emission")).toBe(true);
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "all", "jellyfish-nebula")).toHaveLength(1);
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "all", "never-a-nebula")).toHaveLength(0);
  });

  it("sorts a copy without mutating the canonical order", () => {
    const before = MAINLINE_A_NEBULA_ATLAS_ENTRIES.map((entry) => entry.id);
    const bySize = sortNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "angular-size");
    const byDistance = sortNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "distance");
    expect(MAINLINE_A_NEBULA_ATLAS_ENTRIES.map((entry) => entry.id)).toEqual(before);
    const knownSizes = bySize.filter((entry) => entry.sizeArcmin !== null);
    const knownDistances = byDistance.filter((entry) => entry.distancePc !== null);
    expect(knownSizes[0].sizeArcmin).toBeGreaterThanOrEqual(knownSizes.at(-1)!.sizeArcmin!);
    expect(knownDistances[0].distancePc).toBeLessThanOrEqual(knownDistances.at(-1)!.distancePc!);
    expect(bySize.slice(knownSizes.length).every((entry) => entry.sizeArcmin === null)).toBe(true);
    expect(byDistance.slice(knownDistances.length).every((entry) => entry.distancePc === null)).toBe(true);
    expect(sortNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "catalog")).not.toBe(MAINLINE_A_NEBULA_ATLAS_ENTRIES);
  });

  it("clamps malformed aspect inputs instead of emitting invalid CSS", () => {
    for (const entry of MAINLINE_A_NEBULA_ATLAS_ENTRIES) {
      expect(Number.isFinite(nebulaAtlasAspect(entry))).toBe(true);
      expect(nebulaAtlasAspect(entry)).toBeGreaterThanOrEqual(0.62);
      expect(nebulaAtlasAspect(entry)).toBeLessThanOrEqual(2.6);
    }
  });

  it("reports the evidence split explicitly", () => {
    expect(nebulaAtlasSummary(MAINLINE_A_NEBULA_ATLAS_ENTRIES)).toEqual({
      total: 30, current: 12, candidates: 18, cleared: 0, licenseRecorded: 12,
      review: 30, missing: 0, candidateOnly: 30,
    });
  });

  it("keeps six canonical Beta queue IDs explicitly mapped to legacy source targets", () => {
    expect(Object.keys(MAINLINE_A_BETA_NEBULA_SOURCE_MAP)).toEqual(["m17", "ngc281", "ngc2024", "ic1848", "ic1805", "rho_oph"]);
    expect(betaNebulaSourceMapping("m17")).toMatchObject({ sourceTarget: "dragon-lair-nebula", nasaId: "PIA13240", candidateOnly: true });
    expect(betaNebulaSourceMapping("ngc281")).toMatchObject({ sourceTarget: "pacman-nebula", nasaId: "PIA14731", candidateOnly: true });
    expect(betaNebulaSourceMapping("ngc2024")).toMatchObject({ sourceTarget: "flame-nebula", nasaId: "PIA15635", candidateOnly: true });
    expect(betaNebulaSourceMapping("ic1848")).toMatchObject({ sourceTarget: "soul-nebula", nasaId: "PIA13014", candidateOnly: true });
    expect(betaNebulaSourceMapping("ic1805")).toMatchObject({ sourceTarget: "heart-nebula", nasaId: "PIA13112", candidateOnly: true });
    expect(betaNebulaSourceMapping("rho_oph")).toMatchObject({ sourceTarget: "rho-ophiuchi-cloud", nasaId: "PIA10182", candidateOnly: true });
  });

  it("renders a review surface with every card and a non-admission disclosure", () => {
    const html = renderToStaticMarkup(<MainlineANebulaAtlasV609 onClose={() => undefined} />);
    expect(html).toContain("星云候选图集");
    expect(html).toContain('data-mainline-a-nebula-result-count="30"');
    expect(html).toContain("公开网页版发布仍被阻断");
    expect(html).toContain("逐图版权已签署");
    expect(html).toContain('data-mainline-a-nebula-web-release="blocked-rights-pending"');
    expect(html).not.toContain("已清权");
    expect(html).toContain("NASA 使用条款待复核");
    for (const entry of MAINLINE_A_NEBULA_ATLAS_ENTRIES) expect(html).toContain(`data-mainline-a-nebula-entry=\"${entry.id}\"`);
  });

  it("keeps unmatched candidate measurements and classifications unknown", () => {
    for (const candidate of MAINLINE_A_NEBULA_ATLAS_CANDIDATES) {
      expect(candidate.catalogMatchedId).toBeNull();
      expect(candidate.galLonDeg).toBeNull();
      expect(candidate.galLatDeg).toBeNull();
      expect(candidate.distancePc).toBeNull();
      expect(candidate.sizeArcmin).toBeNull();
      expect(candidate.kind).toBe("unknown");
    }
    expect(filterNebulaAtlasEntries(MAINLINE_A_NEBULA_ATLAS_ENTRIES, "unknown")).toHaveLength(18);
  });

  it("binds each current source record to the exact displayed A-line artifact", () => {
    for (const current of MAINLINE_A_NEBULA_ATLAS_CURRENT) {
      const artifact = MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL.find((asset) => asset.objectId === current.id)!;
      expect(current.sourceImagePath).toBe(artifact.src);
      expect(current.sourceSha256).toBe(artifact.sha256);
      expect(current.sourceBytes).toBe(artifact.byteSize);
      expect(current.sourceDimensions).toEqual(artifact.dimensions);
      expect(current.sourcePage).toBe(artifact.sourcePage);
      expect(current.sourceCredit).toBe(artifact.credit);
      expect(current.sourceLicenseUrl).toBe(artifact.licenseUrl);
    }
  });

  it("does not turn a CC BY candidate label or claimed rights state into approval", () => {
    const fixture: CandidateAsset = {
      target: "test-unreviewed", catalogName: "M 42", nasaId: "test-source",
      source: { url: "https://example.org/source", localPath: "source-cache/test.jpg", bytes: 10,
        sha256: "a".repeat(64), width: 100, height: 100, license: "CC BY 4.0", credit: "Test fixture" },
    };
    const candidate = nebulaAtlasCandidateEntry(fixture);
    expect(candidate.catalogMatchedId).toBe("m42");
    expect(candidate.distancePc).toBe(MAINLINE_A_NEBULA_ATLAS_CURRENT.find((entry) => entry.id === "m42")?.distancePc);
    expect(candidate.runtimeAdmission).toBe("candidate-only");
    expect(candidate.rights).toBe("review");
    expect(nebulaAtlasSourceLabel(candidate)).toContain("待复核");
    const claimedCleared = { ...candidate, rights: "cleared" as const };
    expect(filterNebulaAtlasEntries([claimedCleared], "rights-cleared")).toEqual([]);
    expect(filterNebulaAtlasEntries([claimedCleared], "rights-review")).toEqual([claimedCleared]);
    expect(nebulaAtlasSummary([claimedCleared])).toMatchObject({ cleared: 0, review: 1, candidateOnly: 1 });
    expect(nebulaAtlasSourceLabel(claimedCleared)).not.toContain("已清权");
  });

  it("renders missing card values without a false zero or ambiguous Beta count", () => {
    const html = renderToStaticMarkup(<MainlineANebulaAtlasV609 onClose={() => undefined} />);
    expect(html).toContain("角径 未提供");
    expect(html).not.toContain("· 0′");
    expect(html).toContain("不等于 Beta 已接入对象数");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-mainline-a-scientific-payload-writeback="false"');
    expect(html).toContain('data-mainline-a-nebula-image-state="loading"');
    expect(html).toContain('src="/textures/mainline-a/opo0205d.jpg"');
    expect(html).not.toMatch(/<img[^>]+src="https:/);
  });
});
