import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const manifestPath = resolve(root, "public/data/spice-ephemeris-v1-manifest.json");
const libraryPath = resolve(root, "public/data/low-thrust-solution-library-v1.json");
const fail = (message) => {
  console.error(`FAIL SPICE audit: ${message}`);
  process.exit(1);
};

if (!existsSync(manifestPath)) fail("manifest missing");
if (!existsSync(libraryPath)) fail("low-thrust solution library missing");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const binaryPath = resolve(root, "public", manifest.binaryPath.replace(/^\//, ""));
if (!existsSync(binaryPath)) fail("binary table missing");
const binary = readFileSync(binaryPath);
const checksum = createHash("sha256").update(binary).digest("hex");
if (checksum !== manifest.binarySha256) fail("binary checksum mismatch");
const expectedBytes =
  manifest.bodyOrder.length * manifest.rowCount * manifest.componentsPerRow * Float64Array.BYTES_PER_ELEMENT;
if (binary.length !== expectedBytes) fail(`binary size ${binary.length} != ${expectedBytes}`);
if (manifest.stepDays !== 0.25 || manifest.stopSimDay !== 4200) fail("coverage or step mismatch");
for (const body of ["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn"]) {
  if (!manifest.bodyOrder.includes(body)) fail(`missing body ${body}`);
}
const library = JSON.parse(readFileSync(libraryPath, "utf8"));
if (!Array.isArray(library.solutions) || library.solutions.length < 3) fail("solution library incomplete");
for (const solution of library.solutions) {
  if (!["converged", "seed", "failed", "unavailable"].includes(solution.status)) {
    fail(`missing low-thrust status ${solution.id}`);
  }
  if (solution.status !== "converged" && solution.converged) {
    fail(`non-converged status marked converged ${solution.id}`);
  }
  if (solution.status === "converged") {
    if (!solution.converged) fail(`converged status without converged flag ${solution.id}`);
    if (solution.terminalPositionErrorKm >= 1000) fail(`terminal position error ${solution.id}`);
    if (solution.terminalVelocityErrorMps >= 10) fail(`terminal velocity error ${solution.id}`);
    if ((solution.terminalResidual?.positionKm ?? Infinity) >= 1000) {
      fail(`terminal residual position error ${solution.id}`);
    }
    if ((solution.terminalResidual?.velocityMps ?? Infinity) >= 10) {
      fail(`terminal residual velocity error ${solution.id}`);
    }
  }
  if (solution.status === "seed" && !solution.unavailableReason) {
    fail(`seed record missing unavailable reason ${solution.id}`);
  }
}
console.log(
  `PASS SPICE audit: ${manifest.bodyOrder.length} bodies, ${manifest.rowCount} rows/body, ${(statSync(binaryPath).size / 1024 / 1024).toFixed(1)} MB, ${library.solutions.length} low-thrust records`,
);
