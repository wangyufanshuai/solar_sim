import * as Astronomy from "astronomy-engine";

export const OBSERVATION_PLANNER_VERSION = "v258-observing-planner-v1" as const;
export const OBSERVATION_PLANNER_ENGINE = "astronomy-engine@2.1.19" as const;

export type ObserverProfileV1 = {
  version: "observer-profile-v1";
  id: string;
  name: string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationM: number;
  timeZone: string;
  source: "manual" | "browser-geolocation" | "place-search";
  horizonMask?: readonly HorizonMaskPointV1[];
};

export type HorizonMaskPointV1 = {
  azimuthDeg: number;
  altitudeDeg: number;
};

export type ObservationTargetV1 = {
  id: string;
  name: string;
  raDeg: number;
  decDeg: number;
  epochJulianYear?: number;
  pmRaMasYr?: number | null;
  pmDecMasYr?: number | null;
};

export type ObservationPlanRequest = {
  observer: ObserverProfileV1;
  target: ObservationTargetV1;
  startIso: string;
  durationHours: 24 | 48 | 72;
  sampleMinutes?: number;
  refraction: boolean;
  maxAirmass?: number;
};

export type ObservationPlanSampleV1 = {
  at: string;
  altitudeDeg: number;
  azimuthDeg: number;
  horizonAltitudeDeg: number;
  aboveHorizonMask: boolean;
  airmass: number | null;
  sunAltitudeDeg: number;
  twilight: "day" | "civil" | "nautical" | "astronomical" | "dark";
  moonAltitudeDeg: number;
  moonSeparationDeg: number;
  moonIllumination: number;
  observable: boolean;
};

export type ObservationWindowV1 = {
  start: string;
  end: string;
  durationMinutes: number;
  peakAltitudeDeg: number;
  minimumAirmass: number | null;
};

export type ObservationEventV1 = {
  type: "rise" | "transit" | "set" | "civil-dusk" | "nautical-dusk" | "astronomical-dusk" | "astronomical-dawn" | "nautical-dawn" | "civil-dawn";
  at: string;
  altitudeDeg: number;
};

export type ObservationPlanResult = {
  version: typeof OBSERVATION_PLANNER_VERSION;
  engine: typeof OBSERVATION_PLANNER_ENGINE;
  canonical: true;
  request: ObservationPlanRequest;
  samples: readonly ObservationPlanSampleV1[];
  events: readonly ObservationEventV1[];
  windows: readonly ObservationWindowV1[];
  bestWindow: ObservationWindowV1 | null;
  boundary: "offline-deterministic-astronomy-weather-excluded";
};

export type TelescopeFovProfileV1 = {
  name: string;
  focalLengthMm: number;
  sensorWidthMm?: number;
  sensorHeightMm?: number;
  pixelSizeMicron?: number;
  eyepieceFocalLengthMm?: number;
  eyepieceApparentFovDeg?: number;
  rotationDeg: number;
};

export type TelescopeFovResultV1 = {
  widthDeg: number;
  heightDeg: number;
  arcsecPerPixel: number | null;
  magnification: number | null;
  rotationDeg: number;
};

function finite(value: number): boolean {
  return Number.isFinite(value);
}

export function validateObserverProfileV1(profile: ObserverProfileV1): ObserverProfileV1 {
  if (
    profile.version !== "observer-profile-v1" ||
    !profile.id.trim() ||
    !profile.name.trim() ||
    !finite(profile.latitudeDeg) ||
    profile.latitudeDeg < -90 ||
    profile.latitudeDeg > 90 ||
    !finite(profile.longitudeDeg) ||
    profile.longitudeDeg < -180 ||
    profile.longitudeDeg > 180 ||
    !finite(profile.elevationM) ||
    profile.elevationM < -500 ||
    profile.elevationM > 10_000 ||
    !profile.timeZone.trim()
  ) {
    throw new Error("Observer profile violates the v1 geographic contract");
  }
  if (profile.horizonMask) normalizeHorizonMaskV1(profile.horizonMask);
  return profile;
}

export function parseHorizonMaskCsvV1(csv: string): HorizonMaskPointV1[] {
  const points = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line, index) => {
      const [azimuth, altitude, ...rest] = line.split(",").map((value) => value.trim());
      const azimuthDeg = Number(azimuth);
      const altitudeDeg = Number(altitude);
      if (rest.length > 0 || !finite(azimuthDeg) || !finite(altitudeDeg)) {
        throw new Error(`Invalid horizon mask row ${index + 1}`);
      }
      return { azimuthDeg, altitudeDeg };
    });
  return normalizeHorizonMaskV1(points);
}

