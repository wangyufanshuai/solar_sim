"""Explicit algebraic relaxation policy; not projection or physical admission.

Only h_t -= lambda*(det(h)-1)*h and a_t -= lambda*h*tr_h(a) are
changed. Independent auxiliary fields are NOT reconstructed or relaxed.
The zero-rate default preserves the legacy numerical/checkpoint path.
"""
from __future__ import annotations

import math

CONTROL_METADATA_KEY = "fo_ccz4_constraint_control"


def validate_tau_inverse(value: float) -> float:
    if type(value) not in (int, float) or not math.isfinite(value) or value < 0.:
        raise ValueError("tau_inverse must be a finite non-negative number (not bool)")
    return float(value)


def constraint_control_identity(tau_inverse: float) -> dict:
    rate = validate_tau_inverse(tau_inverse)
    return {
        "schema_version": "nr-fo-algebraic-relaxation-v1",
        "mode": "finite-rate-relaxation" if rate > 0. else "none",
        "tau_inverse": rate,
        "application": "rhs-every-rk-stage" if rate > 0. else "none",
        "algebraic_projection": False,
        "auxiliary_reconstruction": False,
        "physical_validation": False,
        "runtime_writeback": False,
    }


def require_matching_constraint_control(metadata: dict, tau_inverse: float) -> None:
    expected = constraint_control_identity(tau_inverse)
    if CONTROL_METADATA_KEY in metadata:
        stored = metadata[CONTROL_METADATA_KEY]
        if (not isinstance(stored, dict) or set(stored) != set(expected)
                or any(type(stored[k]) is not type(v) or stored[k] != v for k, v in expected.items())):
            raise ValueError("state constraint control mismatch; explicitly pass recorded tau_inverse")
