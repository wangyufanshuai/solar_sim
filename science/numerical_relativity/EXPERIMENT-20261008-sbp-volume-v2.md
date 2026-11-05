# Nonlinear SBP volume: explicit legacy-fixture repair

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective repair before curved experiment execution
- Origin Date: 2026-10-08
- Verification Status: NOT EXECUTED
- Version Label: nr-nonlinear-sbp-volume-v2

The original protocol `EXPERIMENT-20261008-sbp-volume.md` remains unchanged,
SHA256 `7dbfb75490a40d8ff6579afe94be4c9c2919f60c93ae481e2d33d8c622586bd6`.
All its physical equations, source-transition paths, curved/flat/principal
experiments, scientific thresholds, storage and time caps remain in force.

The v1 attempt stopped during the legacy fixture loop: the analytic gauge-wave
constructor correctly rejected a nonperiodic Sommerfeld grid. Its receipt is
`tmp/nr-shadow-evidence/nr-k3-sbp-volume-v1-20261008/receipt.json`, SHA256
`f0c13f0e90ec3cfca14fd769fd1c771bb03d8eea2d66550a9ff1041b61576a93`.
It has completed=false and volume_gate_passed=false, with no completed legacy
matrix and no curved cases. Preserve it and all267 source snapshots. Do not
regrade it. No scientific convergence values were obtained from that attempt.

Only the Sommerfeld legacy-equivalence input changes: start with Minkowski
on the actual endpoint-inclusive N9 grid and set smooth finite lapse, chi,
shift and diagonal A perturbations. It is explicitly a synthetic rollback
fixture, not an analytic gauge-wave solution or physical boundary benchmark.
Periodic cases still use the existing analytic gauge-wave constructor;
Schwarzschild still uses the unchanged analytic exterior initial state.
Both archived and new RHS receive precisely the same input and parameters.
RHS and two-step RK comparisons remain byte-exact.

The runner records this retained failure and the original protocol hashes,
checks the failure receipt/snapshots, adds this amendment to its source set,
and has a direct nonperiodic-fixture regression. All curved and amplitude
experiments are frozen BEFORE this first successful construction attempt.

Entry: `D:/python/python.exe -B scripts/run-nr-k3-sbp-volume.py
--output-directory tmp/nr-shadow-evidence/nr-k3-sbp-volume-v2-20261008`.
Replay: a fresh `nr-k3-sbp-volume-replay-v2-20261008` directory. No overwrites.
All physical/live flags remain false; no volume-only time evolution is added.
