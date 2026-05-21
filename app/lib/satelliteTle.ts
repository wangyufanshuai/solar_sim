import * as satellite from "satellite.js";

export type TleRecord = {
  id: string;
  name: string;
  line1: string;
  line2: string;
  group: string;
};

export type PropagatedSatellite = {
  id: string;
  name: string;
  group: string;
  posEciKm: [number, number, number];
};

export function parseTleText(raw: string, group: string): TleRecord[] {
  const lines = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: TleRecord[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i] ?? "";
    const line1 = lines[i + 1] ?? "";
    const line2 = lines[i + 2] ?? "";
    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) continue;
    const id = line1.slice(2, 7).trim();
    out.push({ id, name, line1, line2, group });
  }
  return out;
}

export function propagateTleBatch(
  records: readonly TleRecord[],
  at: Date
): PropagatedSatellite[] {
  const out: PropagatedSatellite[] = [];
  for (const r of records) {
    try {
      const satrec = satellite.twoline2satrec(r.line1, r.line2);
      const pv = satellite.propagate(satrec, at);
      if (!pv) continue;
      const p = pv.position;
      if (!p) continue;
      out.push({
        id: r.id,
        name: r.name,
        group: r.group,
        posEciKm: [p.x, p.y, p.z],
      });
    } catch {
      // Ignore broken element.
    }
  }
  return out;
}

