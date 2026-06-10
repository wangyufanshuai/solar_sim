import type {
  MissionCcsdsExportOptions,
  MissionManeuverEvent,
  MissionPlan,
  MissionStateSample,
} from "./missionDesignerTypes";

const CAVEAT =
  "Preliminary mission-analysis exchange product. Not GMAT/STK/SPICE certification.";

function finite(value: number, digits = 12) {
  if (!Number.isFinite(value)) throw new Error("CCSDS export contains a non-finite value");
  return value.toFixed(digits);
}

function pad(value: number, width = 2) {
  return Math.trunc(value).toString().padStart(width, "0");
}

export function jdTdbToCcsdsEpoch(jd: number) {
  if (!Number.isFinite(jd)) throw new Error("Invalid TDB Julian date");
  const shifted = jd + 0.5;
  const z = Math.floor(shifted);
  const fraction = shifted - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const decimalDay = b - d - Math.floor(30.6001 * e) + fraction;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  const day = Math.floor(decimalDay);
  const secondsOfDay = (decimalDay - day) * 86400;
  const hour = Math.floor(secondsOfDay / 3600);
  const minute = Math.floor((secondsOfDay - hour * 3600) / 60);
  const second = secondsOfDay - hour * 3600 - minute * 60;
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${second.toFixed(3).padStart(6, "0")}`;
}

function creationDate() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function objectFields(plan: MissionPlan, options: MissionCcsdsExportOptions) {
  return {
    objectName: options.objectName ?? plan.name.replace(/[^A-Za-z0-9 _-]/g, ""),
    objectId: options.objectId ?? plan.id.replace(/[^A-Za-z0-9_-]/g, "-"),
    originator: options.originator ?? "SOLAR_SIM",
  };
}

function segmentSamples(plan: MissionPlan) {
  const samples = plan.cowellAudit?.stateHistory ?? [];
  if (samples.length === 0) {
    throw new Error("CCSDS export requires a completed Cowell state history");
  }
  return plan.segments.map((segment) => ({
    segment,
    samples: samples
      .filter((sample) => sample.segmentId === segment.id)
      .sort((a, b) => a.epochTdbJd - b.epochTdbJd),
  }));
}

function maneuverComment(events: MissionManeuverEvent[], epochTdbJd: number) {
  const nearby = events.filter((event) => Math.abs(event.epochTdbJd - epochTdbJd) < 1e-8);
  return nearby.map(
    (event) =>
      `COMMENT MANEUVER ${event.type.toUpperCase()} DV=${finite(event.deltaVMagnitudeKmS, 9)} km/s SOURCE=${event.source}`,
  );
}

export function missionPlanToCcsdsOem(
  plan: MissionPlan,
  options: MissionCcsdsExportOptions = {},
) {
  const fields = objectFields(plan, options);
  const events = plan.cowellAudit?.maneuverEvents ?? [];
  const lines = [
    "CCSDS_OEM_VERS = 3.0",
    `CREATION_DATE = ${creationDate()}`,
    `ORIGINATOR = ${fields.originator}`,
    `COMMENT ${CAVEAT}`,
    "COMMENT Position units are km; velocity units are km/s.",
  ];
  for (const { segment, samples } of segmentSamples(plan)) {
    if (samples.length < 2) throw new Error(`Cowell segment ${segment.id} has insufficient samples`);
    lines.push(
      "",
      "META_START",
      `OBJECT_NAME = ${fields.objectName}`,
      `OBJECT_ID = ${fields.objectId}`,
      "CENTER_NAME = SUN",
      "REF_FRAME = ECLIPJ2000",
      "TIME_SYSTEM = TDB",
      `START_TIME = ${jdTdbToCcsdsEpoch(samples[0]!.epochTdbJd)}`,
      `USEABLE_START_TIME = ${jdTdbToCcsdsEpoch(samples[0]!.epochTdbJd)}`,
      `USEABLE_STOP_TIME = ${jdTdbToCcsdsEpoch(samples.at(-1)!.epochTdbJd)}`,
      `STOP_TIME = ${jdTdbToCcsdsEpoch(samples.at(-1)!.epochTdbJd)}`,
      "INTERPOLATION = HERMITE",
      "INTERPOLATION_DEGREE = 5",
      `COMMENT LEG ${segment.fromBody.toUpperCase()}-${segment.toBody.toUpperCase()}`,
      "META_STOP",
    );
    for (const sample of samples) {
      lines.push(...maneuverComment(events, sample.epochTdbJd));
      lines.push([
        jdTdbToCcsdsEpoch(sample.epochTdbJd),
        ...sample.positionKm.map((value) => finite(value)),
        ...sample.velocityKmS.map((value) => finite(value)),
      ].join(" "));
    }
    if (segment.toBody === "venus" || segment.toBody === "jupiter") {
      lines.push(`COMMENT UNPOWERED_FLYBY ${segment.toBody.toUpperCase()} - no maneuver event emitted`);
    }
  }
  return `${lines.join("\n")}\n`;
}

const COVARIANCE_KEYS = [
  ["CX_X"],
  ["CY_X", "CY_Y"],
  ["CZ_X", "CZ_Y", "CZ_Z"],
  ["CX_DOT_X", "CX_DOT_Y", "CX_DOT_Z", "CX_DOT_X_DOT"],
  ["CY_DOT_X", "CY_DOT_Y", "CY_DOT_Z", "CY_DOT_X_DOT", "CY_DOT_Y_DOT"],
  ["CZ_DOT_X", "CZ_DOT_Y", "CZ_DOT_Z", "CZ_DOT_X_DOT", "CZ_DOT_Y_DOT", "CZ_DOT_Z_DOT"],
] as const;

function covarianceLines(matrix: number[][]) {
  const lines = ["COV_REF_FRAME = ECLIPJ2000"];
  for (let row = 0; row < 6; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      lines.push(`${COVARIANCE_KEYS[row]![column]} = ${finite(matrix[row]?.[column] ?? 0, 15)}`);
    }
  }
  return lines;
}

function maneuverLines(event: MissionManeuverEvent) {
  return [
    "",
    `COMMENT ${event.source}`,
    `MAN_EPOCH_IGNITION = ${jdTdbToCcsdsEpoch(event.epochTdbJd)}`,
    "MAN_DURATION = 0.0",
    `MAN_DELTA_MASS = ${finite(event.estimatedMassChangeKg, 9)}`,
    "MAN_REF_FRAME = ECLIPJ2000",
    `MAN_DV_1 = ${finite(event.deltaVVectorKmS[0], 12)}`,
    `MAN_DV_2 = ${finite(event.deltaVVectorKmS[1], 12)}`,
    `MAN_DV_3 = ${finite(event.deltaVVectorKmS[2], 12)}`,
  ];
}

export function missionPlanToCcsdsOpm(
  plan: MissionPlan,
  options: MissionCcsdsExportOptions = {},
) {
  const fields = objectFields(plan, options);
  const initial = segmentSamples(plan)[0]?.samples[0];
  if (!initial) throw new Error("CCSDS OPM export requires an initial Cowell state");
  const covariance = plan.covarianceAudit?.initialCovarianceKmKmS;
  if (!covariance) throw new Error("CCSDS OPM export requires an initial 6x6 covariance");
  const lines = [
    "CCSDS_OPM_VERS = 3.0",
    `CREATION_DATE = ${creationDate()}`,
    `ORIGINATOR = ${fields.originator}`,
    `COMMENT ${CAVEAT}`,
    "",
    "META_START",
    `OBJECT_NAME = ${fields.objectName}`,
    `OBJECT_ID = ${fields.objectId}`,
    "CENTER_NAME = SUN",
    "REF_FRAME = ECLIPJ2000",
    "TIME_SYSTEM = TDB",
    "META_STOP",
    "",
    `EPOCH = ${jdTdbToCcsdsEpoch(initial.epochTdbJd)}`,
    `X = ${finite(initial.positionKm[0])}`,
    `Y = ${finite(initial.positionKm[1])}`,
    `Z = ${finite(initial.positionKm[2])}`,
    `X_DOT = ${finite(initial.velocityKmS[0])}`,
    `Y_DOT = ${finite(initial.velocityKmS[1])}`,
    `Z_DOT = ${finite(initial.velocityKmS[2])}`,
    `MASS = ${finite(initial.massKg, 6)}`,
    "",
    ...covarianceLines(covariance),
  ];
  if (options.includeManeuvers !== false) {
    for (const event of plan.cowellAudit?.maneuverEvents ?? []) {
      lines.push(...maneuverLines(event));
    }
  }
  return `${lines.join("\n")}\n`;
}

export function validateCcsdsStateSamples(samples: MissionStateSample[]) {
  return samples.every((sample, index) => {
    const previous = samples[index - 1];
    return (
      Number.isFinite(sample.epochTdbJd) &&
      sample.positionKm.every(Number.isFinite) &&
      sample.velocityKmS.every(Number.isFinite) &&
      (!previous || sample.epochTdbJd > previous.epochTdbJd)
    );
  });
}
