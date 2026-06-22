import type { TelemetrySample, TelemetrySeriesState } from "./telemetryTypes";
import { telemetrySamplesChronological } from "./telemetryTypes";

export function telemetryToJson(
  state: TelemetrySeriesState,
  meta: { relativityEnabled: boolean }
): string {
  const rows = telemetrySamplesChronological(state);
  return JSON.stringify(
    {
      bodyIndex: state.bodyIndex,
      bodyId: state.bodyId,
      relativityEnabled: meta.relativityEnabled,
      columns: [
        "simDays",
        "radialVelocityMs",
        "sunDistanceAu",
        "eccentricity",
        "eccentricityRel",
        "pnAccelFraction",
        "accelTotMs2",
        "orbitalPeriodDays",
      ],
      samples: rows,
    },
    null,
    2
  );
}

export function telemetryToCsv(state: TelemetrySeriesState): string {
  const rows = telemetrySamplesChronological(state);
  const header =
    "simDays,radialVelocity_ms,sunDistance_au,eccentricity,eccentricity_rel,pnAccelFraction,accelTot_ms2,orbitalPeriod_days";
  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        r.simDays,
        r.radialVelocityMs,
        r.sunDistanceAu,
        r.eccentricity ?? "",
        r.eccentricityRel ?? "",
        r.pnAccelFraction ?? "",
        r.accelTotMs2,
        r.orbitalPeriodDays ?? "",
      ].join(",")
    );
  }
  return lines.join("\n");
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type { TelemetrySample };
