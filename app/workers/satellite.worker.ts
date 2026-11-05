/// <reference lib="webworker" />

import type { TleRecord } from "../lib/satelliteTle";
import { propagateTleBatch } from "../lib/satelliteTle";

type SatPose = {
  id: string;
  name: string;
  group: string;
  x: number;
  y: number;
  z: number;
};

type TickMsg = {
  type: "tick";
  records: TleRecord[];
  groupFilter: "all" | "stations" | "qzss" | "starlink";
  earthM: { x: number; y: number; z: number };
};

type ResultMsg = {
  type: "poses";
  poses: SatPose[];
};

self.onmessage = (ev: MessageEvent<TickMsg>) => {
  const d = ev.data;
  if (d.type !== "tick") return;
  const src =
    d.groupFilter === "all"
      ? d.records
      : d.records.filter((r) => r.group === d.groupFilter);
  const prop = propagateTleBatch(src, new Date());
  const poses: SatPose[] = prop.map((s) => ({
    id: s.id,
    name: s.name,
    group: s.group,
    x: d.earthM.x + s.posEciKm[0] * 1000,
    y: d.earthM.y + s.posEciKm[1] * 1000,
    z: d.earthM.z + s.posEciKm[2] * 1000,
  }));
  self.postMessage({ type: "poses", poses } satisfies ResultMsg);
};

