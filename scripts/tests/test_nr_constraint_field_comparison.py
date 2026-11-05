"""Counterexamples, tensor controls and rejection tests; no native evolution."""

from dataclasses import FrozenInstanceError, replace
from fractions import Fraction

import numpy as np
import pytest

from science.numerical_relativity import constraint_field_comparison as C
from science.numerical_relativity.sbp_metric_geometry import constraints_from_slots


def flat(n=9):
    q = np.zeros((58, n, n, n))
    q[[0, 3, 5]] = 1.0
    return q


def tensor_state(n, *, shear=False):
    x, y, z = np.meshgrid(*(np.linspace(1.0, 3.0, n) for _ in range(3)), indexing="ij")
    if shear:
        jacobian = np.broadcast_to(np.eye(3), (n, n, n, 3, 3)).copy()
        jacobian[..., 0, 1], jacobian[..., 0, 2] = 0.17 * z, 0.17 * y
        g = np.einsum("...ai,...aj->...ij", jacobian, jacobian)
    else:
        transform = np.array([[1.0, 0.2, -0.15], [0.3, 1.0, 0.1], [-0.1, 0.25, 1.0]])
        u = transform[0, 0] * x + transform[0, 1] * y + transform[0, 2] * z
        tensors = [np.outer(t, t) for t in transform]
        g = tensors[0] + np.exp(0.4 * u)[..., None, None] * tensors[1]
        g += np.exp(-0.3 * u)[..., None, None] * tensors[2]
    coefficient = 0.02 + 0.01 * x - 0.015 * y + 0.005 * z
    q = flat(n)
    q[17] = 0.013
    q[18] = 0.37  # Theta must not be silently added to physical K.
    for slot, (i, j) in enumerate(C.independent_auditor()["A"]["PAIRS"]):
        q[slot] = g[..., i, j]
        q[11 + slot] = (coefficient - 0.013 / 3.0) * g[..., i, j]
    return q, coefficient


@pytest.fixture(scope="module")
def frame():
    return C.reconstruct(flat(), time=Fraction(1, 8))


@pytest.fixture
def small():
    return np.ones((2, 3, 4)), np.ones((2, 3, 4), dtype=bool)


@pytest.mark.parametrize("vector", [False, True])
def test_equal_norm_opposite_sign_is_not_equal_field(small, vector):
    weights, mask = small
    left = np.ones((*weights.shape, 3)) if vector else np.ones(weights.shape)
    result = C.compare_arrays(left, -left, weights, mask)
    assert result == dict(
        left_norm=1.0,
        right_norm=1.0,
        norm_gap=0.0,
        field_difference_rms=2.0,
        field_difference_linf=2.0,
    )


def test_equal_norm_spatial_rearrangement_detected(small):
    weights, mask = small
    left = np.arange(24, dtype=float).reshape(weights.shape)
    right = left[::-1, ::-1, ::-1]
    result = C.compare_arrays(left, right, weights, mask)
    assert result["norm_gap"] == 0.0
    assert result["field_difference_rms"] == pytest.approx(
        np.sqrt(np.mean((left - right) ** 2))
    )
    assert result["field_difference_rms"] > 10.0


@pytest.mark.parametrize("component", [0, 1, 2])
def test_vector_divides_squared_components_by_three(small, component):
    weights, mask = small
    field = np.zeros((*weights.shape, 3))
    field[..., component] = 3.0
    assert C.weighted_rms(field, weights, mask) == pytest.approx(
        np.sqrt(3.0), rel=2e-15
    )


def test_nonuniform_weights_and_partial_mask_have_hand_computed_answer():
    field = np.array([2.0, 4.0, 100.0, 999.0]).reshape(1, 2, 2)
    weights = np.array([1.0, 3.0, 7.0, 10.0]).reshape(field.shape)
    mask = np.array([True, True, False, False]).reshape(field.shape)
    assert C.weighted_rms(field, weights, mask) == pytest.approx(
        np.sqrt(13.0), rel=2e-15
    )


@pytest.mark.parametrize("scale", [1e-250, 1e250])
def test_finite_extreme_amplitudes_do_not_square_to_zero_or_infinity(small, scale):
    weights, mask = small
    assert C.weighted_rms(weights * scale, weights, mask) / scale == pytest.approx(
        1.0, rel=2e-15
    )


@pytest.mark.parametrize("bad", [np.nan, np.inf, -np.inf, 1j, "text", True])
def test_invalid_field_values_or_dtypes_rejected(small, bad):
    weights, mask = small
    field = np.full(weights.shape, bad)
    with pytest.raises(ValueError):
        C.weighted_rms(field, weights, mask)


@pytest.mark.parametrize("dtype", [np.float32, np.int64, object])
def test_no_implicit_downcast_or_dtype_conversion(small, dtype):
    weights, mask = small
    with pytest.raises(ValueError):
        C.compare_arrays(weights.astype(dtype), weights, weights, mask)


