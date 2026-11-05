from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4_frozen_cpbc import (
    FOCCZ4FrozenCPBCMap3D,
    _incoming_mask,
    linearized_fo_ccz4_frozen_cpbc_map_3d,
)
from .fo_ccz4_principal_symbol import linearized_fo_ccz4_principal_symbol_3d
from .fo_ccz4_rhs import FOCCZ4Config


@pytest.fixture(scope="module")
def frozen_maps() -> tuple[FOCCZ4FrozenCPBCMap3D, FOCCZ4FrozenCPBCMap3D]:
    return (
        linearized_fo_ccz4_frozen_cpbc_map_3d(points=8, orientation="right"),
        linearized_fo_ccz4_frozen_cpbc_map_3d(points=8, orientation="left"),
    )


def test_frozen_cpbc_maps_cover_both_orientations(
    frozen_maps: tuple[FOCCZ4FrozenCPBCMap3D, FOCCZ4FrozenCPBCMap3D],
) -> None:
    right, left = frozen_maps
    for report in (right, left):
        assert report.variable_count == 58
        assert report.constraint_count == 73
        assert (
            report.constraint_operator_kind
            == "ordering-definition-curl-plus-algebraic-plus-linearized-"
            "hamiltonian-momentum-principal"
        )
        assert report.contains_hamiltonian_momentum_constraints is True
        assert report.einstein_constraint_row_count == 4
        assert "physical coordinate speed is -a" in report.phase_speed_convention
        assert "physical speed -a convention" in report.incoming_mode_semantics
        assert report.incoming_mode_count == 16
        assert report.outgoing_mode_count == 16
        assert report.zero_mode_count == 26
        assert report.characteristic_basis_rank == 58
        assert report.incoming_constraint_rank == 16
        assert report.incoming_constraint_map_residual_l_inf < 1.0e-8
        assert report.incoming_amplitude_reconstruction_residual_l_inf < 1.0e-8
        assert report.direct_symbol_crosscheck_error_l_inf < 1.0e-8
        assert report.frozen_incoming_constraint_map_validated is True
        assert report.cpbc_ready is False
        assert report.nonlinear_cpbc_validated is False
        assert report.physical_boundary_validated is False
    assert right.incoming_basis_sha256 != left.incoming_basis_sha256
    assert right.incoming_constraint_map_sha256 != left.incoming_constraint_map_sha256


def test_frozen_cpbc_map_rejects_invalid_orientation() -> None:
    with pytest.raises(ValueError, match="orientation"):
        linearized_fo_ccz4_frozen_cpbc_map_3d(
            points=8,
            orientation="invalid",  # type: ignore[arg-type]
        )


def test_frozen_cpbc_orientation_uses_physical_speed_sign() -> None:
    # The principal-symbol audit stores a in q_t = A q_x, while a mode's
    # physical coordinate speed is -a.  Thus a>0 enters through a right face,
    # and a<0 enters through a left face.
    speeds = np.array([-1.0, 0.0, 1.0])
    assert _incoming_mask(speeds, "right", 1.0e-10).tolist() == [False, False, True]
    assert _incoming_mask(speeds, "left", 1.0e-10).tolist() == [True, False, False]


def test_frozen_cpbc_orientation_matches_a_fourier_wave_packet_direction() -> None:
    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=8,
        normal_axis=0,
        return_raw=True,
    )
    speeds = np.imag(raw.full_eigenvalues) / raw.effective_wave_number
    positive = int(np.flatnonzero(speeds > 0.5)[0])
    negative = int(np.flatnonzero(speeds < -0.5)[0])
    dt = 0.125
    # q_t = A q_x has mode q ~ exp(i k (x + a t)), hence crest displacement
    # is -a*dt.  Positive a enters from the right; negative a enters from left.
    assert _incoming_mask(speeds, "right", 1.0e-10)[positive]
    assert not _incoming_mask(speeds, "left", 1.0e-10)[positive]
    assert _incoming_mask(speeds, "left", 1.0e-10)[negative]
    assert not _incoming_mask(speeds, "right", 1.0e-10)[negative]
    assert -speeds[positive] * dt < 0.0
    assert -speeds[negative] * dt > 0.0


def test_frozen_cpbc_map_rejects_uncontracted_shift_strength() -> None:
    with pytest.raises(ValueError, match="shift_strength=1"):
        linearized_fo_ccz4_frozen_cpbc_map_3d(
            points=8,
            config=FOCCZ4Config(kappa1=0.0, shift_strength=0.0),
        )
