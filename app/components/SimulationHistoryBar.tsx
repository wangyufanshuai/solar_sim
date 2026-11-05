"use client";

import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import type { PhysicsHistoryStack } from "../lib/physicsHistoryStack";

const SCRUB_LIVE = 0.9995;

export type SimulationHistoryBarProps = {
  simDaysRef: MutableRefObject<number>;
  scrubURef: MutableRefObject<number>;
  scrubbingRef: MutableRefObject<boolean>;
  physicsHistoryRef: MutableRefObject<PhysicsHistoryStack>;
  isPlaying: boolean;
  scrubUi: number;
  setScrubUi: (value: number) => void;
  onSyncSuspension: () => void;
};

export default function SimulationHistoryBar({
  simDaysRef,
  scrubURef,
  scrubbingRef,
  physicsHistoryRef,
  isPlaying,
  scrubUi,
  setScrubUi,
  onSyncSuspension,
}: SimulationHistoryBarProps) {
  const [fpsUi, setFpsUi] = useState(0);
  const [snapshotCount, setSnapshotCount] = useState(
    () => physicsHistoryRef.current.length,
  );

  useEffect(() => {
    const publish = () => setSnapshotCount(physicsHistoryRef.current.length);
    publish();
    if (!isPlaying) return;
    const intervalId = window.setInterval(publish, 1200);
    return () => window.clearInterval(intervalId);
  }, [isPlaying, physicsHistoryRef]);

  useEffect(() => {
    let frameId = 0;
    let lastSetAt = 0;
    const stamps: number[] = [];
    const tick = (time: number) => {
      stamps.push(time);
      while (stamps.length > 0 && time - stamps[0]! > 1000) stamps.shift();
      if (time - lastSetAt >= 500 && stamps.length >= 2) {
        lastSetAt = time;
        const elapsedSeconds = (time - stamps[0]!) / 1000;
        setFpsUi(elapsedSeconds > 0 ? Math.round((stamps.length - 1) / elapsedSeconds) : 0);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const onPointerDown = useCallback(() => {
    scrubbingRef.current = true;
    onSyncSuspension();
  }, [scrubbingRef, onSyncSuspension]);

  const onPointerUp = useCallback(() => {
    scrubbingRef.current = false;
    onSyncSuspension();
    if (scrubURef.current < SCRUB_LIVE) {
      physicsHistoryRef.current.trimSnapshotsAfterSimDays(simDaysRef.current);
      physicsHistoryRef.current.resetStepAccumulator();
    }
    setSnapshotCount(physicsHistoryRef.current.length);
  }, [scrubURef, scrubbingRef, physicsHistoryRef, simDaysRef, onSyncSuspension]);

  const onChange = useCallback((value: number) => {
    setScrubUi(value);
    scrubURef.current = value / 1000;
    onSyncSuspension();
  }, [scrubURef, setScrubUi, onSyncSuspension]);

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
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-3 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent accent-[var(--ui-accent)] [&::-moz-range-thumb]:h-1.5 [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--ui-accent)] [&::-moz-range-thumb]:shadow-none [&::-moz-range-track]:h-px [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-white/[0.08] [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-white/[0.08] [&::-webkit-slider-thumb]:mt-[-2px] [&::-webkit-slider-thumb]:h-1.5 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[var(--ui-accent)]"
      />
      <span className="max-w-[10rem] shrink-0 truncate text-right font-mono text-[7px] uppercase text-[var(--ui-text-dim)]">
        {fpsUi}<span className="mx-0.5">/</span>{snapshotCount}
      </span>
    </div>
  );
}
