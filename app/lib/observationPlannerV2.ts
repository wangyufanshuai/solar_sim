import type { GaiaStarRecord } from "../data/gaiaStarCatalog";
import { selectCelestialCatalogEntry } from "./celestialCatalog";
import {
  OBSERVATION_PLANNER_ENGINE,
  computeTelescopeFovV1,
  validateObserverProfileV1,
  type ObservationPlanRequest,
  type ObservationPlanResult,
  type ObservationTargetV1,
  type ObserverProfileV1,
  type TelescopeFovProfileV1,
  type TelescopeFovResultV1,
} from "./observationPlannerV1";

export const OBSERVATION_PLANNER_V2_VERSION =
  "v266-observing-planner-view-model-v2" as const;
export const OBSERVATION_PROFILE_STORAGE_VERSION =
  "v266-observation-profile-storage-v1" as const;
export const OBSERVATION_PROFILE_STORAGE_KEY =
  "orbit-atlas-observation-profiles-v1" as const;
export const OBSERVATION_PROFILE_LIMIT = 10;

export type SavedObserverProfileV1 = {
  version: "saved-observer-profile-v1";
  id: string;
  savedAt: string;
  profile: ObserverProfileV1;
};

export type SavedFovProfileV1 = {
  version: "saved-fov-profile-v1";
  id: string;
  savedAt: string;
  profile: TelescopeFovProfileV1;
};

export type ObservationWeatherSampleV1 = {
  at: string;
  cloudLowPercent: number | null;
  cloudMidPercent: number | null;
  cloudHighPercent: number | null;
  humidityPercent: number | null;
  visibilityM: number | null;
  precipitationProbabilityPercent: number | null;
  windSpeedKmh: number | null;
};

export type ObservationWeatherSnapshotV1 = {
  canonical: false;
  source: "Open-Meteo";
  fetchedAt: string;
  expiresAt: string;
  samples: readonly ObservationWeatherSampleV1[];
  boundary: "optional-transient-weather-not-science-evidence";
};

export type ObservationLocationResultV1 = {
  id: string;
  name: string;
  admin1: string;
  country: string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationM: number;
  timeZone: string;
};

export type ObservationChartSeriesV1 = {
  at: string;
  hourLabel: string;
  altitudeDeg: number;
  azimuthDeg: number;
  airmass: number | null;
  sunAltitudeDeg: number;
  moonAltitudeDeg: number;
  moonSeparationDeg: number;
  moonIlluminationPercent: number;
  cloudPercent: number | null;
  humidityPercent: number | null;
  visibilityKm: number | null;
  precipitationProbabilityPercent: number | null;
  windSpeedKmh: number | null;
};

export type ObservationPlannerViewModelV2 = {
  version: typeof OBSERVATION_PLANNER_V2_VERSION;
  status: "idle" | "calculating" | "ready" | "blocked";
  observer: ObserverProfileV1;
  target: ObservationTargetV1 | null;
  targetBoundary: "manual" | "selected-catalog" | "selected-gaia" | "unavailable";
  result: ObservationPlanResult | null;
  chartSeries: readonly ObservationChartSeriesV1[];
  fovProfile: TelescopeFovProfileV1;
  fov: TelescopeFovResultV1;
  savedObserverCount: number;
  savedFovCount: number;
  weather: ObservationWeatherSnapshotV1 | null;
  weatherCanonical: false;
  error: string;
};

export type ObservationPlannerWorkerRequestV2 = {
  type: "plan";
  requestId: number;
  request: ObservationPlanRequest;
};

export type ObservationPlannerWorkerResponseV2 =
  | { type: "result"; requestId: number; result: ObservationPlanResult; durationMs: number }
  | { type: "error"; requestId: number; error: string; durationMs: number };

export type SelectedObservationTargetV2 = {
  target: ObservationTargetV1 | null;
  boundary: ObservationPlannerViewModelV2["targetBoundary"];
  reason: string;
};

type StorageLikeV2 = Pick<Storage, "getItem" | "setItem"> &
  Partial<Pick<Storage, "removeItem">>;
export type StoredObservationProfilesV1 = {
  version: typeof OBSERVATION_PROFILE_STORAGE_VERSION;
  observers: SavedObserverProfileV1[];
  fovs: SavedFovProfileV1[];
};

