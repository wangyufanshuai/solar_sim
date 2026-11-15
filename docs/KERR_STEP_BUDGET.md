# S5 Kerr extreme-spin step-budget investigation

Acceptance moved: preserve float64 reference errors while reducing unfinished GPU rays.
Same RTX 4060, 128 x 128 camera, a=0.99, inclination 85 degrees, D=40, stepScale=0.04.
The original 4000-step shader ceiling prevented a larger requested budget from taking effect.
The ceiling is now 8000; interactive defaults retain their existing runtime budget.

| requested / actual ceiling | exhausted | classification agreement | maximum redshift relative error | maximum emission-radius relative error |
| --- | --- | --- | --- | --- |
| 4000 / 4000 | 1 | 0.999755859375 | 3.516806245e-5 | 6.776654622e-6 |
| 8000 / 8000 | 0 | 0.99981689453125 | 3.757902054e-4 | 3.317360618e-3 |

The previously unfinished ray at readback pixel (55,68) is now classified as disk, consistent
with the adaptive float64 reference. It adds a more difficult ray to the error sample, so the
maximum measured errors increase. Three captured-to-disk disagreements remain at (80,68),
(80,69), (81,69). Removing budget exhaustion is not a complete precision acceptance.
The CPU reference itself reports maximum Hamiltonian residual 4.09e-5 over this image;
that finite reference accuracy must also remain visible.

Raw records: s4/kerr-extreme-before.json and s4/kerr-extreme-after.json.
Same-camera actual render screenshots: screenshots/kerr-step-budget/.
The old validation records have been preserved.

Reproduce with MAX_STEPS=4000 or 8000, CONFIG=a0.99-i85, N=128, STEP=0.04,
PW_CHANNEL=chrome, and distinct OUT_FILE / SCREENSHOT_DIR destinations:

    node node_modules/tsx/dist/cli.mjs scripts/kerr-v4/validate.mts

kerrReference.test.ts: 9 tests passed on 2026-11-14 (local date).


## Controlled step-scale sweep (2026-11-14)

A validation-only sweep kept the same RTX 4060, 128x128 cameras, spin and
inclination, `MAX_STEPS=8000`, and shader source. Only the requested validation
step scale changed. The interactive renderer default remains `0.04`.

| step scale | a0.9-i75 | a0-i60 | a0.99-i85 | a-0.6-i45 |
|---|---:|---:|---:|---:|
| 0.02 | 1.000000, no exhaustion | 1.000000, no exhaustion | 0.9999389648, one `disk->max-steps` | 1.000000, no exhaustion |
| 0.03 | 1.000000, no exhaustion | 1.000000, no exhaustion | 1.000000, no exhaustion | 1.000000, no exhaustion |

At `0.03`, the extreme-spin case compared 4,474 disk pixels, had no GPU
budget exhaustion or classification mismatch, redshift relative error maximum
`5.262759233983887e-05`, and emission-radius relative error maximum
`4.578224715287766e-04`. The other three cameras also had zero mismatches.
The corresponding raw record is `s4/kerr-extreme-step03.json`; the `0.02`
control is `s4/kerr-extreme-step02.json`.

This isolates a useful validation candidate: reducing the validation step scale
from `0.04` to `0.03` removes the three `captured->disk` disagreements without
raising the 8000-step ceiling. It is not promoted to the interactive default,
because that would change runtime cost and needs a same-camera visual/performance
review. The 8000-step ceiling remains the current validated budget boundary.
The CPU reference still reports finite maximum Hamiltonian residuals, so this
result is a GPU-vs-reference classification result, not a proof of continuum
accuracy.


## Same-camera visual check for step scale .03 (2026-11-14)

The existing 128x128 RTX 4060 screenshots for step scales .02 and .03 were
compared without rerendering. All four camera pairs have identical dimensions.
For a0.99-i85, only 40 pixels changed and the mean absolute RGBA channel
difference was 0.00902; a0.9-i75 changed 45 pixels (mean 0.00072), a0-i60
52 pixels (0.00093), and a-0.6-i45 71 pixels (0.00276). The extreme-spin
pair was visually inspected and remains the same black-hole/disk composition.
The `.03` candidate therefore has no observed broad visual regression in this
controlled pairwise check. This does not authorize changing the `.04`
interactive default or establish a production performance budget.
