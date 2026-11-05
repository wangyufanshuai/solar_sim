"""Audit the exact flat-background FO-CCZ4 characteristic polynomial."""

from __future__ import annotations

import argparse
from dataclasses import asdict
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    GaugeConfig,
    FOCCZ4Config,
    analytic_fo_ccz4_principal_matrix_3d,
    characteristic_speed_multiset,
    flat_fo_ccz4_characteristic_polynomial_contract,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_characteristic_contract.py",
        "scripts/run-nr-k1-fo-ccz4-characteristic-contract.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _parse_axes(raw: str) -> tuple[int, ...]:
    axes = tuple(int(value.strip()) for value in raw.split(",") if value.strip())
    if not axes or any(axis not in (0, 1, 2) for axis in axes):
        raise SystemExit("--normal-axes must contain one or more values from 0,1,2")
    if len(set(axes)) != len(axes):
        raise SystemExit("--normal-axes must not repeat an axis")
    return axes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--polynomial-tolerance", type=float, default=1.0e-8)
    parser.add_argument("--speed-tolerance", type=float, default=1.0e-8)
    args = parser.parse_args()
    if args.polynomial_tolerance <= 0.0 or not np.isfinite(args.polynomial_tolerance):
        raise SystemExit("--polynomial-tolerance must be finite and positive")
    if args.speed_tolerance <= 0.0 or not np.isfinite(args.speed_tolerance):
        raise SystemExit("--speed-tolerance must be finite and positive")
    axes = _parse_axes(args.normal_axes)

    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    reference_contract = flat_fo_ccz4_characteristic_polynomial_contract(
        normal_axis=axes[0], gauge=gauge, config=config
    )
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        contract = flat_fo_ccz4_characteristic_polynomial_contract(
            normal_axis=normal_axis, gauge=gauge, config=config
        )
        matrix = analytic_fo_ccz4_principal_matrix_3d(
            normal_axis=normal_axis, gauge=gauge, config=config
        )
        replay = analytic_fo_ccz4_principal_matrix_3d(
            normal_axis=normal_axis, gauge=gauge, config=config
        )
        expected_polynomial = np.asarray(
            [float(Fraction(value)) for value in contract.monic_coefficients_descending],
            dtype=np.float64,
        )
        observed_polynomial = np.poly(matrix)
        eigenvalues = np.linalg.eigvals(matrix)
        observed_speeds = np.sort(np.real(eigenvalues))
        expected_speeds = characteristic_speed_multiset(contract)
        polynomial_error = float(np.max(np.abs(observed_polynomial.real - expected_polynomial)))
        speed_error = float(np.max(np.abs(observed_speeds - expected_speeds)))
        row = {
            "normal_axis": normal_axis,
            "variable_count": contract.variable_count,
            "factorization": contract.factorization,
            "leading_coefficient": contract.leading_coefficient,
            "polynomial_max_abs_error": polynomial_error,
            "polynomial_imag_l_inf": float(np.max(np.abs(observed_polynomial.imag))),
            "speed_max_abs_error": speed_error,
            "speed_imag_l_inf": float(np.max(np.abs(np.imag(eigenvalues)))),
            "deterministic_replay": bool(np.array_equal(matrix, replay)),
            "exact_factorization_crosscheck": bool(
                polynomial_error <= args.polynomial_tolerance
                and speed_error <= args.speed_tolerance
                and float(np.max(np.abs(np.imag(eigenvalues)))) <= args.speed_tolerance
            ),
        }
        rows.append(row)

    factorization_validated = all(row["exact_factorization_crosscheck"] for row in rows)
    deterministic_replay = all(row["deterministic_replay"] for row in rows)
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-exact-characteristic-polynomial-shadow",
        "schema_version": "nr-k1-fo-ccz4-characteristic-contract-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "background": "flat-Minkowski-linearized-principal-part",
        "contract": {
            "gauge": asdict(gauge),
            "config": asdict(config),
            "factorization": reference_contract.factorization,
            "leading_coefficient": reference_contract.leading_coefficient,
            "monic_coefficients_descending": list(
                reference_contract.monic_coefficients_descending
            ),
            "speed_multiplicities": [
                list(item) for item in reference_contract.speed_multiplicities
            ],
            "analytic_eigenvectors": False,
            "polynomial_is_exact_rational_contract": True,
        },
        "campaign": {
            "normal_axes": list(axes),
            "polynomial_tolerance": args.polynomial_tolerance,
            "speed_tolerance": args.speed_tolerance,
        },
        "rows": rows,
        "validation": {
            "exact_factorization_crosscheck": factorization_validated,
            "deterministic_replay": deterministic_replay,
            "analytic_eigenvectors_validated": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-eigenvectors-symmetrizer-cpbc",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "normal_axes": list(axes),
                "exact_factorization_crosscheck": factorization_validated,
                "deterministic_replay": deterministic_replay,
                "max_polynomial_error": max(row["polynomial_max_abs_error"] for row in rows),
                "max_speed_error": max(row["speed_max_abs_error"] for row in rows),
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if factorization_validated and deterministic_replay else 2


if __name__ == "__main__":
    raise SystemExit(main())
