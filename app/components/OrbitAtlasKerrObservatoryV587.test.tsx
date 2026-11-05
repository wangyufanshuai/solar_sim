import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const observatory = readFileSync("app/components/OrbitAtlasKerrObservatoryV587.tsx", "utf8");
const stage = readFileSync("app/components/KerrObservationStageV587.tsx", "utf8");
const worker = readFileSync("app/workers/kerrObservationProjectionV587.worker.ts", "utf8");
const route = readFileSync("app/local-shadow-v587/page.tsx", "utf8");
const lazy = readFileSync("app/components/OrbitAtlasKerrObservatoryV587Lazy.tsx", "utf8");
const texture = readFileSync("app/lib/useV587Ktx2Texture.ts", "utf8");

describe("v587 event-horizon observatory", () => {
  it("stays local-shadow-only, lazy, single-canvas and formally pinned to v263", () => {
    expect(route).toContain('NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(route).toContain('data-atlas-formal-product-pointer="v263"');
    expect(lazy).toContain('ssr: false');
    expect(lazy).toContain("<Observatory />");
    expect(observatory).toContain("<UniverseCanvas");
    expect(observatory).toContain('data-atlas-browser-acceptance-version="v587-postbuild-browser-acceptance"');
    expect(observatory).not.toContain("<Canvas");
    expect(stage).not.toContain("<Canvas");
    expect(stage).toContain("ObservationRuntimeProbeV587");
    expect(stage).toContain("getAtlasResourceSnapshot");
  });

  it("keeps Science and Cinematic presentation state outside the scientific payload", () => {
    expect(observatory).toContain('data-atlas-v587-cinematic-writeback="false"');
    expect(observatory).toContain("data-atlas-v587-payload-stable={payloadStable}");
    expect(observatory).toContain('data-atlas-v587-radiative-transfer="false"');
    expect(observatory).toContain('data-atlas-v587-measured-authority="false"');
    expect(observatory).toContain("Radiative transfer has no authority in v587");
    expect(observatory).not.toMatch(/synthetic\s+(I|Q|U|V)/i);
    expect(stage).toContain("atlasScientificPayloadMutation: false");
  });

  it("verifies binary maps and releases worker and texture ownership", () => {
    expect(observatory).toContain('cache: "no-store"');
    expect(worker).toContain("sha256BytesHexV566");
    expect(worker).toContain("?sha256=${entry.sha256}");
    expect(worker).toContain("v587-worker-field-coverage");
    expect(observatory).toContain("releaseWorkerOnce");
    expect(texture).toContain("v587-visual-manifest-sha");
    expect(texture).toContain("fetchVerified");
    expect(texture).toContain("release?.()");
    expect(texture).toContain("loaded?.dispose()");
  });

  it("loads KTX2 only as a cinematic presentation layer", () => {
    expect(stage).toContain("cinematic ? (");
    expect(stage).toContain("<CinematicBackdropV587");
    expect(texture).toContain("Science never requests");
    expect(texture).toContain("atlasPresentationOnly: true");
    expect(texture).toContain("atlasScientificPayloadMutation: false");
    expect(stage).not.toContain("Math.random");
  });
});
