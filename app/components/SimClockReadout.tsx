"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import { EPOCH_JD_TDB } from "../data/planetsJ2000";
import { jdToDisplayString } from "../lib/julian";

/**
 * Re-renders periodically so the dock shows advancing TDB-style clock from `simDaysRef`.
 */
export default function SimClockReadout({
  simDaysRef,
}: {
  simDaysRef: MutableRefObject<number>;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  const text = jdToDisplayString(EPOCH_JD_TDB + simDaysRef.current);
  return (
    <time
      dateTime={text}
      className="truncate font-mono text-[10px] tabular-nums text-[var(--ui-text-muted)]"
      title="由历元 JD + 仿真累计日换算的近似历书时（演示）"
    >
      {text}
    </time>
  );
}
