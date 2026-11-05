"""Independent cofactor controls for the explicit standalone algebraic map."""
import numpy as np
import pytest

from .fo_ccz4_algebraic_projection import (
    CHANGED_SLOTS, PRESERVED_SLOTS, algebraic_errors, algebraic_fields,
    correction_fields, geometry, identity, project_algebraic_slots,
)

PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))


def sample(shape=(), seed=74):
    rng = np.random.default_rng(seed)
    q = rng.uniform(-.2, .2, (58, *shape))
    lower = rng.uniform(-.4, .4, (*shape, 3, 3))
    h = lower@np.swapaxes(lower, -1, -2)+np.eye(3)*1.2
    for slot, (i, j) in enumerate(PAIRS):
        q[slot] = h[..., i, j]
    return q


def unpack(point, offset):
    h = np.empty((3, 3))
    for slot, (i, j) in enumerate(PAIRS):
        h[i, j] = h[j, i] = point[offset+slot]
    return h


def cofactor(h):
    a, b, c, d, e, f = (h[i, j] for i, j in PAIRS)
    determinant = a*(d*f-e*e)-b*(b*f-e*c)+c*(b*e-d*c)
    inverse = np.array([[d*f-e*e, c*e-b*f, b*e-c*d],
                        [c*e-b*f, a*f-c*c, b*c-a*e],
                        [b*e-c*d, b*c-a*e, a*d-b*b]])/determinant
    return determinant, inverse


def independent_point(point):
    """No candidate helpers, determinant/inverse/einsum calls, or slot imports."""
    out = point.copy()
    h = unpack(point, 0)
    det, _inverse = cofactor(h)
    h = h/np.cbrt(det)
    _det, inverse = cofactor(h)
    for slot, (i, j) in enumerate(PAIRS):
        out[slot] = h[i, j]
    for offset in (11, 37, 43, 49):
        field = unpack(point, offset)
        trace = sum(inverse[i, j]*field[i, j] for i in range(3) for j in range(3))
        for slot, (i, j) in enumerate(PAIRS):
            out[offset+slot] = field[i, j]-h[i, j]*trace/3.
    return out


@pytest.mark.parametrize("shape", [(), (2,), (2, 3), (2, 3, 4)])
def test_default_off_is_byte_exact_copy_even_with_signed_zero(shape):
    q = sample(shape)
    q[20] = -0.
    original = q.tobytes()
    out = project_algebraic_slots(q)
    assert out.tobytes() == original == q.tobytes()
    assert not np.shares_memory(q, out)
    assert not identity()["enabled"] and not identity()["evolution_connected"]


@pytest.mark.parametrize("seed", range(12))
def test_non_diagonal_map_matches_independent_polynomial_and_trace_formulas(seed):
    q = sample((2, 3), seed)
    original = q.tobytes()
    out = project_algebraic_slots(q, enabled=True)
    for index in np.ndindex(q.shape[1:]):
        np.testing.assert_allclose(out[(slice(None), *index)], independent_point(q[(slice(None), *index)]),
                                   rtol=2.e-13, atol=2.e-13)
    assert max(algebraic_errors(out).values()) < 2.e-13
    assert q.tobytes() == original and not np.shares_memory(out, q)
    assert out[list(PRESERVED_SLOTS)].tobytes() == q[list(PRESERVED_SLOTS)].tobytes()
    twice = project_algebraic_slots(out, enabled=True)
    assert np.max(abs(twice-out))/max(1., np.max(abs(out))) < 2.e-13


def test_already_satisfied_exact_minkowski_is_unchanged():
    q = np.zeros((58, 3, 2))
    q[[0, 3, 5]] = 1.
    assert project_algebraic_slots(q, enabled=True).tobytes() == q.tobytes()
    assert all(np.all(v == 0.) for v in algebraic_fields(q).values())


def test_metric_trace_and_each_auxiliary_trace_are_distinct_constraints():
    q = np.zeros(58)
    q[[0, 3, 5]] = 4.
    q[[11, 14, 16]] = 6.
    q[17] = 3.
    q[10] = .5*np.log(2.)
    for k, offset in enumerate((37, 43, 49)):
        q[[offset, offset+3, offset+5]] = k+1.
    out = project_algebraic_slots(q, enabled=True)
    assert np.allclose(out[[0, 3, 5]], 1., rtol=0., atol=1.e-15)
    assert np.max(abs(out[11:17])) < 1.e-14
    assert np.max(abs(out[37:55])) < 1.e-14
    changes = correction_fields(q, out)
    np.testing.assert_allclose(changes["physical_metric_correction"], -1.5*np.eye(3), atol=1.e-14)
    np.testing.assert_allclose(changes["physical_extrinsic_correction"], -4.5*np.eye(3), atol=1.e-14)
    assert changes["physical_trace_K_correction"] == pytest.approx(-4.5, abs=1.e-14)
    # K slot was retained; the actual physical trace was not K before projection.
    assert out[17] == q[17] == 3.


