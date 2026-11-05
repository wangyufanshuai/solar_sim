import { XMLParser } from "fast-xml-parser";

export type LaunchAssetManifest = {
  version: "v118-launch-asset-manifest";
  vehicleId: string;
  initialAssetBytes: number;
  deferredAssets: readonly string[];
  source: string;
  checksum: string;
};

export type OpenRocketReplayEvent = {
  timeS: number;
  type: string;
  label: string;
};

export type OpenRocketReplaySample = {
  timeS: number;
  altitudeM: number | null;
  velocityMs: number | null;
  mach: number | null;
  dynamicPressurePa: number | null;
};

export type OpenRocketReplayManifest = {
  version: "v118-openrocket-replay-manifest";
  vehicle: { name: string; lengthM: number | null; diameterM: number | null };
  stages: readonly { name: string; componentCount: number }[];
  events: readonly OpenRocketReplayEvent[];
  telemetry: readonly OpenRocketReplaySample[];
  units: { time: "s"; altitude: "m"; velocity: "m/s"; dynamicPressure: "Pa" };
  source: { kind: "ork" | "csv" | "json"; filename: string; policy: "offline-import-no-browser-exe-launch" };
  checksum: string;
};

type XmlNode = Record<string, unknown>;

export function parseOpenRocketDesignXml(xml: string) {
  const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: true, trimValues: true }).parse(xml) as XmlNode;
  const rocket = findObjectByKey(parsed, "rocket") ?? parsed;
  const name = firstString(rocket, ["name"]) ?? "OpenRocket vehicle";
  const stages = collectByKeys(rocket, new Set(["stage", "axialstage", "parallelstage"])).map((stage, index) => ({
    name: firstString(stage, ["name"]) ?? `Stage ${index + 1}`,
    componentCount: countComponentNodes(stage),
  }));
  return {
    name,
    lengthM: firstNumber(rocket, ["length", "length_m"]),
    diameterM: firstNumber(rocket, ["diameter", "diameter_m"]),
    stages: stages.length > 0 ? stages : [{ name: "Stage 1", componentCount: countComponentNodes(rocket) }],
  };
}

function findObjectByKey(node: unknown, key: string): XmlNode | null {
  if (!node || typeof node !== "object") return null;
  for (const [entryKey, value] of Object.entries(node as XmlNode)) {
    if (entryKey.toLowerCase() === key && value && typeof value === "object") return value as XmlNode;
    const nested = findObjectByKey(value, key);
    if (nested) return nested;
  }
  return null;
}

function collectByKeys(node: unknown, keys: Set<string>, output: XmlNode[] = []): XmlNode[] {
  if (!node || typeof node !== "object") return output;
  for (const [key, value] of Object.entries(node as XmlNode)) {
    if (keys.has(key.toLowerCase())) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) if (item && typeof item === "object") output.push(item as XmlNode);
    }
    collectByKeys(value, keys, output);
  }
  return output;
}

function countComponentNodes(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  let count = 0;
  for (const [key, value] of Object.entries(node as XmlNode)) {
    if (/nosecone|bodytube|transition|finset|motor|masscomponent|parachute/i.test(key)) count += Array.isArray(value) ? value.length : 1;
    count += countComponentNodes(value);
  }
  return count;
}

function firstString(node: XmlNode, keys: string[]): string | null {
  for (const key of keys) {
    const value = node[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(node: XmlNode, keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(node[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}
