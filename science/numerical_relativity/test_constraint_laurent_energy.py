"""26 candidate controls. Run only in the separately authorized owned batch."""

from decimal import Decimal, localcontext
from fractions import Fraction as F
import hashlib
import importlib.util
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

from scripts import nr_constraint_exact_coefficients as R
from scripts import nr_constraint_full_symbol as A
from scripts import nr_constraint_laurent_energy as E
from scripts import nr_profile_exact_coefficients as Q


def test_laurent_product_keeps_negative_and_highest_zero_coefficients():
    actual = E.product({-1: R.eye(1), 2: R.zeros(1, 1)}, {-1: R.eye(1), 1: R.eye(1)})
    assert set(actual) == {-2, 0, 1, 3}
    assert actual[-2][0, 0] == actual[0][0, 0] == 1
    assert not np.any(actual[3])


def test_noninteger_powers_and_broadcast_shapes_are_rejected():
    for terms in ({}, {True: R.eye(1)}, {0.0: R.eye(1)}, {0: R.eye(1), 1: R.eye(2)}):
        with pytest.raises(ValueError):
            E.coefficients(terms)


def test_float_coefficients_are_rejected():
    with pytest.raises(ValueError):
        E.coefficients({0: np.eye(2)})


def test_failed_identity_retains_the_full_unmodified_residual():
    actual, reference, writes = {-1: R.eye(1), 0: 2 * R.eye(1)}, {0: R.eye(1)}, []
    with pytest.raises(E.ExactIdentityError) as caught:
        E.identity("mutation", actual, reference, sink=lambda name, values: writes.append((name, values)))
    assert caught.value.name == "mutation" and len(writes) == 1
    assert set(caught.value.residual) == {-1, 0}
    assert all(x[0, 0] == 1 for x in caught.value.residual.values())
    assert actual[0][0, 0] == 2 and reference[0][0, 0] == 1


def test_exact_identity_does_not_require_matching_zero_key_sets():
    residual = E.identity("padding", {0: R.eye(1), 2: R.zeros(1, 1)}, {0: R.eye(1)})
    assert set(residual) == {0, 2} and not any(np.any(x) for x in residual.values())


def test_case12_weights_are_two_sided_rational_inverses():
    w, wi = E.factors(Q.case12())
    for a, b in ((w, wi), (wi, w)):
        E.identity("inverse", E.product(a, b), {0: R.eye(43)})
    assert w[1][41, 41] == 6 and wi[-1][41, 41] == F(1, 6)
    assert w[0][41, 20] == -6 * wi[0][41, 20]


def test_case12_bridge_is_two_sided_and_retains_metric_half_factors():
    b = Q.case12()
    u, ui = E.bridge(b)
    for a, inverse in ((u, ui), (ui, u)):
        E.identity("bridge", E.product(a, inverse), {0: R.eye(43)})
    assert u[0][5, 20] == -Q.inverse(b.metric)[0][0] / 2
    assert u[1][0, 38] == 4 * b.chi * sum(Q.inverse(b.metric)[0][j] * b.ray[j] for j in range(3))


def test_case12_transformed_physical_map_has_the_independent_leading_map():
    b = Q.case12()
    w, _ = E.factors(b)
    u, _ = E.bridge(b)
    rows = E.product(E.product(w, u), dict(enumerate(A.physical_coefficients(b))))
    assert all(not np.any(a) for p, a in rows.items() if p > 0)
    assert np.array_equal(rows[0], R.leading(b))
    assert np.any(rows[-1])  # Do not discard the actual inverse-frequency term.


def test_laurent_zero_frequency_is_rejected_even_for_zero_negative_coefficients():
    with pytest.raises(ValueError, match="not defined at zero"):
        E.evaluate({-1: R.zeros(1, 1), 0: R.eye(1)}, Q.case12(), F(0))


def test_fourier_phases_for_negative_and_positive_powers():
    b = Q.case12()
    for precision in (50, 70):
        with localcontext() as ctx:
            ctx.prec = precision
            x = Decimal(2) / Decimal(6).sqrt()
            for p in (-2, -1, 0, 1, 2):
                real, imag = E.evaluate({p: R.eye(1)}, b, F(2), precision=precision)
                phase = p % 4
                expected = (1 if phase < 2 else -1) * (x ** p if p else Decimal(1))
                assert (imag if phase % 2 else real)[0, 0] == expected
                assert (real if phase % 2 else imag)[0, 0] == 0


