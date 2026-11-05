from __future__ import annotations

import numpy as np
import pytest

from .amr_patch3d import advance_local_patch_periodic_amr
from .nr3d import BSSNState3D, Grid3D


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_local_patch_amr_refreshes_ghosts_deterministically(formulation: str) -> None:
    grid = Grid3D(
        (9, 9, 9),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )
    initial = BSSNState3D.gauge_wave(
        grid,
        amplitude=1.0e-3,
        formulation=formulation,  # type: ignore[arg-type]
    )
    first = advance_local_patch_periodic_amr(
        initial,
        1.0e-5,
        patch_lower=(2, 2, 2),
        patch_upper=(7, 7, 7),
        refinement_ratio=2,
        ghost_cells=2,
    )
    second = advance_local_patch_periodic_amr(
        initial,
        1.0e-5,
        patch_lower=(2, 2, 2),
        patch_upper=(7, 7, 7),
        refinement_ratio=2,
        ghost_cells=2,
    )
    assert first.finite_state is True
    assert first.ghost_consistent is True
    assert first.ghost_refreshes == 5
    assert first.reflux_applied is False
    assert first.physical_amr_validated is False
    assert first.synchronization == "local-node-ghost-refresh-injection-only"
    assert first.boundary_operator == "sommerfeld-scalar-proxy-on-patch-shell"
    assert first.fine_patch_state.grid.shape == (14, 14, 14)
    assert first.coarse_fine_l2 >= 0.0
    assert first.coarse_fine_l_inf >= first.coarse_fine_l2
    assert first.state_sha256 == second.state_sha256
    assert np.array_equal(first.fine_patch_state.chi, second.fine_patch_state.chi)


def test_local_patch_amr_rejects_invalid_domain_contracts() -> None:
    nonperiodic = BSSNState3D.minkowski(
        Grid3D((9, 9, 9), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="excision")
    )
    with pytest.raises(ValueError, match="fully valid periodic"):
        advance_local_patch_periodic_amr(
            nonperiodic,
            1.0e-5,
            patch_lower=(2, 2, 2),
            patch_upper=(7, 7, 7),
        )
    periodic = BSSNState3D.minkowski(
        Grid3D((9, 9, 9), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    )
    with pytest.raises(ValueError, match="at least two"):
        advance_local_patch_periodic_amr(
            periodic,
            1.0e-5,
            patch_lower=(2, 2, 2),
            patch_upper=(7, 7, 7),
            ghost_cells=1,
        )
    with pytest.raises(ValueError, match="in-domain"):
        advance_local_patch_periodic_amr(
            periodic,
            1.0e-5,
            patch_lower=(-1, 2, 2),
            patch_upper=(7, 7, 7),
        )
