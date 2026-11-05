import numpy as np
import pytest
from scipy.linalg import expm

from . import fo_ccz4_sbp_cube as C
from . import fo_ccz4_sbp_frozen as F


@pytest.fixture(scope="module")
def systems():
    return tuple(F.build_system(n) for n in np.eye(3))


@pytest.fixture(scope="module")
def cube(systems):
    return C.FrozenSBPCube.box(9, systems=systems)


def faces(q):
    return tuple(C.face(q, d, s).copy() for d in range(3) for s in range(2))


@pytest.mark.parametrize("shape", ((9, 9, 9), (9, 11, 13)))
def test_cube_mixed_polynomial_rhs_and_single_source(shape, systems):
    cube = C.FrozenSBPCube.box(shape, systems=systems)
    x, y, z = np.meshgrid(*(np.linspace(-1., 1., n) for n in shape), indexing="ij")
    v = np.cos(np.arange(58)+.2)
    q = (x*y+y*z+z*x+x*x)[..., None]*v
    exact = q@cube.source.T
    for d, factor in enumerate((y+z+2*x, x+z, y+x)):
        exact += factor[..., None]*(v@systems[d].principal.T)
    initial = q.copy()
    # Arithmetic bound scales with the O(10) polynomial RHS, not a physics gate.
    bound = 32*np.finfo(float).eps*max(1., np.max(np.abs(exact)))
    np.testing.assert_allclose(cube.rhs(q, faces(q)), exact, atol=bound, rtol=0.)
    np.testing.assert_array_equal(q, initial)
    constant = np.broadcast_to(v, shape+(58,)).copy()
    np.testing.assert_allclose(cube.rhs(constant, faces(constant)), constant@cube.source.T, atol=0., rtol=0.)


@pytest.mark.parametrize("axis", range(3))
@pytest.mark.parametrize("side", range(2))
def test_both_incoming_face_signs_and_outgoing_zero_invariance(cube, axis, side):
    s = cube.systems[axis]
    q = np.zeros(cube.shape+(58,))
    data = list(faces(q))
    incoming = np.flatnonzero(s.roots < 0. if side == 0 else s.roots > 0.)[0]
    data[2*axis+side][...] = s.basis[:, incoming]
    result = cube.penalty_faces(q, data)
    expected = abs(s.roots[incoming])*s.basis[:, incoming]/cube.operators[axis].norm_weights[0 if side == 0 else -1]
    np.testing.assert_allclose(result[2*axis+side], np.broadcast_to(expected, data[2*axis+side].shape), atol=3.e-13, rtol=0.)
    for index, value in enumerate(result):
        if index != 2*axis+side:
            assert not np.any(value)
    excluded = s.roots >= 0. if side == 0 else s.roots <= 0.
    data[2*axis+side][...] = np.sum(s.basis[:, excluded], axis=1)
    assert max(np.max(np.abs(v)) for v in cube.penalty_faces(q, data)) < 5.e-13


@pytest.mark.parametrize("corner", ((0, 0, 0), (-1, -1, -1), (0, -1, 0), (-1, 0, -1)))
def test_adjacent_face_penalties_add_at_corners(cube, corner):
    q = np.random.default_rng(91).normal(size=cube.shape+(58,))*1.e-3
    penalties = cube.penalty_faces(q)
    bulk = q@cube.source.T
    for d in range(3):
        bulk += cube.operators[d].derivative(q, axis=d)@cube.systems[d].principal.T
    expected = bulk[corner].copy()
    for d in range(3):
        tangential = tuple(v for i, v in enumerate(corner) if i != d)
        expected += penalties[2*d+int(corner[d] == -1)][tangential]
    np.testing.assert_array_equal(cube.rhs(q)[corner], expected)