def test_invalid_frequency_or_precision_is_not_clipped():
    for rho in (F(-1), F(9), 1.0, True):
        with pytest.raises(ValueError):
            E.evaluate({0: R.eye(1)}, Q.case12(), rho)
    with pytest.raises(ValueError):
        E.evaluate({0: R.eye(1)}, Q.case12(), F(1), precision=60)


def test_polynomial_evaluation_at_zero_preserves_only_the_constant():
    real, imag = E.evaluate({0: 2 * R.eye(1), 1: R.eye(1), 2: R.eye(1)}, Q.case12(), F(0))
    assert real[0, 0] == 2 and imag[0, 0] == 0


def toy_energy():
    k, o = R.zeros(3, 3), R.zeros(3, 3)
    k[1, 2], k[2, 1], o[0, 0] = F(1), F(4), F(1)
    return k, o, (F(4),), (F(1), F(2), F(3))


def test_paired_energy_handles_a_nonnormal_operator_without_square_roots():
    k, o, squared, diagonal = toy_energy()
    result = E.paired_energy(k, o, squared, diagonal)
    assert result["energy"][1, 1] == 7 and result["energy"][2, 2] == F(7, 4)
    assert np.array_equal(R.product(result["energy"], k), R.product(k.T, result["energy"]))
    assert not np.any(result["zero"]) and len(result["pairs"]) == 1


def test_coercivity_is_an_exact_positive_weighted_gram_certificate():
    result = E.paired_energy(*toy_energy())
    assert result["denominator"] == 4 and result["lower_scalar"] == F(1, 4)
    assert np.array_equal(result["energy"] - result["metric"] / 4, result["coercivity"])


def test_duplicate_or_nonpositive_prescribed_speeds_are_rejected():
    k, o, _, diagonal = toy_energy()
    for squared in ((), (F(4), F(4)), (F(0),), (F(-1),), (4.0,)):
        with pytest.raises(ValueError):
            E.paired_energy(k, o, squared, diagonal)


def test_a_jordan_block_is_not_repaired_into_a_symmetrizer():
    k = R.zeros(2, 2)
    k[0, 1] = F(1)
    with pytest.raises(E.ExactIdentityError, match="zero-speed-action"):
        E.paired_energy(k, R.zeros(2, 2), (F(1),), (F(1), F(1)))


def test_invalid_ode_or_gram_metric_is_rejected():
    k, o, squared, diagonal = toy_energy()
    o[0, 0] = F(2)
    with pytest.raises(E.ExactIdentityError, match="ode-idempotence"):
        E.paired_energy(k, o, squared, diagonal)
    for metric in ((F(1),), (F(1), F(0), F(1))):
        with pytest.raises(ValueError):
            E.paired_energy(k, R.zeros(3, 3), squared, metric)


def test_normal_energy_pullback_preserves_the_original_one_over_fourteen_floor():
    g = R.eye(43)
    for i in R.SCALED_ROWS:
        g[i, i] = F(1, 6)
    actual = E.normal_coordinates(g / 14, Q.case12(), kind="energy")
    with localcontext() as ctx:
        ctx.prec = 70
        target = Decimal(1) / 14
        assert all(abs(actual[i, i] - target) < Decimal("1e-68") for i in range(43))
    assert np.count_nonzero(actual) == 43


def test_entry_bound_is_rational_and_uses_all_entries():
    a = np.array([[F(-2), F(1, 3)], [F(4), F(0)]], dtype=object)
    assert E.entry_bound(a) == F(19, 3)


def test_strict_sparse_decode_roundtrip():
    a = np.array([[F(-2), F(1, 3)], [F(0), F(4)]], dtype=object)
    assert np.array_equal(E.decode(Q.encode(a)), a)


