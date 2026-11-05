"""Post-hoc diagnosis of retained data; no evolution, fitting or promotion."""
from __future__ import annotations

import argparse
from dataclasses import replace
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity.fo_ccz4 import FOCCZ4_AUXILIARY_VARIABLES, FOCCZ4_VARIABLE_ORDER  # noqa: E402
from science.numerical_relativity.fo_ccz4_checkpoint import decode_checkpoint  # noqa: E402
from science.numerical_relativity.fo_ccz4_linear_modes import CONFIG, GAUGE, PROFILE, minkowski_source_matrix  # noqa: E402
from science.numerical_relativity.fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d  # noqa: E402

RECEIPT_SHA = "bb4e8efb398c757a56ec1b35f2676d5d41490f6ebf0001fae965bb60e06c4e1b"
IDENTITY = Path("C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/campaign-v2/receipt.json")
IDENTITY_SHA = "68b1a7c1b2cb5579b9a4aaf7e85e95a49ed2d967694beade2b24b503ed308bbc"
NEW = ("scripts/analyze-nr-auxiliary-trace-source.py", "scripts/tests/test_nr_auxiliary_trace_source.py")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fd4(q, axis):
    """Independent periodic unit-cube stencil, acting on stored scalar slots."""
    q = np.asarray(q)
    if q.ndim != 3 or len(set(q.shape)) != 1 or q.shape[0] < 5 or axis not in (0,1,2) or not np.all(np.isfinite(q)):
        raise ValueError("finite cubic scalar field and Cartesian axis required")
    return (8*(np.roll(q,-1,axis=axis)-np.roll(q,1,axis=axis))
            -(np.roll(q,-2,axis=axis)-np.roll(q,2,axis=axis)))/(12/q.shape[axis])


def trace_and_lapse_residual(slots):
    if len(slots) != 58 or any(q.shape != slots[0].shape for q in slots):
        raise ValueError("58 equal-shaped slots required")
    # Coordinate trace at Minkowski, NOT the nonlinear h^{ij} A_ij.
    trace = slots[11]+slots[14]+slots[16]
    residual = np.stack([slots[25+a]-fd4(slots[6],a) for a in range(3)])
    return trace, residual


def prediction_errors(initial, observed, time):
    if not np.isfinite(time) or time < 0.:
        raise ValueError("finite nonnegative time required")
    tr0, c0 = trace_and_lapse_residual(initial)
    tr, c = trace_and_lapse_residual(observed)
    if c.shape != c0.shape:
        raise ValueError("prediction grid mismatch")
    predicted = c0-2*time*np.stack([fd4(tr0,a) for a in range(3)])
    return {"A_residual_peak": float(np.max(abs(c))),
            "linear_trace_source_prediction_max_abs_error": float(np.max(abs(c-predicted))),
            "coordinate_trace_A_max_drift": float(np.max(abs(tr-tr0)))}


def matrix_identity_errors(k):
    k = np.asarray(k, dtype=float)
    if k.shape != (3,) or not np.all(np.isfinite(k)):
        raise ValueError("finite 3-vector required")
    # These matrices are hand-encoded linearizations, not sampled nonlinear RHS.
    generator = minkowski_source_matrix().astype(complex)
    for a in range(3):
        generator += 1j*k[a]*analytic_fo_ccz4_principal_matrix_3d(
            normal_axis=a, gauge=replace(GAUGE, shift_coefficient=PROFILE.shift_scale),
            config=replace(CONFIG, ordering_mu=PROFILE.ordering_scale))
    basis = np.eye(58)
    e = {n: basis[i] for i,n in enumerate(FOCCZ4_VARIABLE_ORDER)}
    trace = e["A00"]+e["A11"]+e["A22"]
    constraints = [e[f"A{a}"]-1j*k[a]*e["ln_alpha"] for a in range(3)]
    return {"k": k.tolist(), "trace_source_identity_max_abs_error": float(np.max(abs(trace@generator))),
            "lapse_reduction_source_identity_max_abs_error":
                max(float(np.max(abs(c@generator+2j*k[a]*trace))) for a,c in enumerate(constraints))}