def test_physical_correction_uses_full_non_diagonal_extrinsic_trace():
    q = sample((2,))
    out = project_algebraic_slots(q, enabled=True)
    changes = correction_fields(q, out)
    for i in range(2):
        h, hp = unpack(q[:, i], 0), unpack(out[:, i], 0)
        a, ap = unpack(q[:, i], 11), unpack(out[:, i], 11)
        chi = np.exp(2.*q[10, i])
        g, gp = h/chi, hp/chi
        k = (a+h*q[17, i]/3.)/chi
        kp = (ap+hp*out[17, i]/3.)/chi
        delta_trace = np.trace(np.linalg.solve(gp, kp))-np.trace(np.linalg.solve(g, k))
        np.testing.assert_allclose(changes["physical_metric_correction"][i], gp-g, atol=1.e-14)
        np.testing.assert_allclose(changes["physical_extrinsic_correction"][i], kp-k, atol=1.e-14)
        assert changes["physical_trace_K_correction"][i] == pytest.approx(delta_trace, abs=1.e-14)
    assert np.max(abs(changes["physical_metric_correction"])) > .01


def test_tensor_map_covariant_under_orthogonal_basis_change():
    q = sample()
    rotation, _ = np.linalg.qr(np.array([[1., 2., -1.], [2., 1., 3.], [1., -3., 1.]]))
    rotated = q.copy()
    for offset in (0, 11, 37, 43, 49):
        value = rotation@unpack(q, offset)@rotation.T
        for slot, (i, j) in enumerate(PAIRS):
            rotated[offset+slot] = value[i, j]
    mapped, mapped_rotated = (project_algebraic_slots(x, enabled=True) for x in (q, rotated))
    for offset in (0, 11, 37, 43, 49):
        np.testing.assert_allclose(unpack(mapped_rotated, offset), rotation@unpack(mapped, offset)@rotation.T,
                                   rtol=2.e-13, atol=2.e-13)


@pytest.mark.parametrize("enabled", [False, True])
@pytest.mark.parametrize("bad", ["count", "scalar", "empty", "float32", "complex", "bool", "object", "nan",
                                  "infinite", "negative", "singular", "indefinite-positive-det", "condition",
                                  "lapse-overflow", "chi-underflow"])
def test_invalid_inputs_fail_closed_without_mutation(enabled, bad):
    q = sample()
    if bad == "count":
        q = q[:57]
    elif bad == "scalar":
        q = np.array(1.)
    elif bad == "empty":
        q = np.empty((58, 0))
    elif bad in ("float32", "complex", "bool", "object"):
        q = q.astype({"float32": np.float32, "complex": complex, "bool": bool, "object": object}[bad])
    elif bad in ("nan", "infinite"):
        q[57] = np.nan if bad == "nan" else np.inf
    elif bad in ("negative", "singular", "indefinite-positive-det", "condition"):
        q[:6] = 0.
        q[[0, 3, 5]] = {"negative": (-1., 1., 1.), "singular": (0., 1., 1.),
                        "indefinite-positive-det": (-1., -1., 1.), "condition": (1., 1., 1.e-9)}[bad]
    elif bad == "lapse-overflow":
        q[6] = 1000.
    else:
        q[10] = -1000.
    original = q.tobytes()
    with pytest.raises(ValueError):
        project_algebraic_slots(q, enabled=enabled)
    assert q.tobytes() == original


@pytest.mark.parametrize("bad", [0, 1, "true", None, np.bool_(True)])
def test_enable_flag_is_explicit_boolean_only(bad):
    with pytest.raises(ValueError, match="boolean"):
        project_algebraic_slots(sample(), enabled=bad)
    with pytest.raises(ValueError, match="boolean"):
        identity(enabled=bad)


def test_non_contiguous_readonly_input_and_no_reconstruction():
    q = sample((3, 4))[:, ::2, ::-1]
    q.flags.writeable = False
    out = project_algebraic_slots(q, enabled=True)
    assert out.flags.c_contiguous and out.flags.writeable
    assert out[list(PRESERVED_SLOTS)].tobytes() == q[list(PRESERVED_SLOTS)].tobytes()
    # Independent traceless D survives; this is not D := finite_difference(h)/2.
    assert np.max(abs(out[37:55])) > .01


def test_identity_binds_local58_layout_and_never_claims_admission():
    value = identity(enabled=True)
    assert len(value["variable_order"]) == 58 and value["variable_order"][37] == "D000"
    assert len(CHANGED_SLOTS) == 30 and len(PRESERVED_SLOTS) == 28
    for key in ("default_enabled", "auxiliary_reconstruction", "physical_reparameterization",
                "einstein_constraint_solve", "evolution_connected", "restart_permitted",
                "physical_validation", "runtime_writeback", "scientificPayloadWriteback"):
        assert value[key] is False


def test_correction_shape_mismatch_rejected():
    with pytest.raises(ValueError, match="matching"):
        correction_fields(sample(), sample((2,)))


def test_geometry_does_not_normalize_input():
    q = sample()
    original = q.tobytes()
    g = geometry(q)
    assert g["determinant"] > 1.1 and q.tobytes() == original