@pytest.mark.parametrize("forcing", (False, True))
def test_complete_cube_energy_identity_retains_skew_volume(cube, forcing):
    rng = np.random.default_rng(713)
    q = rng.normal(size=cube.shape+(58,))*1.e-3
    data = tuple(rng.normal(size=v.shape)*1.e-3 for v in faces(q)) if forcing else None
    report = cube.balance(q, data)
    assert abs(report["balance_residual"]) < 2.e-17
    assert abs(report["skew_volume_rate"]) > 1.e-8
    defects = cube.identity["x_symmetrizer_defects_on_xyz"]
    assert defects[0] < 2.e-11 and max(defects[1:]) > 1.e-3
    assert not cube.identity["common_symmetrizer_validated"]
    assert all(cube.identity[name] is False for name in F.FLAGS)


@pytest.mark.parametrize("family", ("full58", "tt-plus"))
def test_nonparallel_exact_constraints_equal_sum_of_independent_plane_diagnostics(cube, family):
    waves = C.CubeWaves(cube, family, 1./512., 4)
    q, dq, second = waves.exact_final()
    observed = C.constraint_fields(q, dq, second)
    reference = {}
    for m, n in enumerate(C.NORMALS):
        wave = waves.phase_fields[m][..., None]*waves.final_modes[m]
        fields = F.constraint_fields(*(np.real((1j*np.pi)**d*wave).reshape(-1, 58) for d in range(3)), n)
        for name, value in fields.items():
            value = value.reshape(cube.shape+value.shape[1:])
            reference[name] = reference.get(name, 0.)+value
    for name, value in reference.items():
        np.testing.assert_allclose(observed[name], value, atol=8.e-18, rtol=0.)
    assert len(observed) == 12
    if family == "tt-plus":
        assert max(np.max(np.abs(value)) for value in observed.values()) < 8.e-18


def test_mixed_metric_hamiltonian_is_not_a_plane_proxy(cube):
    q = np.zeros(cube.shape+(58,))
    x, y, _ = np.meshgrid(*(np.linspace(-1., 1., n) for n in cube.shape), indexing="ij")
    q[..., C.INDEX["h01"]] = x*y
    gradient = tuple(op.derivative(q, axis=d) for d, op in enumerate(cube.operators))
    def second(i, j, slot):
        return cube.operators[i].derivative(gradient[j][..., slot], axis=i)
    result = C.constraint_fields(q, gradient, second)
    np.testing.assert_allclose(result["H_metric"], 2., atol=3.e-14, rtol=0.)
    assert not np.any(result["H_fo"])


def test_general_three_dimensional_metric_constraints_against_christoffel_tensors(cube):
    rng = np.random.default_rng(321)
    q = rng.normal(size=cube.shape+(58,))
    gradient = rng.normal(size=(3,)+q.shape)
    hessian = rng.normal(size=(3, 3)+q.shape)
    hessian = .5*(hessian+hessian.swapaxes(0, 1))
    def second(i, j, slot):
        return hessian[i, j, ..., slot]
    actual = C.constraint_fields(q, gradient, second)
    def metric_second(p, r, i, j):
        return (hessian[p, r, ..., C.INDEX[f"h{min(i,j)}{max(i,j)}"]]
                -2.*int(i == j)*hessian[p, r, ..., C.INDEX["ln_phi"]])
    def christoffel_derivative(p, upper, i, j):
        return .5*(metric_second(p, i, upper, j)+metric_second(p, j, upper, i)
                   -metric_second(p, upper, i, j))
    ricci_trace = sum(christoffel_derivative(k, k, i, i)-christoffel_derivative(i, k, i, k)
                      for i in range(3) for k in range(3))
    def extrinsic_derivative(p, i, j):
        return (gradient[p, ..., C.INDEX[f"A{min(i,j)}{max(i,j)}"]]
                +int(i == j)*gradient[p, ..., C.INDEX["K"]]/3.)
    momentum = np.stack([sum(extrinsic_derivative(j, i, j)-extrinsic_derivative(i, j, j)
                             for j in range(3)) for i in range(3)], axis=-1)
    np.testing.assert_allclose(actual["H_metric"], ricci_trace, atol=3.e-14, rtol=0.)
    np.testing.assert_allclose(actual["M_metric"], momentum, atol=5.e-15, rtol=0.)


