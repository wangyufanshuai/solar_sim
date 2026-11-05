from pathlib import Path
import runpy

import numpy as np
import pytest


@pytest.fixture(scope="module")
def analyzer():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"analyze-nr-auxiliary-trace-source.py"))


@pytest.mark.parametrize("axis", (0,1,2))
def test_scalar_fd4_constant_and_fundamental_mode(analyzer, axis):
    n = 8
    x = np.indices((n,)*3)[axis]/n
    assert np.array_equal(analyzer["fd4"](np.full((n,)*3,.1),axis), np.zeros((n,)*3))
    k = n*(8*np.sin(2*np.pi/n)-np.sin(4*np.pi/n))/6
    np.testing.assert_allclose(analyzer["fd4"](np.sin(2*np.pi*x),axis), k*np.cos(2*np.pi*x), atol=5.e-15, rtol=1.e-14)


def test_prediction_sign_coefficient_time_and_coordinate_trace_are_explicit(analyzer):
    q = [np.zeros((8,)*3) for _ in range(58)]
    q[11][:] = 1.e-6*np.sin(2*np.pi*np.indices((8,)*3)[0]/8)
    actual = [s.copy() for s in q]
    actual[25] = -2*3*analyzer["fd4"](q[11],0)
    result = analyzer["prediction_errors"](q,actual,3.)
    assert result["linear_trace_source_prediction_max_abs_error"] == 0.
    assert result["coordinate_trace_A_max_drift"] == 0.
    assert analyzer["prediction_errors"](q,actual,2.)["linear_trace_source_prediction_max_abs_error"] > 1.e-6


@pytest.mark.parametrize("time", (-1.,float("nan"),float("inf")))
def test_invalid_time_cannot_become_zero_error(analyzer, time):
    q = [np.zeros((5,)*3) for _ in range(58)]
    with pytest.raises(ValueError, match="nonnegative time"):
        analyzer["prediction_errors"](q,q,time)


@pytest.mark.parametrize("k", ((0.,0.,0.),(1.,0.,0.),(0.,1.,0.),(0.,0.,1.),(2.3,-1.1,.7),(-13.,7.,19.)))
def test_constraint_source_relation_in_independently_encoded_linear_matrices(analyzer, k):
    result = analyzer["matrix_identity_errors"](k)
    assert result["trace_source_identity_max_abs_error"] < 1.e-13
    assert result["lapse_reduction_source_identity_max_abs_error"] < 1.e-13


@pytest.mark.parametrize("k", ((1.,2.),(1.,2.,float("nan"))))
def test_invalid_wave_number_is_not_an_identity(analyzer, k):
    with pytest.raises(ValueError, match="3-vector"):
        analyzer["matrix_identity_errors"](k)
