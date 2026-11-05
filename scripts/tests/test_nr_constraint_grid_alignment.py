"""Analytic transfer controls, not solver/AMR or physical convergence evidence."""

from dataclasses import FrozenInstanceError, replace
from fractions import Fraction
import math

import numpy as np
import pytest

from science.numerical_relativity import constraint_field_comparison as C
from science.numerical_relativity import constraint_grid_alignment as G


def coordinate_cube(n):
    # Normalized coordinates avoid huge monomials in precision controls.
    return np.meshgrid(*(np.linspace(-1.0, 1.0, n) for _ in range(3)), indexing="ij")


def flat_frame(n, K=0.0):
    q = np.zeros((58, n, n, n))
    q[[0, 3, 5]] = 1.0
    q[17] = K
    return C.reconstruct(q, time=Fraction(1, 8))


@pytest.fixture(scope="module")
def frames():
    return tuple(flat_frame(n) for n in (9, 13, 17))


@pytest.mark.parametrize(
    "source,target",
    [(9, 9), (17, 9), (13, 9), (9, 13), (13, 17), (17, 13), (6, 65), (65, 6)],
)
def test_weight_support_constant_preservation_and_vandermonde_oracle(source, target):
    plan = G.axis_transfer(source, target)
    for j, row in enumerate(plan.weights):
        position = Fraction(j * (source - 1), target - 1)
        assert abs(math.fsum(row) - 1.0) <= 2e-15
        if position.denominator == 1:
            assert np.count_nonzero(row) == 1
            assert row[int(position)] == 1.0
            assert plan.coincident_indices[j] == int(position)
        else:
            nonzero = np.flatnonzero(row)
            assert len(nonzero) == 6
            assert tuple(np.diff(nonzero)) == (1, 1, 1, 1, 1)
            assert 0 <= nonzero[0] < nonzero[-1] < source
            # Independent interpolation moment solve, no rational-product helper.
            nodes = (nonzero - nonzero[0]) / 5.0
            x = (float(position) - nonzero[0]) / 5.0
            oracle = np.linalg.solve(
                np.stack([nodes**k for k in range(6)]),
                np.array([x**k for k in range(6)]),
            )
            np.testing.assert_allclose(row[nonzero], oracle, rtol=0.0, atol=2e-12)


@pytest.mark.parametrize("source,target", [(13, 9), (9, 17)])
@pytest.mark.parametrize("degree", range(6))
def test_degree_zero_to_five_exact_to_fp64(source, target, degree):
    plan = G.axis_transfer(source, target)
    x, y = np.linspace(-1.0, 1.0, source), np.linspace(-1.0, 1.0, target)
    result = G.apply_axis(x**degree, plan, 0)
    np.testing.assert_allclose(result, y**degree, rtol=0.0, atol=2e-12)


@pytest.mark.parametrize("source,target", [(9, 13), (13, 9), (17, 13)])
def test_degree_six_error_equals_analytic_lagrange_remainder(source, target):
    plan = G.axis_transfer(source, target)
    x, y = np.linspace(-1.0, 1.0, source), np.linspace(-1.0, 1.0, target)
    interpolated = G.apply_axis(x**6, plan, 0)
    for j, row in enumerate(plan.weights):
        if plan.coincident_indices[j] >= 0:
            assert interpolated[j] == x[plan.coincident_indices[j]] ** 6
        else:
            exact_error = np.prod(y[j] - x[np.flatnonzero(row)])
            assert abs((y[j] ** 6 - interpolated[j]) - exact_error) <= 2e-12


@pytest.mark.parametrize("vector", [False, True])
def test_nested_transfer_is_byte_exact_and_keeps_negative_zero(vector):
    shape = (17, 17, 17) + ((3,) if vector else ())
    field = np.arange(np.prod(shape), dtype=float).reshape(shape)
    field[0, 0, 0] = -0.0
    result, meta = G.align_cube(field, 9)
    assert result.tobytes() == field[::2, ::2, ::2].tobytes()
    assert meta["coincident_node_count"] == 9
    assert meta["tensor_linf_amplification_bound"] == 1.0


def test_partial_coincident_nodes_copy_exactly_with_three_components():
    field = np.random.default_rng(5043).normal(size=(13, 13, 13, 3))
    result, meta = G.align_cube(field, 9)
    assert result[::2, ::2, ::2].tobytes() == field[::3, ::3, ::3].tobytes()
    assert meta["coincident_node_count"] == 5


