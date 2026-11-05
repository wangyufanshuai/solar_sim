"""Fail-closed product I/O for the additive v595 timelike Kerr lane."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import shutil
import tempfile
from typing import Any, Mapping

import numpy as np

from .timelike_kerr_v595 import (
    INVARIANT_ORDER,
    REFERENCE_BOUNDARY,
    SCHEMA_VERSION,
    STATE_ORDER,
    VERSION,
    IntegrationResult,
    TimelikeKerrError,
    _assert_finite_json,
    _canonical_sha256,
    build_reference_candidate,
    invariants,
    verify_summary,
)

try:  # The dependency gate below turns absence into an explicit contract error.
    import h5py
except ImportError:  # pragma: no cover - exercised by dependency contract tests
    h5py = None  # type: ignore[assignment]

try:
    import astropy
    from astropy.io import fits
except ImportError:  # pragma: no cover - exercised by dependency contract tests
    astropy = None  # type: ignore[assignment]
    fits = None  # type: ignore[assignment]


MANIFEST_VERSION = "v595-timelike-kerr-reference-manifest-v1"
FITS_CHECKSUM_EPOCH = "2026-08-27T00:00:00"
PRODUCT_FILENAMES = (
    "timelike-kerr-summary-v595.json",
    "timelike-kerr-trajectories-v595.h5",
    "timelike-kerr-invariants-v595.fits",
)


def dependency_status() -> dict[str, Any]:
    return {
        "hdf5": {
            "available": h5py is not None,
            "package": "h5py",
            "version": getattr(h5py, "__version__", None),
        },
        "fits": {
            "available": fits is not None,
            "package": "astropy",
            "version": getattr(astropy, "__version__", None),
        },
        "missingDependencyPolicy": (
            "fail-closed-no-partial-canonical-product; callers may skip only "
            "when the skip is explicitly recorded as unavailable-dependency"
        ),
    }


def require_product_dependencies() -> dict[str, Any]:
    status = dependency_status()
    missing = [
        name
        for name in ("hdf5", "fits")
        if status[name]["available"] is not True
    ]
    if missing:
        raise TimelikeKerrError(
            f"canonical-product-dependency-unavailable:{','.join(missing)}"
        )
    return status


def _write_json(path: Path, value: Mapping[str, Any]) -> None:
    _assert_finite_json(value)
    path.write_text(
        json.dumps(
            value,
            ensure_ascii=False,
            sort_keys=True,
            indent=2,
            allow_nan=False,
        )
        + "\n",
        encoding="utf-8",
    )


def _file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _write_hdf5(
    path: Path,
    summary: Mapping[str, Any],
    trajectories: Mapping[str, IntegrationResult],
) -> None:
    if h5py is None:  # pragma: no cover - guarded by dependency gate
        raise TimelikeKerrError("canonical-product-dependency-unavailable:hdf5")
    fixtures = {item["name"]: item for item in summary["fixtures"]}
    with h5py.File(path, "w", libver="latest", track_order=True) as handle:
        handle.attrs["version"] = VERSION
        handle.attrs["schemaVersion"] = SCHEMA_VERSION
        handle.attrs["summarySha256"] = summary["summarySha256"]
        handle.attrs["coordinateFrame"] = summary["coordinates"]
        handle.attrs["stateOrderJson"] = json.dumps(list(STATE_ORDER))
        handle.attrs["invariantOrderJson"] = json.dumps(list(INVARIANT_ORDER))
        handle.attrs["formalEvidence"] = False
        handle.attrs["promotion"] = "none"
        handle.attrs["scientificPromotionGranted"] = False
        handle.attrs["boundary"] = REFERENCE_BOUNDARY
        root = handle.create_group("fixtures", track_order=True)
        for name in sorted(trajectories):
            result = trajectories[name]
            report = fixtures[name]
            group = root.create_group(name, track_order=True)
            group.create_dataset(
                "affineParameter",
                data=np.asarray(result.affine, dtype=np.float64),
                dtype=np.float64,
            )
            group.create_dataset(
                "state",
                data=np.asarray(result.state.T, dtype=np.float64),
                dtype=np.float64,
            )
            group.create_dataset(
                "invariants",
                data=np.asarray(result.invariant_series, dtype=np.float64),
                dtype=np.float64,
            )
            group.create_dataset(
                "radialTurningAffine",
                data=np.asarray(result.radial_turning_affine, dtype=np.float64),
                dtype=np.float64,
            )
            group.create_dataset(
                "polarTurningAffine",
                data=np.asarray(result.polar_turning_affine, dtype=np.float64),
                dtype=np.float64,
            )
            invariant = report["invariants"]
            group.attrs["classification"] = report["classification"]
            group.attrs["expectedClassification"] = report[
                "expectedClassification"
            ]
            group.attrs["energy"] = invariant["initial"]["energy"]
            group.attrs["axialAngularMomentum"] = invariant["initial"][
                "axialAngularMomentum"
            ]
            group.attrs["carterQ"] = invariant["initial"]["carterQ"]
            group.attrs["hamiltonian"] = invariant["initial"]["hamiltonian"]
            group.attrs["massShellResidual"] = invariant[
                "maxMassShellResidual"
            ]
            group.attrs["energyDrift"] = invariant["maxAbsoluteDrift"]["energy"]
            group.attrs["axialAngularMomentumDrift"] = invariant[
                "maxAbsoluteDrift"
            ]["axialAngularMomentum"]
            group.attrs["carterQDrift"] = invariant["maxAbsoluteDrift"][
                "carterQ"
            ]
            group.attrs["hamiltonianDrift"] = invariant["maxAbsoluteDrift"][
                "hamiltonian"
            ]
            group.attrs["invariantsComputedFromTrajectory"] = invariant[
                "computedFromTrajectory"
            ]
            group.attrs["qualified"] = report["qualified"]


def _write_fits(path: Path, summary: Mapping[str, Any]) -> None:
    if fits is None:  # pragma: no cover - guarded by dependency gate
        raise TimelikeKerrError("canonical-product-dependency-unavailable:fits")
    fixtures = summary["fixtures"]
    invariant = [fixture["invariants"] for fixture in fixtures]
    columns = [
        fits.Column(
            name="FIXTURE",
            format="16A",
            array=np.asarray([fixture["name"] for fixture in fixtures]),
        ),
        fits.Column(
            name="CLASS",
            format="16A",
            array=np.asarray([fixture["classification"] for fixture in fixtures]),
        ),
        fits.Column(
            name="ENERGY",
            format="D",
            array=np.asarray([item["initial"]["energy"] for item in invariant]),
        ),
        fits.Column(
            name="LZ",
            format="D",
            array=np.asarray(
                [item["initial"]["axialAngularMomentum"] for item in invariant]
            ),
        ),
        fits.Column(
            name="CARTER_Q",
            format="D",
            array=np.asarray([item["initial"]["carterQ"] for item in invariant]),
        ),
        fits.Column(
            name="HAMILTON",
            format="D",
            array=np.asarray(
                [item["initial"]["hamiltonian"] for item in invariant]
            ),
        ),
        fits.Column(
            name="E_DRIFT",
            format="D",
            array=np.asarray(
                [item["maxAbsoluteDrift"]["energy"] for item in invariant]
            ),
        ),
        fits.Column(
            name="LZ_DRIFT",
            format="D",
            array=np.asarray(
                [
                    item["maxAbsoluteDrift"]["axialAngularMomentum"]
                    for item in invariant
                ]
            ),
        ),
        fits.Column(
            name="Q_DRIFT",
            format="D",
            array=np.asarray(
                [item["maxAbsoluteDrift"]["carterQ"] for item in invariant]
            ),
        ),
        fits.Column(
            name="H_DRIFT",
            format="D",
            array=np.asarray(
                [item["maxAbsoluteDrift"]["hamiltonian"] for item in invariant]
            ),
        ),
        fits.Column(
            name="SHELL_RES",
            format="D",
            array=np.asarray([item["maxMassShellResidual"] for item in invariant]),
        ),
        fits.Column(
            name="R_TURNS",
            format="J",
            array=np.asarray(
                [fixture["integration"]["radialTurningPointCount"] for fixture in fixtures],
                dtype=np.int32,
            ),
        ),
        fits.Column(
            name="TH_TURNS",
            format="J",
            array=np.asarray(
                [fixture["integration"]["polarTurningPointCount"] for fixture in fixtures],
                dtype=np.int32,
            ),
        ),
    ]
    primary = fits.PrimaryHDU()
    primary.header["ENGINE"] = VERSION[:68]
    primary.header["SCHEMA"] = SCHEMA_VERSION[:68]
    primary.header["SUMSHA"] = summary["summarySha256"]
    primary.header["COORDSYS"] = summary["coordinates"][:68]
    primary.header["FORMAL"] = False
    primary.header["PROMOTN"] = "NONE"
    primary.header["SCIPROM"] = False
    primary.header["BOUNDARY"] = REFERENCE_BOUNDARY[:68]
    table = fits.BinTableHDU.from_columns(columns, name="TIMELIKE_KERR")
    primary.add_checksum(when=FITS_CHECKSUM_EPOCH)
    table.add_checksum(when=FITS_CHECKSUM_EPOCH)
    fits.HDUList([primary, table]).writeto(path, overwrite=False, checksum=False)


def _source_receipt() -> dict[str, Any]:
    root = Path(__file__).resolve().parent
    files = [root / "timelike_kerr_v595.py", root / "timelike_kerr_io_v595.py"]
    return {
        "files": [
            {
                "path": path.name,
                "bytes": path.stat().st_size,
                "sha256": _file_sha256(path),
            }
            for path in files
        ]
    }


def write_reference_candidate(output_dir: Path) -> Path:
    """Build all products transactionally into a previously absent directory."""
    dependencies = require_product_dependencies()
    summary, trajectories = build_reference_candidate()
    output = Path(output_dir).resolve()
    if output.exists():
        raise TimelikeKerrError(f"output-already-exists:{output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(
        tempfile.mkdtemp(
            prefix=f".{output.name}-v595-staging-", dir=str(output.parent)
        )
    )
    try:
        summary_path = staging / PRODUCT_FILENAMES[0]
        hdf5_path = staging / PRODUCT_FILENAMES[1]
        fits_path = staging / PRODUCT_FILENAMES[2]
        _write_json(summary_path, summary)
        _write_hdf5(hdf5_path, summary, trajectories)
        _write_fits(fits_path, summary)
        source = _source_receipt()
        unsigned = {
            "version": MANIFEST_VERSION,
            "generatedAt": "2026-08-27T00:00:00Z",
            "summarySha256": summary["summarySha256"],
            "dependencies": dependencies,
            "source": source,
            "sourceSha256": _canonical_sha256(source),
            "files": [
                {
                    "path": path.name,
                    "bytes": path.stat().st_size,
                    "sha256": _file_sha256(path),
                }
                for path in (summary_path, hdf5_path, fits_path)
            ],
            "formalEvidence": False,
            "promotion": "none",
            "scientificPromotionGranted": False,
            "boundary": REFERENCE_BOUNDARY,
        }
        manifest = {**unsigned, "manifestSha256": _canonical_sha256(unsigned)}
        manifest_path = staging / "timelike-kerr-manifest-v595.json"
        _write_json(manifest_path, manifest)
        staging.replace(output)
        return output / manifest_path.name
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise


def _read_json_strict(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(
            path.read_text(encoding="utf-8"),
            parse_constant=lambda token: (_raise_non_finite(token)),
        )
    except (OSError, json.JSONDecodeError) as exc:
        raise TimelikeKerrError(f"json-read-failed:{path.name}:{exc}") from exc
    if not isinstance(value, dict):
        raise TimelikeKerrError(f"json-root-not-object:{path.name}")
    _assert_finite_json(value)
    return value


def _raise_non_finite(token: str) -> None:
    raise TimelikeKerrError(f"json-non-finite-token:{token}")


def _assert_close(actual: float, expected: float, label: str) -> None:
    if not math.isfinite(actual) or not math.isfinite(expected):
        raise TimelikeKerrError(f"non-finite-semantic-value:{label}")
    if not math.isclose(actual, expected, rel_tol=2.0e-12, abs_tol=2.0e-14):
        raise TimelikeKerrError(f"semantic-mismatch:{label}:{actual}:{expected}")


def verify_reference_candidate(manifest_path: Path) -> dict[str, Any]:
    """Read-only verification of hashes plus JSON/HDF5/FITS semantics."""
    require_product_dependencies()
    path = Path(manifest_path).resolve()
    root = path.parent.resolve()
    manifest = _read_json_strict(path)
    seal = manifest.pop("manifestSha256", None)
    if not isinstance(seal, str) or seal != _canonical_sha256(manifest):
        raise TimelikeKerrError("manifest-seal-invalid")
    if manifest.get("version") != MANIFEST_VERSION:
        raise TimelikeKerrError("manifest-version-invalid")
    if (
        manifest.get("formalEvidence") is not False
        or manifest.get("promotion") != "none"
        or manifest.get("scientificPromotionGranted") is not False
        or manifest.get("boundary") != REFERENCE_BOUNDARY
    ):
        raise TimelikeKerrError("manifest-authority-boundary-violated")
    current_source = _source_receipt()
    if manifest.get("sourceSha256") != _canonical_sha256(current_source):
        raise TimelikeKerrError("manifest-current-source-identity-mismatch")
    if manifest.get("source") != current_source:
        raise TimelikeKerrError("manifest-current-source-receipt-mismatch")
    records = manifest.get("files")
    if not isinstance(records, list) or {item.get("path") for item in records} != set(
        PRODUCT_FILENAMES
    ):
        raise TimelikeKerrError("manifest-file-set-invalid")
    resolved: dict[str, Path] = {}
    for record in records:
        name = record["path"]
        candidate = (root / name).resolve()
        if candidate.parent != root or not candidate.is_file():
            raise TimelikeKerrError(f"manifest-file-invalid:{name}")
        if candidate.stat().st_size != record.get("bytes"):
            raise TimelikeKerrError(f"manifest-file-size-mismatch:{name}")
        if _file_sha256(candidate) != record.get("sha256"):
            raise TimelikeKerrError(f"manifest-file-hash-mismatch:{name}")
        resolved[name] = candidate
    summary = _read_json_strict(resolved[PRODUCT_FILENAMES[0]])
    summary_receipt = verify_summary(summary)
    if summary_receipt["summarySha256"] != manifest.get("summarySha256"):
        raise TimelikeKerrError("manifest-summary-identity-mismatch")
    fixture_reports = {item["name"]: item for item in summary["fixtures"]}
    _verify_hdf5(resolved[PRODUCT_FILENAMES[1]], summary, fixture_reports)
    _verify_fits(resolved[PRODUCT_FILENAMES[2]], summary, fixture_reports)
    return {
        "status": "passed-readonly-v595-timelike-kerr-json-hdf5-fits",
        "manifestSha256": seal,
        "summarySha256": summary["summarySha256"],
        "fixtureCount": len(fixture_reports),
        "formatsVerified": ["JSON", "HDF5", "FITS"],
        "writesPerformed": False,
        "formalEvidence": False,
        "promotion": "none",
        "scientificPromotionGranted": False,
    }


def _verify_hdf5(
    path: Path,
    summary: Mapping[str, Any],
    fixture_reports: Mapping[str, Mapping[str, Any]],
) -> None:
    if h5py is None:  # pragma: no cover
        raise TimelikeKerrError("canonical-product-dependency-unavailable:hdf5")
    with h5py.File(path, "r") as handle:
        if handle.attrs.get("summarySha256") != summary["summarySha256"]:
            raise TimelikeKerrError("hdf5-summary-identity-mismatch")
        if (
            bool(handle.attrs.get("formalEvidence")) is not False
            or handle.attrs.get("promotion") != "none"
            or bool(handle.attrs.get("scientificPromotionGranted")) is not False
        ):
            raise TimelikeKerrError("hdf5-authority-boundary-violated")
        if "fixtures" not in handle or set(handle["fixtures"].keys()) != set(
            fixture_reports
        ):
            raise TimelikeKerrError("hdf5-fixture-set-invalid")
        for name, report in fixture_reports.items():
            group = handle["fixtures"][name]
            state = np.asarray(group["state"], dtype=float)
            invariant_series = np.asarray(group["invariants"], dtype=float)
            affine = np.asarray(group["affineParameter"], dtype=float)
            if (
                state.ndim != 2
                or state.shape[1] != len(STATE_ORDER)
                or invariant_series.shape != (state.shape[0], len(INVARIANT_ORDER))
                or affine.shape != (state.shape[0],)
                or not np.all(np.isfinite(state))
                or not np.all(np.isfinite(invariant_series))
                or not np.all(np.isfinite(affine))
            ):
                raise TimelikeKerrError(f"hdf5-trajectory-invalid:{name}")
            recomputed = np.column_stack(
                [
                    invariants(float(report["spin"]), state[index])
                    for index in range(state.shape[0])
                ]
            ).T
            if not np.allclose(
                invariant_series,
                recomputed,
                rtol=2.0e-12,
                atol=2.0e-13,
            ):
                raise TimelikeKerrError(
                    f"hdf5-invariants-not-recomputed-from-state:{name}"
                )
            if float(np.ptp(state[:, 2])) <= 1.0e-5 or float(np.ptp(state[:, 6])) <= 1.0e-5:
                raise TimelikeKerrError(f"hdf5-dynamic-polar-state-missing:{name}")
            invariant = report["invariants"]
            expected = {
                "energy": invariant["initial"]["energy"],
                "axialAngularMomentum": invariant["initial"][
                    "axialAngularMomentum"
                ],
                "carterQ": invariant["initial"]["carterQ"],
                "hamiltonian": invariant["initial"]["hamiltonian"],
                "massShellResidual": invariant["maxMassShellResidual"],
                "energyDrift": invariant["maxAbsoluteDrift"]["energy"],
                "axialAngularMomentumDrift": invariant["maxAbsoluteDrift"][
                    "axialAngularMomentum"
                ],
                "carterQDrift": invariant["maxAbsoluteDrift"]["carterQ"],
                "hamiltonianDrift": invariant["maxAbsoluteDrift"]["hamiltonian"],
            }
            for field, value in expected.items():
                _assert_close(float(group.attrs[field]), float(value), f"hdf5:{name}:{field}")
            if bool(group.attrs.get("invariantsComputedFromTrajectory")) is not True:
                raise TimelikeKerrError(f"hdf5-invariants-not-derived:{name}")


def _verify_fits(
    path: Path,
    summary: Mapping[str, Any],
    fixture_reports: Mapping[str, Mapping[str, Any]],
) -> None:
    if fits is None:  # pragma: no cover
        raise TimelikeKerrError("canonical-product-dependency-unavailable:fits")
    with fits.open(path, mode="readonly", checksum=True, memmap=False) as hdus:
        if len(hdus) != 2 or hdus[1].name != "TIMELIKE_KERR":
            raise TimelikeKerrError("fits-hdu-layout-invalid")
        primary = hdus[0].header
        if primary.get("SUMSHA") != summary["summarySha256"]:
            raise TimelikeKerrError("fits-summary-identity-mismatch")
        if (
            primary.get("FORMAL") is not False
            or primary.get("PROMOTN") != "NONE"
            or primary.get("SCIPROM") is not False
        ):
            raise TimelikeKerrError("fits-authority-boundary-violated")
        required_columns = {
            "FIXTURE",
            "CLASS",
            "ENERGY",
            "LZ",
            "CARTER_Q",
            "HAMILTON",
            "E_DRIFT",
            "LZ_DRIFT",
            "Q_DRIFT",
            "H_DRIFT",
            "SHELL_RES",
            "R_TURNS",
            "TH_TURNS",
        }
        if not required_columns.issubset(set(hdus[1].columns.names)):
            raise TimelikeKerrError("fits-required-invariant-columns-missing")
        rows = hdus[1].data
        if rows is None or len(rows) != len(fixture_reports):
            raise TimelikeKerrError("fits-row-count-invalid")
        observed_names: set[str] = set()
        for row in rows:
            name = str(row["FIXTURE"]).strip()
            observed_names.add(name)
            if name not in fixture_reports:
                raise TimelikeKerrError(f"fits-fixture-unregistered:{name}")
            report = fixture_reports[name]
            invariant = report["invariants"]
            expected = {
                "ENERGY": invariant["initial"]["energy"],
                "LZ": invariant["initial"]["axialAngularMomentum"],
                "CARTER_Q": invariant["initial"]["carterQ"],
                "HAMILTON": invariant["initial"]["hamiltonian"],
                "E_DRIFT": invariant["maxAbsoluteDrift"]["energy"],
                "LZ_DRIFT": invariant["maxAbsoluteDrift"][
                    "axialAngularMomentum"
                ],
                "Q_DRIFT": invariant["maxAbsoluteDrift"]["carterQ"],
                "H_DRIFT": invariant["maxAbsoluteDrift"]["hamiltonian"],
                "SHELL_RES": invariant["maxMassShellResidual"],
            }
            for column, value in expected.items():
                _assert_close(float(row[column]), float(value), f"fits:{name}:{column}")
        if observed_names != set(fixture_reports):
            raise TimelikeKerrError("fits-fixture-set-invalid")