const EMPTY_STORAGE: StoredObservationProfilesV1 = {
  version: OBSERVATION_PROFILE_STORAGE_VERSION,
  observers: [],
  fovs: [],
};

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function boundedWeatherMetric(value: unknown, minimum: number, maximum: number): number | null {
  const candidate = finiteOrNull(value);
  return candidate != null && candidate >= minimum && candidate <= maximum ? candidate : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function validSavedObserver(value: unknown): value is SavedObserverProfileV1 {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SavedObserverProfileV1>;
  if (row.version !== "saved-observer-profile-v1" || typeof row.id !== "string" || !row.id.trim() || row.id.length > 120 ||
    typeof row.savedAt !== "string" || row.profile?.version !== "observer-profile-v1") return false;
  try {
    validateObserverProfileV1(row.profile);
    return Number.isFinite(Date.parse(row.savedAt));
  } catch {
    return false;
  }
}

function validSavedFov(value: unknown): value is SavedFovProfileV1 {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SavedFovProfileV1>;
  if (row.version !== "saved-fov-profile-v1" || typeof row.id !== "string" || !row.id.trim() || row.id.length > 120 ||
    typeof row.savedAt !== "string" || !row.profile) return false;
  try {
    computeTelescopeFovV1(row.profile);
    return Number.isFinite(Date.parse(row.savedAt));
  } catch {
    return false;
  }
}

export function readObservationProfilesV1(storage: StorageLikeV2): StoredObservationProfilesV1 {
  try {
    const raw = storage.getItem(OBSERVATION_PROFILE_STORAGE_KEY);
    if (!raw) return EMPTY_STORAGE;
    const parsed = JSON.parse(raw) as Partial<StoredObservationProfilesV1>;
    if (parsed.version !== OBSERVATION_PROFILE_STORAGE_VERSION) {
      storage.removeItem?.(OBSERVATION_PROFILE_STORAGE_KEY);
      return EMPTY_STORAGE;
    }
    const repaired = {
      version: OBSERVATION_PROFILE_STORAGE_VERSION,
      observers: Array.isArray(parsed.observers)
        ? parsed.observers.filter(validSavedObserver).slice(0, OBSERVATION_PROFILE_LIMIT)
        : [],
      fovs: Array.isArray(parsed.fovs)
        ? parsed.fovs.filter(validSavedFov).slice(0, OBSERVATION_PROFILE_LIMIT)
        : [],
    };
    if (
      repaired.observers.length !== (parsed.observers?.length ?? 0) ||
      repaired.fovs.length !== (parsed.fovs?.length ?? 0)
    ) storage.setItem(OBSERVATION_PROFILE_STORAGE_KEY, JSON.stringify(repaired));
    return repaired;
  } catch {
    storage.removeItem?.(OBSERVATION_PROFILE_STORAGE_KEY);
    return EMPTY_STORAGE;
  }
}

function writeProfiles(
  storage: StorageLikeV2,
  value: StoredObservationProfilesV1,
): StoredObservationProfilesV1 {
  storage.setItem(OBSERVATION_PROFILE_STORAGE_KEY, JSON.stringify(value));
  return value;
}

export function saveObserverProfileV1(
  storage: StorageLikeV2,
  profile: SavedObserverProfileV1,
): StoredObservationProfilesV1 {
  const current = readObservationProfilesV1(storage);
  return writeProfiles(storage, {
    ...current,
    observers: [profile, ...current.observers.filter((entry) => entry.id !== profile.id)]
      .slice(0, OBSERVATION_PROFILE_LIMIT),
  });
}

export function saveFovProfileV1(
  storage: StorageLikeV2,
  profile: SavedFovProfileV1,
): StoredObservationProfilesV1 {
  const current = readObservationProfilesV1(storage);
  return writeProfiles(storage, {
    ...current,
    fovs: [profile, ...current.fovs.filter((entry) => entry.id !== profile.id)]
      .slice(0, OBSERVATION_PROFILE_LIMIT),
  });
}

export function deleteObservationProfileV1(
  storage: StorageLikeV2,
  kind: "observer" | "fov",
  id: string,
): StoredObservationProfilesV1 {
  const current = readObservationProfilesV1(storage);
  return writeProfiles(storage, kind === "observer"
    ? { ...current, observers: current.observers.filter((entry) => entry.id !== id) }
    : { ...current, fovs: current.fovs.filter((entry) => entry.id !== id) });
}

export function observationTargetFromSelectionV2(
  selectedObjectId: string,
  gaiaStars: readonly GaiaStarRecord[],
): SelectedObservationTargetV2 {
  if (!selectedObjectId) return { target: null, boundary: "unavailable", reason: "当前没有选中的天空目标" };
  const sourceId = selectedObjectId.startsWith("gaia-dr3:")
    ? selectedObjectId.slice("gaia-dr3:".length)
    : "";
  if (sourceId) {
    const star = gaiaStars.find((entry) => entry.sourceId === sourceId);
    return star
      ? {
          target: {
            id: selectedObjectId,
            name: `Gaia DR3 ${sourceId}`,
            raDeg: star.raDeg,
            decDeg: star.decDeg,
            epochJulianYear: 2016,
          },
          boundary: "selected-gaia",
          reason: "",
        }
      : { target: null, boundary: "unavailable", reason: "选中的 Gaia source 不在已加载离线目录中" };
  }
  const catalog = selectCelestialCatalogEntry(selectedObjectId);
  if (catalog?.raHours != null && catalog.decDeg != null) {
    return {
      target: {
        id: catalog.id,
        name: catalog.primaryName,
        raDeg: catalog.raHours * 15,
        decDeg: catalog.decDeg,
        epochJulianYear: 2000,
      },
      boundary: "selected-catalog",
      reason: "",
    };
  }
  return { target: null, boundary: "unavailable", reason: "选中对象没有可靠赤经赤纬，不能用于观测规划" };
}

export function parseObservationWeatherV1(value: unknown): ObservationWeatherSnapshotV1 {
  if (!value || typeof value !== "object") throw new Error("天气响应不是对象");
  const root = value as Record<string, unknown>;
  const weather = root.weather && typeof root.weather === "object"
    ? root.weather as Record<string, unknown>
    : {};
  const hourly = weather.hourly && typeof weather.hourly === "object"
    ? weather.hourly as Record<string, unknown>
    : {};
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const fetchedAt = text(root.fetchedAt);
  const expiresAt = text(root.expiresAt);
  if (
    root.canonical !== false || root.source !== "Open-Meteo" || !times.length || times.length > 72 ||
    !Number.isFinite(Date.parse(fetchedAt)) || !Number.isFinite(Date.parse(expiresAt)) ||
    Date.parse(expiresAt) < Date.parse(fetchedAt)
  ) {
    throw new Error("天气响应缺少 Open-Meteo 小时序列");
  }
  const array = (key: string) => Array.isArray(hourly[key]) ? hourly[key] as unknown[] : [];
  const low = array("cloud_cover_low");
  const mid = array("cloud_cover_mid");
  const high = array("cloud_cover_high");
  const humidity = array("relative_humidity_2m");
  const visibility = array("visibility");
  const precipitation = array("precipitation_probability");
  const wind = array("wind_speed_10m");
  const samples = times.map((at, index) => ({
    at: text(at),
    cloudLowPercent: boundedWeatherMetric(low[index], 0, 100),
    cloudMidPercent: boundedWeatherMetric(mid[index], 0, 100),
    cloudHighPercent: boundedWeatherMetric(high[index], 0, 100),
    humidityPercent: boundedWeatherMetric(humidity[index], 0, 100),
    visibilityM: boundedWeatherMetric(visibility[index], 0, 100_000),
    precipitationProbabilityPercent: boundedWeatherMetric(precipitation[index], 0, 100),
    windSpeedKmh: boundedWeatherMetric(wind[index], 0, 500),
  })).filter((entry) => Number.isFinite(Date.parse(entry.at)));
  if (!samples.length) throw new Error("天气时间轴无有效样本");
  return {
    canonical: false,
    source: "Open-Meteo",
    fetchedAt,
    expiresAt,
    samples,
    boundary: "optional-transient-weather-not-science-evidence",
  };
}

export function parseObservationLocationsV1(value: unknown): ObservationLocationResultV1[] {
  if (!value || typeof value !== "object") throw new Error("地名响应不是对象");
  const root = value as Record<string, unknown>;
  if (root.canonical !== false || root.source !== "Open-Meteo Geocoding" || !Array.isArray(root.results)) {
    throw new Error("地名响应缺少 Open-Meteo Geocoding provenance");
  }
  return root.results.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const row = candidate as Record<string, unknown>;
    const latitudeDeg = finiteOrNull(row.latitudeDeg);
    const longitudeDeg = finiteOrNull(row.longitudeDeg);
    if (
      latitudeDeg === null || latitudeDeg < -90 || latitudeDeg > 90 ||
      longitudeDeg === null || longitudeDeg < -180 || longitudeDeg > 180 ||
      !text(row.name)
    ) return [];
    return [{
      id: text(row.id),
      name: text(row.name),
      admin1: text(row.admin1),
      country: text(row.country),
      latitudeDeg,
      longitudeDeg,
      elevationM: finiteOrNull(row.elevationM) ?? 0,
      timeZone: text(row.timeZone) || "UTC",
    }];
  });
}

