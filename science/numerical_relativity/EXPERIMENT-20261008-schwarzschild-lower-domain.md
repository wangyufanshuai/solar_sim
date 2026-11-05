# Lower-face-only Schwarzschild control and resolution-dependent factorial study

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective deterministic simulation, inline
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED; freeze before execution
- Version Label: nr-k3-schwarzschild-lower-domain-v1

## Question and controls

Does the coarse low-face effect persist across the original three spacings,
and how do the signed low/high/interaction fields refine? This is not a new
physical boundary, reflection measurement, or unique error-source decomposition.
The immediately preceding assessment-only goal turn produced no new experiment.

Retain the original, upper-expanded and both-expanded failed studies with SHA256
2aef22efc6bbb38fbbdcfed2211071487a709a81f01fab3a35fec99d360591c2,
ac35d3e159b9c0ad603f7bde4068171f2a396a4a690799b5c0ccc42462e33da7,
7e8ed82d234b56309c54093298ec475da4f00a2e47eea5a052a48026bd2d2157.
Their raw 45-state inventory is pinned by
482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a.
The single-resolution halo intervention receipt is pinned by
aba75f5d5bbadda6891e7f33dce2e0712aece034304fa6cc5e32fed0a6ee4ef3.
No old failure is rescored or overwritten.

Use unchanged native0.5.0, SHA256
fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc.
New domain [.5,3]^3, N21/31/41 matches old N17/25/33 at h=1/8,1/12,1/16.
M=1, FD4, RK4, dt=1/256, tau_inverse=1, original state-dependent gauge and
two analytic fixed halo layers at every RK stage. All 58 slots remain independent.
Shared initial coordinates must differ by <=2e-15, fields by <=2e-14;
record byte equality separately and never repair rounding by copying fields.
The common measurement nodes remain {1.5,1.75,2,2.25,2.5}^3; no interpolation.

## Ordered execution and prospective decisions

1. n21: eight 32-step, four-thread segments to T=1M, saved every .125M.
   At T=.125,.25,.5,1, require the ENTIRE N21 state to match the first 21
   nodes per axis of the retained N25 high-clamp trajectory byte-for-byte.
   Failure stops further stages. This validates operator equivalence, not physics.
2. n31 and n41: identical eight-segment schedules. Across all three grids,
   assess the five primary metrics at T=.25,.5,1: 15 own-domain groups and
   15 original/lower signed-difference groups, using existing p>=3 rule.
3. dt41: four 128-step segments, dt=1/512, to .25,.5,.75,1; initial slot
   bytes equal primary N41. At .25,.5,1 check all 13 signed diagnostic fields
   using <=5% difference/coarse norm or both-norms<=2e-12. Not temporal order.
4. replay: continuous 256-step single-thread N21, checkpoint AND manifest
   must equal segmented four-thread final output. Total 29 new native calls.

There are 31 distinct diagnostic samples (3 initials,24 primary outputs,4
half-step outputs); the half-step initial and replay are identity controls.
All samples use the existing boundedness screens: finite state, 0<alpha<2,
chi>0, active state error<=.01 and analytic halo error<=2e-14. Each native
restart is checked against metadata, checksum and unchanged fixed-layer bytes.
Spatial groups use the existing 2e-12 floor: all below is bounded-null, mixed
floor is unresolved/fail, otherwise both adjacent orders must be >=3.
Numerical failure does not prevent collecting remaining controls; execution,
identity, nonfinite or equivalence errors stop without automatic retry.

At four retained times and all three spacings, reconstruct H/Ricci on the
same core from all four domains, then form signed fields BEFORE norms:
low=lower-original, high=upper-original,
interaction=both-upper-lower+original, total=both-original.
Save 24 metric/time/resolution factorial records, all signed core values,
and 24 three-resolution trend groups at .25,.5,1 (2 metrics x4 contrasts x3
times). Trend groups use the same floor/order classifier but are exploratory
diagnostics, NOT an additional post-hoc pass/fail gate or reflection rate.
Check factorial reconstruction residual<=2e-12. Interaction does not uniquely
measure nonlinear Einstein terms; domain propagation and cancellation matter.

Study pass requires all 30 primary spatial groups,39 time checks,boundedness,
four historical byte controls and deterministic replay. It cannot promote
physical_validation, physical_boundary_validated, black_hole_evolution_validated,
amr_validated, waveform_validated, gpu_validated, runtime_writeback or
scientificPayloadWriteback; all eight remain false regardless of outcome.

## Resources and evidence

Fresh E-drive children of tmp/nr-shadow-evidence only, including TEMP/TMP.
C reserve 3GiB; E reserve 4GiB+32MiB plus next-output headroom. No installation,
deletion, art edits, commits, pushes or parent-repository inspection.

| Stage | Seconds cap | Output cap MiB | Headroom MiB | Native call cap |
|---|---:|---:|---:|---:|
| n21 | 900 | 128 | 16 | 180s |
| n31 | 1400 | 256 | 32 | 180s |
| n41 | 2400 | 448 | 48 | 240s |
| dt41 | 2600 | 288 | 48 | 700s |
| replay | 700 | 32 | 8 | 600s |

Chain cap 8000s, audit separately 1500s/8MiB. These are limits, not speed claims.
Monitor the same live handle at <=60s intervals; silent native segments are
not restarts. Hard command timeouts terminate that command; no automatic retry.
Each stage freezes current/source-snapshot hashes, protocol,binary,parents,
input hashes,commands,exit statuses and outputs. Recheck identities at the end.
Separate-process audit reconstructs diagnostics and decisions from raw states,
checks manifests/halo bytes, factorial fields, all stages and negative gates.
It uses the same geometry definitions, not an independent physical solver.

Run D:\python\python.exe -B scripts/run-nr-k3-schwarzschild-lower-domain.py
with --stage n21|n31|n41|dt41|replay and fresh --output-directory.
Later stages require exact --parent-receipt and --parent-sha256.
Audit: scripts/audit-nr-k3-schwarzschild-lower-domain.py with --receipt,
--receipt-sha256 and fresh --output-directory. Synthetic tests precede execution.
