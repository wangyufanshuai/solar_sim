# Research continuation status (2026-11-14)

This iteration maps to S2/S3 (new numerical trajectories and small strong-field
foundations), S5 (Kerr reference comparison), and E0 (production-build preparation).

- Full frozen 8^3 binary64 alignment has NOT run in this iteration. The retained
  registration requires 4 GiB available RAM. Earlier Richardson-v2 results use a
  different acceptance rule and do not discharge this original-registration item.
- S2-c: fresh native FD4 n=8, seed42, noise1e-10, dt=.0125; 600 s resource stop
  at T=440.9125, samples through T=440, 46.25 MiB peak. T=500 incomplete.
  The post-hoc [200,440] log slope is +.001711745; Hamiltonian growth from t=1
  is 1.02025, and lapse RMS grows approximately linearly. No boundedness proof.
- S3: fresh native A=.1 gauge wave fails in [23.28125,23.2890625], RK4 stage2
  exp overflow. Python comparison exceeds 1% from T=18 and differs by 84.9%
  at T=22; late-time trajectory reproduction FAILED. External reproduction is absent.
- S3 follow-on: conservative 2:1 transfer, time-symmetric two-puncture initial-data
  residuals, and synthetic spin-2 l=2 angular projection are implemented and checked
  in the NR repository. These are not AMR evolution, orbiting binaries, or waveforms.
  The first AMR expected-order registration was incorrect, its failed result is
  preserved, and the corrected third-order expectation is explicitly post-hoc.
- S5: extreme Kerr 128^2 real-GPU budget exhaustion decreases 1 -> 0 with an
  8000-step budget. Three captured/disk disagreements remain. Newly completed ray
  increases maximum redshift relative error to 3.76e-4; see KERR_STEP_BUDGET.md.
- E0: direct all-route Next build at source 9b371640 failed after 45.58 s at the
  768 MiB V8 heap limit; combined peak process RSS ~1.15 GiB. No BUILD_ID, no
  typecheck completion, no production acceptance. Raw receipt/log: build/.

The existing formal build-profile runner isolates historical research routes and uses
an application production tsconfig. It has NOT been executed in this iteration; the
failed direct all-route attempt is not evidence that the formal route profile cannot
build. That runner currently requires >=4096 MiB heap. Low-memory Next options now
recognize its existing 'true' flag as well as '1'. Its recovery directory is retained if
restoring isolated sources fails. Syntax/config checks passed; fault-injected restore
and a successful full profile build remain unverified.

The mainline art branch has two committed changes not yet merged into this worktree.
A merge-tree preview reported no conflicts, but no branch merge or deployment was done.
This web repository has no Git remote configured. Original directories/branches were
not moved or reset.

NR source/results: branch codex/s3-gauge-wave-evidence, pushed through a93bb07.
Tracked entry points: experiments/b3_native/long_diagnostics.py,
experiments/b3_native/analyze_long_diagnostics.py,
experiments/strong_field/foundations.py. Full results and actual-data figure are under
docs/long-diagnostics/ in that repository. Nine initial native scoped tests, four
post-change diagnostic tests, and six foundation tests passed; this does not turn
failed scientific comparisons into passes.

Next scientific priority is field/stage comparison near T=15-18 for A=.1, including
roundoff perturbation sensitivity before attributing the instability. The S2-c lapse
secular mode requires analysis of the implemented gauge and constraint subsystem.
Deployment requires a successful formal profile build, browser integration on the
merged candidate, and a verified publication target; none is claimed complete here.


Kerr four-camera regression with MAX_STEPS=8000 completed on the real GPU:
all four have zero exhausted rays; three have classification agreement 1, and the
extreme-spin case has 0.99981689453125. Raw: s4/kerr-budget-regression.json.

The legacy v596 profile test was also attempted and FAILED before build invocation:
v596-workspace-realpath-boundary for public/data/stellar-relativity-v595/manifest.json.
At that attempt public was a junction into D:/SolarResearchWorkspace/solar-s4-reference-errors/public.
It has since been materialized in this worktree: all 2253 files (2027129370 bytes)
were checked against the source before switching. The original junction is retained
at ../solar-s4-public-original-junction and the D-drive assets are untouched.
After materialization, 105 tracked text files differed only in CRLF/LF; each was
compared to HEAD and the preserved source, restored to exact HEAD bytes here, and
its stale index stat metadata refreshed after confirming byte identity. No asset
content was staged or committed. The strict source-boundary check stays in place.

