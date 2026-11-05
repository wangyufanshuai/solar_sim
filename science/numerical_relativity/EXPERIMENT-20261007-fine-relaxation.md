# Frozen finer-grid vacuum-slice experiment v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent, inline
- Origin Mode: run / deterministic numerical validation
- Origin Date: 2026-10-07
- Verification Status: UNVERIFIED (prospective protocol)
- Version Label: nr-k3-fine-relaxation-v1

## Hypothesis and immutable baseline

Test the hypothesis that the coarse N8 grid in the prior relaxation study is
outside an asymptotic range for Hamiltonian constraint convergence. Do not
change its failed result, norms, floors, equations, gauge, data, or binary.
This is a separately selected finer-resolution test, not a preregistered
replication of that first study and not independent evolution-code validation.

Parent completed but failed convergence receipt:
`C:/Users/86137/NRShadowEvidence/nr-k3-relaxation-convergence-v1-20261007/receipt.json`
SHA-256 `bfbc9c97a57d97e9fab733331f54adaf4d975e9d8aad438c6a72f2a28a78e5b3`.
Retain all 170 parent source identities and artifacts. Add exactly four new
diagnostic/runner/test sources; snapshot 174. Native 0.4.0 binary SHA-256:
`20402d8e8ac65e1c24d87df4a5ad828846c40929c10af5f64b2c8b3ce1c27e38`.
No compilation, C++/Python evolution change, projection, KO dissipation,
auxiliary reconstruction, toolchain installation or environmental change.

## Matrix and reuse

Same periodic oblique k=(1,1,1) vacuum slice, amplitude 0.01, same analytic
GammaHat, centered A/B/D/P initialization and advective 1+log/Gamma-driver
profile (3,0.2). The harmonic analytic solution is not a time-dependent
reference under this gauge. All 58 stored fields evolve independently.

- Spatial: FD2/FD4 x lambda0/1 x N16/24/32, dt=1/512.
- Reuse the eight N16/32 cases and all 24 samples from the immutable parent;
  do not rerun or duplicate those outputs. Recompute and compare their metrics.
- Four fresh N24/dt1/512 cases, plus eight fresh N24/32/dt1/1024 controls.
- Every case has t=0,1/8,1/4 samples: 20 cases / 60 total samples, 36 fresh.
- Verify fresh initial payload equality across rate0/1 and across timesteps.
- Fresh FD4/N24/lambda1/dt1/512 direct 128-step serial replay must equal the
  four-thread 64+64-step checkpoint AND manifest bytes.
- Expected native commands: 25, all expected exit0; no failed-command retry.

## Frozen gates

Independent physical metric H/M and A/B/D/P/GammaHat/Theta/determinant/trace
diagnostics are unchanged from the parent. At each positive sample time,
the N16/24 and N24/32 L2 orders are log(E_coarse/E_fine)/log(N_fine/N_coarse).
Each must be >=1.5 (FD2) or >=3.0 (FD4). The same per-constraint floors
apply: H=5e-11; M/A/B/D/P/Ghat=5e-12; Theta/det_h/trace_a=5e-13.
All three norms below floor is bounded-null, not measured convergence;
mixed below/above floor is inconclusive and not passed.

For final all-58 state self-convergence, sample the three resolutions at
common N8 nodes using strides2/3/4. Let d1=u16-u24 and d2=u24-u32.
Fit their RMS norm ratio to
`R(p) = ((24/16)^p - 1)/(1 - (24/32)^p)` by bracketed bisection on 0<p<12.
Do NOT use log2 for these unequal spacings. Require p>=1.5/3.0 and cosine
alignment <d1,d2>/(||d1||||d2||)>=0.99. Either norm <=2e-12, an out-of-range
fit, or insufficient alignment is not a pass. Use distinct spatial_order
and observed_order fields in all new records.

At final time, for each N24/32 timestep pair, its signed all-58 state RMS
difference at common N8 nodes must be <=5% of the N24-vs-N32 spatial state
difference. The spatial denominator must exceed2e-12.
At BOTH positive sample times, signed constraint-field RMS differences from
dt1/512 to dt1/1024 must be <=5% of max(dt1/512 field RMS, diagnostic floor)
for every constraint. If both norms are below their floor, record bounded-null
instead. This is a timestep-contamination screen, not an independent
measurement of RK4 order (the parent already measured that at N16).

All spatial constraint, state, timestep and replay checks are required for
the new aggregate. Preserve all individual outcomes if any numerical gate
fails. Stop only on artifact/identity/finite-state failures or resource caps.

## Resources and command

Windows-native 0.4.0 MSVC2022 binary, 4 OpenMP threads; one replay uses1.
Campaign <=1800s, native command <=180s. New output <=512MiB with32MiB
in-flight reserve. Keep C>=4GiB and E>=1GiB. Output directory must not exist.
No source edits during execution; snapshot protocol and all174 sources.

`python -B scripts/run-nr-k3-fine-relaxation.py --output-directory C:/Users/86137/NRShadowEvidence/nr-k3-fine-relaxation-v1-20261007`

Regardless of finite-window outcome, physical validation, full constraint
propagation proof, strong hyperbolicity, CPBC, black holes, AMR, horizons,
Psi4, GPU, live admission, runtime writeback and scientificPayloadWriteback
remain false. No default relaxation or physics-regime change is authorized
by this experiment. Retain the earlier failed aggregate unchanged.
