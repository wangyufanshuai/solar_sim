"""Audit the direct FO-CCZ4 flat symbol at oblique unit normals.

This is a frozen analytic-symbol replay.  It checks spectral isotropy of the
58-variable shadow away from the Cartesian axes and explicitly measures
repeated-root geometric defects.  It does not export characteristic vectors
to a runtime boundary operator and cannot establish a continuum symmetrizer
or nonlinear strong hyperbolicity.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
import math
from pathlib import Path
import sys
from typing import Iterable

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    FOCCZ4_VARIABLE_ORDER,
    FOCCZ4Config,
    GaugeConfig,
    analytic_fo_ccz4_principal_matrix_3d,
    fo_ccz4_rotation_representation_3d,
    published_fo_ccz4_speed_family_contract,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_characteristic_contract.py",
        "scripts/run-nr-k3-fo-ccz4-oblique-symbol.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _parse_normals(value: str) -> tuple[tuple[float, float, float], ...]:
    normals: list[tuple[float, float, float]] = []
    for raw in value.split(";"):
        components = tuple(
            float(component.strip())
            for component in raw.split(",")
            if component.strip()
        )
        if len(components) != 3 or not all(math.isfinite(component) for component in components):
            raise ValueError("each normal must contain three finite components")
        if np.linalg.norm(np.asarray(components, dtype=np.float64)) <= 0.0:
            raise ValueError("each normal must have non-zero length")
        normals.append(components)
    if not normals:
        raise ValueError("at least one normal is required")
    return tuple(normals)


def _normalized(normal: Iterable[float]) -> tuple[float, float, float]:
    vector = np.asarray(tuple(normal), dtype=np.float64)
    vector /= np.linalg.norm(vector)
    return tuple(float(value) for value in vector)


def _sort_eigenvalues(values: np.ndarray) -> np.ndarray:
    values = np.asarray(values, dtype=np.complex128)
    return values[np.lexsort((values.imag, values.real))]


def _rotation_with_first_column(normal: tuple[float, float, float]) -> np.ndarray:
    vector = np.asarray(_normalized(normal), dtype=np.float64)
    reference = np.asarray((0.0, 1.0, 0.0), dtype=np.float64)
    if abs(float(np.dot(vector, reference))) >= 0.9:
        reference = np.asarray((0.0, 0.0, 1.0), dtype=np.float64)
    second = reference - vector * float(np.dot(reference, vector))
    second /= np.linalg.norm(second)
    third = np.cross(vector, second)
    return np.column_stack((vector, second, third))


def _nonzero_speed_defect(
    matrix: np.ndarray,
    targets: np.ndarray,
    *,
    tolerance: float = 1.0e-8,
) -> int:
    defect = 0
    for speed in np.unique(np.round(targets, decimals=12)):
        multiplicity = int(
            np.count_nonzero(np.isclose(targets, speed, rtol=0.0, atol=tolerance))
        )
        if multiplicity <= 1 or abs(float(speed)) <= tolerance:
            continue
        _, singular_values, _ = np.linalg.svd(
            matrix - float(speed) * np.eye(matrix.shape[0], dtype=np.complex128),
            full_matrices=False,
        )
        scale = max(1.0, float(singular_values[0]))
        geometric = int(np.count_nonzero(singular_values <= tolerance * scale))
        defect += max(0, multiplicity - geometric)
    return defect


def _row(
    normal: tuple[float, float, float],
    *,
    gauge: GaugeConfig,
    config: FOCCZ4Config,
    reference_eigenvalues: np.ndarray,
    reference_matrix: np.ndarray,
    targets: np.ndarray,
) -> dict[str, object]:
    matrix = analytic_fo_ccz4_principal_matrix_3d(
        normal=normal,
        gauge=gauge,
        config=config,
    )
    replay = analytic_fo_ccz4_principal_matrix_3d(
        normal=normal,
        gauge=gauge,
        config=config,
    )
    values, vectors = np.linalg.eig(matrix)
    sorted_values = _sort_eigenvalues(values)
    rank = int(np.linalg.matrix_rank(vectors, tol=1.0e-10))
    residual = float(
        np.max(np.abs(matrix @ vectors - vectors @ np.diag(values)))
    )
    zero_values = np.count_nonzero(np.abs(values) <= 1.0e-10)
    _, singular_values, _ = np.linalg.svd(matrix, full_matrices=False)
    zero_scale = max(1.0, float(singular_values[0]))
    zero_nullity = int(np.count_nonzero(singular_values <= 1.0e-10 * zero_scale))
    zero_defect = max(0, int(zero_values) - zero_nullity)
    nonzero_defect = _nonzero_speed_defect(matrix, targets)
    rotation = _rotation_with_first_column(normal)
    representation = fo_ccz4_rotation_representation_3d(rotation)
    rotated_reference = (
        representation @ reference_matrix @ np.linalg.inv(representation)
    )
    digest = hashlib.sha256()
    digest.update(np.ascontiguousarray(matrix, dtype=np.float64).tobytes())
    return {
        "normal_input": list(normal),
        "normal_unit": list(_normalized(normal)),
        "variable_count": len(FOCCZ4_VARIABLE_ORDER),
        "matrix_sha256": digest.hexdigest(),
        "deterministic_replay": bool(np.array_equal(matrix, replay)),
        "eigenvector_rank": rank,
        "eigenvector_condition_number": float(np.linalg.cond(vectors)),
        "eigenvector_residual_l_inf": residual,
        "max_imaginary_eigenvalue": float(np.max(np.abs(sorted_values.imag))),
        "phase_speeds": [float(value.real) for value in sorted_values],
        "speed_census_error": float(
            np.max(np.abs(sorted_values.real - np.sort(targets)))
        ),
        "spectral_error_vs_reference": float(
            np.max(np.abs(sorted_values - reference_eigenvalues))
        ),
        "rotation_covariance_residual_l_inf": float(
            np.max(np.abs(matrix - rotated_reference))
        ),
        "zero_eigenvalue_count": int(zero_values),
        "zero_eigenspace_nullity": zero_nullity,
        "zero_speed_defect": zero_defect,
        "nonzero_speed_defect": nonzero_defect,
        # At exact repeated roots, numpy's floating eigensolver can return a
        # rank-deficient basis even when the independent nullity checks show
        # no geometric defect.  Keep both diagnostics; this flag is based on
        # the defect audit, never on that fragile eigenvector rank alone.
        "full_symbol_diagonalizable": bool(
            zero_defect == 0 and nonzero_defect == 0
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--normals",
        default="1,0,0;0,1,0;0,0,1;1,2,3;1,-2,0.5;-3,4,5",
        help="semicolon-separated normal vectors",
    )
    parser.add_argument("--shift-coefficient", type=float, default=1.0)
    args = parser.parse_args()
    normals = _parse_normals(args.normals)
    gauge = GaugeConfig(
        shift_coefficient=float(args.shift_coefficient),
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    config = FOCCZ4Config(kappa1=0.0)
    targets = np.asarray(
        [
            value
            for family in published_fo_ccz4_speed_family_contract(gauge, config)
            for value in (
                [family.phase_speed] * family.multiplicity
                if not family.signed
                else [-family.phase_speed] * family.multiplicity
                + [family.phase_speed] * family.multiplicity
            )
        ],
        dtype=np.float64,
    )
    reference = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=0, gauge=gauge, config=config
    )
    reference_eigenvalues = _sort_eigenvalues(np.linalg.eigvals(reference))
    rows = [
        _row(
            normal,
            gauge=gauge,
            config=config,
            reference_eigenvalues=reference_eigenvalues,
            reference_matrix=reference,
            targets=targets,
        )
        for normal in normals
    ]
    isotropy_validated = all(
        row["spectral_error_vs_reference"] <= 1.0e-10
        and row["rotation_covariance_residual_l_inf"] <= 1.0e-10
        and row["speed_census_error"] <= 1.0e-10
        and row["max_imaginary_eigenvalue"] <= 1.0e-10
        and row["deterministic_replay"]
        for row in rows
    )
    repeated_root_defect_free = all(
        bool(row["full_symbol_diagonalizable"]) for row in rows
    )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-oblique-analytic-symbol-shadow",
        "schema_version": "nr-k3-fo-ccz4-oblique-symbol-v2-tensor-covariance",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "background": "flat-Minkowski-linearized-principal-part",
        "contract": {
            "variable_order": "58=11-ode+47-pde",
            "normalization": "input normals normalized to Euclidean unit covectors",
            "phase_convention": "q_t=i*k*A(n)*q",
            "published_speed_families": [
                asdict(family)
                for family in published_fo_ccz4_speed_family_contract(gauge, config)
            ],
            "characteristic_vectors_exported": False,
        },
        "gauge": asdict(gauge),
        "config": asdict(config),
        "normals": [list(normal) for normal in normals],
        "rows": rows,
        "validation": {
            "oblique_spectral_isotropy_validated": isotropy_validated,
            "tensor_rotation_covariance_validated": isotropy_validated,
            "sampled_repeated_root_defect_free": repeated_root_defect_free,
            "repeated_nonzero_speed_defect_audited": True,
            "analytic_uniform_eigenbasis_validated": False,
            "analytic_symmetrizer_validated": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-uniform-eigenbasis-symmetrizer-cpbc-physical-validation",
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
                "normal_count": len(rows),
                "oblique_spectral_isotropy_validated": isotropy_validated,
                "sampled_repeated_root_defect_free": repeated_root_defect_free,
                "max_spectral_error": max(
                    row["spectral_error_vs_reference"] for row in rows
                ),
                "max_rotation_covariance_residual": max(
                    row["rotation_covariance_residual_l_inf"] for row in rows
                ),
                "max_nonzero_speed_defect": max(
                    row["nonzero_speed_defect"] for row in rows
                ),
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if isotropy_validated and repeated_root_defect_free else 2


if __name__ == "__main__":
    raise SystemExit(main())
