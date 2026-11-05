# Runner supervision fault controls (not a physics experiment)

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: user-approved repair of unfrozen runner code and one independent fault batch
- Origin Date: 2026-10-13
- Verification Status: PREREGISTERED BEFORE EXECUTION
- Version Label: nr-runner-guard-controls-v1

## Fixed scope

Repair only the unqualified energy runner and its new stdlib supervisor. Do not
change any of the 501 frozen parent sources, their source snapshots or receipts.
The three new mathematical/test files have pinned hashes in the control runner
and must also remain unchanged. The energy candidate is NOT run this round.
No N9/N13, integration, native binary, GPU, live dynamics, art or payload writes.
Original 100 energy + 52 longitudinal tests and all physical thresholds remain
unchanged and unexecuted by this batch. Local runner safety is not science.

## Mechanism and acceptance

The stdlib supervisor is a separate process from the scientific worker. A
pipe-gated bootstrap cannot start the requested work before Windows Job Object
assignment. The Job Object has kill-on-close, no breakaway, and owns descendants.
The outer monitor polls elapsed time, output size and the original disk floors
throughout tests, exact replay and worker integrity checks. Interruptions include
KeyboardInterrupt and SystemExit. Assignment failure must never release work.
Cleanup must report zero owned active processes; unrelated processes are not
selected by image name or broad PID searches.

Before any work, allocate two dense 1 MiB slots, flush them, and verify allocated
storage (including disabling inherited compression only on these new files).
The canonical terminal is updated in place without creating/truncating a file
or re-running the ordinary disk-floor guard. Its prepared twin stays incomplete.
Checksums and run identity are verified on readback. Corrupt or wrong-run
canonical data fall back to incomplete, never to success. Oversized final
metadata becomes a compact failure. Failures before reservation can leave no
finished terminal, but launch no worker. Power loss, forced supervisor death,
filesystem corruption or I/O failure do NOT guarantee a final receipt; valid
prepared data can only establish incomplete status. This is not a security
sandbox, OS quota or hard-real-time guarantee. Monitor overshoot and bounded
cleanup may extend wall time; neither is permission for continued computation.

Register exactly **44 tests**, all in `scripts/tests/test_nr_owned_control.py`:
original limits, invalid limits, prospective C/E floors, active deadline/cap/floors,
path/reparse isolation, full-size physical terminal allocation and low-space
finalization, torn/checksum/wrong-run fallback, oversize refusal, exact inventory
exclusion, real Windows job success/nonzero exit, a stalled dummy replay,
KeyboardInterrupt/SystemExit with descendants, low-space stop receipts,
assignment failure, verification failure, compact failure, outliving descendant
cleanup, survival of an unrelated synthetic process, pre-release interruption,
preparation failure, existing-directory refusal, stdlib-only energy entry,
whole-worker delegation and rejection of unsupervised scientific imports.

Fake disk probes are injected only into nested test instances; the outer batch
retains real disk probes and original limits. Dummy processes sleep at most
30 seconds, perform no physics and write only tiny readiness receipts. Nested
fixtures use smaller 2 MiB caps and 64 KiB terminal slots to stay inside the
unchanged outer budget. One test exercises the full production 1 MiB slots.
Every successful/failed fixture checks persistent terminal recovery and owned
cleanup. The unrelated synthetic fixture is terminated through its own process
handle by the test that created it. No user process is selected or stopped.

## Single batch and immutable evidence

Entry: `D:/python/python.exe -B scripts/run-nr-k3-runner-guard-controls.py`
with fresh output `tmp/nr-shadow-evidence/nr-k3-runner-guard-controls-v1-20261013`.
Total 64 MiB / 600 seconds, original 2 MiB finalization headroom, no automatic
retry; stop at first failed test. C >= 3 GiB; E >= 4 GiB + 32 MiB plus prospective
64 MiB at startup. Python -B, one BLAS/OMP/MKL thread, E TEMP/TMP. Snapshot cap
8 MiB. No installs, cleanup, original test replay or time evolution.

Pin longitudinal parent gate
`ffb93ab382da9d28019586e0e3b674ca414c1a4b577c261bdf3ee74f3461438a`.
Read-only validation checks all indexed parent artifacts and the 501 current
and frozen source identities before and after the batch. Snapshot those 501 plus
10 candidate/control files = **511 sources**. Save exact XML, logs, nested fault
receipts, attempt, source snapshot, final indexed artifacts and sealed terminal.
Admission requires 44/44 with no failures/errors/skips, unchanged identities,
verified cleanup and successful supervisor readback. All science/live gates stay
false, including fixed-projector energy qualification.

## Primary platform references

- [Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects): descendant ownership, nested jobs and kill-on-close.
- [AssignProcessToJobObject](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-assignprocesstojobobject): assignment requirements.
- [FILE_STANDARD_INFO](https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_standard_info): allocated and logical file sizes.
- [Compression state](https://learn.microsoft.com/en-us/windows/win32/fileio/compression-state): inherited compression and explicit file control.

These references describe the OS contract, not proof that this implementation
passes its controls. Results must be recorded separately after the one batch.
