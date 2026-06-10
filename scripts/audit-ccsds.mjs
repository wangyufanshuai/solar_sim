import { readFile } from "node:fs/promises";

const oemPath = process.argv[2] ?? "public/data/ccsds-demo/solar-sim-demo.oem";
const opmPath = process.argv[3] ?? "public/data/ccsds-demo/solar-sim-demo.opm";
const failures = [];

function requireLine(text, value, label) {
  if (!text.includes(value)) failures.push(`${label} missing ${value}`);
}

function auditLines(text, label) {
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (line.length > 254) failures.push(`${label} line ${index + 1} exceeds 254 characters`);
  }
}

const [oem, opm] = await Promise.all([readFile(oemPath, "utf8"), readFile(opmPath, "utf8")]);
for (const value of [
  "CCSDS_OEM_VERS = 3.0",
  "CENTER_NAME = SUN",
  "REF_FRAME = ECLIPJ2000",
  "TIME_SYSTEM = TDB",
  "INTERPOLATION = HERMITE",
]) requireLine(oem, value, "OEM");
for (const value of [
  "CCSDS_OPM_VERS = 3.0",
  "CENTER_NAME = SUN",
  "REF_FRAME = ECLIPJ2000",
  "TIME_SYSTEM = TDB",
  "COV_REF_FRAME = ECLIPJ2000",
  "MAN_EPOCH_IGNITION",
  "MAN_REF_FRAME = ECLIPJ2000",
]) requireLine(opm, value, "OPM");
auditLines(oem, "OEM");
auditLines(opm, "OPM");

const stateLines = oem.split(/\r?\n/).filter((line) => /^\d{4}-\d{2}-\d{2}T/.test(line));
if (stateLines.length < 2) failures.push("OEM must contain at least two state vectors");
const epochs = stateLines.map((line) => line.split(/\s+/)[0]);
if (!epochs.every((epoch, index) => index === 0 || epoch > epochs[index - 1])) {
  failures.push("OEM epochs must be strictly increasing");
}
for (const [index, line] of stateLines.entries()) {
  const fields = line.trim().split(/\s+/);
  if (fields.length !== 7) failures.push(`OEM state ${index + 1} must contain epoch plus six values`);
  if (!fields.slice(1).every((value) => Number.isFinite(Number(value)))) {
    failures.push(`OEM state ${index + 1} contains a non-finite value`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`PASS CCSDS OEM/OPM 3.0 audit: ${stateLines.length} OEM states`);
