"""Opt-in field-dependent gauge/ordering candidate, not a promotion contract.

This repository-derived candidate keeps advective 1+log and Gamma-driver but
sets f = shift_scale*alpha*chi and mu = ordering_scale*chi. For 0<alpha<2,
shift_scale>2 and 0<ordering_scale<2 the six distinct intrinsic speed families
are ordered: ordering-T < ordering-L < light < lapse < shift-T < shift-L.
Repeated families still require a complete uniformly bounded eigenbasis;
this separation argument alone proves neither strong hyperbolicity nor CPBC.

The FIRST-ORDER shift-gradient equation must include
    partial_k(f)*b^i = f*(A_k + 2*P_k)*b^i.
No derivative of mu is introduced: mu multiplies an ordering constraint after
the first-order reduction; it is not inside a differentiated flux. Constraints
must be re-derived for this variable-coefficient addition before promotion.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import math
from typing import TYPE_CHECKING

import numpy as np

from .ccz4_reference import GaugeConfig

if TYPE_CHECKING:
    from .fo_ccz4_rhs import FOCCZ4Config


PROFILE_METADATA_KEY = "fo_ccz4_gauge_profile"


@dataclass(frozen=True)
class FOCCZ4GaugeProfile:
    """A separately identified, experimental shadow coefficient family."""

    shift_scale: float = 3.0
    ordering_scale: float = 0.2

    def __post_init__(self):
        if not math.isfinite(self.shift_scale) or self.shift_scale <= 2.:
            raise ValueError("shift_scale must be finite and greater than 2")
        if not math.isfinite(self.ordering_scale) or not 0. < self.ordering_scale < 2.:
            raise ValueError("ordering_scale must be finite and between 0 and 2")

    def identity(self) -> dict:
        return {
            "schema_version": "fo-ccz4-state-dependent-gauge-shadow-v1",
            "shift_law": "f=shift_scale*alpha*chi",
            "ordering_law": "mu=ordering_scale*chi",
            "parameters": asdict(self),
            "runtime_writeback": False,
        }

    def validate_formulation(self, gauge: GaugeConfig, config: FOCCZ4Config) -> None:
        if (
            not gauge.advective or gauge.lapse_coefficient != 2.
            or gauge.theta_coupling != 2. or config.c != 1.
            or config.cleaning_speed != 1. or config.shift_strength != 1.
        ):
            raise ValueError("state-dependent profile requires advective 1+log and c=e=s=1")

    def coefficients(self, lapse, chi):
        alpha, conformal = np.asarray(lapse, dtype=float), np.asarray(chi, dtype=float)
        if not np.all(np.isfinite(alpha)) or not np.all((alpha > 0.) & (alpha < 2.)):
            raise ValueError("state-dependent profile requires 0 < lapse < 2; no clipping")
        if not np.all(np.isfinite(conformal)) or not np.all(conformal > 0.):
            raise ValueError("state-dependent profile requires finite positive chi")
        f = self.shift_scale * alpha * conformal
        mu = self.ordering_scale * conformal
        if not np.all(np.isfinite(f)) or not np.all(np.isfinite(mu)) or not np.all((f > 0.) & (mu > 0.)):
            raise ValueError("profile coefficients must remain finite and positive")
        return f, mu


def require_matching_gauge_profile(metadata: dict, profile: FOCCZ4GaugeProfile | None) -> None:
    """A profile-tagged state cannot silently continue with constant coefficients."""

    if PROFILE_METADATA_KEY in metadata:
        if profile is None or metadata[PROFILE_METADATA_KEY] != profile.identity():
            raise ValueError("state gauge profile mismatch; explicitly pass the recorded shadow profile")