@pytest.mark.parametrize("bad", [0.0, -1.0, np.nan, np.inf])
def test_invalid_weight_rejected_even_outside_selected_mask(small, bad):
    weights, mask = small
    weights[0, 0, 0], mask[0, 0, 0] = bad, False
    with pytest.raises(ValueError):
        C.weighted_rms(np.ones(weights.shape), weights, mask)


@pytest.mark.parametrize("kind", ["empty", "wrong_shape", "integer", "list"])
def test_invalid_masks_do_not_broadcast(small, kind):
    weights, mask = small
    invalid = {
        "empty": np.zeros_like(mask),
        "wrong_shape": mask[:1],
        "integer": mask.astype(int),
        "list": mask.tolist(),
    }[kind]
    with pytest.raises(ValueError):
        C.weighted_rms(weights, weights, invalid)


@pytest.mark.parametrize("shape", [(1, 3, 4), (2, 3, 4, 1), (2, 3, 4, 2), (24,)])
def test_mismatched_or_unsupported_field_shape_rejected(small, shape):
    weights, mask = small
    bad = np.ones(shape)
    with pytest.raises(ValueError):
        C.compare_arrays(weights, bad, weights, mask)
    with pytest.raises(ValueError):
        C.weighted_rms(bad, weights, mask)


def test_difference_overflow_is_not_silently_accepted(small):
    weights, mask = small
    field = np.full(weights.shape, np.finfo(float).max)
    with pytest.raises(FloatingPointError):
        C.compare_arrays(field, -field, weights, mask)


@pytest.mark.parametrize("n", [9, 13, 17])
def test_flat_spacetime_constraints_and_self_difference(n):
    sample = C.reconstruct(flat(n), time=Fraction(0))
    for value in sample.fields.values():
        np.testing.assert_allclose(value, 0.0, atol=2e-12, rtol=0.0)
    comparison = C.compare_frames(sample, sample)
    for region in comparison["regions"].values():
        for value in region.values():
            assert (
                value["field_difference_rms"] == value["field_difference_linf"] == 0.0
            )
    for key in (
        "new_evolution",
        "constraint_convergence_validated",
        "spatial_convergence_validated",
        "primary_result_regraded",
        "physical_gate",
        "live_admission",
        "scientificPayloadWriteback",
    ):
        assert comparison[key] is False


