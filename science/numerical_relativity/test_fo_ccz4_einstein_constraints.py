from __future__ import annotations

import numpy as np
import pytest

from .constraints3d import constraint_report_3d
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4 import build_fo_ccz4_auxiliary_3d
from .fo_ccz4_einstein_constraints import (
    linearized_fo_ccz4_einstein_constraint_rows_3d,
)
from .nr3d import BSSNState3D, Grid3D


@pytest.mark.parametrize("normal_axis", (0, 1, 2))
def test_linearized_einstein_constraint_rows_have_expected_support(
    normal_axis: int,
) -> None:
    rows = linearized_fo_ccz4_einstein_constraint_rows_3d(
        normal_axis=normal_axis,
        effective_wave_number=0.75,
    )
    assert rows.shape == (4, len(FOCCZ4_VARIABLE_ORDER))
    assert np.all(np.isfinite(rows))
    assert np.count_nonzero(rows[0, :25]) == 0
    assert np.count_nonzero(rows[0, 25:]) > 0
    assert np.count_nonzero(rows[1:, :11]) == 0
    assert np.count_nonzero(rows[1:, 11:17]) > 0
    assert np.count_nonzero(rows[1:, 17]) > 0
    # FO-CCZ4 evolves physical K.  Theta belongs to the Z4 damping/gauge
    # sector and is not silently folded into the ADM momentum row.
    assert np.count_nonzero(rows[1:, FOCCZ4_VARIABLE_ORDER.index("Theta")]) == 0
    assert np.linalg.matrix_rank(rows) == 4


def test_linearized_einstein_constraint_rows_reject_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="normal_axis"):
        linearized_fo_ccz4_einstein_constraint_rows_3d(normal_axis=3)
    with pytest.raises(ValueError, match="effective_wave_number"):
        linearized_fo_ccz4_einstein_constraint_rows_3d(effective_wave_number=0.0)


def test_linearized_rows_match_independent_metric_constraint_fourier_probe() -> None:
    points = 32
    grid = Grid3D(
        (points, 7, 7),
        (0.0, 0.0, 0.0),
        (2.0 * np.pi, 2.0 * np.pi, 2.0 * np.pi),
        boundary="periodic",
        spatial_order=2,
    )
    state = BSSNState3D.minkowski(grid)
    x = grid.coordinates[0]
    amplitude = 1.0e-7
    mode = np.cos(x)
    state.h[..., 1, 1] += amplitude * mode
    state.chi[...] = np.exp(2.0 * amplitude * mode)
    state.a[..., 0, 1] = amplitude * mode
    state.a[..., 1, 0] = amplitude * mode
    state.trace_k[...] = amplitude * mode

    auxiliary = build_fo_ccz4_auxiliary_3d(state)
    report = constraint_report_3d(state)
    factor = np.exp(-1j * x)
    q_hat = np.zeros(len(FOCCZ4_VARIABLE_ORDER), dtype=np.complex128)
    for derivative_axis in range(3):
        for first in range(3):
            for second in range(first, 3):
                q_hat[
                    FOCCZ4_VARIABLE_ORDER.index(
                        f"D{derivative_axis}{first}{second}"
                    )
                ] = np.mean(
                    auxiliary.metric_gradient[..., derivative_axis, first, second]
                    * factor
                )
    for axis in range(3):
        q_hat[FOCCZ4_VARIABLE_ORDER.index(f"P{axis}")] = np.mean(
            auxiliary.conformal_factor_gradient[..., axis] * factor
        )
    for first in range(3):
        for second in range(first, 3):
            q_hat[FOCCZ4_VARIABLE_ORDER.index(f"A{first}{second}")] = np.mean(
                state.a[..., first, second] * factor
            )
    q_hat[FOCCZ4_VARIABLE_ORDER.index("K")] = np.mean(state.trace_k * factor)

    effective_wave_number = np.sin(grid.spacing[0]) / grid.spacing[0]
    rows = linearized_fo_ccz4_einstein_constraint_rows_3d(
        normal_axis=0,
        effective_wave_number=effective_wave_number,
    )
    predicted = rows @ q_hat
    measured = np.asarray(
        [
            np.mean(report.hamiltonian * factor),
            *[np.mean(report.momentum[..., component] * factor) for component in range(3)],
        ],
        dtype=np.complex128,
    )
    # Metric constraints include quadratic Christoffel/extrinsic-curvature
    # terms, so the linearized row comparison is normalized by the probe size.
    assert np.max(np.abs(predicted - measured)) / amplitude < 2.0e-5
