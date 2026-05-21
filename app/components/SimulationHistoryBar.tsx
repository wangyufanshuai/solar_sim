"use client";

import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import {
  SNAPSHOT_EVERY_SUBSTEPS,
  type PhysicsHistoryStack,
} from "../lib/physicsHistoryStack";

const SCRUB_LIVE = 0.9995;

export type SimulationHistoryBarProps = {
  simDaysRef: MutableRefObject<number>;
  scrubURef: MutableRefObject<number>;
  scrubbingRef: MutableRefObject<boolean>;
  physicsHistoryRef: MutableRefObject<PhysicsHistoryStack>;
  scrubUi: number;
  setScrubUi: (v: number) => void;
  snapshotCount: number;
  onSyncSuspension: () => void;
  onScrubEnd: () => void;
};

/**
 * Bottom timeline: drag left to scrub/interpolate history; physics suspends while off live edge.
 */
export default function SimulationHistoryBar({
  simDaysRef,
  scrubURef,
  scrubbingRef,
  physicsHistoryRef,
  scrubUi,
  setScrubUi,
  snapshotCount,
  onSyncSuspension,
  onScrubEnd,
}: SimulationHistoryBarProps) {
  const [fpsUi, setFpsUi] = useState(0);

  useEffect(() => {
    let id = 0;
    let lastSetT = 0;
    const stamps: number[] = [];
    const tick = (t: number) => {
      stamps.push(t);
      while (stamps.length > 0 && t - stamps[0]! > 1000) stamps.shift();
      if (t - lastSetT >= 500 && stamps.length >= 2) {
        lastSetT = t;
        const dtS = (t - stamps[0]!) / 1000;
        setFpsUi(dtS > 0 ? Math.round((stamps.length - 1) / dtS) : 0);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const onPointerDown = useCallback(() => {
    scrubbingRef.current = true;
    onSyncSuspension();
  }, [scrubbingRef, onSyncSuspension]);

  const onPointerUp = useCallback(() => {
    scrubbingRef.current = false;
    onSyncSuspension();
    const u = scrubURef.current;
    if (u < SCRUB_LIVE) {
      physicsHistoryRef.current.trimSnapshotsAfterSimDays(simDaysRef.current);
      physicsHistoryRef.current.resetStepAccumulator();
    }
    onScrubEnd();
  }, [scrubURef, scrubbingRef, physicsHistoryRef, simDaysRef, onSyncSuspension, onScrubEnd]);

  const onChange = useCallback(
    (v: number) => {
      setScrubUi(v);
      scrubURef.current = v / 1000;
      onSyncSuspension();
    },
    [scrubURef, setScrubUi, onSyncSuspension],
  );

  return (
    <div className="flex w-full items-center gap-2 px-2 py-0.5">
      <span className="hidden shrink-0 font-mono text-[7px] uppercase tracking-[0.18em] text-[var(--ui-text-dim)] sm:inline">
            T
          </span>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={scrubUi}
            aria-label="拖拽回溯历史状态"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-3 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent accent-[var(--ui-accent)] [&::-moz-range-thumb]:h-1.5 [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--ui-accent)] [&::-moz-range-thumb]:shadow-none [&::-moz-range-track]:h-px [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-white/[0.08] [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-white/[0.08] [&::-webkit-slider-thumb]:mt-[-2px] [&::-webkit-slider-thumb]:h-1.5 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[var(--ui-accent)]"
          />
          <span className="max-w-[10rem] shrink-0 truncate text-right font-mono text-[7px] uppercase text-[var(--ui-text-dim)]">
            {fpsUi}<span className="mx-0.5 text-[var(--ui-text-dim)]">/</span>{snapshotCount}
          </span>
        </div>
  );
}
