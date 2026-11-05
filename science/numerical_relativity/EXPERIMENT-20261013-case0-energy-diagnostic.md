## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: run; pre-registered arithmetic diagnosis only
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: UNVERIFIED before the single registered execution
- Version Label: nr-case0-energy-diagnostic-v1

## Scope and authorization

The user authorized diagnosis of saved case 0, 64 MiB / 600 seconds, unchanged
thresholds and preserved failure evidence, without rerunning the full matrix.
This is not permission to fix the frozen candidate or qualify scientific use.
Only new diagnostic files and a fresh evidence directory may be written.

- Command: `D:/python/python.exe -B scripts/run-nr-k3-case0-energy-diagnostic.py --output-directory tmp/nr-shadow-evidence/nr-k3-case0-energy-diagnostic-v1-20261013`
- Workspace: `E:/86137/myai/solar_sim/next-web`.
- Inputs: all 14 saved case-0 arrays, observations, failure receipt and the 507-file
  source snapshot in `tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012`.
- Pinned failed gate SHA-256:
  `786b3b86ae9d4fd9035ae05e0bc6058b03147c27e2c9dfbad336a85db673b370`.
- Output cap: 64 MiB (artifacts, not a 64 MiB RAM claim); 2 MiB finalization
  headroom; source snapshot <= 8 MiB; C >= 3 GiB, E >= 4 GiB + 32 MiB.
  Admission reserves the entire prospective 64 MiB. One CPU thread, E-drive
  temporary files, no pyc. Frozen Windows-owned supervisor; no automatic retry.
- Stop on timeout, resource limit, ancestry drift, diagnostic control failure,
  or nonfinite data. Preserve partial outputs and failed terminal.

## Question and fixed analysis

Why do the full-state case-0 projector identities exceed `2e-12`, while the
constraint-block identities do not? Do not assume that extra precision fixes it.

1. Verify pinned old evidence, all 507 current/snapshot sources, and hash every
   old batch file before and after. Copy only the 14 case-0 arrays into the new
   batch. Validate Minkowski coefficients, zero shift, normal (1,0,0), and the
   exact old observation. No fresh principal-symbol generation or time stepping.
2. Within the owned process, run synthetic exact diagonal and integer-similarity
   controls on the new polynomial evaluator. The controls must match known
   projectors and verify the residual identities below to `1e-50` at Decimal70;
   this is a diagnostic arithmetic self-check, not a changed physics threshold.
3. Recompute the frozen candidate at Decimal50 and Decimal70 on the **same saved
   47x47 matrix and 13 saved nodes**. Require exact binary64 reproduction of the
   saved projectors at Decimal50. Independently retain the Decimal results
   before casting. Reproduce original full58/constraint43 metrics and ranks.
4. Compare four pre-registered Decimal70 paths, always keeping the saved matrix:
   - expanded paired polynomial, original saved nodes;
   - factored paired polynomial, same nodes, different evaluation order;
   - direct degree-12 Lagrange polynomial, same nodes (diagnostic representation,
     not a solver change);
   - factored paired polynomial with analytical flat-background squared speeds
     `[1/20, 1/10, 1, 2, 3, 4]`, square roots evaluated at Decimal70.
     This last path deliberately changes the diagnostic node input only. It is
     derived from the frozen flat-fixture coefficient formulas, not fitted to
     the matrix, and can never regrade the original failure.
5. Measure all 13 idempotency/action and 156 ordered cross-product residuals,
   completeness and reconstruction in Decimal70 before casting and binary64
   after casting. Use the original infinity-norm normalization and `2e-12`.
   Save maximal row/entry witnesses, full Decimal projectors, float arrays and
   per-stage receipts. A failing physical residual is a finding, not an error
   that permits the diagnostic runner to suppress later registered comparisons.
6. Compute the matrix polynomial `m(K)=K product_j(K^2-a_j^2 I)` without fitting
   eigenvalues. For direct Lagrange projectors, the exact identity is
   `(K-lambda I)L_lambda=m(K)/m'(lambda)`. For the frozen paired construction,
   `E_lambda=(K/lambda)L_lambda` when lambda!=0, hence its action residual is
   `K m(K)/(lambda m'(lambda))`; for zero it is `m(K)/m'(0)`.
   Check these identities to `1e-50` in the new diagnostic evaluation.
   This separates polynomial amplification of input incompatibility from
   high-precision evaluation error. Compare original-node and analytical-node
   annihilators; report the difference explicitly, not as a causal percentage
   because the components may cancel.

## Interpretation and exclusions

`Decimal.from_float` preserves the existing binary64 value, not an intended
real coefficient: [Python Decimal documentation](https://docs.python.org/3/library/decimal.html#decimal.Decimal.from_float).
Decimal70 is still finite arithmetic, not a formal exact proof. A nonzero
analytical-node annihilator of the saved matrix demonstrates incompatibility
of that saved input with those ideal nodes, but alone does not distinguish
coefficient-rounding from an equation/assembly defect. No matrix rationalization,
eigenvalue fitting, clipping, rank truncation or threshold relaxation is allowed.

Successful diagnostic completion means source preservation, self-controls,
required comparisons, inventories and resource supervision passed. It does
**not** mean the failed candidate passed. All physical, boundary, convergence,
hyperbolicity, live-admission and payload flags remain false. No full 66-case
matrix, 100/52-test suites, N9/N13, integration, native/GPU run or art changes.
There is no pre-registered automatic follow-up or second run.
