"""Actual nonlinear FO-CCZ4 volume equations with explicit SBP(4,2) derivatives.

This module has NO time driver, SAT, fixed halo, or physical boundary condition.
All58 independent fields and all nonlinear sources enter the shared equation
body. Its grid is explicitly nonperiodic; legacy evolution/checkpoint paths
reject it. This is the volume component of a future nonlinear SBP/SAT IBVP.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import hashlib

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4Auxiliary3D, FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_rhs import (
    FOCCZ4Config, FOCCZ4State3D, _fo_ccz4_volume_rhs_3d, _geometry,
)
from .nr3d import BSSNState3D, Grid3D
from .sbp_boundary_operator import SBP42

BOUNDARY = "sbp-volume"
METADATA_KEY = "fo_ccz4_sbp_volume_operator"
SYMMETRIC = tuple((i, j) for i in range(3) for j in range(i, 3))
FLAGS = (
    "physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
    "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
    "scientificPayloadWriteback", "cpbc_ready", "strong_hyperbolicity_validated",
)


@dataclass(frozen=True)
class SBPVolumeOperator:
    """A fixed grid and explicitly identified, ghost-free spatial derivative."""

    grid: Grid3D
    axes: tuple[SBP42, ...] = field(init=False, repr=False)

    def __post_init__(self):
        if not isinstance(self.grid, Grid3D) or self.grid.boundary != BOUNDARY:
            raise ValueError("explicit sbp-volume grid required; no periodic/fixed-halo alias")
        if self.grid.spatial_order != 4:
            raise ValueError("SBP(4,2) has interior order4, boundary order2")
        object.__setattr__(self, "axes", tuple(
            SBP42(n, dx) for n, dx in zip(self.grid.shape, self.grid.spacing, strict=True)
        ))

    @property
    def identity(self):
        return {
            "schema": "nr-fo-nonlinear-sbp-volume-v1",
            "boundary": BOUNDARY, "boundary_conditions_applied": False,
            "shape": list(self.grid.shape), "lower": list(self.grid.lower),
            "upper": list(self.grid.upper), "spacing": list(self.grid.spacing),
            "interior_order": 4, "boundary_order": 2, "boundary_rows_per_face": 4,
            "variable_order": list(FOCCZ4_VARIABLE_ORDER),
            "auxiliary_fields_independent": True, "auxiliaries_reconstructed": False,
            "sat_applied": False, "fixed_halo": False, "evolution_supported": False,
            **{key: False for key in FLAGS},
        }

    def validate_state(self, state):
        if not isinstance(state, FOCCZ4State3D) or state.grid != self.grid:
            raise ValueError("matching FO-CCZ4 state/grid required")
        if state.base.metadata.get(METADATA_KEY) != self.identity:
            raise ValueError("explicit matching SBP volume identity required")
        if not np.all(state.base.valid_mask):
            raise ValueError("SBP volume requires all cells valid; no excision or hidden halo")
        # State arrays are mutable. Recheck positivity/SPD instead of trusting
        # the original constructor, and never clip an invalid metric or lapse.
        if (not np.all(np.isfinite(state.base.h))
                or not np.array_equal(state.base.h, np.swapaxes(state.base.h, -1, -2))
                or np.any(np.linalg.eigvalsh(state.base.h) <= 0.)):
            raise ValueError("finite symmetric positive definite metric required")
        for values in (state.base.lapse, state.base.chi):
            if not np.all(np.isfinite(values)) or np.any(values <= 0.):
                raise ValueError("positive finite lapse and chi required")

    def derivative(self, values, state, axis):
        if state.grid != self.grid or type(axis) is not int or axis not in (0, 1, 2):
            raise ValueError("matching derivative grid and spatial axis required")
        if np.shape(values)[:3] != self.grid.shape:
            raise ValueError("derivative requires three leading spatial axes")
        return self.axes[axis].derivative(values, axis=axis)

    def rhs(
        self, state, *, gauge=GaugeConfig(theta_coupling=2.),
        config=FOCCZ4Config(), gauge_profile=None,
    ):
        """Evaluate nonlinear volume RHS, including the surface rows, without SAT."""
        self.validate_state(state)
        return _fo_ccz4_volume_rhs_3d(
            state, gauge=gauge, config=config, gauge_profile=gauge_profile,
            first_derivative=self.derivative,
        )

    def geometry(self, state):
        """The same first-order geometry as the RHS, with this explicit derivative."""
        self.validate_state(state)
        return _geometry(state, self.derivative)


def state_from_slots(grid, slots, *, metadata=None):
    """Copy independent canonical fields; never reconstruct A/B/D/P derivatives.

    This is an in-memory volume-state constructor, not the native checkpoint
    format. A caller must not serialize it as a periodic or fixed-halo restart.
    """
    operator = SBPVolumeOperator(grid)
    raw = np.asarray(slots)
    if (raw.dtype.kind not in "fiu" or raw.shape != (58, *grid.shape)
            or not np.all(np.isfinite(raw))):
        raise ValueError("58 real finite canonical fields on the complete grid required")
    q = np.array(raw, dtype=np.float64, order="C", copy=True)
    h, a = (np.zeros((*grid.shape, 3, 3)) for _ in range(2))
    d = np.zeros((*grid.shape, 3, 3, 3))
    for offset, (i, j) in enumerate(SYMMETRIC):
        h[..., i, j] = h[..., j, i] = q[offset]
        a[..., i, j] = a[..., j, i] = q[11+offset]
        for axis in range(3):
            d[..., axis, i, j] = d[..., axis, j, i] = q[37+6*axis+offset]
    supplied = dict(metadata or {})
    if METADATA_KEY in supplied and supplied[METADATA_KEY] != operator.identity:
        raise ValueError("supplied SBP volume identity conflicts with grid/operator")
    # A frozen-halo domain label on this new grid would be a false contract.
    if "schwarzschild_domain" in supplied or "checkpoint_version" in supplied:
        raise ValueError("legacy boundary/checkpoint metadata is not an SBP volume contract")
    with np.errstate(over="raise", invalid="raise", under="raise"):
        try:
            lapse, chi = np.exp(q[6]), np.exp(2.*q[10])
        except FloatingPointError as error:
            raise ValueError("logarithmic fields must give positive finite lapse/chi") from error
    base = BSSNState3D(
        grid, chi, h, q[17], a, q[18], np.moveaxis(q[19:22], 0, -1),
        lapse, np.moveaxis(q[7:10], 0, -1), np.moveaxis(q[22:25], 0, -1),
        np.ones(grid.shape, dtype=bool), formulation="ccz4",
        metadata={**supplied, METADATA_KEY: operator.identity},
    )
    auxiliary = FOCCZ4Auxiliary3D(
        np.moveaxis(q[25:28], 0, -1),
        np.moveaxis(q[28:37], 0, -1).reshape((*grid.shape, 3, 3)), d,
        np.moveaxis(q[55:58], 0, -1), derivative_order=4,
        source_state_sha256=hashlib.sha256(q.tobytes()).hexdigest(),
        method="independent-58-slots-sbp-volume-not-reconstructed-v1",
    )
    result = FOCCZ4State3D(base, auxiliary)
    operator.validate_state(result)
    return result