Legacy profile qualification still fails: v595 encounters a named TypeScript export
loading error; v596 reports v596-v595-base-byte-drift:app/components/AtlasAppShell.tsx.
Those historical seals were not relaxed or regenerated. No production build,
complete typecheck, merge or deployment was performed. These failures are separate
from the passing numerical checks; they do not qualify the current release.


## S3 arithmetic localization milestone (2026-11-14)

Independent NR branch codex/s3-gauge-wave-evidence is pushed through 612bfb9.
The registered four T=0 RK inputs now isolate inverse-metric arithmetic (LU versus
adjugate) and periodic stencil arithmetic (division versus reciprocal multiplication).
Combining both in a diagnostic Python clone reproduces all 397 exported native
geometry components bitwise. Complete RHS active-slot relative maxima are
6.156e-14, 7.536e-14, 3.603e-14 and 3.013e-14, below the unchanged 1e-12 gate.
The original Python/native comparison remains failed (3.80e-12 to 5.01e-12).
All 58 native outputs remain bitwise equal to saved original-library outputs and
ordinary calls. No solver default or frozen science source was changed.
The first observer comparison failed because in-place harmonic correction preceded
the raw-output comparison; the initial report is retained and the comparison order
is fixed and covered by a regression test. This is not a solver failure repair.

Forty related tests passed; the 267-file constraint-bridge input manifest passed
without running the full experiment. Final diagnostic: 1.569 s, 67.906 MiB peak,
839139 output bytes. Raw arrays, original failures, registration and commands:
D:/SolarResearchWorkspace/nr-s3-gauge-wave/docs/GAUGE_WAVE_STAGE_DIAGNOSTIC.md.
This result covers four saved inputs only. Full frozen 8^3 alignment, the T~23.28
wave failure, external reproduction and S2-c boundedness remain open. Next numerical
step is a separately registered comparison near T=15-18. No AMR/binary evolution
or physical waveform has been validated by this milestone.


## S3 late-state and restart milestone (2026-11-14)

Independent NR branch codex/s3-gauge-wave-evidence is pushed through ad7b957;
local and remote full commit IDs were verified equal. Working directory:
D:/SolarResearchWorkspace/nr-s3-gauge-wave. No original extraction directory edits.

All twelve RK inputs constructed from the saved native T15/T18/T22 snapshots pass
the original 1e-12 active-slot RHS comparison (worst 5.403e-14). The isolated
inverse/stencil arithmetic variant reproduces all 397 geometry components bitwise;
its worst active-slot relative discrepancy is 3.772e-16. This does not erase the
original T0 gate failure or compare whole trajectories.

Four trajectories restarted from exactly the same T22 snapshot, using common
additive-slot RK4, all fail at stage2 in [23.28125,23.2890625]: native, one-ULP
native perturbation, original Python RHS and arithmetic-aligned Python RHS.
The failed inputs have max(2 ln(phi)) about 901.418, causing chi exponential
overflow. The last-valid analytic error divided by A=.1 is already about 1.926e9.
Arithmetic alignment therefore does not repair this observed restart failure.
A native timestep diagnostic at dt=1/128,1/256,1/512 also fails near T23.28 in all
cases; the half-step candidate loses reconstructed lapse positivity after a
completed step (min ln lapse about -8166), whereas the others overflow in stages.
This does not establish a continuum instability, gauge cause or full initial-value
convergence. A candidate-capture correction was verified by a rerun with identical
last-valid arrays and failure intervals; both original and corrected records remain.

Thirty-one related tests passed. Largest new measured process peak was below
84 MiB; longest job 57.49 s. All stayed inside 600 s,64 MiB output,512 MiB process
ceilings. Available RAM was 3.34-3.55 GiB on resource checks, so the full frozen
8^3 4-GiB launch gate was not crossed. Full results, code and replay commands:
D:/SolarResearchWorkspace/nr-s3-gauge-wave/docs/GAUGE_WAVE_STAGE_DIAGNOSTIC.md.

Next: register pre-T22 growing field/constraint-mode analysis and spatial
refinement from initial data before modifying a solver. S2-c boundedness, external
reproduction, full frozen 8^3, remaining Kerr classification differences, production
build/merge/deploy and real AMR/binary/waveform evolution remain open. No web code,
GPU run, production build, merge or deployment was performed in this milestone.


## S3 measured growth modes and initial-data refinement (2026-11-14)

Independent NR branch codex/s3-gauge-wave-evidence is pushed through 46c3f8143f1c4b5b3cd7f86b59796d776060692a;
local and remote HEAD were verified equal. S3 acceptance moved: observed failure
localization and reproducible resolution dependence, with no stability gate closed.