function nearestWeather(
  samples: readonly ObservationWeatherSampleV1[],
  at: string,
): ObservationWeatherSampleV1 | null {
  if (!samples.length) return null;
  const target = weatherTimeMs(at);
  if (!Number.isFinite(target)) return null;
  let best: ObservationWeatherSampleV1 | null = null;
  let delta = Number.POSITIVE_INFINITY;
  for (const sample of samples) {
    const candidate = Math.abs(weatherTimeMs(sample.at) - target);
    if (candidate < delta) {
      best = sample;
      delta = candidate;
    }
  }
  return delta <= 45 * 60_000 ? best : null;
}

/** Open-Meteo is requested with timezone=UTC but returns offset-free hourly labels. */
function weatherTimeMs(value: string): number {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return Date.parse(normalized);
}

export function createObservationChartSeriesV1(
  result: ObservationPlanResult,
  weather: ObservationWeatherSnapshotV1 | null,
): ObservationChartSeriesV1[] {
  return result.samples.map((sample) => {
    const weatherSample = nearestWeather(weather?.samples ?? [], sample.at);
    const cloudLayers = weatherSample
      ? [weatherSample.cloudLowPercent, weatherSample.cloudMidPercent, weatherSample.cloudHighPercent]
        .filter((value): value is number => value != null)
      : [];
    const clouds = cloudLayers.length ? Math.max(...cloudLayers) : null;
    return {
      at: sample.at,
      hourLabel: new Date(sample.at).toISOString().slice(5, 16).replace("T", " "),
      altitudeDeg: sample.altitudeDeg,
      azimuthDeg: sample.azimuthDeg,
      airmass: sample.airmass,
      sunAltitudeDeg: sample.sunAltitudeDeg,
      moonAltitudeDeg: sample.moonAltitudeDeg,
      moonSeparationDeg: sample.moonSeparationDeg,
      moonIlluminationPercent: sample.moonIllumination * 100,
      cloudPercent: clouds,
      humidityPercent: weatherSample?.humidityPercent ?? null,
      visibilityKm: weatherSample?.visibilityM == null ? null : weatherSample.visibilityM / 1000,
      precipitationProbabilityPercent: weatherSample?.precipitationProbabilityPercent ?? null,
      windSpeedKmh: weatherSample?.windSpeedKmh ?? null,
    };
  });
}

