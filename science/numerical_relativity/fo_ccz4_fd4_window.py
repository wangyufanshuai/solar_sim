"""Frozen FD4 sampled-window gates, separate from retained FD2 evidence."""
from __future__ import annotations

import numpy as np

from .fo_ccz4_remainder import FIELDS, assess_remainder

MIN_SPATIAL_ORDER = 3.0
AUXILIARY_LIMIT = 1.e-3
HEALTH_NORMS = (
    "ordering_max_curl_l_inf", "ordering_max_algebraic_l_inf",
    "max_auxiliary_reduction_l_inf",
)
CONSTRAINT_NORMS = ("det_h_l_inf", "trace_a_l_inf", "conformal_gamma_l_inf")


def assess_fd4_window(rows):
    """Require every frozen grid/time; roundoff and a good endpoint cannot pass.

    Reuse the FD2 campaign's fixed cases, amplitude/time controls and raw field
    metrics, but never change its scoring function or historical receipts. The
    additional FD4 criterion is declared here before any candidate evolution.
    """
    for row in rows:
        if type(row.get("spatial_order")) is not int or row["spatial_order"] != 4:
            raise ValueError("FD4 window requires explicit integer spatial_order=4")
        for sample in row["samples"]:
            if sample.get("checkpoint_version") != 3 or sample.get("spatial_order") != 4:
                raise ValueError("each sample must declare checkpoint v3 and order 4")
            if sample.get("auxiliary_derivative_order") != 4:
                raise ValueError("sample auxiliary order must be four")
            for field in (*FIELDS, "M_y", "M_z", "Gamma_x", "Gamma_y", "Gamma_z"):
                values = np.asarray(sample["planes"][field], dtype=float)
                if values.shape != (row["points"],) or not np.all(np.isfinite(values)):
                    raise ValueError("finite complete signed planes, including t=0, required")
            reduction = np.asarray(sample["auxiliary_reduction_l_inf_by_slot"], dtype=float)
            if reduction.shape != (33,) or not np.all(np.isfinite(reduction)) or np.any(reduction < 0.):
                raise ValueError("all 33 finite non-negative auxiliary residuals required")
            if float(np.max(reduction)) != sample["max_auxiliary_reduction_l_inf"]:
                raise ValueError("auxiliary maximum disagrees with full residual list")
            norms = [sample[key] for key in HEALTH_NORMS]
            norms += [sample["constraints"][key] for key in CONSTRAINT_NORMS]
            if not np.all(np.isfinite(norms)) or min(norms) < 0.:
                raise ValueError("finite non-negative supplemental constraint norms required")
            domain = [sample[key] for key in ("min_lapse", "max_lapse", "min_chi", "min_metric_eigenvalue")]
            if not np.all(np.isfinite(domain)) or min(domain) <= 0. or domain[0] > domain[1]:
                raise ValueError("finite positive sampled lapse, chi and metric domain required")
    reference = assess_remainder(rows)
    spatial = {}
    for field in FIELDS:
        item = reference["spatial"][field]
        orders = item["orders"] + item["peak_orders"]
        spatial[field] = {**item, "minimum_order": MIN_SPATIAL_ORDER,
                          "passed": all(p is not None and p >= MIN_SPATIAL_ORDER for p in orders)}
    samples = [s for row in rows for s in row["samples"]]
    peaks = {key: max(s[key] for s in samples) for key in HEALTH_NORMS}
    peaks.update({key: max(s["constraints"][key] for s in samples) for key in CONSTRAINT_NORMS})
    supplemental_passed = all(value <= AUXILIARY_LIMIT for value in peaks.values())
    return {"reference_fd2_threshold_assessment": reference, "spatial": spatial,
            "supplemental_constraint_peaks": peaks, "supplemental_limit": AUXILIARY_LIMIT,
            "supplemental_passed": supplemental_passed,
            "sampled_fd4_window_gates_passed": bool(
                reference["bounded_remainder_gates_passed"] and supplemental_passed
                and all(value["passed"] for value in spatial.values())),
            "continuous_window_convergence_validated": False, "physical_validation": False,
            "runtime_writeback": False}