Offline analysis of saved T0/15/18/22 states now retains seven field errors,
physical constraints on evolved and analytic slices, their differences, actual
auxiliary/base derivative consistency and Parseval-checked x Fourier spectra.
At T22, chi and h error energy is about 97.745% and 98.077% Nyquist. Hamiltonian
and momentum differences from the same-grid analytic slice have L_inf about
1.01492 and .300408. This is sampled grid-scale error with constraint growth;
its cause is not established merely by observing the spectrum.

A registered native RK4 study starts each grid from analytic data (A=.1, FD4,
dt=dx/4, transverse 5x5). All three runs fail before target T24:

| nx | dt | failure interval | stage |
|---|---|---|---|
| 16 | 1/64 | [12.078125,12.09375] | 2 |
| 32 | 1/128 | [23.28125,23.2890625] | 2 |
| 64 | 1/256 | [20.8359375,20.83984375] | 2 |

The nx32 trajectory matches all four archived baseline snapshots bitwise.
At T1 the early pairwise error orders are 3.76694 and 3.96624; this does not
qualify long-time convergence. nx64 initially has lower errors but develops
large Nyquist energy earlier and fails earlier than nx32. Simply increasing
resolution did not repair the observed instability. All failed stage inputs,
last-valid states, sampled raw arrays and measured-data curves are retained.
The run took 192.240 s, peak 313.223 MiB, raw output 3739603 bytes, within
600 s / 512 MiB process / 64 MiB output. Fifty-one related tests passed.

Code, registration, results and replay commands:
D:/SolarResearchWorkspace/nr-s3-gauge-wave/docs/GAUGE_WAVE_STAGE_DIAGNOSTIC.md.
Figure: docs/gauge-stage/spatial-refinement/figures/refinement.png in that repo.
The next numerical study should isolate the high-frequency stability mechanism
with a retained baseline and controlled perturbation/dissipation variants before
changing any solver default. These results do not establish pure-gauge growth,
a continuum instability, nonlinear stability or external reproduction.

Full frozen 8^3 remains unrun below its 4-GiB available-RAM launch gate. S2-c
boundedness, independent reproduction, remaining Kerr precision/classification,
production build/merge/deploy and real AMR/binary/waveform evolution remain open.
No web runtime changes, GPU run, production build, merge or deployment were made
in this milestone; the webpage branch remains local.


## S3 controlled x-dissipation and portable CI repair (2026-11-14)

Independent NR branch pushed source/results through 46aad916894d5825060c1462421fd1fdad75d961.
Registered experiment source was clean b327fe559bc439e7f5b120fc54615e96e66e2326.
At nx32 x 5 x 5, A=.1, FD4, additive RK4 dt=1/128, target T24,
the unchanged baseline again failed in stage 2 over [23.28125,23.2890625];
all four old snapshots replay bitwise on this Windows host. Experimental
x-only KO sigma=.02/.1 both reached T24, but max analytic field error/A
remained .2399755/.2382312. Neither is a stability qualification or default change.
At common T22, h-error Nyquist absolute power was 7.729e-4 (baseline),
2.687e-12 (.02), 2.600e-33 (.1). Hamiltonian differences were 1.01492,
.000629389, .000620800. Low-mode error remains; weak dissipation still develops
increasing high-frequency power. No continuum/root-cause proof follows.
Run: 158.358 s, 315.086 MiB peak working set, 4213489 raw output bytes;
within 600 s / 512 MiB process / 64 MiB output. Actual data/plots retained in
D:/SolarResearchWorkspace/nr-s3-gauge-wave/docs/gauge-stage/dissipation/.

Repeated GitHub Actions failures were diagnosed from actual job logs. Two stale
binary64 packaging identities (README and .gitignore only) were refreshed;
frozen sources, parents, numerical thresholds and resource limits are unchanged.
Observer preservation is checked bitwise against fresh ordinary RHS on each host;
Windows archive replay stays separately recorded with the registered numeric gate.
Native scalar reconstruction now uses the actual native chi from the existing
Theta export; the old mixed NumPy/native-chi error remains reported. A negative
control checks mismatched chi explicitly. Latest local suite: 478 passed in 34.30 s.
Hosted checks must be read at the pushed commit; local tests alone are insufficient.

This advances S3 failure localization and E0 portable verification. Full frozen
8^3 is still unrun below its 4-GiB available-RAM launch gate. S2-c boundedness,
external independent reproduction, remaining Kerr precision/classification,
production build/merge/deploy and real AMR/binary/waveform evolution remain open.
Only continuation documents changed in this web worktree; it remains local.


