# Orbit Atlas v592 governance

v592 is an additive Living Universe candidate at `/local-shadow-v592`. It
consumes the qualified v591 visual candidate as an exact-byte, read-only
dependency and does not change formal product v263 or any scientific authority.

Current phase:

- `CelestialClockV592` resolves UTC, Julian Date and J2000 from an absolute
  anchor and supports pause, forward rates and deterministic reverse time.
- The local exact-byte NASA/JPL NAIF `pck00011.tpc` admits 14 of the 16 existing
  Hero bodies for absolute IAU linear pole/prime-meridian orientation.
- JPL SBDB pole and rotation-period metadata completes deterministic spin
  kinematics for Bennu and Kleopatra. Their v591 model-native X axis defines a
  disclosed derived W0 at J2000; both remain `rotation-authority-incomplete`
  for absolute physical prime meridian, and no guessed W0 is claimed.
- The Sun receives a bounded differential-rotation presentation model on v592
  only. It is not an observed surface map and writes no scientific payload.
- A 24-object stellar Hero packet is bound to the existing Gaia 46K catalog.
  Exact positional crossmatches and render-only anchors are distinguished; the
  close-up photospheres are explicit physics shaders, never observation maps.
- The failed single-request NAIF network acquisition is retained as negative
  evidence. An existing locally cached exact-byte PCK is used instead and is
  locked by SHA.

P0/P1 commands:

```text
node scripts/build-v592-rotation-packet.mjs
node scripts/build-v592-living-universe-candidate.mjs
npx vitest run app/lib/celestialClockV592.test.ts app/lib/celestialRotationV592.test.ts --exclude tmp/** --exclude **/.next*/**
```

No Git operation, deployment, dense/GPU science, scientific payload download,
production pointer migration or public release is authorized by v592.
