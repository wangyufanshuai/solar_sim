import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type {
  KerrFitsHeaderCardV456,
  KerrSparseCoordinateRowV456,
} from "../app/lib/kerrSparseScienceImageEnvelopeV456";

const root = process.cwd();
const wcs = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-availability.json",
    ),
    "utf8",
  ),
);
const v455 = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/kerr-detector-robust-coadd-v455/robust-coadd-qualification.json",
    ),
    "utf8",
  ),
);
if (
  wcs.status !==
    "qualified-linear-wcs-coordinate-authority-detector-projection-blocked" ||
  wcs.rows?.length !== 4 ||
  v455.status !==
    "qualified-mask-provenance-robust-coadd-fixture-only-measured-image-unavailable"
) {
  throw new Error("v456-header-source-boundary");
}

const cards: KerrFitsHeaderCardV456[] = [
  { keyword: "SIMPLE", value: true, comment: "FITS standard header fixture" },
  { keyword: "BITPIX", value: -64, comment: "Future floating-point electron raster" },
  { keyword: "NAXIS", value: 2, comment: "Proposed image axes; no HDU emitted" },
  { keyword: "NAXIS1", value: 384, comment: "Proposed detector width" },
  { keyword: "NAXIS2", value: 384, comment: "Proposed detector height" },
  { keyword: "EXTEND", value: true, comment: "Extensions permitted by future authority" },
  { keyword: "BUNIT", value: "electron", comment: "Future calibrated signal unit" },
  { keyword: "WCSNAME", value: wcs.wcs.name, comment: "Finite-distance ZAMO linear WCS" },
  { keyword: "CTYPE1", value: wcs.wcs.ctype1, comment: "Kerr alpha linear axis" },
  { keyword: "CTYPE2", value: wcs.wcs.ctype2, comment: "Kerr beta linear axis" },
  { keyword: "CNAME1", value: wcs.wcs.cname1, comment: "Kerr alpha coordinate" },
  { keyword: "CNAME2", value: wcs.wcs.cname2, comment: "Kerr beta coordinate" },
  { keyword: "CRPIX1", value: wcs.wcs.crpix1, comment: "Reference pixel X, FITS one-based" },
  { keyword: "CRPIX2", value: wcs.wcs.crpix2, comment: "Reference pixel Y, FITS one-based" },
  { keyword: "CRVAL1", value: wcs.wcs.crval1M, comment: "Reference Kerr alpha" },
  { keyword: "CRVAL2", value: wcs.wcs.crval2M, comment: "Reference Kerr beta" },
  { keyword: "CDELT1", value: wcs.wcs.cdelt1MPerPixel, comment: "Kerr alpha per pixel" },
  { keyword: "CDELT2", value: wcs.wcs.cdelt2MPerPixel, comment: "Kerr beta per pixel" },
  { keyword: "PROVSHA", value: v455.artifactSha256, comment: "" },
  { keyword: "QUALSTAT", value: "PIXELS-BLOCKED", comment: "No detector-value authority" },
  { keyword: "DENSESTA", value: "INCOMPLETE-0-OF-49", comment: "Dense Kerr campaign state" },
  { keyword: "ORIGIN", value: "Orbit Atlas local-shadow", comment: "Local research candidate only" },
];
const coordinateRows: KerrSparseCoordinateRowV456[] = wcs.rows.map(
  (row: {
    rayId: string;
    rayIndex: 12 | 13 | 14 | 15;
    continuousPixelX: number;
    continuousPixelY: number;
  }) => ({
    rayId: row.rayId,
    rayIndex: row.rayIndex,
    continuousPixelX: row.continuousPixelX,
    continuousPixelY: row.continuousPixelY,
    coordinateAuthority: true,
    valueAuthority: false,
  }),
);
const fixture = {
  version: "v456-kerr-sparse-science-image-header-fixture-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: "fits-header-and-sparse-coordinate-fixture-no-hdu",
  headerCards: cards,
  coordinateRows,
  worldRows: wcs.rows.map(
    (row: { rayId: string; alphaM: number; betaM: number }) => ({
      rayId: row.rayId,
      alphaM: row.alphaM,
      betaM: row.betaM,
    }),
  ),
  fitsHduEmitted: false,
  fitsFileEmitted: false,
  pngEmitted: false,
  sparseValueRows: 0,
  scienceRasterAllowed: false,
};
const target = resolve(
  root,
  "dist/science/kerr-sparse-science-image-v456/header-fixture.json",
);
mkdirSync(dirname(target), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
renameSync(part, target);
console.log(
  JSON.stringify(
    {
      status: fixture.status,
      headerCards: cards.length,
      coordinateRows: 4,
      sparseValueRows: 0,
      fitsHduEmitted: false,
      pngEmitted: false,
    },
    null,
    2,
  ),
);
