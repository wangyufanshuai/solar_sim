import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472,
  ATLAS_V8_TOKEN_PATHS_V472,
  auditAtlasScienceCinematicV8V472,
  resolveAtlasScienceCinematicV8V472,
} from "./atlasScienceCinematicV8V472";

const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );

describe("v472 Science Cinematic V8", () => {
  it("returns frozen stable profile references", () => {
    expect(resolveAtlasScienceCinematicV8V472("science")).toBe(
      resolveAtlasScienceCinematicV8V472("science"),
    );
    expect(resolveAtlasScienceCinematicV8V472("cinematic")).toBe(
      resolveAtlasScienceCinematicV8V472("cinematic"),
    );
    expect(Object.isFrozen(resolveAtlasScienceCinematicV8V472("science"))).toBe(true);
  });

  it("consumes every token exactly once across 13 presentation-only consumers", () => {
    const audit = auditAtlasScienceCinematicV8V472();

    expect(ATLAS_V8_TOKEN_PATHS_V472).toHaveLength(33);
    expect(ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472).toHaveLength(33);
    expect(new Set(ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472.map((entry) => entry.tokenPath)).size).toBe(
      33,
    );
    expect(audit).toMatchObject({
      tokenCount: 33,
      bindingCount: 33,
      consumerCount: 13,
      unconsumedTokenPaths: [],
      duplicateTokenPaths: [],
      scientificFieldMutation: false,
      defaultApplied: false,
    });
  });

  it("keeps science effects at zero and cinematic deterministic", () => {
    const science = resolveAtlasScienceCinematicV8V472("science");
    const cinematic = resolveAtlasScienceCinematicV8V472("cinematic");

    expect(science.strongGravity).toMatchObject({
      linearDisplay: true,
      bloomIntensity: 0,
      colorGradeIntensity: 0,
      seed: null,
    });
    expect(science.postFx).toMatchObject({ grain: 0, chromaticAberration: 0 });
    expect(cinematic.strongGravity.seed).toBe("orbit-atlas-v472-cinematic-seed-01");
    expect(cinematic.scientificFieldMutation).toBe(false);
  });

  it("matches the canonical generated profile artifact", () => {
    const artifact = JSON.parse(
      readFileSync("dist/science/atlas-science-cinematic-v8-v472/profile-audit.json", "utf8"),
    );
    const sha = createHash("sha256")
      .update(JSON.stringify(canonicalize(artifact)))
      .digest("hex");
    expect(sha).toBe(artifact.artifactSha256);
    expect(artifact.runtime.v8DefaultApplied).toBe(false);
    expect(artifact.observableBoundary.sciencePixelRows).toBe(0);
  });
});
