import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  writeAtlasLaunchHandoffToPhysics,
  type AtlasLaunchHandoffState,
  type AtlasLaunchHandoffPhysics,
} from "./useAtlasLaunchController";

function loggedBuffer(
  name: string,
  length: number,
  writes: string[],
): number[] {
  return new Proxy(Array<number>(length).fill(0), {
    set(target, property, value, receiver) {
      if (typeof property === "string" && /^\d+$/.test(property)) {
        writes.push(`${name}[${property}]=${String(value)}`);
      }
      return Reflect.set(target, property, value, receiver);
    },
  });
}

function expectOrdered(source: string, snippets: readonly string[]): void {
  let cursor = -1;
  for (const snippet of snippets) {
    const index = source.indexOf(snippet, cursor + 1);
    expect(index, `missing or out-of-order snippet: ${snippet}`).toBeGreaterThan(cursor);
    cursor = index;
  }
}

describe("v170 Atlas launch controller", () => {
  it("writes handoff position, velocity, mass, and syncPosAu in the legacy order", () => {
    const writes: string[] = [];
    const physics: AtlasLaunchHandoffPhysics = {
      n: 4,
      posM: loggedBuffer("posM", 12, writes),
      velM: loggedBuffer("velM", 12, writes),
      mass: loggedBuffer("mass", 4, writes),
      syncPosAu: () => { writes.push("syncPosAu()"); },
    };

    expect(writeAtlasLaunchHandoffToPhysics(physics, 2, {
      posM: [11, 12, 13],
      velMs: [21, 22, 23],
      massKg: 31,
    })).toBe(true);
    expect(writes).toEqual([
      "posM[6]=11",
      "posM[7]=12",
      "posM[8]=13",
      "velM[6]=21",
      "velM[7]=22",
      "velM[8]=23",
      "mass[2]=31",
      "syncPosAu()",
    ]);
  });

  it("rejects unavailable and out-of-range handoffs before any partial write", () => {
    const writes: string[] = [];
    const physics: AtlasLaunchHandoffPhysics = {
      n: 1,
      posM: loggedBuffer("posM", 3, writes),
      velM: loggedBuffer("velM", 3, writes),
      mass: loggedBuffer("mass", 1, writes),
      syncPosAu: () => { writes.push("syncPosAu()"); },
    };
    const handoff: AtlasLaunchHandoffState = {
      posM: [1, 2, 3],
      velMs: [4, 5, 6],
      massKg: 7,
    };

    expect(writeAtlasLaunchHandoffToPhysics(null, 0, handoff)).toBe(false);
    expect(writeAtlasLaunchHandoffToPhysics(physics, -1, handoff)).toBe(false);
    expect(writeAtlasLaunchHandoffToPhysics(physics, 1, handoff)).toBe(false);
    expect(writes).toEqual([]);
  });

  it("locks start, abort, handoff exit, and camera-focus ordering", () => {
    const source = readFileSync("app/lib/useAtlasLaunchController.ts", "utf8");
    const start = source.slice(source.indexOf("const handleLaunchStart"), source.indexOf("const handleLaunchAbort"));
    const abort = source.slice(source.indexOf("const handleLaunchAbort"), source.indexOf("const handleLocalLaunchHandoff"));
    const handoff = source.slice(source.indexOf("const handleLocalLaunchHandoff"), source.indexOf("return {"));

    expectOrdered(start, [
      "selection.clearSelection();",
      "dispatchCameraFocusOrigin();",
      "setLaunchMode(true);",
      "launchConfigRef.current = config;",
      "localLaunchActiveRef.current = true;",
      "setLocalLaunchActive(true);",
    ]);
    expectOrdered(abort, [
      "setLaunchMode(false);",
      "selection.returnToSimulation();",
      "selection.clearSelection();",
      "localLaunchActiveRef.current = false;",
      "setLocalLaunchActive(false);",
      "localTelemetryRef.current = null;",
      "launchConfigRef.current = null;",
      "selection.resetCameraOrigin();",
      "isLaunchActivePhase()",
      "stopLaunchSequence();",
    ]);
    expectOrdered(handoff, [
      "writeAtlasLaunchHandoffToPhysics(",
      "localLaunchActiveRef.current = false;",
      "setLocalLaunchActive(false);",
      "setLaunchMode(false);",
      "selection.returnToSimulation();",
      "localTelemetryRef.current = null;",
      "launchConfigRef.current = null;",
      "selection.focusSpacecraft(",
      'mode: "lock"',
      "nonce: (previous?.nonce ?? 0) + 1",
    ]);
  });

  it("keeps launch UI selectors, callbacks, and the responsive wrapper unchanged", () => {
    const controller = readFileSync("app/UniverseRuntimeController.tsx", "utf8");
    expect(controller).toContain("onLocalLaunchHandoff: handleLocalLaunchHandoff");
    expect(controller).toContain("onLocalLaunchAbort: handleLaunchAbort");
    expect(controller).toContain("<LaunchTelemetryDock onAbort={handleLaunchAbort}>");
    expect(controller).toContain("telemetryRef={localTelemetryRef}");
    expect(controller).toContain("<LaunchControlPanel");
    expect(controller).toContain("onLaunch={handleLaunchStart}");
    expect(controller).toContain("onAbort={handleLaunchAbort}");
    expect(controller).toContain('defaultProfileId="leo_satellite"');
    expect(controller).toContain(
      'className="pointer-events-auto fixed inset-x-3 bottom-[calc(var(--ui-dock-height)+12px+env(safe-area-inset-bottom))] top-14 z-[130] flex items-end sm:absolute sm:inset-x-auto sm:bottom-24 sm:right-4 sm:top-auto"',
    );
  });
});
