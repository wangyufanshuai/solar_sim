"""Exact flat-background characteristic-polynomial contract for FO-CCZ4.

The default non-degenerate shadow point (``f=1``, ``mu=1``, ``e=c=1``)
has a rational characteristic polynomial even though several characteristic
speeds are irrational.  The factorization below is an exact algebraic
contract for the *direct* 58-by-58 principal matrix.  It is deliberately
smaller than an analytic eigenvector or symmetrizer proof: repeated roots can
still require a formulation-specific basis construction and boundary energy
estimate.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_rhs import FOCCZ4Config


@dataclass(frozen=True)
class FOCCZ4CharacteristicPolynomialContract:
    """Exact factorization and root census at the audited shadow point."""

    normal_axis: int
    variable_count: int
    factorization: str
    leading_coefficient: str
    monic_coefficients_descending: tuple[str, ...]
    speed_multiplicities: tuple[tuple[str, float, int], ...]
    method: str = "exact-rational-flat-fo-ccz4-characteristic-polynomial-v1"
    analytic_eigenvectors_validated: bool = False
    strong_hyperbolicity_validated: bool = False
    constraint_preserving_validated: bool = False
    physical_boundary_validated: bool = False


def _multiply(left: list[Fraction], right: list[Fraction]) -> list[Fraction]:
    result = [Fraction(0) for _ in range(len(left) + len(right) - 1)]
    for first, left_value in enumerate(left):
        for second, right_value in enumerate(right):
            result[first + second] += left_value * right_value
    return result


def _factor_product() -> tuple[list[Fraction], str, Fraction]:
    """Return ascending coefficients, display factorization, and leading scale."""

    factors: tuple[tuple[list[Fraction], int], ...] = (
        ([Fraction(0), Fraction(1)], 26),
        ([Fraction(-1), Fraction(1)], 8),
        ([Fraction(1), Fraction(1)], 8),
        ([Fraction(-1), Fraction(2)], 4),
        ([Fraction(1), Fraction(2)], 4),
        ([Fraction(-2), Fraction(0), Fraction(1)], 1),
        ([Fraction(-1), Fraction(0), Fraction(2)], 2),
        ([Fraction(-4), Fraction(0), Fraction(3)], 1),
    )
    polynomial = [Fraction(1)]
    for factor, multiplicity in factors:
        for _ in range(multiplicity):
            polynomial = _multiply(polynomial, factor)
    leading = polynomial[-1]
    display = (
        "lambda**26*(lambda-1)**8*(lambda+1)**8*"
        "(2*lambda-1)**4*(2*lambda+1)**4*"
        "(lambda**2-2)*(2*lambda**2-1)**2*(3*lambda**2-4)/3072"
    )
    return polynomial, display, leading


def _require_audited_point(gauge: GaugeConfig, config: FOCCZ4Config) -> None:
    checks = (
        (gauge.advective, "advective gauge"),
        (math.isclose(gauge.lapse_coefficient, 2.0, rel_tol=0.0, abs_tol=1.0e-12), "lapse_coefficient=2"),
        (math.isclose(gauge.shift_coefficient, 1.0, rel_tol=0.0, abs_tol=1.0e-12), "shift_coefficient=1"),
        (math.isclose(gauge.shift_damping, 0.0, rel_tol=0.0, abs_tol=1.0e-12), "shift_damping=0"),
        (math.isclose(gauge.theta_coupling, 2.0, rel_tol=0.0, abs_tol=1.0e-12), "theta_coupling=2"),
        (math.isclose(config.cleaning_speed, 1.0, rel_tol=0.0, abs_tol=1.0e-12), "cleaning_speed=1"),
        (math.isclose(config.ordering_mu, 1.0, rel_tol=0.0, abs_tol=1.0e-12), "ordering_mu=1"),
        (math.isclose(config.shift_strength, 1.0, rel_tol=0.0, abs_tol=1.0e-12), "shift_strength=1"),
        (math.isclose(config.c, 1.0, rel_tol=0.0, abs_tol=1.0e-12), "c=1"),
    )
    for valid, label in checks:
        if not valid:
            raise ValueError(
                "exact FO-CCZ4 characteristic contract requires the audited "
                f"shadow point ({label})"
            )


def flat_fo_ccz4_characteristic_polynomial_contract(
    *,
    normal_axis: int = 0,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
) -> FOCCZ4CharacteristicPolynomialContract:
    """Return the exact rational polynomial contract at the audited point."""

    if normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    _require_audited_point(gauge, config)
    polynomial, factorization, leading = _factor_product()
    monic = tuple(
        str(value / leading) for value in reversed(polynomial)
    )
    # The factors encode the Appendix-A family multiplicities at this point:
    # 26 zero modes, then signed light/cleaning, gauge, and ordering branches.
    speeds = (
        ("zero", 0.0, 26),
        ("light-cleaning", 1.0, 6),
        ("one-plus-log", math.sqrt(2.0), 1),
        ("gamma-driver-longitudinal", math.sqrt(4.0 / 3.0), 1),
        ("ordering-longitudinal", math.sqrt(0.5), 2),
        ("gamma-driver-transverse", 1.0, 2),
        ("ordering-transverse", 0.5, 4),
    )
    return FOCCZ4CharacteristicPolynomialContract(
        normal_axis=normal_axis,
        variable_count=len(FOCCZ4_VARIABLE_ORDER),
        factorization=factorization,
        leading_coefficient=str(leading),
        monic_coefficients_descending=monic,
        speed_multiplicities=speeds,
    )


def characteristic_speed_multiset(
    contract: FOCCZ4CharacteristicPolynomialContract,
) -> np.ndarray:
    """Expand the contract into a sorted signed speed multiset."""

    values: list[float] = []
    for _, speed, multiplicity in contract.speed_multiplicities:
        if speed == 0.0:
            values.extend([0.0] * multiplicity)
        else:
            values.extend([-speed] * multiplicity)
            values.extend([speed] * multiplicity)
    result = np.asarray(values, dtype=np.float64)
    if result.size != contract.variable_count:
        raise AssertionError("characteristic speed contract does not contain 58 modes")
    return np.sort(result)


def published_characteristic_speed_collisions(
    *,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    tolerance: float = 1.0e-12,
) -> tuple[tuple[str, str, float], ...]:
    """Return exact frozen speed-family collisions for the gauge contract.

    The collision list is a spectral diagnostic only.  Equal characteristic
    speeds do not by themselves prove loss of strong hyperbolicity; the
    corresponding eigenvectors still need a uniformly bounded construction.
    It does, however, make the legacy ``f=3/4`` longitudinal/light collision
    explicit instead of inferring it from an ill-conditioned numerical basis.
    """

    tolerance = float(tolerance)
    if not math.isfinite(tolerance) or tolerance <= 0.0:
        raise ValueError("tolerance must be finite and positive")
    if not math.isclose(config.cleaning_speed, 1.0, rel_tol=0.0, abs_tol=1.0e-12):
        raise ValueError("speed collision contract requires cleaning_speed=1")
    if not math.isclose(config.c, 1.0, rel_tol=0.0, abs_tol=1.0e-12):
        raise ValueError("speed collision contract requires c=1")
    families = (
        ("light-cleaning", float(config.cleaning_speed)),
        ("one-plus-log", float(math.sqrt(gauge.lapse_coefficient))),
        (
            "gamma-driver-longitudinal",
            float(math.sqrt(4.0 * gauge.shift_coefficient / 3.0)),
        ),
        (
            "ordering-longitudinal",
            float(math.sqrt(config.ordering_mu / 2.0)),
        ),
        ("gamma-driver-transverse", float(math.sqrt(gauge.shift_coefficient))),
        ("ordering-transverse", float(0.5 * math.sqrt(config.ordering_mu))),
    )
    collisions: list[tuple[str, str, float]] = []
    for left_index, (left_name, left_speed) in enumerate(families):
        for right_name, right_speed in families[left_index + 1 :]:
            if math.isclose(left_speed, right_speed, rel_tol=0.0, abs_tol=tolerance):
                collisions.append((left_name, right_name, left_speed))
    return tuple(collisions)


__all__ = [
    "FOCCZ4CharacteristicPolynomialContract",
    "characteristic_speed_multiset",
    "flat_fo_ccz4_characteristic_polynomial_contract",
    "published_characteristic_speed_collisions",
]