@pytest.mark.parametrize("family", ("full58", "tt-plus"))
def test_continuum_faces_agree_with_full_cube_and_replay(cube, family):
    waves = C.CubeWaves(cube, family, 1./512., 4)
    for index in (0, 3, 8):
        for actual, reference in zip(waves(index), faces(waves.values(index))):
            np.testing.assert_allclose(actual, reference, atol=1.e-18, rtol=0.)
    q = waves.values(0)
    start = q.copy()
    for step in range(4):
        q = cube.step(q, step, 1./512., waves)
    mid = cube.step(cube.step(start, 0, 1./512., waves), 1, 1./512., waves)
    replay = cube.step(cube.step(mid.copy(), 2, 1./512., waves), 3, 1./512., waves)
    np.testing.assert_array_equal(replay, q)


def test_uniform_source_rhs_and_boundary_halfstep_schedule(cube):
    v = np.sin(np.arange(58))*1.e-3
    q = np.broadcast_to(v, cube.shape+(58,)).copy()
    dt = 1.e-3
    calls = []
    def boundary(index):
        calls.append(index)
        state = expm(index*.5*dt*cube.source)@v
        return faces(np.broadcast_to(state, q.shape))
    actual = cube.step(q, 0, dt, boundary)
    assert calls == [0, 1, 2]
    np.testing.assert_allclose(actual, np.broadcast_to(expm(dt*cube.source)@v, q.shape), atol=3.e-14, rtol=0.)


def test_strided_initial_state_and_contiguous_restore_produce_exact_steps(cube):
    raw = np.random.default_rng(384).normal(size=cube.shape+(58,))+0.j
    view = raw.real*1.e-4
    raw.real[...] = view
    view = raw.real
    assert not view.flags.c_contiguous
    restored = view.copy()
    np.testing.assert_array_equal(cube.step(view, 0, 1./512.), cube.step(restored, 0, 1./512.))


@pytest.mark.parametrize("points", (True, 8, 66, (9, 9), (9, 9., 9)))
def test_reject_invalid_grid(points, systems):
    with pytest.raises(ValueError):
        C.FrozenSBPCube.box(points, systems=systems)


@pytest.mark.parametrize("kind", ("shape", "nan", "complex", "bool", "faces", "face-shape", "cfl", "dt", "index", "callback"))
def test_cube_invalid_inputs_rejected_without_mutation(cube, kind):
    q = np.zeros(cube.shape+(58,))
    initial = q.copy()
    with pytest.raises(ValueError):
        if kind == "shape":
            cube.rhs(q[..., :57])
        elif kind == "nan":
            bad = q.copy()
            bad[0, 0, 0, 0] = np.nan
            cube.rhs(bad)
        elif kind in ("complex", "bool"):
            cube.rhs(q.astype(complex if kind == "complex" else bool))
        elif kind == "faces":
            cube.rhs(q, faces(q)[:5])
        elif kind == "face-shape":
            cube.rhs(q, [np.zeros((1, 58))]*6)
        elif kind == "cfl":
            cube.step(q, 0, .1)
        elif kind == "dt":
            cube.step(q, 0, 0.)
        elif kind == "index":
            cube.step(q, True, .001)
        else:
            cube.step(q, 0, .001, 7)
    np.testing.assert_array_equal(q, initial)


def test_system_mismatch_and_invalid_continuum_request(cube, systems):
    with pytest.raises(ValueError, match="Cartesian"):
        C.FrozenSBPCube(cube.operators, systems[::-1])
    with pytest.raises(ValueError):
        C.FrozenSBPCube(cube.operators[:2], systems)
    with pytest.raises(ValueError):
        C.CubeWaves(cube, "invented", .001, 2)
    with pytest.raises(ValueError):
        C.CubeWaves(cube, "full58", .001, True)
    waves = C.CubeWaves(cube, "tt-plus", .001, 2)
    for index in (-1, 5, True):
        with pytest.raises(ValueError):
            waves(index)