def test_strict_sparse_decode_rejects_duplicates_and_noncanonical_fractions():
    for entries in ([[0, 0, "1", "1"], [0, 0, "1", "1"]], [[0, 0, "0", "1"]],
                    [[0, 0, "2", "2"]], [[0, 0, "1", "0"]], [[0, 0, "01", "1"]]):
        with pytest.raises(ValueError):
            E.decode(dict(shape=[1, 1], representation="sparse-exact-rational-zero-fill", entries=entries))


def test_growth_bound_does_not_drop_nonzero_higher_derivatives():
    b = {i: R.zeros(43, 43) for i in range(3)}
    with pytest.raises(ValueError, match="exactly first-order"):
        E.growth_bounds(b, {1: R.eye(43), 2: R.eye(43)}, R.eye(43), F(1), Q.case12())


def test_growth_bound_uses_registered_cutoff_and_includes_negative_powers():
    b = {i: R.zeros(43, 43) for i in range(3)}
    b[0][4, 4] = F(-1)
    reduced = {-2: R.zeros(43, 43), 0: R.zeros(43, 43), 1: R.eye(43)}
    reduced[-2][4, 4] = F(1)
    actual = E.growth_bounds(b, reduced, R.eye(43), F(1), Q.case12())
    assert actual["low"] == actual["zero"] == 2
    assert actual["high_terms"][-2] == 36 and actual["high"] == 2 * 43 * 36
    with pytest.raises(ValueError, match="fixed case12"):
        E.growth_bounds(b, reduced, R.eye(43), F(1), Q.case12(), cutoff=F(1))


def test_control_guard_propagates_without_retry():
    calls = []

    def stopped():
        calls.append(1)
        raise RuntimeError("budget stopped")

    with pytest.raises(RuntimeError, match="budget stopped"):
        E.product({0: R.eye(2)}, {0: R.eye(2)}, guard=stopped)
    assert calls == [1]


@pytest.fixture(scope="module")
def lower_energy_runner():
    path = Path(__file__).resolve().parents[2] / "scripts/run-nr-k3-case12-lower-energy.py"
    spec = importlib.util.spec_from_file_location("case12_lower_energy_runner_controls", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module  # Import defines helpers; it must not launch the supervisor.


def test_frozen_input_hashes_archives_and_returns_one_read(lower_energy_runner):
    payloads, calls, saved, hashes = (b"original-input", b"changed-input"), [], [], {}

    def changed_on_reopen():
        value = payloads[min(len(calls), 1)]
        calls.append(value)
        return value

    source = SimpleNamespace(read_bytes=changed_on_reopen)
    budget = SimpleNamespace(save=lambda name, payload: saved.append((name, payload)))
    digest = hashlib.sha256(payloads[0]).hexdigest()
    actual = lower_energy_runner.frozen_input_bytes(source, digest, budget, "fixture.bin", hashes)
    assert actual == payloads[0] and calls == [payloads[0]]
    assert saved == [("inputs/fixture.bin", actual)] and hashes == {"fixture.bin": digest}


def test_frozen_input_rejects_drift_duplicate_and_failed_save_without_admission(lower_energy_runner):
    calls, saved, hashes = [], [], {}
    payload = b"current-input"
    source = SimpleNamespace(read_bytes=lambda: calls.append(1) or payload)
    budget = SimpleNamespace(save=lambda name, data: saved.append((name, data)))
    digest = hashlib.sha256(b"different-input").hexdigest()
    with pytest.raises(ValueError, match="payload drift"):
        lower_energy_runner.frozen_input_bytes(source, digest, budget, "fixture.bin", hashes)
    assert calls == [1] and not saved and not hashes
    with pytest.raises(ValueError, match="distinct frozen input"):
        lower_energy_runner.frozen_input_bytes(source, digest, budget, "fixture.bin", {"fixture.bin": digest})
    assert calls == [1] and not saved

    def failed_save(name, data):
        raise RuntimeError("output unavailable")

    with pytest.raises(RuntimeError, match="output unavailable"):
        lower_energy_runner.frozen_input_bytes(source, hashlib.sha256(payload).hexdigest(),
                                              SimpleNamespace(save=failed_save), "fixture.bin", hashes)
    assert calls == [1, 1] and not saved and not hashes