Hosted acceptance confirmed for 46aad916894d5825060c1462421fd1fdad75d961:
https://github.com/wangyufanshuai/solar-sim-nr/actions/runs/43553737025
All three jobs succeeded. Windows: 478 tests / 56.95 s. Ubuntu: 476 tests /
33.92 s, retaining the two pre-existing deselections documented in the workflow;
no new test was skipped. C++ component controls passed. Both operating systems
also recomputed the full portable continuum bridge successfully (exit_code=0).
The source branch and remote HEAD match, and the independent NR working tree is
clean. Earlier failed runs remain in history. This confirms the portable CI repair;
it does not execute full frozen 8^3, prove stability, or constitute independent
external reproduction. NR output receipt: outputs/ci-verification.json (local).


## S3 fixed-dissipation refinement and E0 failure diagnosis (2026-11-14)

S3 measured finite-horizon resolution improvement at fixed x-only KO sigma=.1.
Registered evolution source ad67e121f1d73e73cfdd6ac9507eb0d2350c16c1 was clean
at launch. Independent analytic initial data, nx16/32/64 x 5 x 5, FD4 and
canonical-slot RK4 dt=dx/4 all reached T24. Maximum seven-field analytic
error/A at T24 was 7.49019790 / .238231229 / .0144374880. The fine-pair
observed order was 4.04447; early T1 orders were 3.75788 / 3.96439. All 25
nx32 states replay the earlier sigma=.1 trajectory bitwise on this host.
Hamiltonian-difference fine-pair order at T24 was only 3.14084. These are
joint space/time finite-horizon diagnostics, not separated orders, external
reproduction, nonlinear stability or qualification of the original solver.
Neither the default RHS nor the frozen 8^3 contract was modified.

Run: 296.241 s, 331.035 MiB peak working set, 4681951 raw bytes. Local portable
suite: 483 passed in 33.13 s. Source/results commit 5240972 in the independent
NR repository. Data and actual-data plot: docs/gauge-stage/dissipation-refinement/.
Next S3 study should isolate timestep error at fixed grid before extending
the horizon with unchanged sigma.

E0: corrected the generic build runner's catch handler to preserve the failed
Next exit code; previously overwriting it with 1 made the existing code-134
heap-maximum classification unreachable. node --check passed; no actual OOM
build or successful production build was run to qualify the correction.
On Node 24.22.1, direct native TypeScript profile import succeeded, whereas
--import tsx reproduced the v595 named-export error. Direct node --test then
advanced to the unchanged historical seal failure:
v595-v594-base-byte-drift:app/AtlasRuntimeWorkbench.tsx. Do not regenerate or
relax that seal. v596's historical seal blocker is also still open.

Preflight snapshot: 1.69 GiB available RAM, C free 7.35 GiB, D free 78.75 GiB.
Full frozen 8^3 and production build were not launched. S2-c boundedness,
remaining Kerr classifications, merge/deployment and real AMR/binary/waveform
evolution remain open. Web runtime visuals and scientific defaults unchanged.


## S5 controlled Kerr step-scale sweep (2026-11-14)

On the same RTX 4060 and 128x128 four-camera validation, `MAX_STEPS=8000`
with step scale `.03` produced zero classification mismatches and zero exhausted
rays for all four cameras, including `a=.99`, inclination 85 degrees. Extreme
spin compared 4474 disk pixels; maximum redshift relative error was
5.262759233983887e-05 and emission-radius relative error 4.578224715287766e-04.
A `.02` control removed the three captured-to-disk mismatches but introduced one
disk-to-max-steps ray, so `.03` is the useful validation candidate. The
interactive default remains `.04` pending visual/performance review; this
candidate has not been promoted to production.

The raw records are `docs/s4/kerr-extreme-step02.json` and
`docs/s4/kerr-extreme-step03.json`. The Kerr reference test file passed 9/9.


## S3 fixed-grid timestep study: resource stop and partial evidence (2026-11-14)

Registered evolution source a5345ceb88e120945e93b5f8e072c58e5ad5149f, clean
at launch; retained results commit 9e9a0e2 in the independent NR branch.
At nx32 x 5 x 5, A=.1, FD4, fixed x-only KO sigma=.1, dt=1/128 and
1/256 reached T24. dt=1/512 stopped at T14: sampled peak working set
513.828125 MiB exceeded the registered 512-MiB ceiling. Time 318.567 s;
raw output 3698091 bytes. This is RESOURCE_STOPPED, not within all resource
limits or a completed T24 qualification. No automatic rerun or ceiling change.

