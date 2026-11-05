"""Exact frozen-point eigenspace audit for the FO-CCZ4 shadow matrix.

This is an optional research audit.  SymPy is intentionally not imported by
the runtime package; the script rationalizes the direct floating-point matrix,
records that reconstruction residual, and then computes exact eigenspaces of
the rationalized matrix.  It validates one frozen parameter point only.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

try:
    import sympy as sp
except ImportError as exc:  # pragma: no cover - environment-specific
    raise SystemExit("SymPy is required for the optional exact eigenbasis audit") from exc

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    GaugeConfig,
    FOCCZ4Config,
    analytic_fo_ccz4_principal_matrix_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_characteristic_contract.py",
        "scripts/run-nr-k1-fo-ccz4-exact-eigenbasis.py",
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
    residual = float(np.max(np.abs(reconstructed - matrix)))
    return rational, residual


def _expected_factorization(lam: sp.Symbol) -> sp.Expr:
    return (
        lam**26
        * (lam - 1) ** 8
        * (lam + 1) ** 8
        * (2 * lam - 1) ** 4
        * (2 * lam + 1) ** 4
        * (lam**2 - 2)
        * (2 * lam**2 - 1) ** 2
        * (3 * lam**2 - 4)
        / sp.Integer(3072)
    )


def _eigenspace_rows(matrix: sp.Matrix) -> tuple[list[dict[str, object]], int, bool]:
    rows: list[dict[str, object]] = []
    all_vectors: list[sp.Matrix] = []
    eigenspaces = matrix.eigenvects()
    for eigenvalue, algebraic_multiplicity, vectors in eigenspaces:
        exact_residual = all(
            matrix * vector - eigenvalue * vector == sp.zeros(matrix.rows, 1)
            for vector in vectors
        )
        rows.append(
            {
                "eigenvalue": sp.sstr(eigenvalue),
                "algebraic_multiplicity": int(algebraic_multiplicity),
                "geometric_multiplicity": len(vectors),
                "geometric_equals_algebraic": len(vectors) == algebraic_multiplicity,
                "exact_eigenvector_residual_zero": exact_residual,
            }
        )
        all_vectors.extend(vectors)
    basis = sp.Matrix.hstack(*all_vectors)
    basis_rank = int(basis.rank())
    complete = bool(
        basis_rank == matrix.rows
        and all(row["geometric_equals_algebraic"] for row in rows)
        and all(row["exact_eigenvector_residual_zero"] for row in rows)
    )
    return rows, basis_rank, complete


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--rationalization-tolerance", type=float, default=1.0e-14)
    args = parser.parse_args()
    if args.rationalization_tolerance <= 0.0 or not np.isfinite(args.rationalization_tolerance):
        raise SystemExit("--rationalization-tolerance must be finite and positive")
    axes = tuple(int(value.strip()) for value in args.normal_axes.split(",") if value.strip())
    if not axes or any(axis not in (0, 1, 2) for axis in axes) or len(set(axes)) != len(axes):
        raise SystemExit("--normal-axes must contain distinct values from 0,1,2")

    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    lam = sp.symbols("lambda")
    expected = sp.expand(_expected_factorization(lam))
    rows: list[dict[str, object]] = []
    for normal_axis in axes:
        direct = analytic_fo_ccz4_principal_matrix_3d(
            normal_axis=normal_axis, gauge=gauge, config=config
        )
        rational, rationalization_residual = _rationalize(direct)
        characteristic = rational.charpoly(lam).as_expr()
        factorization_match = bool(sp.simplify(characteristic - expected) == 0)
        eigenspaces, basis_rank, complete = _eigenspace_rows(rational)
        rows.append(
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

    rationalization_passed = all(row["rationalization_within_tolerance"] for row in rows)
    factorization_passed = all(row["characteristic_factorization_match"] for row in rows)
    eigenbasis_passed = all(row["exact_eigenbasis_complete"] for row in rows)
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-exact-frozen-eigenbasis-shadow",
        "schema_version": "nr-k1-fo-ccz4-exact-eigenbasis-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "background": "flat-Minkowski-linearized-principal-part",
        "contract": {
            "gauge": asdict(gauge),
            "config": asdict(config),
            "rationalization": "limit-denominator-100000-from-direct-float-matrix",
            "expected_factorization": sp.sstr(sp.factor(expected)),
        },
        "campaign": {
            "normal_axes": list(axes),
            "rationalization_tolerance": args.rationalization_tolerance,
        },
        "rows": rows,
        "validation": {
            "rationalized_direct_matrix_validated": rationalization_passed,
            "exact_characteristic_factorization_validated": factorization_passed,
            "flat_point_exact_eigenbasis_validated": eigenbasis_passed,
            "analytic_full_parameter_eigenvectors_validated": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-parameterized-eigenbasis-symmetrizer-cpbc",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "normal_axes": list(axes),
                "rationalized_direct_matrix_validated": rationalization_passed,
                "exact_characteristic_factorization_validated": factorization_passed,
                "flat_point_exact_eigenbasis_validated": eigenbasis_passed,
                "max_rationalization_residual": max(
                    row["rationalization_residual_l_inf"] for row in rows
                ),
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if rationalization_passed and factorization_passed and eigenbasis_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