export function createObservationPlannerViewModelV2(args: {
  status: ObservationPlannerViewModelV2["status"];
  observer: ObserverProfileV1;
  target: ObservationTargetV1 | null;
  targetBoundary: ObservationPlannerViewModelV2["targetBoundary"];
  result: ObservationPlanResult | null;
  fovProfile: TelescopeFovProfileV1;
  savedObserverCount: number;
  savedFovCount: number;
  weather: ObservationWeatherSnapshotV1 | null;
  error?: string;
}): ObservationPlannerViewModelV2 {
  return {
    version: OBSERVATION_PLANNER_V2_VERSION,
    status: args.status,
    observer: args.observer,
    target: args.target,
    targetBoundary: args.targetBoundary,
    result: args.result,
    chartSeries: args.result ? createObservationChartSeriesV1(args.result, args.weather) : [],
    fovProfile: args.fovProfile,
    fov: computeTelescopeFovV1(args.fovProfile),
    savedObserverCount: args.savedObserverCount,
    savedFovCount: args.savedFovCount,
    weather: args.weather,
    weatherCanonical: false,
    error: args.error ?? "",
  };
}

function exportEnvelope(
  result: ObservationPlanResult,
  fovProfile: TelescopeFovProfileV1,
  weather: ObservationWeatherSnapshotV1 | null,
) {
  return {
    version: OBSERVATION_PLANNER_V2_VERSION,
    engine: OBSERVATION_PLANNER_ENGINE,
    units: {
      angles: "degree",
      airmass: "relative-optical-airmass",
      elevation: "metre",
      time: "ISO-8601 UTC",
    },
    observer: result.request.observer,
    target: result.request.target,
    request: result.request,
    horizonMask: result.request.observer.horizonMask ?? null,
    fovProfile,
    result,
    weather,
    canonicalBoundary: {
      astronomy: "offline-deterministic-canonical",
      weather: weather ? "transient-non-canonical" : "not-requested",
      physicsMutation: "not-applied",
    },
  };
}

