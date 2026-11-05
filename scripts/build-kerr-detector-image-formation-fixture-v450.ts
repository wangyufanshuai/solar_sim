import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalPayloadV450,
  formKerrDetectorExpectedImageFixtureV450,
  type KerrDetectorExpectedImageInputV450,
} from "../app/lib/kerrDetectorExpectedImageFormationV450";

const root = process.cwd();
const outputRoot = "dist/science/kerr-detector-image-formation-v450";
const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, unknown>;
const sha = (value: unknown): string =>
  createHash("sha256").update(canonicalPayloadV450(value)).digest("hex");

const wcs = readJson(
  "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-availability.json",
);
const electron = readJson(
  "dist/science/kerr-detector-electron-kernel-v447/electron-kernel-qualification.json",
);
if (
  wcs.status !==
    "qualified-linear-wcs-coordinate-authority-detector-projection-blocked" ||
  !Array.isArray(wcs.rows) ||
  wcs.rows.length !== 4 ||
  electron.status !==
    "qualified-unit-strict-electron-expectation-kernel-fixture-only-measured-authority-unavailable" ||
  !Array.isArray(electron.rows) ||
  electron.rows.length !== 4
) {
  throw new Error("v450-fixture-source-boundary");
}

type WcsRow = {
  rayId: string;
  rayIndex: 12 | 13 | 14 | 15;
  continuousPixelX: number;
  continuousPixelY: number;
};
type ElectronRow = {
  fixtureId: string;
  rayIndex: 12 | 13 | 14 | 15;
  sourceExpectedElectrons: number;
  fixtureOnly: true;
  scienceRasterAllowed: false;
};

const inputs = (wcs.rows as WcsRow[]).map((wcsRow) => {
  const electronRow = (electron.rows as ElectronRow[]).find(
    (candidate) => candidate.rayIndex === wcsRow.rayIndex,
  );
  if (
    !electronRow ||
    electronRow.fixtureOnly !== true ||
    electronRow.scienceRasterAllowed !== false
  ) {
    throw new Error(`v450-electron-row-missing:${wcsRow.rayIndex}`);
  }
  return {
    sourceKind: "test-fixture",
    fixtureId: `v450-ray-${wcsRow.rayIndex}`,
    rayId: wcsRow.rayId,
    rayIndex: wcsRow.rayIndex,
    width: 384,
    height: 384,
    pixelConvention: "FITS-one-based-continuous-pixel-centers",
    continuousPixelX: wcsRow.continuousPixelX,
    continuousPixelY: wcsRow.continuousPixelY,
    sourceExpectedElectrons: electronRow.sourceExpectedElectrons,
  } satisfies KerrDetectorExpectedImageInputV450;
});
const rows = inputs.map(formKerrDetectorExpectedImageFixtureV450);
const replay = inputs.map(formKerrDetectorExpectedImageFixtureV450);
if (sha(rows) !== sha(replay)) throw new Error("v450-fixture-ab-determinism");

const fixture = {
  version: "v450-kerr-detector-expected-image-fixture-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: "sparse-expected-electron-image-fixture-only",
  source: {
    v441ArtifactSha256: wcs.artifactSha256,
    v447ArtifactSha256: electron.artifactSha256,
  },
  inputs,
  rows,
  deterministicReplay: true,
  measuredDetectorGeometryAvailable: false,
  psfAvailable: false,
  pixelResponseAvailable: false,
  scienceRasterAllowed: false,
  observedImageAvailable: false,
};
const target = resolve(root, outputRoot, "typescript-formation.json");
mkdirSync(dirname(target), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
renameSync(part, target);
console.log(
  JSON.stringify(
    {
      status: fixture.status,
      sourceRows: rows.length,
      sparseDeposits: rows.reduce((sum, row) => sum + row.deposits.length, 0),
      maximumWeightResidual: Math.max(
        ...rows.map((row) => row.weightConservationAbsolute),
      ),
      maximumElectronResidual: Math.max(
        ...rows.map((row) => row.electronConservationRelative),
      ),
      scienceRasterRows: 0,
    },
    null,
    2,
  ),
);
