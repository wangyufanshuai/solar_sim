"""Synthetic stage-support and file-format checks, not physical validation."""
import numpy as np
import pytest

from . import rk_stage_locality as S


@pytest.mark.parametrize("side", ["low", "high"])
@pytest.mark.parametrize("n", [17, 25, 33])
def test_oriented_depth_matches_distance_from_fixed_layer(n, side):
    d = S.distance(n, side)
    assert d[2, 2, 2] == (1 if side == "low" else n-4)
    assert d[n-3, n-3, n-3] == (n-4 if side == "low" else 1)


@pytest.mark.parametrize("label,depth", list(S.SUPPORT.items()))
def test_beyond_each_stage_envelope_is_detected(label, depth):
    q = np.zeros((58, 17, 17, 17))
    q[17, depth+2, depth+2, depth+2] = 3.e-12
    row = S.compare_stage(q, np.zeros_like(q), label, "low")
    assert not row["support_consistency_passed"]
    assert row["outside_support_max_abs"] == 3.e-12
    assert row["regions"]["active"]["resolved_nodes"] == 1
    assert len(row["regions"]["core"]["slot_norms"]) == 58


def test_subfloor_difference_is_recorded_without_resolution_claim():
    q = np.zeros((58, 17, 17, 17))
    q[3, 8, 8, 8] = 1.e-15
    row = S.compare_stage(q, np.zeros_like(q), "k1", "high")
    assert row["support_consistency_passed"]
    assert row["regions"]["core"]["resolved_nodes"] == 0
    assert not row["regions"]["core"]["bytes_equal"]
    assert row["regions"]["core"]["max_abs_difference"] == 1.e-15


@pytest.mark.parametrize("side", ["low", "high"])
def test_depth_bands_cover_active_nodes_without_overlap(side):
    q = np.zeros((58, 17, 17, 17))
    rows = S.compare_stage(q, q, "final", side)["regions"]
    assert sum(rows[k]["node_count"] for k in rows if k.startswith("depth_")) == rows["active"]["node_count"]
    assert all(r["bytes_equal"] and r["max_abs_difference"] == 0. for r in rows.values())


@pytest.mark.parametrize("n,side", [(True, "low"), (16, "low"), (17., "low"), (17, "both")])
def test_invalid_depth_contract_rejected(n, side):
    with pytest.raises(ValueError):
        S.distance(n, side)


@pytest.mark.parametrize("defect", ["short", "magic", "version", "points", "slots", "size"])
def test_bad_trace_headers_rejected(tmp_path, defect):
    values = [b"NRRKSTG1", 1, 17, 58]
    for kind, index, value in (("magic", 0, b"NRFORHS1"), ("version", 1, 2), ("points", 2, 25), ("slots", 3, 57)):
        if defect == kind:
            values[index] = value
    data = S.HEADER.pack(*values)
    target = tmp_path/"bad.trace"
    target.write_bytes(data[:3] if defect == "short" else data)
    with pytest.raises(ValueError):
        S.read_trace(target, 17)


def test_valid_trace_is_read_only_and_exact_shape(tmp_path):
    target = tmp_path/"good.trace"
    with target.open("xb") as stream:
        stream.write(S.HEADER.pack(b"NRRKSTG1", 1, 17, 58))
        stream.truncate(S.HEADER.size+8*58*17**3*8)
    value = S.read_trace(target, 17)
    assert value.shape == (8, 58, 17, 17, 17)
    assert not value.flags.writeable
    assert not np.any(value)
    del value