export function observationPlanToJsonV2(
  result: ObservationPlanResult,
  fovProfile: TelescopeFovProfileV1,
  weather: ObservationWeatherSnapshotV1 | null,
): string {
  return JSON.stringify(exportEnvelope(result, fovProfile, weather), null, 2);
}

function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  return /[",\r\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function observationPlanToCsvV2(
  result: ObservationPlanResult,
  weather: ObservationWeatherSnapshotV1 | null,
): string {
  const series = createObservationChartSeriesV1(result, weather);
  const header = [
    "at_iso", "altitude_deg", "azimuth_deg", "airmass", "sun_altitude_deg",
    "moon_altitude_deg", "moon_separation_deg", "moon_illumination_percent",
    "cloud_percent", "humidity_percent", "visibility_km",
    "precipitation_probability_percent", "wind_speed_kmh",
  ];
  const metadata = [
    `# engine=${OBSERVATION_PLANNER_ENGINE}`,
    `# observer=${csvCell(result.request.observer.name)}`,
    `# target=${csvCell(result.request.target.name)}`,
    `# timezone=${csvCell(result.request.observer.timeZone)}`,
    `# refraction=${result.request.refraction}`,
    `# weather=${weather ? "transient-non-canonical" : "not-requested"}`,
  ];
  return [...metadata, header.join(","), ...series.map((row) => [
    row.at, row.altitudeDeg, row.azimuthDeg, row.airmass, row.sunAltitudeDeg,
    row.moonAltitudeDeg, row.moonSeparationDeg, row.moonIlluminationPercent,
    row.cloudPercent, row.humidityPercent, row.visibilityKm,
    row.precipitationProbabilityPercent, row.windSpeedKmh,
  ].map(csvCell).join(","))].join("\n");
}

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function observationPlanToIcsV2(result: ObservationPlanResult): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Orbit Atlas//Observing Planner v266//ZH-CN",
    "CALSCALE:GREGORIAN",
    `X-ATLAS-ENGINE:${OBSERVATION_PLANNER_ENGINE}`,
    `X-ATLAS-TIMEZONE:${result.request.observer.timeZone}`,
    "X-ATLAS-WEATHER-BOUNDARY:transient-non-canonical-excluded",
  ];
  result.windows.forEach((window, index) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(result.request.target.id)}-${icsDate(window.start)}-${index}@orbit-atlas.local`,
      `DTSTAMP:${icsDate(result.request.startIso)}`,
      `DTSTART:${icsDate(window.start)}`,
      `DTEND:${icsDate(window.end)}`,
      `SUMMARY:Orbit Atlas - ${result.request.target.name}`,
      `DESCRIPTION:Peak altitude ${window.peakAltitudeDeg.toFixed(2)} deg; minimum airmass ${window.minimumAirmass?.toFixed(3) ?? "unavailable"}; observer ${result.request.observer.name}; refraction ${result.request.refraction}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
