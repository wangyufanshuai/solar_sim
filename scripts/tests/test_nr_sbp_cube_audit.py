from pathlib import Path
import runpy

import numpy as np
import pytest

from science.numerical_relativity import fo_ccz4_sbp_cube as C

ROOT = Path(__file__).resolve().parents[2]
AUDIT = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-sbp-cube.py"))


@pytest.mark.parametrize("n", (9, 13))
def test_independent_dense_tensor_diagnostics_match_packed_cube(n):
    q = np.random.default_rng(117).normal(size=(n, n, n, 58))*.001
    matrix, _ = AUDIT["PLANE"]["sbp_matrix"](n)
    gradient = [AUDIT["derivative"](matrix, q, d) for d in range(3)]
    def second(i, j, slot):
        return AUDIT["derivative"](matrix, gradient[j][..., slot], i)
    packed = C.constraint_fields(q, gradient, second)
    tensor = AUDIT["tensor_constraints"](q, matrix, C.INDEX)
    assert set(packed) == set(tensor)
    for key in packed:
        # Random second derivatives can be O(1), despite O(.001) input fields.
        # This is an arithmetic bound, separate from campaign acceptance.
        bound = 32*np.finfo(float).eps*max(1., np.max(np.abs(packed[key])))
        np.testing.assert_allclose(packed[key], tensor[key], atol=bound, rtol=0.)


def test_independent_tensor_mixed_curvature_and_physical_trace():
    n = 9
    q = np.zeros((n, n, n, 58))
    x, y, _ = np.meshgrid(*(np.linspace(-1., 1., n) for _ in range(3)), indexing="ij")
    q[..., C.INDEX["h01"]] = x*y
    q[..., C.INDEX["A11"]] = 3*x
    matrix, _ = AUDIT["PLANE"]["sbp_matrix"](n)
    result = AUDIT["tensor_constraints"](q, matrix, C.INDEX)
    np.testing.assert_allclose(result["H_metric"], 2., atol=2.e-14, rtol=0.)
    np.testing.assert_allclose(result["M_metric"][..., 0], -3., atol=2.e-14, rtol=0.)
    assert np.max(np.abs(result["M_stored_K"])) < 2.e-14
