"""FO-CCZ4 first-order reduction contract for the NR-K3 shadow backend.

This module does not claim to be a complete first-order CCZ4 evolution
system.  It records the auxiliary variables used by the strongly hyperbolic
FO-CCZ4 formulation and provides deterministic ordering-constraint audits so
that the eventual PDE implementation has a language-neutral, testable
interface.

The convention is the one used by modern FO-CCZ4 implementations:

* ``A_i = d_i ln(alpha)``;
* ``B_k^i = d_k beta^i``;
* ``D_kij = 1/2 d_k h_ij`` for the conformal metric ``h``;
* ``P_i = d_i ln(phi)`` with ``ln(phi) = +1/2 ln(chi)`` because the
  project stores ``chi = phi**2`` in the conformal metric convention.

There are 33 auxiliary components (3 + 9 + 18 + 3), giving 58 fields when
attached to the existing 25-component CCZ4/BSSN state.  The derivative
variables are deliberately kept separate from the existing second-order RHS.
The report therefore never asserts strong hyperbolicity, constraint
preservation, physical validity, or production readiness.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Mapping

import numpy as np

from .bssn3d import _d1
from .nr3d import Array, BSSNState3D


FOCCZ4_BASE_VARIABLES: tuple[str, ...] = (
    *(f"h{i}{j}" for i in range(3) for j in range(i, 3)),
    "ln_alpha",
    *(f"beta{i}" for i in range(3)),
    "ln_phi",
    *(f"A{i}{j}" for i in range(3) for j in range(i, 3)),
    "K",
    "Theta",
    *(f"GammaHat{i}" for i in range(3)),
    *(f"b{i}" for i in range(3)),
)


FOCCZ4_AUXILIARY_VARIABLES: tuple[str, ...] = (
    *(f"A{i}" for i in range(3)),
    *(f"B{k}{i}" for k in range(3) for i in range(3)),
    *(f"D{k}{i}{j}" for k in range(3) for i in range(3) for j in range(i, 3)),
    *(f"P{i}" for i in range(3)),
)


FOCCZ4_VARIABLE_ORDER: tuple[str, ...] = (
    *FOCCZ4_BASE_VARIABLES,
    *FOCCZ4_AUXILIARY_VARIABLES,
)


# FO-CCZ4's strongly hyperbolic split isolates the metric/lapse/shift
# variables as 11 algebraic/ODE rows; the remaining 47 variables form the
# reduced spatial PDE block.  This is a declaration for the future RHS, not a
# numerical claim about the current second-order shadow operator.
FOCCZ4_ODE_VARIABLES: tuple[str, ...] = FOCCZ4_BASE_VARIABLES[:11]
FOCCZ4_PDE_VARIABLES: tuple[str, ...] = FOCCZ4_VARIABLE_ORDER[11:]


@dataclass(frozen=True)
class FOCCZ4Auxiliary3D:
    """First-order spatial derivatives attached to one valid 3-D state."""

    lapse_gradient: Array  # A_i = d_i ln(alpha), shape (..., 3)
    shift_gradient: Array  # B_k^i = d_k beta^i, shape (..., 3, 3)
    metric_gradient: Array  # D_kij = 1/2 d_k h_ij, shape (..., 3, 3, 3)
    conformal_factor_gradient: Array  # P_i = d_i(+1/2 ln(chi)), shape (..., 3)
    derivative_order: int
    source_state_sha256: str
    method: str = "fo-ccz4-auxiliary-derivatives-v1"

    def __post_init__(self) -> None:
        for name, expected_tail in (
            ("lapse_gradient", (3,)),
            ("shift_gradient", (3, 3)),
            ("metric_gradient", (3, 3, 3)),
            ("conformal_factor_gradient", (3,)),
        ):
            value = np.asarray(getattr(self, name), dtype=np.float64)
            if value.ndim != 3 + len(expected_tail):
                raise ValueError(f"{name} must have a three-dimensional grid prefix")
            if value.shape[-len(expected_tail):] != expected_tail:
                raise ValueError(f"{name} has invalid component shape {value.shape}")
            if value.size == 0 or not np.all(np.isfinite(value)):
                raise ValueError(f"{name} must be finite and non-empty")
            object.__setattr__(self, name, value)
        if self.derivative_order not in (2, 4):
            raise ValueError("derivative_order must be 2 or 4")
        if not isinstance(self.source_state_sha256, str) or len(self.source_state_sha256) != 64:
            raise ValueError("source_state_sha256 must be a SHA-256 hex digest")

    @property
    def component_count(self) -> int:
        return len(FOCCZ4_AUXILIARY_VARIABLES)

    def arrays(self) -> tuple[Array, ...]:
        """Return components in the canonical FO-CCZ4 auxiliary ordering."""

        return tuple(
            [self.lapse_gradient[..., i] for i in range(3)]
            + [self.shift_gradient[..., k, i] for k in range(3) for i in range(3)]
            + [
                self.metric_gradient[..., k, i, j]
                for k in range(3)
                for i in range(3)
                for j in range(i, 3)
            ]
            + [self.conformal_factor_gradient[..., i] for i in range(3)]
        )

    def sha256(self) -> str:
        digest = hashlib.sha256()
        digest.update(self.method.encode("ascii"))
        digest.update(str(self.derivative_order).encode("ascii"))
        digest.update(self.source_state_sha256.encode("ascii"))
        for name, value in zip(FOCCZ4_AUXILIARY_VARIABLES, self.arrays()):
            digest.update(name.encode("ascii"))
            digest.update(np.ascontiguousarray(value, dtype=np.float64).tobytes())
        return digest.hexdigest()


@dataclass(frozen=True)
class FOCCZ4OrderingReport3D:
    """Norms of FO-CCZ4 differential and algebraic ordering constraints."""

    derivative_order: int
    grid_shape: tuple[int, int, int]
    auxiliary_sha256: str
    curl_l2: Mapping[str, float]
    curl_l_inf: Mapping[str, float]
    algebraic_l2: Mapping[str, float]
    algebraic_l_inf: Mapping[str, float]
    method: str
    strong_hyperbolicity_validated: bool = False
    constraint_preserving_validated: bool = False
    physical_validation_validated: bool = False

    @property
    def max_curl_l_inf(self) -> float:
        return max(self.curl_l_inf.values(), default=math.inf)

    @property
    def max_algebraic_l_inf(self) -> float:
        return max(self.algebraic_l_inf.values(), default=math.inf)

    @property
    def finite(self) -> bool:
        return all(
            math.isfinite(value)
            for values in (
                self.curl_l2,
                self.curl_l_inf,
                self.algebraic_l2,
                self.algebraic_l_inf,
            )
            for value in values.values()
        )


def _state_sha256(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    digest.update(b"fo-ccz4-source-state-v1\0")
    digest.update(state.formulation.encode("ascii"))
    digest.update(np.asarray(state.grid.shape, dtype=np.int64).tobytes())
    digest.update(np.asarray(state.grid.lower, dtype=np.float64).tobytes())
    digest.update(np.asarray(state.grid.upper, dtype=np.float64).tobytes())
    digest.update(str(state.grid.boundary).encode("ascii"))
    digest.update(str(state.grid.spatial_order).encode("ascii"))
    for name in ("chi", "h", "lapse", "shift"):
        digest.update(name.encode("ascii"))
        digest.update(np.ascontiguousarray(getattr(state, name), dtype=np.float64).tobytes())
    return digest.hexdigest()


def _require_full_valid_state(state: BSSNState3D) -> None:
    if state.formulation != "ccz4":
        raise ValueError("FO-CCZ4 auxiliary construction requires formulation='ccz4'")
    if not np.all(state.valid_mask):
        raise ValueError(
            "FO-CCZ4 auxiliary construction requires a fully valid grid; "
            "fill an excision shadow explicitly before differentiating"
        )
    if state.grid.boundary not in ("periodic", "sommerfeld"):
        raise ValueError(
            "FO-CCZ4 auxiliary construction requires periodic or Sommerfeld boundaries"
        )


def build_fo_ccz4_auxiliary_3d(state: BSSNState3D) -> FOCCZ4Auxiliary3D:
    """Construct the 33 canonical first-order auxiliary fields.

    ``P_i`` is computed from the project's ``chi`` convention rather than
    introducing a second conformal-factor storage field.  The explicit
    logarithms enforce the positive lapse/chi contract already checked by
    :class:`BSSNState3D`.
    """

    _require_full_valid_state(state)
    order = state.grid.spatial_order
    lapse_log = np.log(state.lapse)
    conformal_log_phi = 0.5 * np.log(state.chi)
    lapse_gradient = np.stack([_d1(lapse_log, state, axis) for axis in range(3)], axis=-1)
    shift_gradient = np.empty((*state.grid.shape, 3, 3), dtype=np.float64)
    for axis in range(3):
        for component in range(3):
            shift_gradient[..., axis, component] = _d1(
                state.shift[..., component], state, axis
            )
    metric_gradient = np.empty((*state.grid.shape, 3, 3, 3), dtype=np.float64)
    for axis in range(3):
        metric_gradient[..., axis, :, :] = 0.5 * _d1(state.h, state, axis)
    conformal_factor_gradient = np.stack(
        [_d1(conformal_log_phi, state, axis) for axis in range(3)], axis=-1
    )
    return FOCCZ4Auxiliary3D(
        lapse_gradient=lapse_gradient,
        shift_gradient=shift_gradient,
        metric_gradient=metric_gradient,
        conformal_factor_gradient=conformal_factor_gradient,
        derivative_order=order,
        source_state_sha256=_state_sha256(state),
    )


def _norms(value: Array) -> tuple[float, float]:
    data = np.asarray(value, dtype=np.float64)
    return float(np.sqrt(np.mean(data * data))), float(np.max(np.abs(data)))


def _curl_1form(field: Array, state: BSSNState3D) -> dict[str, Array]:
    derivatives = [
        _d1(field[..., component], state, axis)
        for axis in range(3)
        for component in range(3)
    ]
    result: dict[str, Array] = {}
    for first in range(3):
        for second in range(first + 1, 3):
            result[f"{first}{second}"] = (
                derivatives[first * 3 + second] - derivatives[second * 3 + first]
            )
    return result


def _curl_shift(field: Array, state: BSSNState3D) -> dict[str, Array]:
    result: dict[str, Array] = {}
    for component in range(3):
        curls = _curl_1form(field[..., :, component], state)
        for pair, value in curls.items():
            result[f"{pair}^{component}"] = value
    return result


def _curl_metric(field: Array, state: BSSNState3D) -> dict[str, Array]:
    result: dict[str, Array] = {}
    for first in range(3):
        for second in range(first, 3):
            curls = _curl_1form(field[..., :, first, second], state)
            for pair, value in curls.items():
                result[f"{pair}^{first}{second}"] = value
    return result


def fo_ccz4_ordering_constraints_3d(
    state: BSSNState3D,
    auxiliary: FOCCZ4Auxiliary3D | None = None,
) -> FOCCZ4OrderingReport3D:
    """Measure first-order curl and algebraic constraints on a valid state.

    The curl families are the integrability constraints for ``A``, ``B``,
    ``D`` and ``P``.  The algebraic family additionally checks the unit
    conformal determinant, trace-free ``A_ij`` and the determinant-compatible
    traces ``h^ij D_kij``.  These are diagnostics only; no projection or
    damping is applied.
    """

    _require_full_valid_state(state)
    if auxiliary is None:
        auxiliary = build_fo_ccz4_auxiliary_3d(state)
    if auxiliary.derivative_order != state.grid.spatial_order:
        raise ValueError("auxiliary derivative order does not match the state grid")
    expected_shape = state.grid.shape
    if auxiliary.lapse_gradient.shape[:3] != expected_shape:
        raise ValueError("auxiliary fields do not match the state grid")
    inverse = np.linalg.inv(state.h)
    curl_fields: dict[str, Array] = {}
    for prefix, field, function in (
        ("A", auxiliary.lapse_gradient, _curl_1form),
        ("B", auxiliary.shift_gradient, _curl_shift),
        ("D", auxiliary.metric_gradient, _curl_metric),
        ("P", auxiliary.conformal_factor_gradient, _curl_1form),
    ):
        for name, value in function(field, state).items():
            curl_fields[f"{prefix}:{name}"] = value
    curl_l2: dict[str, float] = {}
    curl_l_inf: dict[str, float] = {}
    for name, value in curl_fields.items():
        l2, l_inf = _norms(value)
        curl_l2[name] = l2
        curl_l_inf[name] = l_inf

    determinant = np.linalg.det(state.h) - 1.0
    trace_a = np.einsum("...ij,...ij->...", inverse, state.a)
    d_trace = np.einsum("...ij,...kij->...k", inverse, auxiliary.metric_gradient)
    algebraic_fields = {
        "det_h_minus_one": determinant,
        "trace_a": trace_a,
        "metric_gradient_trace": d_trace,
    }
    algebraic_l2: dict[str, float] = {}
    algebraic_l_inf: dict[str, float] = {}
    for name, value in algebraic_fields.items():
        l2, l_inf = _norms(value)
        algebraic_l2[name] = l2
        algebraic_l_inf[name] = l_inf
    return FOCCZ4OrderingReport3D(
        derivative_order=auxiliary.derivative_order,
        grid_shape=tuple(int(value) for value in state.grid.shape),
        auxiliary_sha256=auxiliary.sha256(),
        curl_l2=curl_l2,
        curl_l_inf=curl_l_inf,
        algebraic_l2=algebraic_l2,
        algebraic_l_inf=algebraic_l_inf,
        method="fo-ccz4-ordering-constraint-audit-v1",
    )


def fo_ccz4_variable_contract_3d() -> dict[str, object]:
    """Return a stable, JSON-friendly description of the 58-field contract."""

    return {
        "base_variable_count": len(FOCCZ4_BASE_VARIABLES),
        "auxiliary_variable_count": len(FOCCZ4_AUXILIARY_VARIABLES),
        "total_variable_count": len(FOCCZ4_VARIABLE_ORDER),
        "base_variables": list(FOCCZ4_BASE_VARIABLES),
        "auxiliary_variables": list(FOCCZ4_AUXILIARY_VARIABLES),
        "ode_variable_count": len(FOCCZ4_ODE_VARIABLES),
        "ode_variables": list(FOCCZ4_ODE_VARIABLES),
        "pde_variable_count": len(FOCCZ4_PDE_VARIABLES),
        "definitions": {
            "A_i": "partial_i ln(alpha)",
            "B_k^i": "partial_k beta^i",
            "D_kij": "0.5 partial_k h_ij",
            "P_i": "partial_i ln(phi), with ln(phi)=+0.5 ln(chi)",
        },
        "state_mapping": {
            "h_ij": "state.h",
            "ln_alpha": "log(state.lapse)",
            "beta^i": "state.shift",
            "ln_phi": "+0.5*log(state.chi)",
            "A_ij": "state.a",
            "K": "state.trace_k",
            "Theta": "state.theta",
            "GammaHat^i": "state.conformal_gamma",
            "b^i": "state.b",
        },
        "ordering_constraints": {
            "A": "partial_i A_j - partial_j A_i = 0",
            "B": "partial_k B_l^i - partial_l B_k^i = 0",
            "D": "partial_k D_lij - partial_l D_kij = 0",
            "P": "partial_i P_j - partial_j P_i = 0",
        },
        "algebraic_constraints": [
            "det(h)-1=0",
            "h^ij A_ij=0",
            "h^ij D_kij=0",
        ],
        "strong_hyperbolicity_validated": False,
        "rhs_shadow_available": True,
        "production_evolution_validated": False,
    }


__all__ = [
    "FOCCZ4_BASE_VARIABLES",
    "FOCCZ4_AUXILIARY_VARIABLES",
    "FOCCZ4_VARIABLE_ORDER",
    "FOCCZ4_ODE_VARIABLES",
    "FOCCZ4_PDE_VARIABLES",
    "FOCCZ4Auxiliary3D",
    "FOCCZ4OrderingReport3D",
    "build_fo_ccz4_auxiliary_3d",
    "fo_ccz4_ordering_constraints_3d",
    "fo_ccz4_variable_contract_3d",
]
