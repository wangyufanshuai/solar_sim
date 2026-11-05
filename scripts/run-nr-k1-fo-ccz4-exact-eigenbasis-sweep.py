"""Sweep exact frozen-point FO-CCZ4 eigenspaces over tuned/degenerate gauges.

The audit covers a small rational parameter set, including known gamma-driver
and ordering degeneracies.  It is a parameter-domain *sample*, not a proof for
all positive parameters or a continuum strong-hyperbolicity theorem.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

try:
    import sympy as sp
except ImportError as exc:  # pragma: no cover - environment-specific
    raise SystemExit("SymPy is required for the optional exact eigenbasis sweep") from exc

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    GaugeConfig,
    FOCCZ4Config,
    analytic_fo_ccz4_principal_matrix_3d,
)


CASES: tuple[dict[str, object], ...] = (
    {
        "name": "tuned-default",
        "lapse_coefficient": 2.0,
        "shift_coefficient": 1.0,
        "ordering_mu": 1.0,
        "expected": "pass",
    },
    {
        "name": "tuned-mu-half",
        "lapse_coefficient": 2.0,
        "shift_coefficient": 1.0,
        "ordering_mu": 0.5,
        "expected": "pass",
    },
    {
        "name": "moderate-shift",
        "lapse_coefficient": 2.0,
        "shift_coefficient": 1.25,
        "ordering_mu": 1.0,
        "expected": "pass",
    },
    {
        "name": "nonstandard-lapse",
        "lapse_coefficient": 1.25,
        "shift_coefficient": 1.0,
        "ordering_mu": 1.0,
        "expected": "pass",
    },
    {
        "name": "ordering-degeneracy",
        "lapse_coefficient": 2.0,
        "shift_coefficient": 1.0,
        "ordering_mu": 2.0,
        "expected": "fail",
    },
    {
        "name": "shift-degeneracy",
        "lapse_coefficient": 2.0,
        "shift_coefficient": 1.5,
        "ordering_mu": 1.0,
        "expected": "fail",
    },
    {
        "name": "legacy-gamma-driver",
        "lapse_coefficient": 2.0,
        "shift_coefficient": 0.75,
        "ordering_mu": 1.0,
        "expected": "fail",
    },
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_characteristic_contract.py",
        "scripts/run-nr-k1-fo-ccz4-exact-eigenbasis-sweep.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _rationalize(matrix: np.ndarray) -> tuple[sp.Matrix, float]:
    rational = sp.Matrix(
        [
            [sp.Rational(float(value)).limit_denominator(100_000) for value in row]
            for row in matrix
        ]
    )
    reconstructed = np.asarray(rational.tolist(), dtype=np.float64)
    return rational, float(np.max(np.abs(reconstructed - matrix)))


def _expected_factorization(
    lam: sp.Symbol,
    *,
    lapse_coefficient: float,
    shift_coefficient: float,
    ordering_mu: float,
) -> sp.Expr:
    lapse = sp.Rational(str(lapse_coefficient))
    shift = sp.Rational(str(shift_coefficient))
    ordering = sp.Rational(str(ordering_mu))
    return sp.expand(
        lam**26
        * (lam**2 - 1) ** 6
        * (lam**2 - lapse)
        * (3 * lam**2 - 4 * shift)
        * (2 * lam**2 - ordering) ** 2
        * (lam**2 - shift) ** 2
        * (4 * lam**2 - ordering) ** 4
        / (sp.Integer(3) * sp.Integer(2) ** 2 * sp.Integer(4) ** 4),
    )


def _exact_eigenspace_summary(
    matrix: sp.Matrix,
) -> tuple[list[dict[str, object]], int, bool]:
    rows: list[dict[str, object]] = []
    all_vectors: list[sp.Matrix] = []
    for eigenvalue, algebraic_multiplicity, vectors in matrix.eigenvects():
        residual_zero = all(
            matrix * vector - eigenvalue * vector == sp.zeros(matrix.rows, 1)
            for vector in vectors
        )
        rows.append(
            {
                "eigenvalue": sp.sstr(eigenvalue),
                "algebraic_multiplicity": int(algebraic_multiplicity),
                "geometric_multiplicity": len(vectors),
                "geometric_equals_algebraic": len(vectors) == algebraic_multiplicity,
                "exact_eigenvector_residual_zero": residual_zero,
            }
        )
        all_vectors.extend(vectors)
    basis = sp.Matrix.hstack(*all_vectors)
    rank = int(basis.rank())
    complete = bool(
        rank == matrix.rows
        and all(row["geometric_equals_algebraic"] for row in rows)
        and all(row["exact_eigenvector_residual_zero"] for row in rows)
    )
    return rows, rank, complete


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
    parser.add_argument("--rationalization-tolerance", type=float, default=1.0e-14)
    args = parser.parse_args()
    if args.rationalization_tolerance <= 0.0 or not np.isfinite(args.rationalization_tolerance):
        raise SystemExit("--rationalization-tolerance must be finite and positive")
    axes = _parse_axes(args.normal_axes)
    lam = sp.symbols("lambda")
    case_rows: list[dict[str, object]] = []
    for case in CASES:
        lapse = float(case["lapse_coefficient"])
        shift = float(case["shift_coefficient"])
        ordering = float(case["ordering_mu"])
        gauge = GaugeConfig(
            lapse_coefficient=lapse,
            shift_coefficient=shift,
            shift_damping=0.0,
            theta_coupling=2.0,
        )
        config = FOCCZ4Config(kappa1=0.0, ordering_mu=ordering)
        expected_polynomial = _expected_factorization(
            lam,
            lapse_coefficient=lapse,
            shift_coefficient=shift,
            ordering_mu=ordering,
        )
        axis_rows: list[dict[str, object]] = []
        for normal_axis in axes:
            direct = analytic_fo_ccz4_principal_matrix_3d(
                normal_axis=normal_axis, gauge=gauge, config=config
            )
            rational, rationalization_residual = _rationalize(direct)
            characteristic = rational.charpoly(lam).as_expr()
            eigenspaces, basis_rank, complete = _exact_eigenspace_summary(rational)
            factorization_match = bool(sp.simplify(characteristic - expected_polynomial) == 0)
            axis_rows.append(
                {
                    "normal_axis": normal_axis,
                    "rationalization_residual_l_inf": rationalization_residual,
                    "rationalization_within_tolerance": rationalization_residual
                    <= args.rationalization_tolerance,
                    "characteristic_factorization": sp.sstr(sp.factor(characteristic)),
                    "characteristic_factorization_match": factorization_match,
                    "eigenspaces": eigenspaces,
                    "exact_eigenbasis_rank": basis_rank,
                    "exact_eigenbasis_complete": complete,
                }
            )
        factorization_passed = all(
            row["characteristic_factorization_match"] for row in axis_rows
        )
        rationalization_passed = all(
            row["rationalization_within_tolerance"] for row in axis_rows
        )
        eigenbasis_complete = all(row["exact_eigenbasis_complete"] for row in axis_rows)
        expected_classification = case["expected"] == "pass"
        classification_match = eigenbasis_complete == expected_classification
        case_rows.append(
            {
                "name": case["name"],
                "lapse_coefficient": lapse,
                "shift_coefficient": shift,
                "ordering_mu": ordering,
                "expected": case["expected"],
                "expected_factorization": sp.sstr(sp.factor(expected_polynomial)),
                "axes": axis_rows,
                "rationalized_direct_matrix_validated": rationalization_passed,
                "exact_characteristic_factorization_validated": factorization_passed,
                "exact_eigenbasis_complete": eigenbasis_complete,
                "classification_match": classification_match,
            }
        )

    classification_passed = all(row["classification_match"] for row in case_rows)
    factorization_passed = all(
        row["exact_characteristic_factorization_validated"] for row in case_rows
    )
    rationalization_passed = all(
        row["rationalized_direct_matrix_validated"] for row in case_rows
    )
    positive_complete = all(
        row["exact_eigenbasis_complete"]
        for row in case_rows
        if row["expected"] == "pass"
    )
    negative_exposed = all(
        not row["exact_eigenbasis_complete"]
        for row in case_rows
        if row["expected"] == "fail"
    )
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-exact-eigenbasis-parameter-sweep",
        "schema_version": "nr-k1-fo-ccz4-exact-eigenbasis-sweep-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "background": "flat-Minkowski-linearized-principal-part",
        "contract": {
            "fixed_cleaning_speed": 1.0,
            "fixed_c": 1.0,
            "fixed_shift_strength": 1.0,
            "fixed_shift_damping": 0.0,
            "rationalization": "limit-denominator-100000-from-direct-float-matrix",
            "negative_controls_are_expected_to_fail_diagonalizability": True,
        },
        "campaign": {
            "normal_axes": list(axes),
            "rationalization_tolerance": args.rationalization_tolerance,
            "case_count": len(case_rows),
        },
        "cases": case_rows,
        "validation": {
            "rationalized_direct_matrix_validated": rationalization_passed,
            "exact_characteristic_factorizations_validated": factorization_passed,
            "positive_parameter_cases_exact_eigenbasis_validated": positive_complete,
            "known_degeneracies_exposed": negative_exposed,
            "parameter_classification_contract_passed": classification_passed,
            "analytic_full_parameter_eigenvectors_validated": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-continuum-eigenbasis-symmetrizer-cpbc",
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
                "case_count": len(case_rows),
                "normal_axes": list(axes),
                "parameter_classification_contract_passed": classification_passed,
                "positive_parameter_cases_exact_eigenbasis_validated": positive_complete,
                "known_degeneracies_exposed": negative_exposed,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if classification_passed and factorization_passed and rationalization_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