@pytest.mark.parametrize(
    "powers", [(5, 0, 0), (0, 5, 0), (0, 0, 5), (2, 3, 4), (5, 5, 5)]
)
def test_tensor_mixed_polynomials_on_non_nested_grid(powers):
    x, y, z = coordinate_cube(13)
    p, q, r = powers
    field = x**p * y**q * z**r + 0.23 * x * y - 0.31 * y * z + 0.11 * x * z
    actual, _ = G.align_cube(field, 9)
    x, y, z = coordinate_cube(9)
    expected = x**p * y**q * z**r + 0.23 * x * y - 0.31 * y * z + 0.11 * x * z
    np.testing.assert_allclose(actual, expected, rtol=0.0, atol=2e-12)


def test_smooth_nonpolynomial_transfer_error_decreases_on_fixed_dense_nodes():
    target = np.linspace(-1.0, 1.0, 65)
    errors = []
    for n in (9, 17, 33):
        x = np.linspace(-1.0, 1.0, n)
        interpolated = G.apply_axis(np.exp(x), G.axis_transfer(n, 65), 0)
        errors.append(float(np.max(abs(interpolated - np.exp(target)))))
    assert errors[0] > 16 * errors[1] > 256 * errors[2] > 0.0


def test_nonseparable_vector_axes_are_not_mixed():
    x, y, z = coordinate_cube(13)
    field = np.stack((x**2 * y + z, y**3 * z + x, z**4 * x + y), axis=-1)
    output, _ = G.align_cube(field, 9)
    x, y, z = coordinate_cube(9)
    expected = np.stack((x**2 * y + z, y**3 * z + x, z**4 * x + y), axis=-1)
    np.testing.assert_allclose(output, expected, atol=2e-12, rtol=0.0)


def test_endpoint_does_not_wrap_or_average():
    field = np.zeros((13, 13, 13))
    field[0, :, :] = 17.0
    output, _ = G.align_cube(field, 9)
    np.testing.assert_array_equal(output[0], 17.0)
    np.testing.assert_array_equal(output[-1], 0.0)
    assert not np.array_equal(output[1], field[0])


def test_input_unchanged_output_and_cached_weights_immutable():
    x, y, z = coordinate_cube(13)
    field = np.sin(x + 0.3 * y - 0.2 * z)
    before = field.copy()
    output, _ = G.align_cube(field, 9)
    np.testing.assert_array_equal(field, before)
    snapshot = output.copy()
    field[:] = 100.0
    np.testing.assert_array_equal(output, snapshot)
    with pytest.raises(ValueError):
        output.setflags(write=True)
    with pytest.raises(ValueError):
        G.axis_transfer(13, 9).weights.setflags(write=True)
    with pytest.raises(FrozenInstanceError):
        G.axis_transfer(13, 9).source_points = 17


@pytest.mark.parametrize("bad", [5, 66, 0, -1, 9.0, True, np.int64(9), "9", [9]])
def test_invalid_axis_contract_rejected_even_after_valid_cache_fill(bad):
    G.axis_transfer(9, 9)
    with pytest.raises(ValueError):
        G.axis_transfer(bad, 9)
    with pytest.raises(ValueError):
        G.axis_transfer(9, bad)


@pytest.mark.parametrize(
    "shape", [(9, 9), (9, 9, 13), (9, 9, 9, 1), (9, 9, 9, 4), (58, 9, 9, 9)]
)
def test_non_diagnostic_layouts_cannot_broadcast(shape):
    with pytest.raises(ValueError):
        G.align_cube(np.ones(shape), 9)


@pytest.mark.parametrize("value", [np.nan, np.inf, -np.inf, 1j, True])
def test_nonfinite_complex_or_non_fp64_fields_rejected(value):
    with pytest.raises(ValueError):
        G.align_cube(np.full((9, 9, 9), value), 13)


@pytest.mark.parametrize("axis", [-1, 3, True, 0.0])
def test_wrong_spatial_axis_rejected(axis):
    with pytest.raises(ValueError):
        G.apply_axis(np.ones((9, 9, 9)), G.axis_transfer(9, 13), axis)


@pytest.mark.parametrize("kind", ["weights", "complex", "copy_indices", "source_shape"])
def test_altered_plan_or_wrong_axis_length_rejected(kind):
    plan = G.axis_transfer(13, 9)
    field = np.ones(13)
    if kind == "weights":
        plan = replace(plan, weights=plan.weights * 2.0)
    elif kind == "complex":
        plan = replace(plan, weights=plan.weights.astype(complex))
    elif kind == "copy_indices":
        plan = replace(plan, coincident_indices=(0,) * 9)
    else:
        field = np.ones(12)
    with pytest.raises(ValueError):
        G.apply_axis(field, plan, 0)