export function normalizeHorizonMaskV1(
  points: readonly HorizonMaskPointV1[],
): HorizonMaskPointV1[] {
  if (points.length < 2) throw new Error("Horizon mask requires at least two points");
  const normalized = points.map((point) => ({
    azimuthDeg: ((point.azimuthDeg % 360) + 360) % 360,
    altitudeDeg: point.altitudeDeg,
  }));
  if (normalized.some((point) => !finite(point.altitudeDeg) || point.altitudeDeg < -20 || point.altitudeDeg > 90)) {
    throw new Error("Horizon mask altitude must be in [-20, 90]");
  }
  normalized.sort((left, right) => left.azimuthDeg - right.azimuthDeg || left.altitudeDeg - right.altitudeDeg);
  if (normalized.some((point, index) => index > 0 && point.azimuthDeg === normalized[index - 1]!.azimuthDeg)) {
    throw new Error("Horizon mask azimuths must be unique");
  }
  return normalized;
}

export function horizonAltitudeAtAzimuthV1(
  mask: readonly HorizonMaskPointV1[] | undefined,
  azimuthDeg: number,
): number {
  if (!mask?.length) return 0;
  const points = normalizeHorizonMaskV1(mask);
  const azimuth = ((azimuthDeg % 360) + 360) % 360;
  for (let index = 0; index < points.length; index += 1) {
    const left = points[index]!;
    const right = points[(index + 1) % points.length]!;
    const rightAzimuth = index + 1 < points.length ? right.azimuthDeg : right.azimuthDeg + 360;
    const adjusted = azimuth < left.azimuthDeg ? azimuth + 360 : azimuth;
    if (adjusted >= left.azimuthDeg && adjusted <= rightAzimuth) {
      const span = rightAzimuth - left.azimuthDeg;
      const t = span > 0 ? (adjusted - left.azimuthDeg) / span : 0;
      return left.altitudeDeg + (right.altitudeDeg - left.altitudeDeg) * t;
    }
  }
  return points[0]!.altitudeDeg;
}

export function kastenYoungAirmassV1(altitudeDeg: number): number | null {
  if (!finite(altitudeDeg) || altitudeDeg <= -5) return null;
  const zenithDeg = 90 - altitudeDeg;
  const denominator =
    Math.cos((zenithDeg * Math.PI) / 180) +
    0.50572 * Math.pow(96.07995 - zenithDeg, -1.6364);
  return denominator > 0 ? 1 / denominator : null;
}

export function computeTelescopeFovV1(profile: TelescopeFovProfileV1): TelescopeFovResultV1 {
  if (!(finite(profile.focalLengthMm) && profile.focalLengthMm > 0)) {
    throw new RangeError("Focal length must be positive");
  }
  const sensorWidth = profile.sensorWidthMm ?? 0;
  const sensorHeight = profile.sensorHeightMm ?? 0;
  const eyepieceFocal = profile.eyepieceFocalLengthMm ?? 0;
  const apparentFov = profile.eyepieceApparentFovDeg ?? 0;
  const widthDeg = sensorWidth > 0
    ? (2 * Math.atan(sensorWidth / (2 * profile.focalLengthMm)) * 180) / Math.PI
    : eyepieceFocal > 0 && apparentFov > 0
      ? apparentFov / (profile.focalLengthMm / eyepieceFocal)
      : 0;
  const heightDeg = sensorHeight > 0
    ? (2 * Math.atan(sensorHeight / (2 * profile.focalLengthMm)) * 180) / Math.PI
    : widthDeg;
  const arcsecPerPixel = profile.pixelSizeMicron && profile.pixelSizeMicron > 0
    ? (206.265 * profile.pixelSizeMicron) / profile.focalLengthMm
    : null;
  return {
    widthDeg,
    heightDeg,
    arcsecPerPixel,
    magnification: eyepieceFocal > 0 ? profile.focalLengthMm / eyepieceFocal : null,
    rotationDeg: ((profile.rotationDeg % 360) + 360) % 360,
  };
}

function julianYear(date: Date): number {
  return 2000 + (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 86_400_000);
}

function targetEquatorialOfDate(
  target: ObservationTargetV1,
  date: Date,
): { raHours: number; decDeg: number } {
  const years = julianYear(date) - (target.epochJulianYear ?? 2000);
  const decJ2000 = target.decDeg + ((target.pmDecMasYr ?? 0) * years) / 3_600_000;
  const cosDec = Math.max(1e-6, Math.cos((target.decDeg * Math.PI) / 180));
  const raJ2000 = target.raDeg + ((target.pmRaMasYr ?? 0) * years) / (3_600_000 * cosDec);
  const vector = Astronomy.VectorFromSphere(
    new Astronomy.Spherical(decJ2000, ((raJ2000 % 360) + 360) % 360, 1),
    date,
  );
  const rotated = Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(date), vector);
  const spherical = Astronomy.SphereFromVector(rotated);
  return { raHours: spherical.lon / 15, decDeg: spherical.lat };
}