def analyze(parent):
    input_hashes, rows = {}, []

    def read(path, digest):
        path = Path(path)
        raw = path.read_bytes()
        if hashlib.sha256(raw).hexdigest() != digest:
            raise ValueError(f"input checkpoint identity drift: {path}")
        input_hashes[str(path)] = digest
        return decode_checkpoint(raw, expected_profile=PROFILE, expected_spatial_order=4)

    for row in parent["cases"]:
        initial = read(row["initial_checkpoint"], row["initial_checkpoint_sha256"])
        samples, worst = [], None
        for s in row["samples"]:
            data = initial if s["time"] == 0 else read(s["checkpoint"], s["checkpoint_sha256"])
            if data.header["time"] != s["time"] or data.header["step"] != s["step"]:
                raise ValueError("retained sample/checkpoint metadata mismatch")
            samples.append({"time": s["time"], **prediction_errors(initial.slots, data.slots, s["time"])})
            norms = s["auxiliary_reduction_l_inf_by_slot"]
            index = int(np.argmax(norms))
            if worst is None or norms[index] > worst["norm"]:
                worst = {"slot": FOCCZ4_AUXILIARY_VARIABLES[index], "time": s["time"], "norm": norms[index]}
        peaks = {k: max(s[k] for s in samples) for k in samples[0] if k != "time"}
        rows.append({"family": row["family"], "n": row["points"], "seed": row["seed"],
                     "steps_per_unit": row["steps_per_unit"], "worst_recorded_auxiliary": worst,
                     **peaks, "error_over_observed_peak": peaks["linear_trace_source_prediction_max_abs_error"]/
                     peaks["A_residual_peak"] if peaks["A_residual_peak"] else None, "samples": samples})
    wave_numbers = ((0.,0.,0.), (1.,0.,0.), (0.,1.,0.), (0.,0.,1.), (2.3,-1.1,.7), (-13.,7.,19.))
    return {"schema_version": "nr-auxiliary-trace-source-posthoc-v1", "input_hashes": input_hashes, "rows": rows,
            "matrix_identities": [matrix_identity_errors(k) for k in wave_numbers],
            "analysis_kind": "posthoc-no-fit-read-only-hypothesis-generation",
            "residual_convention": "stored ln_alpha, not log(exp(ln_alpha))",
            "prediction": "C_Ai(t)=C_Ai(0)-2*t*D_i(A00+A11+A22)(0), flat linearization, tau_inverse=0",
            "new_simulation_executed": False, "prospective_causal_validation": False,
            "physical_validation": False, "strong_hyperbolicity_validated": False,
            "runtime_writeback": False, "scientificPayloadWriteback": False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if sha256(args.receipt) != RECEIPT_SHA or sha256(IDENTITY) != IDENTITY_SHA:
        raise ValueError("known retained data and source-identity receipts required")
    identity = json.loads(IDENTITY.read_text(encoding="utf-8"))
    names = sorted(set(identity["source_before"]) | set(NEW))
    before = {n: sha256(ROOT/n) for n in names}
    if any(before[n] != digest for n,digest in identity["source_before"].items()):
        raise ValueError("validated source changed")
    result = analyze(json.loads(args.receipt.read_text(encoding="utf-8")))
    after = {n: sha256(ROOT/n) for n in names}
    if before != after:
        raise ValueError("source changed during analysis")
    result.update(receipt=str(args.receipt), receipt_sha256=RECEIPT_SHA,
                  source_identity_receipt=str(IDENTITY), source_identity_receipt_sha256=IDENTITY_SHA,
                  source_before=before, source_after=after)
    with args.output.open("x", encoding="utf-8") as stream:
        stream.write(json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n")
    print(json.dumps({"output": str(args.output), "sha256": sha256(args.output),
                      "input_checkpoints": len(result["input_hashes"]),
                      "maximum_prediction_error": max(r["linear_trace_source_prediction_max_abs_error"] for r in result["rows"]),
                      "matrix_identities": result["matrix_identities"]}))


if __name__ == "__main__":
    main()
