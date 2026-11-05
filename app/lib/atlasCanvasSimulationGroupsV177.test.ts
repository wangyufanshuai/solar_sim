import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sceneSource = readFileSync("app/components/UniverseScene.tsx", "utf8");
const canvasSource = readFileSync("app/components/UniverseCanvas.tsx", "utf8");
const hostSource = readFileSync("app/components/AtlasSceneHost.tsx", "utf8");

function quotedKeys(constantName: string): string[] {
  const match = sceneSource.match(new RegExp(
    `export const ${constantName} = \\[([\\s\\S]*?)\\] as const`,
  ));
  if (!match) throw new Error(`missing ${constantName}`);
  return [...match[1].matchAll(/"([A-Za-z0-9_]+)"/g)].map((entry) => entry[1]);
}

describe("v177 canvas simulation groups", () => {
  it("partitions every flat public prop exactly once", () => {
    const propsBlock = sceneSource.match(
      /export type UniverseCanvasSimulationProps = \{([\s\S]*?)\n\};/,
    );
    if (!propsBlock) throw new Error("missing flat simulation contract");
    const publicKeys = [...propsBlock[1].matchAll(/^  ([A-Za-z0-9_]+)\??:/gm)]
      .map((entry) => entry[1]);
    const groupedKeys = [
      ...quotedKeys("ATLAS_CANVAS_SIMULATION_REF_KEYS"),
      ...quotedKeys("ATLAS_CANVAS_SIMULATION_INTERACTIVE_KEYS"),
      ...quotedKeys("ATLAS_CANVAS_SIMULATION_ACTION_KEYS"),
      ...quotedKeys("ATLAS_CANVAS_SIMULATION_VISUAL_KEYS"),
    ];

    expect(publicKeys).toHaveLength(85);
    expect(new Set(groupedKeys).size).toBe(groupedKeys.length);
    expect([...groupedKeys].sort()).toEqual([...publicKeys].sort());
  });

  it("normalizes only inside the Canvas while preserving the flat external prop", () => {
    expect(sceneSource).toContain("export type AtlasCanvasSimulationGroups");
    expect(sceneSource).toContain("export function normalizeAtlasCanvasSimulationProps");
    expect(canvasSource).toContain("simulation: UniverseCanvasSimulationProps");
    expect(canvasSource).toContain("normalizeAtlasCanvasSimulationProps(simulation)");
    expect(canvasSource).toContain("simulationGroups={simulationGroups}");
  });

  it("retains a single memoized Canvas host and scene revision identity boundary", () => {
    expect(canvasSource.match(/<Canvas\b/g)).toHaveLength(1);
    expect(canvasSource.match(/<UniverseScene\b/g)).toHaveLength(1);
    expect(hostSource.match(/<UniverseCanvas\b/g)).toHaveLength(1);
    expect(hostSource).toContain("snapshot.sceneRevision");
    expect(hostSource).toContain("shallowEqualSimulationProps");
    expect(hostSource).toContain('data-atlas-scene-host-canvas-limit="1"');
  });
});