def test_triplet_refuses_shuffled_grid_order(frames):
    with pytest.raises(ValueError, match="ordered"):
        G.compare_registered_triplet([frames[1], frames[0], frames[2]])


def test_triplet_refuses_nearby_but_different_time(frames):
    altered = replace(frames[-1], time=Fraction(1, 8) + Fraction(1, 10**20))
    with pytest.raises(ValueError, match="common exact"):
        G.compare_registered_triplet([*frames[:2], altered])


@pytest.mark.parametrize(
    "key,value",
    [("method", "other"), ("units", "SI"), ("normalization", "cell-average")],
)
def test_triplet_refuses_diagnostic_identity_drift(frames, key, value):
    with pytest.raises(ValueError):
        G.compare_registered_triplet([*frames[:2], replace(frames[-1], **{key: value})])


@pytest.mark.parametrize("order", [2, 4])
def test_analytic_H_error_differences_use_actual_unequal_h_ratios(order):
    h = [2.0 / (n - 1) for n in (9, 13, 17)]
    samples = [
        flat_frame(n, K=spacing ** (order / 2))
        for n, spacing in zip((9, 13, 17), h, strict=True)
    ]
    result = G.compare_registered_triplet(samples)
    for pair, (i, j) in zip(
        result["comparisons"], ((0, 1), (1, 2), (0, 2)), strict=True
    ):
        expected = (2.0 / 3.0) * (h[i] ** order - h[j] ** order)
        for fields in pair["regions"].values():
            for name in ("H_metric", "H_metric_hessian"):
                assert abs(fields[name]["field_difference_rms"] - expected) <= 2e-12
    coarse = result["comparisons"][0]["regions"]["whole"]["H_metric_hessian"][
        "field_difference_rms"
    ]
    fine = result["comparisons"][1]["regions"]["whole"]["H_metric_hessian"][
        "field_difference_rms"
    ]
    assert abs(math.log2(coarse / fine) - order) > 0.2
    assert result["refinement_ratios"] == [
        dict(numerator=3, denominator=2),
        dict(numerator=4, denominator=3),
    ]
    for flag in (
        "order_estimated",
        "new_evolution",
        "rhs_recomputed",
        "primary_result_regraded",
        "spatial_convergence_validated",
        "constraint_convergence_validated",
        "amr_validated",
        "physical_gate",
        "live_admission",
        "scientificPayloadWriteback",
    ):
        assert result[flag] is False


def test_coarse_sampling_can_hide_fine_mode_so_aliasing_not_excluded(frames):
    # Deliberate synthetic field injection; not generated by an Einstein state.
    field = np.zeros((17, 17, 17))
    field[1::2, :, :] = 1.0
    output, _ = G.align_cube(field, 9)
    np.testing.assert_array_equal(output, 0.0)
    altered = dict(frames[-1].fields)
    altered["H_metric_hessian"] = C.immutable_array(field)
    result = G.compare_registered_triplet(
        [*frames[:2], replace(frames[-1], fields=altered)]
    )
    assert result["native_grid_norms"][2]["whole"]["H_metric_hessian"] > 0.5
    assert (
        result["comparisons"][2]["regions"]["whole"]["H_metric_hessian"][
            "field_difference_rms"
        ]
        < 2e-12
    )
    assert result["aliasing_excluded"] is False
    assert result["interpolation_error_bound_known"] is False


def test_amplification_bound_is_not_a_truncation_error_claim():
    plan = G.axis_transfer(13, 9)
    meta = G.transfer_metadata(plan)
    row = plan.weights[np.argmax(np.sum(abs(plan.weights), axis=1))]
    # Signs attain the scalar L-infinity operator norm at this row.
    field = np.sign(row)
    output = G.apply_axis(field, plan, 0)
    assert np.max(abs(output)) == pytest.approx(
        meta["axis_linf_amplification_bound"], abs=2e-15
    )
    assert meta["axis_linf_amplification_bound"] > 1.0
    for flag in (
        "truncation_error_bound_known",
        "conservative_transfer",
        "sbp_norm_compatible_transfer",
        "evolution_connected",
    ):
        assert meta[flag] is False
