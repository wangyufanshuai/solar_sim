# Source-only snapshot of next-web — post-freeze A3/A4

Generated 2026-11-09 from local commit `48239d572b19477565ff1c222f62db17b2407cf1` (branch codex/solar-sim-mainline-a). The local
history contains data files over GitHub's 100 MB limit, so this commit is a source-only
snapshot whose parent is the v1.0-freeze snapshot (095a6dc).

Contents since v1.0-freeze (separate post-freeze projects, see docs/ROADMAP.md): A3 nebula
parallax layers; A4 shared sky basis, steadier sky focus turns, separate constellation line
and boundary switches.

Excluded asset directories (Gaia catalogues, textures, models, ephemerides, bundled
runtimes; needed at runtime and shipped separately):

- tools/asset-cache, tools/science-cache, tools/ktx
- public/textures, public/data, public/atlas-lite, public/models, public/vendor
- dist/content-packs, dist/release-exports
- source-cache, src-tauri/server, src-tauri/runtime
