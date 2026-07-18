export const OPENROCKET_IMPORT_BRIDGE_VERSION =
  "v112-openrocket-offline-import-bridge";
export const OPENROCKET_IMPORT_BRIDGE_POLICY =
  "offline-import-no-browser-exe-launch";

export type OpenRocketTelemetrySample = {
  timeS: number;
  altitudeM: number | null;
  velocityMs: number | null;
  mach: number | null;
  dynamicPressurePa: number | null;
};

export type OpenRocketImportSummary = {
  version: typeof OPENROCKET_IMPORT_BRIDGE_VERSION;
  policy: typeof OPENROCKET_IMPORT_BRIDGE_POLICY;
  sourceType: "csv" | "json" | "ork-xml" | "unknown";
  designName: string;
  sampleCount: number;
  browserExeLaunch: "not-applied";
  outputDirectory: "public/data/openrocket/";
};

export function parseOpenRocketTelemetryCsv(csv: string): readonly OpenRocketTelemetrySample[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]!).map(normalizeHeader);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const valueFor = (...keys: string[]) => {
      const index = headers.findIndex((header) => keys.includes(header));
      return index >= 0 ? parseFinite(values[index]) : null;
    };
    return {
      timeS: valueFor("time", "time_s", "t") ?? 0,
      altitudeM: valueFor("altitude", "altitude_m", "height", "height_m"),
      velocityMs: valueFor("velocity", "velocity_m_s", "speed", "speed_m_s"),
      mach: valueFor("mach", "mach_number"),
      dynamicPressurePa: valueFor("dynamic_pressure", "dynamic_pressure_pa", "q", "max_q"),
    };
  });
}

export function summarizeOpenRocketImport(input: string): OpenRocketImportSummary {
  const trimmed = input.trim();
  if (!trimmed) return emptySummary("unknown", "");
  const json = parseJson(trimmed);
  if (json) {
    const telemetry = Array.isArray(json.telemetry) ? json.telemetry : [];
    return {
      ...emptySummary("json", String(json.name ?? json.designName ?? "OpenRocket JSON")),
      sampleCount: telemetry.length,
    };
  }
  if (trimmed.includes("<openrocket") || trimmed.includes("<rocket")) {
    return emptySummary("ork-xml", extractXmlName(trimmed) ?? "OpenRocket design");
  }
  const telemetry = parseOpenRocketTelemetryCsv(trimmed);
  return {
    ...emptySummary(telemetry.length > 0 ? "csv" : "unknown", "OpenRocket telemetry"),
    sampleCount: telemetry.length,
  };
}

function emptySummary(
  sourceType: OpenRocketImportSummary["sourceType"],
  designName: string,
): OpenRocketImportSummary {
  return {
    version: OPENROCKET_IMPORT_BRIDGE_VERSION,
    policy: OPENROCKET_IMPORT_BRIDGE_POLICY,
    sourceType,
    designName,
    sampleCount: 0,
    browserExeLaunch: "not-applied",
    outputDirectory: "public/data/openrocket/",
  };
}

function parseJson(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractXmlName(input: string): string | null {
  const match = input.match(/<name>\s*([^<]+?)\s*<\/name>/i);
  return match?.[1]?.trim() || null;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseFinite(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
