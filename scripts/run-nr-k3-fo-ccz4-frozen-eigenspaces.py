"""Audit actual local FO-CCZ4 eigenspaces, including mandatory rejected points.

A successful campaign means the controls were reproduced, not that all states
passed or that the equations are uniformly strongly hyperbolic. SymPy is used
only for exact ranks of tightly checked rational reconstructions, never as an
unreported replacement for the floating-point evolution RHS.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import platform
import sys

import numpy as np
import sympy as sp

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    FOCCZ4Config,
    GaugeConfig,
    audit_frozen_fo_ccz4_eigenspaces_3d,
    frozen_fo_ccz4_principal_matrix_3d,
    probe_frozen_fo_ccz4_rhs_matrix_3d,
)


SOURCES = (
    "science/numerical_relativity/__init__.py",
    "science/numerical_relativity/nr3d.py",
    "science/numerical_relativity/ccz4_reference.py",
    "science/numerical_relativity/bssn3d.py",
    "science/numerical_relativity/fo_ccz4.py",
    "science/numerical_relativity/fo_ccz4_rhs.py",
    "science/numerical_relativity/fo_ccz4_principal_symbol.py",
    "science/numerical_relativity/fo_ccz4_frozen_symbol.py",
    "science/numerical_relativity/fo_ccz4_frozen_characteristics.py",
    "scripts/run-nr-k3-fo-ccz4-frozen-eigenspaces.py",
)
RHS_TOLERANCE = 2.e-12
RECONSTRUCTION_TOLERANCE = 2.e-14
RECONSTRUCTION_MAX_DENOMINATOR = 144


def _source_digest():
    digest = hashlib.sha256()
    for relative in SOURCES:
        digest.update(relative.encode() + b"\0" + (ROOT / relative).read_bytes())
    return digest.hexdigest()


def rational_collision_certificate(matrix, squared_speed: Fraction) -> dict:
    """Certify a Jordan defect of a rational reconstruction, not of all PDEs.

    For p(x)=x**2-r**2, p has distinct roots when r**2>0. Growth of the exact
    kernel from p(A) to p(A)**2 proves a nontrivial Jordan block in the rational
    matrix. The reconstruction tolerance/denominator are fixed before running.
    """

    matrix = np.asarray(matrix, dtype=float)
    if matrix.shape != (58, 58) or not np.all(np.isfinite(matrix)) or squared_speed <= 0:
        raise ValueError("certificate requires a finite 58-by-58 matrix and positive squared speed")
    rational = sp.Matrix([
        [sp.Rational(Fraction(float(value)).limit_denominator(RECONSTRUCTION_MAX_DENOMINATOR)) for value in row]
        for row in matrix
    ])
    error = float(np.max(np.abs(np.asarray(rational, dtype=float) - matrix)))
    if error > RECONSTRUCTION_TOLERANCE:
        raise ValueError("matrix is not within the declared rational reconstruction tolerance")
    polynomial = rational * rational - sp.Rational(squared_speed) * sp.eye(58)
    first_nullity = 58 - polynomial.rank()
    second_nullity = 58 - (polynomial * polynomial).rank()
    return {
        "scope": "exact ranks of rational reconstruction, not an analytic continuum proof",
        "polynomial": f"x**2-({squared_speed})",
        "reconstruction_max_denominator": RECONSTRUCTION_MAX_DENOMINATOR,
        "reconstruction_tolerance": RECONSTRUCTION_TOLERANCE,
        "reconstruction_l_inf": error,
        "rational_matrix_sha256": hashlib.sha256(str(rational.tolist()).encode()).hexdigest(),
        "nullity_pA": first_nullity,
        "nullity_pA_squared": second_nullity,
        "nonsemisimple_rational_reconstruction": bool(second_nullity > first_nullity),
    }


def _cases():
    identity = np.eye(3)
    h = np.array(((1.1, .13, -.1), (.13, .9, .02), (-.1, .02, 1.2)))
    h /= np.linalg.det(h)**(1./3.)
    # name, h, chi, alpha, beta, n, f, expected local gate, exact p-nullities
    return (
        ("minkowski-x", identity, 1., 1., (0.,0.,0.), (1.,0.,0.), 1., True, None),
        ("minkowski-y", identity, 1., 1., (0.,0.,0.), (0.,-1.,0.), 1., True, None),
        ("minkowski-oblique", identity, 1., 1., (0.,0.,0.), (1.,-2.,.3), 1., True, None),
        ("lapse-shift", identity, .6, .8, (.03,0.,0.), (1.,0.,0.), 1., True, None),
        ("anisotropic-oblique", h, .61, .7, (.2,-.1,.05), (1.,-2.,.3), 1., True, None),
        ("opposite-face", h, .61, .7, (.2,-.1,.05), (-1.,2.,-.3), 1., True, None),
        ("nonflat-f075", h, .61, .7, (.2,-.1,.05), (1.,-2.,.3), .75, True, None),
        ("legacy-flat-light-shift-collision", identity, 1., 1., (0.,0.,0.), (1.,0.,0.), .75, False, (Fraction(1),12,14)),
        ("lapse-shift-collision", identity, 2./3., 1., (0.,0.,0.), (1.,0.,0.), 1., False, (Fraction(4,3),2,4)),
        ("light-ordering-collision", identity, .5, 1., (0.,0.,0.), (1.,0.,0.), 1., False, (Fraction(1,2),12,16)),
    )


def run_campaign() -> dict:
    before = _source_digest()
    rows = []
    for name, h, chi, alpha, beta, n, f, expected, exact in _cases():
        args = (h, chi, alpha, beta, n)
        kwargs = dict(gauge=GaugeConfig(shift_coefficient=f, theta_coupling=2.), config=FOCCZ4Config(kappa1=0.))
        first = audit_frozen_fo_ccz4_eigenspaces_3d(*args, **kwargs)
        second = audit_frozen_fo_ccz4_eigenspaces_3d(*args, **kwargs)
        matrix = frozen_fo_ccz4_principal_matrix_3d(*args, **kwargs)
        actual = probe_frozen_fo_ccz4_rhs_matrix_3d(*args, **kwargs)
        rhs_error = float(np.max(abs(matrix-actual))) / max(1., float(np.max(abs(actual))))
        certificate = rational_collision_certificate(matrix, exact[0]) if exact else None
        exact_ok = certificate is None or (
            certificate["nonsemisimple_rational_reconstruction"]
            and certificate["nullity_pA"] == exact[1]
            and certificate["nullity_pA_squared"] == exact[2]
        )
        reproduced = first == second and first.pointwise_eigenbasis_validated == expected and exact_ok and rhs_error <= RHS_TOLERANCE
        rows.append({
            "case": name, "conformal_metric": h.tolist(), "chi": chi, "lapse": alpha,
            "shift": list(beta), "normal_covector": list(n),
            "gauge": asdict(kwargs["gauge"]), "config": asdict(kwargs["config"]),
            "expected_pointwise_pass": expected, "audit": asdict(first),
            "deterministic_replay": first == second, "rhs_scaled_error": rhs_error,
            "rational_certificate": certificate, "expected_control_reproduced": bool(reproduced),
        })
        print(json.dumps({"case": name, "rank": first.basis_rank, "pointwise_pass": first.pointwise_eigenbasis_validated,
                          "control_reproduced": bool(reproduced)}), flush=True)
    # These are additional diagnostics, not a post-hoc change to pass thresholds.
    approach = []
    for distance in (1.e-2, 1.e-4, 1.e-6):
        for sign in (-1, 1):
            result = audit_frozen_fo_ccz4_eigenspaces_3d(np.eye(3), 2./3.+sign*distance, 1., (0.,0.,0.), (1.,0.,0.))
            approach.append({"chi_offset": sign*distance, "audit": asdict(result)})
    after = _source_digest()
    reproduced = len(rows) == len(_cases()) and all(row["expected_control_reproduced"] for row in rows) and before == after
    return {
        "schema_version": "nr-k3-fo-ccz4-frozen-eigenspaces-v1",
        "source_digest": before, "source_files": list(SOURCES), "source_unchanged_during_run": before == after,
        "environment": {"python": sys.version, "numpy": np.__version__, "sympy": sp.__version__, "platform": platform.platform()},
        "primary_source": "https://arxiv.org/html/1707.09910v3#A2",
        "coefficient_convention": "gamma=h/chi; q_t=sum A^i*d_i(q)+S; 11 ODE speeds zero",
        "rhs_tolerance": RHS_TOLERANCE, "case_count": len(rows), "cases": rows,
        "approach_to_lapse_shift_collision": approach,
        "validation": {
            "expected_controls_reproduced": bool(reproduced),
            "all_sampled_points_diagonalizable": all(row["audit"]["pointwise_eigenbasis_validated"] for row in rows),
            "strong_hyperbolicity_validated": False, "analytic_uniform_basis_validated": False,
            "physical_boundary_validated": False, "cpbc_ready": False,
            "runtime_writeback": False, "scientificPayloadWriteback": False,
            "promotion": "blocked-known-local-eigenspace-defects-and-unproved-uniform-domain",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output already exists; choose a fresh receipt path")
    receipt = run_campaign()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(receipt, stream, indent=2, sort_keys=True, allow_nan=False)
        stream.write("\n")
    print(json.dumps({"output": str(args.output.resolve()), "validation": receipt["validation"]}))
    return 0 if receipt["validation"]["expected_controls_reproduced"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
