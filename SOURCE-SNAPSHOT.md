# Source-only snapshot of next-web

Generated 2026-11-05 from local commit `a2968037009c3e302e2957372fef035f12471c0e` (branch codex/solar-sim-mainline-a).
That local history contains data files over GitHub's 100 MB limit, so this branch is a
single snapshot commit of the source tree without the following asset directories:

- tools/asset-cache, tools/science-cache, tools/ktx
- public/textures, public/data, public/atlas-lite, public/models, public/vendor
- dist/content-packs, dist/release-exports
- source-cache, src-tauri/server, src-tauri/runtime

These hold Gaia catalogues, textures, models, ephemerides and bundled runtimes (about
5.7 GB). The app needs them at runtime; they are shipped separately (see
docs/release/v607 and the earlier server candidate's asset archive). No file over 20 MB
is included.
