import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = process.argv[2] ?? "public/data/ccsds-demo";
const epochs = [
  "2026-06-10T00:00:00.000",
  "2026-06-11T00:00:00.000",
  "2026-06-12T00:00:00.000",
];
const states = [
  [149597870.7, 0, 0, 0, 29.7846918, 0],
  [149575696.1, 2573104.8, 0, -0.5124, 29.7802, 0],
  [149509179.4, 5145446.5, 0, -1.0246, 29.7668, 0],
];
const header = [
  "CREATION_DATE = 2026-06-10T00:00:00Z",
  "ORIGINATOR = SOLAR_SIM",
  "COMMENT Preliminary mission-analysis exchange product. Not GMAT/STK/SPICE certification.",
];
const metadata = [
  "META_START",
  "OBJECT_NAME = SOLAR_SIM_DEMO",
  "OBJECT_ID = SOLAR-SIM-DEMO",
  "CENTER_NAME = SUN",
  "REF_FRAME = ECLIPJ2000",
  "TIME_SYSTEM = TDB",
  `START_TIME = ${epochs[0]}`,
  `USEABLE_START_TIME = ${epochs[0]}`,
  `USEABLE_STOP_TIME = ${epochs.at(-1)}`,
  `STOP_TIME = ${epochs.at(-1)}`,
  "INTERPOLATION = HERMITE",
  "INTERPOLATION_DEGREE = 5",
  "META_STOP",
];
const oem = [
  "CCSDS_OEM_VERS = 3.0",
  ...header,
  ...metadata,
  ...states.map((state, index) =>
    [epochs[index], ...state.map((value) => value.toFixed(9))].join(" "),
  ),
  "",
].join("\n");
const opm = [
  "CCSDS_OPM_VERS = 3.0",
  ...header,
  "META_START",
  "OBJECT_NAME = SOLAR_SIM_DEMO",
  "OBJECT_ID = SOLAR-SIM-DEMO",
  "CENTER_NAME = SUN",
  "REF_FRAME = ECLIPJ2000",
  "TIME_SYSTEM = TDB",
  "META_STOP",
  `EPOCH = ${epochs[0]}`,
  `X = ${states[0][0]}`,
  `Y = ${states[0][1]}`,
  `Z = ${states[0][2]}`,
  `X_DOT = ${states[0][3]}`,
  `Y_DOT = ${states[0][4]}`,
  `Z_DOT = ${states[0][5]}`,
  "MASS = 7200.0",
  "COV_REF_FRAME = ECLIPJ2000",
  "CX_X = 64.0",
  "CY_X = 0.0",
  "CY_Y = 64.0",
  "CZ_X = 0.0",
  "CZ_Y = 0.0",
  "CZ_Z = 64.0",
  "CX_DOT_X = 0.0",
  "CX_DOT_Y = 0.0",
  "CX_DOT_Z = 0.0",
  "CX_DOT_X_DOT = 0.000000000064",
  "CY_DOT_X = 0.0",
  "CY_DOT_Y = 0.0",
  "CY_DOT_Z = 0.0",
  "CY_DOT_X_DOT = 0.0",
  "CY_DOT_Y_DOT = 0.000000000064",
  "CZ_DOT_X = 0.0",
  "CZ_DOT_Y = 0.0",
  "CZ_DOT_Z = 0.0",
  "CZ_DOT_X_DOT = 0.0",
  "CZ_DOT_Y_DOT = 0.0",
  "CZ_DOT_Z_DOT = 0.000000000064",
  `MAN_EPOCH_IGNITION = ${epochs[0]}`,
  "MAN_DURATION = 0.0",
  "MAN_DELTA_MASS = -120.0",
  "MAN_REF_FRAME = ECLIPJ2000",
  "MAN_DV_1 = 0.0",
  "MAN_DV_2 = 3.2",
  "MAN_DV_3 = 0.0",
  "",
].join("\n");

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "solar-sim-demo.oem"), oem);
await writeFile(path.join(outputDir, "solar-sim-demo.opm"), opm);
console.log(`Wrote ${outputDir}/solar-sim-demo.oem and .opm`);