A fresh offline analysis retained the original result.json byte-for-byte and
used common integer T1..14 samples only. h/Gamma/Theta L_inf self-convergence
orders span 3.98469..4.01735. At T14 the maximum field error/A is
.0993077659/.0992314419/.0992265007. Conditional finest RK4 estimates are
about 4e-6 of the total analytic error in these fields. A direct physical-state
reconstruction cross-check exactly matched all reported pairwise L_inf norms.
All 25 coarse samples replay the previous sigma=.1 archive bitwise here.
This supports small time-truncation error relative to fixed-grid residuals
on the measured interval, not a unique spatial cause, undamped solver repair,
long-time stability or external reproduction. T24 three-path data are missing.

Original arrays, result, offline analysis and actual-data graph are retained
under docs/gauge-stage/dissipation-timestep/ in the NR repository. Local complete
suite: 489 passed in 41.58 s. The next run requires investigating the measured
working-set behavior first. Full frozen 8^3 still awaits its unchanged 4-GiB
launch gate; webpage production build/merge/deploy remain unqualified.


## E0 seal-drift diagnostic (2026-11-14)

The v595 standalone preflight still stops before build invocation. The diagnostic
now reports both sealed and current identities without changing the acceptance
rule:

- `app/AtlasRuntimeWorkbench.tsx`: expected 22223 bytes,
  `c85de245c28c9cea726df56138f92ad9f37b8094e77c0c75c0eebf104e729c2d`; current
  22210 bytes, `9817b938c871b6404a5543034ff54bc6750400e605d106e5e9aa52e556824259`.
- The next v594 base file, `app/components/AtlasAppShell.tsx`, is expected to
  be 6811 bytes, `d9b0367752046975550118d74b072282d7c4aad60fc5357ee257128195119103`;
  the current worktree is 8962 bytes,
  `52afb04e28fb2b87b0251d4727aeb3d130d85a387175d5bc0a2f42a55692eace`.

`node --check` passes for both source-manifest builders. The build remains
blocked before Next compilation; no seal was regenerated, no parent file was
reclassified as a v595 delta, and no deployment was attempted. To unblock E0,
restore the exact v594 source snapshot or create a separately registered current
candidate; both require an explicit source/authority decision.


The lightweight v595/v596 source-path tests pass 6/8. The two failures are
pre-existing missing reserved tmp inputs (`tmp/v595-browser-evidence-contract.mjs`
and `tmp/v596-build-checkpoint-human-decision.mjs`), before any Next build; no
source-manifest assertion was weakened.


## E0 historical recovery search (2026-11-14)

A read-only search covered the current worktree, configured worktrees,
`D:\SolarResearchWorkspace` and available Git refs/tags. The v595 parent
`app/components/AtlasAppShell.tsx` identity (8120 bytes,
7d7e386794077f3c497c91a8b4c23ae6a9e97aaa4277a8afb4607600952a8ba7) is present
in Git commit `af61a2f4`, but the v594 parent
`app/AtlasRuntimeWorkbench.tsx` identity (22223 bytes,
c85de245c28c9cea726df56138f92ad9f37b8094e77c0c75c0eebf104e729c2d) is absent
from all available refs and searched recovery roots. The current 22210-byte
file is the only available Workbench source and has SHA-256
9817b938c871b6404a5543034ff54bc6750400e605d106e5e9aa52e556824259.

Therefore the sealed v594 source snapshot cannot be reconstructed from the
current local history alone. Restoring only AtlasAppShell would still leave
v594 Workbench drift and would mutate the current worktree without completing
the parent identity. E0 remains blocked on obtaining the exact historical
snapshot or explicitly registering a new current candidate; no source file was
replaced and no seal was regenerated.


## S5 visual check for Kerr step-scale candidate (2026-11-14)

Existing same-camera 128x128 screenshots at validation step scales .02 and .03
were compared offline. Extreme a=.99/i=85 changed 40 pixels with mean absolute
RGBA difference .00902; the other cameras changed 45/52/71 pixels with means
.00072/.00093/.00276. Visual inspection found the same disk and lensing
composition. The .03 candidate remains validation-only; interactive .04 is
unchanged pending performance review.


## E0 historical receipt audit (2026-11-14)

The repository contains historical receipts recording passed v594 standalone/lite
builds and passed v595 standalone/lite builds. v594 is bound to source manifest
`6599398a6fab78a1367b234d3a3e9ed428027879a1df4838f76b97ff279b981f`; v595 is
bound to source manifest `e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186`.
Their build IDs and deployment IDs are content-addressed to those historical
identities. No corresponding `.next-atlas-v594` or `.next-atlas-v595` build
output is present in this worktree, so the receipts prove historical runs only;
they cannot qualify a fresh build from the current source. The current preflight
still fails at v594 parent byte drift before Next compilation. No deployment or
receipt reuse was performed.
