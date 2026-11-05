import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalKerrReplayCompatibilityV542, compareKerrReplayCompatibilityHudEncodingsV542, createKerrReplayCompatibilityHudEncodingV542, parseKerrReplayCompatibilityArtifactV542, resolveKerrReplayCompatibilityHudProfileV542 } from "./kerrReplayCompatibilityV542";

const artifact = parseKerrReplayCompatibilityArtifactV542(JSON.parse(readFileSync("dist/science/kerr-replay-compatibility-v542/atlas.json", "utf8")));
const digest = (value: unknown) => createHash("sha256").update(canonicalKerrReplayCompatibilityV542(value)).digest("hex");
describe("v542 replay compatibility", () => {
  it("parses the canonical artifact and preserves fail-closed qualification", () => { expect(digest(artifact)).toBe(artifact.artifactSha256); expect(digest(artifact.preflight)).toBe(artifact.preflight.preflightSha256); expect(digest(artifact.compatibility)).toBe(artifact.compatibility.matrixSha256); expect(artifact.compatibility.cells).toHaveLength(4); expect(artifact.compatibility.cells.filter((cell) => cell.executed)).toHaveLength(1); expect(artifact.qualification.crossEnvironmentQualified).toBe(false); expect(artifact.preflight.qualification.scientificReplayQualifiedByThisPreflight).toBe(false); });
  it("keeps science and cinematic styling away from scientific identities", () => { const science = createKerrReplayCompatibilityHudEncodingV542(artifact, "science"), cinematic = createKerrReplayCompatibilityHudEncodingV542(artifact, "cinematic"); expect(compareKerrReplayCompatibilityHudEncodingsV542(science, cinematic)).toMatchObject({ compatibilityStable: true, scienceReplayIdentityStable: true, scientificFieldMutation: false }); expect(resolveKerrReplayCompatibilityHudProfileV542("science").scienceBoundary.bloomIntensity).toBe(0); expect(resolveKerrReplayCompatibilityHudProfileV542("cinematic").cinematicSeed).toBeTruthy(); });
});
