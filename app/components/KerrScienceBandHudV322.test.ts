import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("v322 Science spectral HUD", () => {
  it("is a telemetry-only intent HUD and keeps Cinematic hidden", () => {
    const source = readFileSync(resolve(process.cwd(), "app/components/KerrScienceBandHudV322.tsx"), "utf8");
    const header = readFileSync(resolve(process.cwd(), "app/components/KerrScienceObservatoryHeaderV333.tsx"), "utf8");
    const visual = `${source}\n${header}`;
    const panel = readFileSync(resolve(process.cwd(), "app/components/KerrBlackHolePanel.tsx"), "utf8");
    expect(source).toContain("useSyncExternalStore");
    expect(source).toContain("data-kerr-science-band-hud-v322");
    expect(source).toContain("KerrScienceObservatoryHeaderV333");
    expect(visual).toContain("dense");
    expect(visual).toContain("shared");
    expect(source).toContain("science-band-provenance-v323");
    expect(source).toContain("precision-instrument-runtime-consumer");
    expect(visual).toContain("JSON");
    expect(visual).toContain("CSV");
    expect(source).toContain("data-kerr-science-profile-ab-v324");
    expect(source).toContain("KerrScienceBandUncertaintyV325");
    expect(source).toContain("KerrScienceCinematicABV327");
    expect(source).toContain("KerrSciencePhotonBandsV328");
    expect(source).not.toContain("fetch(");
    expect(panel).toContain("KerrScienceBandHudV322");
  });
});
