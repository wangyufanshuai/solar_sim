"""Reproduce local principal matrices against the implemented FO-CCZ4 RHS.

No evolution or boundary update is performed. The suite compares explicit
coefficient assembly with centered affine and normalized sine probes, verifies
exact same-environment replay, and retains the old proxy as a negative control.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import platform
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    FOCCZ4Config,
    FOCCZ4_VARIABLE_ORDER,
    GaugeConfig,
    frozen_fo_ccz4_principal_matrix_3d,
    probe_frozen_fo_ccz4_rhs_matrix_3d,
    linearized_fo_ccz4_local_principal_proxy_3d,
)


# Declared numerical gates. These check equation coefficients, NOT physics,
# physical boundary conditions, characteristic bases or hyperbolicity.
TOLERANCE = 2.0e-12
AMPLITUDE = 1.0e-5
SOURCES = (
    "science/numerical_relativity/__init__.py",
    "science/numerical_relativity/nr3d.py",
    "science/numerical_relativity/ccz4_reference.py",
    "science/numerical_relativity/bssn3d.py",
    "science/numerical_relativity/fo_ccz4.py",
    "science/numerical_relativity/fo_ccz4_rhs.py",
    "science/numerical_relativity/fo_ccz4_principal_symbol.py",
    "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
    "science/numerical_relativity/fo_ccz4_local_frame_shadow.py",
    "science/numerical_relativity/fo_ccz4_local_principal_proxy_shadow.py",
    "science/numerical_relativity/fo_ccz4_frozen_symbol.py",
    "scripts/run-nr-k3-fo-ccz4-frozen-symbol.py",
)


def _source_digest() -> str:
    digest = hashlib.sha256()
    for name in SOURCES:
        digest.update(name.encode() + b"\0" + (ROOT / name).read_bytes())
    return digest.hexdigest()


def _hash(matrix) -> str:
    return hashlib.sha256(np.ascontiguousarray(matrix, dtype="<f8").tobytes()).hexdigest()


def _cases():
    h = np.array(((1.1, .13, -.1), (.13, .9, .02), (-.1, .02, 1.2)))
    h /= np.linalg.det(h)**(1./3.)
    ident = np.eye(3)
    # (name, h, chi, lapse, shift, normal, shift_strength, Gamma-driver f)
    return (
        ("minkowski", ident, 1., 1., (0., 0., 0.), (1., 0., 0.), 1., 1.),
        ("flat-oblique", ident, 1., 1., (0., 0., 0.), (1., -2., .3), 1., 1.),
        ("lapse-shift", ident, 1., .8, (.03, 0., 0.), (1., 0., 0.), 1., 1.),
        ("conformal-lapse-shift", ident, .6, .8, (.03, 0., 0.), (1., 0., 0.), 1., 1.),
        ("anisotropic-oblique", h, .61, .7, (.2, -.1, .05), (1., -2., .3), 1., 1.),
        ("opposite-face", h, .61, .7, (.2, -.1, .05), (-1., 2., -.3), 1., 1.),
        ("shift-disabled", h, .7, 1.3, (.2, -.1, .05), (0., .4, -.2), 0., 1.),
        ("legacy-f075-coefficient-check-only", h, .61, .7, (.2, -.1, .05), (1., -2., .3), 1., .75),
    )


def run_campaign() -> dict:
    source_before = _source_digest()
    rows = []
    for name, h, chi, lapse, shift, normal, strength, shift_coeff in _cases():
        gauge = GaugeConfig(shift_coefficient=shift_coeff, theta_coupling=2.)
        config = FOCCZ4Config(shift_strength=strength, kappa1=0.)
        args = (h, chi, lapse, shift, normal)
        kwargs = dict(gauge=gauge, config=config)
        matrix = frozen_fo_ccz4_principal_matrix_3d(*args, **kwargs)
        reference = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, **kwargs, amplitude=AMPLITUDE)
        sine = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, **kwargs, profile="sine", amplitude=AMPLITUDE/2.)
        replay = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, **kwargs, amplitude=AMPLITUDE)
        direct_replay = frozen_fo_ccz4_principal_matrix_3d(*args, **kwargs)
        proxy, _ = linearized_fo_ccz4_local_principal_proxy_3d(h/chi, lapse, np.asarray(shift), np.asarray(normal), **kwargs)
        error = abs(matrix - reference)
        row, column = np.unravel_index(error.argmax(), error.shape)
        scale = max(1., float(np.max(abs(reference))))
        relative = float(np.max(error)) / scale
        profile_error = float(np.max(abs(sine-reference))) / scale
        ode_residual = float(np.max(abs(matrix[:11])))
        deterministic = np.array_equal(matrix, direct_replay) and np.array_equal(reference, replay)
        passed = deterministic and relative <= TOLERANCE and profile_error <= TOLERANCE and ode_residual == 0.
        rows.append({
            "case": name,
            "conformal_metric": h.tolist(), "chi": chi, "lapse": lapse,
            "shift": list(shift), "normal_covector": list(normal),
            "gauge": asdict(gauge), "config": asdict(config),
            "assembly_sha256": _hash(matrix), "rhs_sha256": _hash(reference),
            "rhs_replay_sha256": _hash(replay),
            "assembly_replay_sha256": _hash(direct_replay),
            "max_abs_error": float(error[row, column]),
            "scaled_error": relative, "profile_scaled_error": profile_error,
            "ode_row_residual": ode_residual,
            "worst_row": FOCCZ4_VARIABLE_ORDER[row], "worst_column": FOCCZ4_VARIABLE_ORDER[column],
            "legacy_proxy_max_abs_error": float(np.max(abs(proxy-reference))),
            "deterministic_replay": bool(deterministic),
            "rhs_principal_consistency_validated": bool(passed),
        })
        print(json.dumps({"case": name, "max_error": float(error[row, column]), "passed": bool(passed)}), flush=True)
    source_after = _source_digest()
    rejection_checks = []
    for method in (frozen_fo_ccz4_principal_matrix_3d, probe_frozen_fo_ccz4_rhs_matrix_3d):
        try:
            method(np.diag((-1., 1., 1.)), 1., 1., (0., 0., 0.), (1., 0., 0.))
        except ValueError as exc:
            rejection_checks.append({"method": method.__name__, "rejected": True, "reason": str(exc)})
        else:
            rejection_checks.append({"method": method.__name__, "rejected": False})
    negative_control = next(row for row in rows if row["case"] == "lapse-shift")
    passed = (
        len(rows) == len(_cases())
        and all(row["rhs_principal_consistency_validated"] for row in rows)
        and all(item["rejected"] for item in rejection_checks)
        and negative_control["legacy_proxy_max_abs_error"] > .1
        and source_before == source_after
    )
    return {
        "schema_version": "nr-k3-fo-ccz4-frozen-symbol-v1",
        "scope": "code-level local principal matrices, no boundary evolution",
        "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
        "source_digest": source_before, "source_files": list(SOURCES),
        "source_unchanged_during_run": source_before == source_after,
        "coefficient_convention": "gamma=h/chi; q_t=A(n)*d_n q+S; normal not normalized",
        "tolerance": TOLERANCE, "probe_amplitude": AMPLITUDE,
        "case_count": len(rows), "cases": rows, "rejection_checks": rejection_checks,
        "validation": {
            "rhs_principal_consistency_validated": bool(passed),
            "deterministic_replay": all(row["deterministic_replay"] for row in rows),
            "independent_physical_validation": False,
            "strong_hyperbolicity_validated": False,
            "variable_coefficient_energy_estimate_validated": False,
            "nonlinear_cpbc_validated": False, "physical_boundary_validated": False,
            "runtime_writeback": False, "scientificPayloadWriteback": False,
            "promotion": "blocked-pending-characteristic-basis-energy-estimate-CPBC-physical-benchmarks",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    # Refuse to silently replace historical evidence.
    if args.output.exists():
        raise SystemExit("output already exists; choose a fresh receipt path")
    receipt = run_campaign()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(receipt, stream, indent=2, sort_keys=True, allow_nan=False)
        stream.write("\n")
    passed = receipt["validation"]["rhs_principal_consistency_validated"]
    print(json.dumps({"output": str(args.output.resolve()), "rhs_consistency": passed}))
    return 0 if passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
