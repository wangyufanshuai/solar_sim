"""Frozen FO-CCZ4 gauge-regime sweep for the numerical symmetrizer candidate.

The sweep makes the Gamma-driver parameter boundary explicit.  It compares
the legacy ``shift_coefficient=0.75`` regime with the non-degenerate shadow
regime without changing either runtime.  A finite condition-number bound is a
numerical conditioning guard only; it is not an analytic hyperbolicity proof.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Iterable

from .ccz4_reference import GaugeConfig
from .fo_ccz4_rhs import FOCCZ4Config
from .fo_ccz4_symmetrizer_shadow import (
    linearized_fo_ccz4_numerical_symmetrizer_shadow_3d,
)
from .fo_ccz4_characteristic_contract import published_characteristic_speed_collisions


@dataclass(frozen=True)
class FOCCZ4GaugeRegimeCase3D:
    """One replayed gauge/normal point in the frozen candidate sweep."""

    points: int
    harmonic: int
    normal_axis: int
    shift_coefficient: float
    shift_damping: float
    theta_coupling: float
    speed_collisions: tuple[tuple[str, str, float], ...]
    effective_wave_number: float
    variable_count: int
    eigenbasis_rank: int
    eigenbasis_condition_number: float
    eigenbasis_residual_l_inf: float
    eigenvalues_imaginary_l_inf: float
    symmetrizer_condition_number: float
    symmetrizer_condition_number_limit: float
    symmetrizer_condition_bound_validated: bool
    weighted_principal_symmetry_residual_l_inf: float
    numerical_candidate_validated: bool
    deterministic_replay: bool
    symmetrizer_sha256: str
    method: str = "fo-ccz4-gauge-regime-condition-bound-shadow-v1"


def _validate_axes(values: Iterable[int]) -> tuple[int, ...]:
    axes = tuple(int(value) for value in values)
    if not axes or any(axis not in (0, 1, 2) for axis in axes):
        raise ValueError("normal_axes must contain one or more values from 0, 1, 2")
    if len(set(axes)) != len(axes):
        raise ValueError("normal_axes must not repeat an axis")
    return axes


def _validate_coefficients(values: Iterable[float]) -> tuple[float, ...]:
    coefficients = tuple(float(value) for value in values)
    if not coefficients or any(
        not math.isfinite(value) or value <= 0.0 for value in coefficients
    ):
        raise ValueError("shift_coefficients must be finite and positive")
    if len(set(coefficients)) != len(coefficients):
        raise ValueError("shift_coefficients must not repeat a value")
    return coefficients


def run_fo_ccz4_gauge_regime_sweep_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axes: Iterable[int] = (0, 1, 2),
    shift_coefficients: Iterable[float] = (0.75, 1.0),
    shift_damping: float = 0.0,
    theta_coupling: float = 2.0,
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    condition_number_limit: float = 1.0e10,
) -> tuple[FOCCZ4GaugeRegimeCase3D, ...]:
    """Run a deterministic frozen sweep over gauge and normal directions."""

    axes = _validate_axes(normal_axes)
    coefficients = _validate_coefficients(shift_coefficients)
    shift_damping = float(shift_damping)
    theta_coupling = float(theta_coupling)
    if not math.isfinite(shift_damping) or shift_damping < 0.0:
        raise ValueError("shift_damping must be finite and non-negative")
    if not math.isfinite(theta_coupling) or theta_coupling < 0.0:
        raise ValueError("theta_coupling must be finite and non-negative")
    condition_number_limit = float(condition_number_limit)
    if not math.isfinite(condition_number_limit) or condition_number_limit <= 0.0:
        raise ValueError("condition_number_limit must be finite and positive")

    cases: list[FOCCZ4GaugeRegimeCase3D] = []
    for shift_coefficient in coefficients:
        gauge = GaugeConfig(
            shift_coefficient=shift_coefficient,
            shift_damping=shift_damping,
            theta_coupling=theta_coupling,
        )
        for normal_axis in axes:
            audit = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
                points=points,
                harmonic=harmonic,
                normal_axis=normal_axis,
                gauge=gauge,
                config=config,
                condition_number_limit=condition_number_limit,
            )
            replay = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
                points=points,
                harmonic=harmonic,
                normal_axis=normal_axis,
                gauge=gauge,
                config=config,
                condition_number_limit=condition_number_limit,
            )
            speed_collisions = published_characteristic_speed_collisions(
                gauge=gauge,
                config=config,
            )
            deterministic = bool(
                audit.symmetrizer_sha256 == replay.symmetrizer_sha256
                and audit.eigenbasis_residual_l_inf
                == replay.eigenbasis_residual_l_inf
                and audit.symmetrizer_condition_number
                == replay.symmetrizer_condition_number
            )
            cases.append(
                FOCCZ4GaugeRegimeCase3D(
                    points=audit.points,
                    harmonic=audit.harmonic,
                    normal_axis=audit.normal_axis,
                    shift_coefficient=shift_coefficient,
                    shift_damping=shift_damping,
                    theta_coupling=theta_coupling,
                    speed_collisions=speed_collisions,
                    effective_wave_number=audit.effective_wave_number,
                    variable_count=audit.variable_count,
                    eigenbasis_rank=audit.eigenbasis_rank,
                    eigenbasis_condition_number=audit.eigenbasis_condition_number,
                    eigenbasis_residual_l_inf=audit.eigenbasis_residual_l_inf,
                    eigenvalues_imaginary_l_inf=audit.eigenvalues_imaginary_l_inf,
                    symmetrizer_condition_number=audit.symmetrizer_condition_number,
                    symmetrizer_condition_number_limit=(
                        audit.symmetrizer_condition_number_limit
                    ),
                    symmetrizer_condition_bound_validated=(
                        audit.symmetrizer_condition_bound_validated
                    ),
                    weighted_principal_symmetry_residual_l_inf=(
                        audit.weighted_principal_symmetry_residual_l_inf
                    ),
                    numerical_candidate_validated=audit.numerical_candidate_validated,
                    deterministic_replay=deterministic,
                    symmetrizer_sha256=audit.symmetrizer_sha256,
                )
            )
    return tuple(cases)


__all__ = [
    "FOCCZ4GaugeRegimeCase3D",
    "run_fo_ccz4_gauge_regime_sweep_3d",
]