function angularSeparationDeg(
  leftRaHours: number,
  leftDecDeg: number,
  rightRaHours: number,
  rightDecDeg: number,
): number {
  const leftRa = (leftRaHours * 15 * Math.PI) / 180;
  const rightRa = (rightRaHours * 15 * Math.PI) / 180;
  const leftDec = (leftDecDeg * Math.PI) / 180;
  const rightDec = (rightDecDeg * Math.PI) / 180;
  const dot =
    Math.sin(leftDec) * Math.sin(rightDec) +
    Math.cos(leftDec) * Math.cos(rightDec) * Math.cos(leftRa - rightRa);
  return (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
}

function twilightForSunAltitude(altitudeDeg: number): ObservationPlanSampleV1["twilight"] {
  if (altitudeDeg >= 0) return "day";
  if (altitudeDeg >= -6) return "civil";
  if (altitudeDeg >= -12) return "nautical";
  if (altitudeDeg >= -18) return "astronomical";
  return "dark";
}

function sampleAt(
  request: ObservationPlanRequest,
  observer: Astronomy.Observer,
  date: Date,
): ObservationPlanSampleV1 {
  const target = targetEquatorialOfDate(request.target, date);
  const targetHorizontal = Astronomy.Horizon(
    date,
    observer,
    target.raHours,
    target.decDeg,
    request.refraction ? "normal" : undefined,
  );
  const sunEq = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
  const sunHorizontal = Astronomy.Horizon(date, observer, sunEq.ra, sunEq.dec);
  const moonEq = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true);
  const moonHorizontal = Astronomy.Horizon(date, observer, moonEq.ra, moonEq.dec);
  const moonIllumination = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction;
  const horizonAltitudeDeg = horizonAltitudeAtAzimuthV1(request.observer.horizonMask, targetHorizontal.azimuth);
  const airmass = kastenYoungAirmassV1(targetHorizontal.altitude);
  const aboveHorizonMask = targetHorizontal.altitude >= horizonAltitudeDeg;
  return {
    at: date.toISOString(),
    altitudeDeg: targetHorizontal.altitude,
    azimuthDeg: targetHorizontal.azimuth,
    horizonAltitudeDeg,
    aboveHorizonMask,
    airmass,
    sunAltitudeDeg: sunHorizontal.altitude,
    twilight: twilightForSunAltitude(sunHorizontal.altitude),
    moonAltitudeDeg: moonHorizontal.altitude,
    moonSeparationDeg: angularSeparationDeg(target.raHours, target.decDeg, moonEq.ra, moonEq.dec),
    moonIllumination,
    observable:
      aboveHorizonMask &&
      sunHorizontal.altitude <= -18 &&
      airmass !== null &&
      airmass <= (request.maxAirmass ?? 3),
  };
}

function observationWindows(samples: readonly ObservationPlanSampleV1[]): ObservationWindowV1[] {
  const windows: ObservationWindowV1[] = [];
  let start = -1;
  for (let index = 0; index <= samples.length; index += 1) {
    const observable = index < samples.length && samples[index]!.observable;
    if (observable && start < 0) start = index;
    if (!observable && start >= 0) {
      const slice = samples.slice(start, index);
      const first = slice[0]!;
      const last = slice.at(-1)!;
      const finiteAirmass = slice.map((sample) => sample.airmass).filter((value): value is number => value !== null);
      windows.push({
        start: first.at,
        end: last.at,
        durationMinutes: Math.max(0, (Date.parse(last.at) - Date.parse(first.at)) / 60_000),
        peakAltitudeDeg: Math.max(...slice.map((sample) => sample.altitudeDeg)),
        minimumAirmass: finiteAirmass.length ? Math.min(...finiteAirmass) : null,
      });
      start = -1;
    }
  }
  return windows;
}

function refineCrossing(
  leftIso: string,
  rightIso: string,
  valueAt: (date: Date) => number,
): Date {
  let left = Date.parse(leftIso);
  let right = Date.parse(rightIso);
  let leftValue = valueAt(new Date(left));
  for (let iteration = 0; iteration < 24 && right - left > 250; iteration += 1) {
    const middle = (left + right) / 2;
    const middleValue = valueAt(new Date(middle));
    if ((leftValue <= 0 && middleValue >= 0) || (leftValue >= 0 && middleValue <= 0)) {
      right = middle;
    } else {
      left = middle;
      leftValue = middleValue;
    }
  }
  return new Date((left + right) / 2);
}

