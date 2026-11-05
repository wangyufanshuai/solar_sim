from __future__ import annotations

import csv
import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import numpy as np
from astropy.io import fits

ROOT = Path.cwd()
V537_ATLAS = ROOT / "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json"
V537_FITS = ROOT / "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits"
V536_ATLAS = ROOT / "dist/science/kerr-response-aware-sparse-image-v536/atlas.json"
OUT_DIR = ROOT / "dist/science/kerr-response-aware-fits-column-schema-v538"
ATLAS_PATH = OUT_DIR / "atlas.json"
CSV_PATH = OUT_DIR / "column-schema.csv"
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256"}

COLUMNS: list[dict[str, Any]] = [
    {"name": "RAY_ID", "format": "16A", "fitsUnit": None, "unitSemantic": "not-applicable-identifier", "valueKind": "ascii-string", "semantic": "canonical sparse authority ray identifier", "applicability": "all-four-disk-hit-rays", "missingness": "required-nonempty-no-null-sentinel", "domain": "disk-00-through-disk-03"},
    {"name": "RAY_INDEX", "format": "J", "fitsUnit": None, "unitSemantic": "not-applicable-index", "valueKind": "signed-int32", "semantic": "v296/v536 canonical ray index", "applicability": "all-four-disk-hit-rays", "missingness": "required-no-null-sentinel", "domain": "integer-12-through-15"},
    {"name": "SPIN_A", "format": "D", "fitsUnit": None, "unitSemantic": "dimensionless-a-over-M", "valueKind": "float64", "semantic": "signed Kerr spin parameter a/M", "applicability": "all-four-disk-hit-rays", "missingness": "required-finite-no-null-sentinel", "domain": "finite-absolute-value-at-most-0.998"},
    {"name": "X_CONT", "format": "D", "fitsUnit": "pixel", "unitSemantic": "FITS-1-based-continuous-coordinate", "valueKind": "float64", "semantic": "continuous source-plane x coordinate; not a sampled pixel", "applicability": "coordinate-provenance-only", "missingness": "required-finite-no-null-sentinel", "domain": "finite-positive-continuous-coordinate"},
    {"name": "Y_CONT", "format": "D", "fitsUnit": "pixel", "unitSemantic": "FITS-1-based-continuous-coordinate", "valueKind": "float64", "semantic": "continuous source-plane y coordinate; not a sampled pixel", "applicability": "coordinate-provenance-only", "missingness": "required-finite-no-null-sentinel", "domain": "finite-positive-continuous-coordinate"},
    {"name": "ALPHA_M", "format": "D", "fitsUnit": "M", "unitSemantic": "geometrized-black-hole-mass", "valueKind": "float64", "semantic": "ZAMO screen alpha coordinate", "applicability": "all-four-disk-hit-rays", "missingness": "required-finite-no-null-sentinel", "domain": "finite-screen-coordinate"},
    {"name": "BETA_M", "format": "D", "fitsUnit": "M", "unitSemantic": "geometrized-black-hole-mass", "valueKind": "float64", "semantic": "ZAMO screen beta coordinate", "applicability": "all-four-disk-hit-rays", "missingness": "required-finite-no-null-sentinel", "domain": "finite-screen-coordinate"},
    {"name": "REDSHIFT", "format": "D", "fitsUnit": None, "unitSemantic": "dimensionless-nu-observer-over-nu-emitter", "valueKind": "float64", "semantic": "frequency redshift factor computed from k dot u", "applicability": "disk-hit-only", "missingness": "required-finite-no-null-sentinel", "domain": "finite-strictly-positive"},
    {"name": "EVPA_DEG", "format": "D", "fitsUnit": "deg", "unitSemantic": "axial-angle-period-180-degrees", "valueKind": "float64", "semantic": "finite-distance ZAMO screen electric-vector position angle", "applicability": "v297-qualified-disk-hit-only", "missingness": "required-finite-no-null-sentinel", "domain": "zero-inclusive-180-exclusive"},
    {"name": "Q_HAT", "format": "D", "fitsUnit": None, "unitSemantic": "dimensionless-normalized-linear-orientation", "valueKind": "float64", "semantic": "cosine of twice EVPA; orientation only, not measured Stokes Q", "applicability": "v474-orientation-only", "missingness": "required-finite-no-null-sentinel", "domain": "finite-minus-one-through-one"},
    {"name": "U_HAT", "format": "D", "fitsUnit": None, "unitSemantic": "dimensionless-normalized-linear-orientation", "valueKind": "float64", "semantic": "sine of twice EVPA; orientation only, not measured Stokes U", "applicability": "v474-orientation-only", "missingness": "required-finite-no-null-sentinel", "domain": "finite-minus-one-through-one"},
    {"name": "PHOT_RAD", "format": "D", "fitsUnit": "ph s-1 m-2 sr-1", "unitSemantic": "photon-per-second-per-square-metre-per-steradian", "valueKind": "float64", "semantic": "model-predicted visible-band observer photon radiance", "applicability": "v534-response-aware-model-only-not-measured", "missingness": "required-finite-no-null-sentinel", "domain": "finite-nonnegative"},
    {"name": "RESP_J", "format": "D", "fitsUnit": None, "unitSemantic": "dimensionless-log-derivative", "valueKind": "float64", "semantic": "d ln N divided by d ln wavelength-response shift", "applicability": "v535-local-linear-sensitivity-only", "missingness": "required-finite-no-null-sentinel", "domain": "finite"},
    {"name": "NONLIN", "format": "D", "fitsUnit": None, "unitSemantic": "dimensionless-relative-remainder", "valueKind": "float64", "semantic": "finite response-shift nonlinear remainder relative to exact operator", "applicability": "diagnostic-model-only", "missingness": "required-finite-no-null-sentinel", "domain": "finite"},
    {"name": "PHYS_UNC", "format": "L", "fitsUnit": None, "unitSemantic": "boolean-availability-flag", "valueKind": "logical", "semantic": "physical uncertainty interval availability", "applicability": "false-until-measured-wavelength-calibration-exists", "missingness": "explicit-false-not-zero-uncertainty", "domain": "false-for-all-four-rows"},
    {"name": "PIXEL", "format": "L", "fitsUnit": None, "unitSemantic": "boolean-availability-flag", "valueKind": "logical", "semantic": "sampled raster pixel availability", "applicability": "false-continuous-coordinate-table-only", "missingness": "explicit-false-not-zero-valued-pixel", "domain": "false-for-all-four-rows"},
    {"name": "ROW_SHA", "format": "64A", "fitsUnit": None, "unitSemantic": "not-applicable-sha256", "valueKind": "ascii-string", "semantic": "canonical v536 row SHA-256", "applicability": "all-four-disk-hit-rays", "missingness": "required-lowercase-hex-no-null-sentinel", "domain": "lowercase-hex-64-unique"},
]


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    encoded = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def atomic_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    part.write_text(value, encoding="utf-8", newline="")
    part.replace(path)


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    atomic_text(path, json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def text_value(value: Any) -> str:
    if isinstance(value, (bytes, np.bytes_)):
        return value.decode("ascii").strip()
    return str(value).strip()


def domain_valid(name: str, values: Any) -> bool:
    if name == "RAY_ID":
        return [text_value(value) for value in values] == ["disk-00", "disk-01", "disk-02", "disk-03"]
    if name == "RAY_INDEX":
        return [int(value) for value in values] == [12, 13, 14, 15]
    if name == "SPIN_A":
        return bool(np.all(np.isfinite(values)) and np.all(np.abs(values) <= 0.998))
    if name in {"X_CONT", "Y_CONT"}:
        return bool(np.all(np.isfinite(values)) and np.all(values > 0))
    if name in {"ALPHA_M", "BETA_M", "RESP_J", "NONLIN"}:
        return bool(np.all(np.isfinite(values)))
    if name == "REDSHIFT":
        return bool(np.all(np.isfinite(values)) and np.all(values > 0))
    if name == "EVPA_DEG":
        return bool(np.all(np.isfinite(values)) and np.all(values >= 0) and np.all(values < 180))
    if name in {"Q_HAT", "U_HAT"}:
        return bool(np.all(np.isfinite(values)) and np.all(np.abs(values) <= 1))
    if name == "PHOT_RAD":
        return bool(np.all(np.isfinite(values)) and np.all(values >= 0))
    if name in {"PHYS_UNC", "PIXEL"}:
        return not bool(np.any(values))
    if name == "ROW_SHA":
        parsed = [text_value(value) for value in values]
        return len(set(parsed)) == 4 and all(len(value) == 64 and set(value) <= set("0123456789abcdef") for value in parsed)
    return False


def observed_summary(values: Any, kind: str) -> dict[str, Any]:
    if kind == "float64":
        minimum = float(np.min(values))
        maximum = float(np.max(values))
        safe_integer_limit = 2**53 - 1
        minimum_json = int(minimum) if minimum.is_integer() and abs(minimum) <= safe_integer_limit else minimum
        maximum_json = int(maximum) if maximum.is_integer() and abs(maximum) <= safe_integer_limit else maximum
        return {"rowCount": len(values), "finiteCount": int(np.isfinite(values).sum()), "minimum": minimum_json, "maximum": maximum_json, "uniqueCount": len(set(float(value) for value in values))}
    if kind == "signed-int32":
        return {"rowCount": len(values), "finiteCount": len(values), "minimum": int(np.min(values)), "maximum": int(np.max(values)), "uniqueCount": len(set(int(value) for value in values))}
    if kind == "logical":
        return {"rowCount": len(values), "finiteCount": len(values), "minimum": None, "maximum": None, "uniqueCount": len(set(bool(value) for value in values)), "trueCount": int(np.count_nonzero(values)), "falseCount": int(len(values) - np.count_nonzero(values))}
    parsed = [text_value(value) for value in values]
    return {"rowCount": len(parsed), "finiteCount": len(parsed), "minimum": None, "maximum": None, "uniqueCount": len(set(parsed))}


def main() -> None:
    v537 = json.loads(V537_ATLAS.read_text(encoding="utf-8"))
    v536 = json.loads(V536_ATLAS.read_text(encoding="utf-8"))
    if canonical_sha(v537) != v537.get("artifactSha256") or file_sha(V537_FITS) != v537.get("fits", {}).get("fileSha256") or canonical_sha(v536) != v536.get("artifactSha256"):
        raise RuntimeError("v538-upstream-integrity")
    with fits.open(V537_FITS, checksum=True, memmap=False) as hdus:
        hdus.verify("exception")
        if len(hdus) != 2 or hdus[0].data is not None or hdus[0].header["NAXIS"] != 0 or not isinstance(hdus[1], fits.BinTableHDU):
            raise RuntimeError("v538-hdu-contract")
        table = hdus[1]
        if table.header["NAXIS1"] != 182 or table.header["NAXIS2"] != 4 or table.header["PCOUNT"] != 0 or table.header["GCOUNT"] != 1:
            raise RuntimeError("v538-table-layout")
        if [column.name for column in table.columns] != [entry["name"] for entry in COLUMNS]:
            raise RuntimeError("v538-column-order")
        records: list[dict[str, Any]] = []
        for ordinal, (expected, actual) in enumerate(zip(COLUMNS, table.columns, strict=True), start=1):
            unit = actual.unit if actual.unit not in {"", None} else None
            values = table.data[expected["name"]]
            base = {
                "ordinal": ordinal,
                **expected,
                "observed": observed_summary(values, expected["valueKind"]),
                "formatQualified": actual.format == expected["format"],
                "unitQualified": unit == expected["fitsUnit"],
                "domainQualified": domain_valid(expected["name"], values),
            }
            if not all(base[key] is True for key in ("formatQualified", "unitQualified", "domainQualified")):
                raise RuntimeError(f"v538-column-{expected['name']}")
            records.append({**base, "columnSha256": canonical_sha(base)})
        q = np.asarray(table.data["Q_HAT"], dtype=np.float64)
        u = np.asarray(table.data["U_HAT"], dtype=np.float64)
        orientation_residual = float(np.max(np.abs(q * q + u * u - 1)))
        source_rows = v536["rows"]
        row_replay = all(
            int(table.data["RAY_INDEX"][index]) == row["rayIndex"]
            and text_value(table.data["ROW_SHA"][index]) == row["rowSha256"]
            and float(table.data["REDSHIFT"][index]) == row["responseAwareRadiometry"]["redshiftFactor"]
            for index, row in enumerate(source_rows)
        )
        checksum_qualified = all(hdu.verify_checksum() == 1 and hdu.verify_datasum() == 1 for hdu in hdus)
    if orientation_residual >= 1e-15 or not row_replay or not checksum_qualified:
        raise RuntimeError("v538-cross-column-invariants")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    part = CSV_PATH.with_name(f"{CSV_PATH.name}.{os.getpid()}.part")
    with part.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["ordinal", "name", "fits_format", "fits_unit", "unit_semantic", "value_kind", "semantic", "applicability", "missingness", "domain", "row_count", "finite_count", "minimum", "maximum", "unique_count", "qualified", "column_sha256"])
        for record in records:
            observed = record["observed"]
            writer.writerow([record["ordinal"], record["name"], record["format"], record["fitsUnit"] or "", record["unitSemantic"], record["valueKind"], record["semantic"], record["applicability"], record["missingness"], record["domain"], observed["rowCount"], observed["finiteCount"], "" if observed["minimum"] is None else observed["minimum"], "" if observed["maximum"] is None else observed["maximum"], observed["uniqueCount"], "true", record["columnSha256"]])
    part.replace(CSV_PATH)

    source_paths = [V537_ATLAS, V537_FITS, V536_ATLAS, ROOT / "scripts/build-kerr-response-aware-fits-column-schema-v538.py"]
    source_manifest = sorted(({"path": path.relative_to(ROOT).as_posix(), "sha256": file_sha(path)} for path in source_paths), key=lambda item: item["path"])
    unsigned = {
        "version": "v538-kerr-response-aware-fits-column-schema-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "fits-column-semantics-qualified-physical-uncertainty-unavailable",
        "source": {"v537ArtifactSha256": v537["artifactSha256"], "v537FitsFileSha256": v537["fits"]["fileSha256"], "v536PayloadSha256": v536["payloadSha256"]},
        "contract": {"columnCount": 17, "rowCount": 4, "columnOrderLocked": True, "fitsFormatLocked": True, "fitsUnitLocked": True, "unitSemanticExplicit": True, "applicabilityExplicit": True, "missingnessExplicit": True, "domainValidationRequired": True, "columnShaRequired": True, "rowShaReplayRequired": True},
        "table": {"extensionName": "SPARSE_SCIENCE", "naxis1RowBytes": 182, "naxis2Rows": 4, "pcount": 0, "gcount": 1, "primaryNaxis": 0, "binaryTableHduCount": 1, "imageHduCount": 0},
        "columns": records,
        "invariants": {"rowIdentityReplayQualified": row_replay, "maximumOrientationUnitNormResidual": orientation_residual, "orientationUnitNormLimit": 1e-15, "checksumAndDatasumQualified": checksum_qualified, "continuousCoordinatesArePixelSamples": False, "physicalUncertaintyFalseMeansZeroUncertainty": False, "pixelFalseMeansZeroValuedPixel": False},
        "counts": {"qualifiedColumnCount": 17, "dimensionlessSemanticColumnCount": 6, "explicitPhysicalUnitColumnCount": 6, "identifierOrFlagColumnCount": 5, "applicabilityStatementCount": 17, "missingnessStatementCount": 17, "physicalUncertaintyValueCount": 0, "pixelSampleCount": 0, "rasterPixelCount": 0, "fitsImageHduCount": 0, "pngImageCount": 0},
        "qualification": {"columnSchemaQualified": True, "fitsFormatQualified": True, "fitsUnitQualified": True, "domainQualified": True, "applicabilityQualified": True, "missingnessQualified": True, "crossColumnInvariantQualified": True, "scienceImageQualified": False, "physicalUncertaintyQualified": False},
        "boundary": {"schemaDoesNotCreateNewMeasurement": True, "schemaDoesNotCreatePixelSamples": True, "physicalUncertaintyAvailable": False, "measuredCalibrationFiles": 0, "requiredMeasuredCalibrationFiles": 6, "sciencePayloadMutationAllowed": False, "cinematicScienceWritebackAllowed": False, "denseCampaignStatus": "incomplete-0-of-49", "browserQualification": "not-run", "formalProductPointer": "v263", "formalDefaultKernel": "legacy-eih-1pn"},
        "export": {"csvPath": "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv", "csvFileSha256": file_sha(CSV_PATH), "rowCount": 17},
        "sourceManifest": source_manifest,
        "sourceSha256": canonical_sha(source_manifest),
    }
    artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned)}
    atomic_json(ATLAS_PATH, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "columns": 17, "rows": 4, "maximumOrientationUnitNormResidual": orientation_residual, "physicalUncertaintyValues": 0, "pixelSamples": 0, "imageHdus": 0}, indent=2))


if __name__ == "__main__":
    main()
