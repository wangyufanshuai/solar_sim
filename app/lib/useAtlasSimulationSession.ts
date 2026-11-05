"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type MutableRefObject,
} from "react";
import { applyHistoryEntryToPhysics } from "./applyPhysicsSnapshot";
import { PhysicsHistoryStack } from "./physicsHistoryStack";
import {
  captureHistoryEntry,
  filePayloadToHistoryEntry,
  parseSnapshotFile,
  snapshotToFilePayload,
} from "./physicsSnapshot";
import { PHYSICS_ACTIVE_BODY_COUNT } from "./physicsSharedBuffer";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import { acquireAtlasResource } from "./atlasResourceLifecycle";

const TIME_TRAVEL_LIVE_U = 0.9995;

export type AtlasSimulationSession = ReturnType<typeof useAtlasSimulationSession>;

/** Owns snapshot import/export and time-travel state without changing the physics runtime. */
export function useAtlasSimulationSession({
  physicsRef,
  simDaysRef,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  simDaysRef: MutableRefObject<number>;
}) {
  const physicsHistoryRef = useRef(new PhysicsHistoryStack());
  const integrationSuspendedRef = useRef(false);
  const timeTravelScrubURef = useRef(1);
  const timeTravelScrubbingRef = useRef(false);
  const importStateInputRef = useRef<HTMLInputElement>(null);
  const [timeTravelScrubUi, setTimeTravelScrubUi] = useState(1000);

  const syncTimeTravelSuspension = useCallback(() => {
    integrationSuspendedRef.current =
      timeTravelScrubURef.current < TIME_TRAVEL_LIVE_U ||
      timeTravelScrubbingRef.current;
  }, []);

  const handleExportSystemState = useCallback(() => {
    const physics = physicsRef.current;
    if (!physics) return;
    const entry = captureHistoryEntry(physics, simDaysRef.current);
    const payload = snapshotToFilePayload(entry, simDaysRef.current);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const releaseUrl = acquireAtlasResource("object-url", "atlas", "simulation-state-export", {
      owner: "export",
      estimatedBytes: blob.size,
    });
    const anchor = document.createElement("a");
    try {
      anchor.href = url;
      anchor.download = `solar-system-state-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.json`;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
      releaseUrl();
    }
  }, [physicsRef, simDaysRef]);

  const handleImportStateFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = parseSnapshotFile(JSON.parse(text) as unknown);
        if (!parsed || parsed.massKg.length !== PHYSICS_ACTIVE_BODY_COUNT) {
          window.alert("文件无效：schema 或天体数量与当前模拟不一致。");
          return;
        }
        const physics = physicsRef.current;
        if (!physics) return;
        applyHistoryEntryToPhysics(physics, filePayloadToHistoryEntry(parsed));
        simDaysRef.current = parsed.simDays;
        physicsHistoryRef.current.clear();
        timeTravelScrubURef.current = 1;
        timeTravelScrubbingRef.current = false;
        setTimeTravelScrubUi(1000);
        syncTimeTravelSuspension();
      } catch {
        window.alert("无法解析 JSON 文件。");
      }
    },
    [physicsRef, simDaysRef, syncTimeTravelSuspension],
  );

  return {
    physicsHistoryRef,
    integrationSuspendedRef,
    timeTravelScrubURef,
    timeTravelScrubbingRef,
    importStateInputRef,
    timeTravelScrubUi,
    setTimeTravelScrubUi,
    syncTimeTravelSuspension,
    handleExportSystemState,
    handleImportStateFile,
  };
}
