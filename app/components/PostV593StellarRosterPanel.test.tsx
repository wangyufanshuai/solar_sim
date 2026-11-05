import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PostV593StellarRosterPanel from "./PostV593StellarRosterPanel";
import {
  createStellarPhenomenologyByIdV1,
  summarizeStellarPhenomenologyV1,
} from "../lib/stellarPhenomenologyV1";

describe("post-v593 stellar roster phenomenology bridge", () => {
  it("publishes the version and fail-closed authority markers on the roster root", () => {
    const html = renderToStaticMarkup(
      <PostV593StellarRosterPanel
        selectedCatalogId="stellar-hero:sirius-a"
        onFocus={() => undefined}
      />,
    );
    expect(html).toContain('data-post-v593-stellar-phenomenology-version="post-v593-stellar-phenomenology-v1"');
    expect(html).toContain('data-post-v593-stellar-phenomenology-presentation-only="true"');
    expect(html).toContain('data-post-v593-stellar-phenomenology-measurement-authority="false"');
    expect(html).toContain('data-post-v593-stellar-phenomenology-payload-writeback="false"');
  });

  it("keeps UI status semantics aligned with the typed contract", () => {
    const sirius = createStellarPhenomenologyByIdV1("sirius-a");
    const achernar = createStellarPhenomenologyByIdV1("achernar");
    expect(sirius.binary).toMatchObject({
      state: "binary-presentation-only",
      companionIds: ["sirius-b"],
      orbit: null,
    });
    expect(achernar.binary).toMatchObject({ state: "unknown", companionIds: [], orbit: null });
    expect(sirius.pulsation).toMatchObject({
      state: "pulsation-disabled-no-admitted-amplitude",
      enabled: false,
      amplitude: null,
      periodDays: null,
    });
    expect(summarizeStellarPhenomenologyV1()).toMatchObject({
      rosterCount: 24,
      measurementAuthorityGrantedCount: 0,
      orbitClaimCount: 0,
    });
  });

  it("keeps every required data marker in the component source for the interactive list/detail render", () => {
    const source = readFileSync("app/components/PostV593StellarRosterPanel.tsx", "utf8");
    for (const marker of [
      "data-post-v593-stellar-variability-state",
      "data-post-v593-stellar-pulsation-state",
      "data-post-v593-stellar-pulsation-enabled",
      "data-post-v593-stellar-binary-state",
      "data-post-v593-stellar-binary-companion-count",
      "data-post-v593-stellar-selected-phenomenology",
      "data-post-v593-stellar-selected-orbit-claim",
    ]) {
      expect(source).toContain(marker);
    }
  });

  it("keeps Mainline A admission-state labels and legend wired to the roster", () => {
    const source = readFileSync("app/components/PostV593StellarRosterPanel.tsx", "utf8");
    for (const marker of [
      "MAINLINE_A_BETA_HERO_ROSTER",
      "data-mainline-a-hero-status",
      "data-mainline-a-hero-status-label",
      "runtime cleared",
      "evidence pending",
      "data-mainline-a-hero-status-legend",
      "data-mainline-a-hero-roster-scroll",
      "overflow-x-hidden",
    ]) {
      expect(source).toContain(marker);
    }
  });
});