function refineTransit(
  request: ObservationPlanRequest,
  observer: Astronomy.Observer,
  leftIso: string,
  rightIso: string,
): ObservationPlanSampleV1 {
  let left = Date.parse(leftIso);
  let right = Date.parse(rightIso);
  for (let iteration = 0; iteration < 24 && right - left > 250; iteration += 1) {
    const first = left + (right - left) / 3;
    const second = right - (right - left) / 3;
    if (sampleAt(request, observer, new Date(first)).altitudeDeg < sampleAt(request, observer, new Date(second)).altitudeDeg) {
      left = first;
    } else {
      right = second;
    }
  }
  return sampleAt(request, observer, new Date((left + right) / 2));
}

function deriveEvents(
  request: ObservationPlanRequest,
  observer: Astronomy.Observer,
  samples: readonly ObservationPlanSampleV1[],
): ObservationEventV1[] {
  const events: ObservationEventV1[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    const previousClearance = previous.altitudeDeg - previous.horizonAltitudeDeg;
    const currentClearance = current.altitudeDeg - current.horizonAltitudeDeg;
    if ((previousClearance < 0 && currentClearance >= 0) || (previousClearance >= 0 && currentClearance < 0)) {
      const at = refineCrossing(previous.at, current.at, (date) => {
        const sample = sampleAt(request, observer, date);
        return sample.altitudeDeg - sample.horizonAltitudeDeg;
      });
      const sample = sampleAt(request, observer, at);
      events.push({
        type: previousClearance < 0 ? "rise" : "set",
        at: at.toISOString(),
        altitudeDeg: sample.altitudeDeg,
      });
    }
    for (const [threshold, dusk, dawn] of [
      [-6, "civil-dusk", "civil-dawn"],
      [-12, "nautical-dusk", "nautical-dawn"],
      [-18, "astronomical-dusk", "astronomical-dawn"],
    ] as const) {
      if (
        (previous.sunAltitudeDeg > threshold && current.sunAltitudeDeg <= threshold) ||
        (previous.sunAltitudeDeg <= threshold && current.sunAltitudeDeg > threshold)
      ) {
        const at = refineCrossing(
          previous.at,
          current.at,
          (date) => sampleAt(request, observer, date).sunAltitudeDeg - threshold,
        );
        const altitudeDeg = sampleAt(request, observer, at).sunAltitudeDeg;
        events.push({
          type: previous.sunAltitudeDeg > threshold ? dusk : dawn,
          at: at.toISOString(),
          altitudeDeg,
        });
      }
    }
  }
  for (let index = 1; index + 1 < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    const next = samples[index + 1]!;
    if (current.altitudeDeg >= previous.altitudeDeg && current.altitudeDeg > next.altitudeDeg) {
      const transit = refineTransit(request, observer, previous.at, next.at);
      events.push({ type: "transit", at: transit.at, altitudeDeg: transit.altitudeDeg });
    }
  }
  return events.sort((left, right) => left.at.localeCompare(right.at));
}

export function createObservationPlanV1(request: ObservationPlanRequest): ObservationPlanResult {
  validateObserverProfileV1(request.observer);
  const start = new Date(request.startIso);
  if (!finite(start.getTime())) throw new Error("Observation plan start time is invalid");
  if (![24, 48, 72].includes(request.durationHours)) throw new Error("Observation duration must be 24, 48 or 72 hours");
  if (!finite(request.target.raDeg) || !finite(request.target.decDeg) || request.target.decDeg < -90 || request.target.decDeg > 90) {
    throw new Error("Observation target coordinates are invalid");
  }
  const sampleMinutes = request.sampleMinutes ?? 10;
  if (!(Number.isInteger(sampleMinutes) && sampleMinutes >= 1 && sampleMinutes <= 60)) {
    throw new Error("Observation sample cadence must be 1-60 minutes");
  }
  const observer = new Astronomy.Observer(
    request.observer.latitudeDeg,
    request.observer.longitudeDeg,
    request.observer.elevationM,
  );
  const count = Math.floor((request.durationHours * 60) / sampleMinutes) + 1;
  const samples = Array.from({ length: count }, (_, index) =>
    sampleAt(request, observer, new Date(start.getTime() + index * sampleMinutes * 60_000)),
  );
  const windows = observationWindows(samples);
  const bestWindow = [...windows].sort(
    (left, right) => right.durationMinutes - left.durationMinutes || right.peakAltitudeDeg - left.peakAltitudeDeg,
  )[0] ?? null;
  return {
    version: OBSERVATION_PLANNER_VERSION,
    engine: OBSERVATION_PLANNER_ENGINE,
    canonical: true,
    request: { ...request, sampleMinutes },
    samples,
    events: deriveEvents(request, observer, samples),
    windows,
    bestWindow,
    boundary: "offline-deterministic-astronomy-weather-excluded",
  };
}