@pytest.mark.parametrize("n", [9, 13, 17])
def test_five_masks_have_registered_geometry(n):
    masks = C.region_masks(n)
    assert tuple(masks) == C.REGIONS
    assert masks["whole"].sum() == n**3
    assert masks["central_box"].sum() == ((n - 1) // 2 + 1) ** 3
    assert masks["faces"].sum() == 6 * (n - 2) ** 2
    assert masks["edges"].sum() == 12 * (n - 2)
    assert masks["corners"].sum() == 8
    assert not np.any(masks["faces"] & masks["edges"])
    assert not np.any(masks["edges"] & masks["corners"])


def test_state_unchanged_and_output_does_not_alias_input():
    q, _ = tensor_state(9)
    before = q.copy()
    sample = C.reconstruct(q, time=Fraction(0))
    np.testing.assert_array_equal(q, before)
    snapshot = sample.fields["H_metric_hessian"].copy()
    q[:] = 0.0
    np.testing.assert_array_equal(sample.fields["H_metric_hessian"], snapshot)


@pytest.mark.parametrize("kind", ["coordinates", "weights", "field"])
def test_returned_buffers_cannot_be_made_writable(frame, kind):
    value = {
        "coordinates": frame.coordinates[0],
        "weights": frame.weights,
        "field": frame.fields["M_metric"],
    }[kind]
    with pytest.raises(ValueError):
        value.setflags(write=True)
    with pytest.raises(ValueError):
        value.flat[0] = 4.0


def test_mapping_and_metadata_are_frozen(frame):
    with pytest.raises(TypeError):
        frame.fields["M_metric"] = np.zeros((9, 9, 9, 3))
    with pytest.raises(FrozenInstanceError):
        frame.time = Fraction(1)


@pytest.mark.parametrize("bad", [0.0, 1, True, "1/8", Fraction(-1, 8)])
def test_time_requires_exact_nonnegative_fraction(bad):
    with pytest.raises(ValueError):
        C.reconstruct(flat(), time=bad)


@pytest.mark.parametrize(
    "key,value",
    [
        ("method", "other"),
        ("units", "SI"),
        ("normalization", "Euclidean-vector-norm"),
        ("state_sha256", "wrong"),
        ("time", 0.125),
    ],
)
def test_mismatched_or_invalid_frame_contract_rejected(frame, key, value):
    with pytest.raises(ValueError):
        C.compare_frames(frame, replace(frame, **{key: value}))


def test_common_time_is_exact_not_nearly_equal(frame):
    with pytest.raises(ValueError, match="common exact"):
        C.compare_frames(
            frame, replace(frame, time=Fraction(1, 8) + Fraction(1, 10**20))
        )


@pytest.mark.parametrize("n", [13, 17])
def test_cross_grid_comparison_explicitly_refused(frame, n):
    other = C.reconstruct(flat(n), time=frame.time)
    with pytest.raises(ValueError, match="same spatial grid"):
        C.compare_frames(frame, other)


@pytest.mark.parametrize(
    "kind", ["axes", "weights", "missing", "extra", "vector_layout", "nonfinite"]
)
def test_mutated_frame_cannot_evade_validation(frame, kind):
    if kind == "axes":
        other = replace(
            frame, coordinates=tuple(axis + 0.001 for axis in frame.coordinates)
        )
    elif kind == "weights":
        other = replace(frame, weights=frame.weights * 2.0)
    else:
        fields = dict(frame.fields)
        if kind == "missing":
            fields.pop("M_metric")
        elif kind == "extra":
            fields["fake"] = fields["H_metric"]
        elif kind == "vector_layout":
            fields["M_metric"] = fields["M_metric"][..., :1]
        else:
            fields["H_metric"] = fields["H_metric"] * np.nan
        other = replace(frame, fields=fields)
    with pytest.raises(ValueError):
        C.compare_frames(frame, other)


@pytest.mark.parametrize(
    "kind", ["not58", "rectangular", "n7", "nan", "complex", "negative_metric", "lapse"]
)
def test_invalid_canonical_state_rejected(kind):
    q = flat(7 if kind == "n7" else 9)
    if kind == "not58":
        q = q[:57]
    elif kind == "rectangular":
        q = q[:, :, :, :8]
    elif kind == "nan":
        q[7] = np.nan
    elif kind == "complex":
        q = q.astype(complex)
    elif kind == "negative_metric":
        q[0] = -1.0
    elif kind == "lapse":
        q[6] = np.log(3.0)
    with pytest.raises(ValueError):
        C.reconstruct(q, time=Fraction(0))


def test_non_tracefree_A_and_Theta_do_not_change_K_convention():
    q = flat()
    q[11], q[14], q[16], q[17], q[18] = 0.1, 0.2, -0.05, 0.3, 0.7
    sample = C.reconstruct(q, time=Fraction(0))
    physical_diagonal = np.array([0.2, 0.3, 0.05])
    expected = 0.55**2 - np.sum(physical_diagonal**2)
    for key in ("H_metric", "H_metric_hessian"):
        np.testing.assert_allclose(sample.fields[key], expected, atol=2e-12, rtol=0.0)
    np.testing.assert_allclose(sample.fields["M_metric"], 0.0, atol=2e-12, rtol=0.0)


@pytest.mark.parametrize("n", [9, 13, 17])
def test_polynomial_shear_flat_metric_and_variable_K_analytic_constraints(n):
    q, coefficient = tensor_state(n, shear=True)
    sample = C.reconstruct(q, time=Fraction(0))
    np.testing.assert_allclose(
        sample.fields["H_metric_hessian"], 6 * coefficient**2, atol=2e-12, rtol=0.0
    )
    expected_M = np.broadcast_to([-0.02, 0.03, -0.01], (n, n, n, 3))
    np.testing.assert_allclose(
        sample.fields["M_metric"], expected_M, atol=2e-12, rtol=0.0
    )


@pytest.mark.parametrize("n", [9, 13, 17])
def test_curved_offdiagonal_metric_matches_production_full_fields(n):
    q, _ = tensor_state(n)
    sample = C.reconstruct(q, time=Fraction(0))
    actual = constraints_from_slots(q, (2.0 / (n - 1),) * 3)
    for key in ("H_metric_hessian", "M_metric"):
        np.testing.assert_allclose(
            sample.fields[key], actual[key], atol=2e-12, rtol=0.0
        )
    assert np.max(abs(sample.fields["H_metric_hessian"])) > 0.01


def test_old_regional_norms_preserved_including_legacy_H():
    dual = C.independent_auditor()
    q = dual["A"]["initial_slots"](13, perturbed=True)
    before = q.copy()
    old, _ = dual["reconstructed"](q, q)
    sample = C.reconstruct(q, time=Fraction(1, 8))
    for region, mask in C.region_masks(13).items():
        for name in C.FIELDS:
            assert (
                abs(
                    C.weighted_rms(sample.fields[name], sample.weights, mask)
                    - old[region][name]
                )
                <= 2e-12
            )
    np.testing.assert_array_equal(q, before)


def test_helper_hash_drift_refused_before_evaluation(monkeypatch):
    monkeypatch.setattr(C, "HELPERS", {next(iter(C.HELPERS)): "0" * 64})
    with pytest.raises(ValueError, match="helper changed"):
        C.reconstruct(flat(), time=Fraction(0))
