# Boundary-to-second-stage source-channel prediction

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective retained-state mechanism analysis
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED; frozen before real-input execution
- Version Label: nr-boundary-stage-channels-v1

The previous goal turn was a project assessment, not a new scientific gate.
This is the second discriminating batch after the initial B-source audit, not
another domain/time matrix or a replacement for the full NR goal.

## Question and independent reduction

Does the initial B source alone explain the first incoming *discrete* domain
effect, or do extrinsic-curvature/trace/Z4 channels also matter?
Use Eq.(12) of [Dumbser et al.](https://ar5iv.labs.arxiv.org/html/1707.09910),
DOI10.1103/PhysRevD.97.084053. This is our restricted derivation, not a theorem
in that paper for the custom gauge or boundary. No physical speed is inferred.

On the shared original active cube, the two s2 states agree up to roundoff.
Their h=I, beta=b=GammaHat=D=0, alpha/chi/A_k/P_k remain the static initial
fields; s2 changes only a_ij (the conformal extrinsic curvature), K,Theta,B.
Local algebraic sources therefore cancel between domains on that cube. For
`u=(dt/2)*(k1_left-k1_right)` and direct FD4 derivative d, define
`T_k=d_k tr(a)` and `C_k=sum_j (d_k B_j^j+d_j B_k^j)/2`.
The difference of the actual k2 RHS must reduce to these spatial terms:

```
G_i = alpha*(-4/3*d_i K + 2*d_i Theta + 2*T_i)
      + sum_j d_j B_j^i + C_i/3
delta GammaHat_i = delta b_i = G_i
delta A_k = -2*d_k K + 4*d_k Theta - 2*T_k
delta D_kij = -alpha*d_k a_ij + alpha*delta_ij*T_k/3
              +(d_k B_j^i+d_j B_k^i+d_k B_i^j+d_i B_k^j)/4
              -delta_ij*C_k/3
delta P_k = alpha*(d_k K+T_k)/3 - C_k/3
all other 28 output slots = 0
```

The tr(a) terms must be retained even though they can be roundoff-small on the
retained data. A polynomial trace perturbation tests them separately. This
linear reduction is special to matching s2 local states. It is NOT a general
linearization, full RHS replacement, CPBC or a prediction for k3/k4/T=1M.

## Inputs and complete coverage

Read the 9 retained RK traces and 9 T=0 checkpoints identified by
`nr-k3-rk-stage-locality-v1-20261008/receipt.json`, SHA256
`cd1872626f3f572bf1f2a41b528794510ec08a21e7180c606a2cc3b61eedb0e1`.
Recheck the unchanged solver SHA256
`6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457`.
Bind the B-source replay receipt SHA256
`c1ab418f3afa736704079572bd9ed32ef9d0313e4ec5855aff1c93322e5d9776`
and the lower-domain failed final receipt/audit retained by that parent.

At each original N17,25,33 (h=1/8,1/12,1/16), compare upper-original and
both-upper: all 6 pairs, full original active cubes, all 58 output slots.
Use exact matched crops (no interpolation). Read k1,s2,k2 only from memmapped
traces; never copy large traces or rerun a trajectory. Retain per-output-family
and per-slot norms for observed, full prediction, residual and all 4 source
channels (a,K,Theta,B). Preserve signed core values and their hashes.

## Frozen numerical criteria and controls

- Require complete input/source coverage and unchanged hashes; parent source
  and operator controls must pass, old physical failures must remain failed.
- Initial/s2 local-state mismatch <=2e-14; original-active k1 mismatch <=2e-12.
  Explicitly report actual mismatches; tolerance is not exact equality.
- All initial k1 slots outside a,K,Theta,B must be exactly zero. Check s2 is
  q0+dt*k1/2 across each common cube within2e-14. Require dt=1/256.
- Independent FD4 direct weights, not the production stencil or principal
  symbol, generate the prediction. Full-active maximum residual <=2e-12.
- Evaluate B-only residual with the same absolute floor: if >2e-12, B alone
  does not explain measured k2. No dominance percentage or physical cause is
  inferred from adding norms; signed channels may cancel.
- Test derivative polynomial moments, K/Theta/trace/off-diagonal-B coefficients,
  linearity, zero fields, all58 output defects, unsupported states and coverage.
  A synthetic actual-Python-RHS check is a separate implementation control.
- No new spatial-order or physical-admission threshold. Norms of differently
  dimensioned coordinate slots are diagnostic bookkeeping, not invariant energy.

## Execution and resource contract

Entry: `D:\python\python.exe -B scripts/analyze-nr-k3-boundary-stage-channels.py`
with a fresh `--output-directory` under workspace `tmp/nr-shadow-evidence`.
Run synthetic tests first, then the frozen retained-data analysis, then a
separately planned second-process replay. Compare all scientific fields and
source/input hashes exactly, excluding seconds only. No silent crash retry.

600s analysis wall cap,32MiB output cap,16MiB receipt/headroom; memory-map large
retained traces, process one resolution at a time. Keep C>=3GiB and
E>=4GiB+32MiB plus16MiB headroom. Outputs/TEMP/TMP are on E. Freeze235 old source
files plus these5 new protocol/module/runner/test files and the prior B results
record (241 total). No install, delete, art change, solver edit or live write.

If the reduction matches, use measured non-B channels to decide which boundary
compatibility equations require attention; do not keep assuming B-only control.
If it fails, retain the failed result and locate the missing terms/assumptions.
Only one more discriminating batch, at most, precedes a gauge/boundary route
decision. This cannot close the old T=1M gate or any of the eight admission flags.
