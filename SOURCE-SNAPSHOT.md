# Source-only snapshot of next-web — v1.0-freeze

Generated 2026-11-08 from local commit `1e8eef18e4fe2fffeff6a7c9232340fa4827eedd` (annotated tag v1.0-freeze, branch
codex/solar-sim-mainline-a). The local history contains data files over GitHub's 100 MB
limit, so this commit is a source-only snapshot whose parent is the previous snapshot
(9cd43ad, 2026-11-05). The tag v1.0-freeze in this repository points here.

Excluded asset directories (Gaia catalogues, textures, models, ephemerides, bundled
runtimes, about 5.7 GB; needed at runtime and shipped separately):

- tools/asset-cache, tools/science-cache, tools/ktx
- public/textures, public/data, public/atlas-lite, public/models, public/vendor
- dist/content-packs, dist/release-exports
- source-cache, src-tauri/server, src-tauri/runtime

No file over 20 MB is included. Freeze rule and scope: docs/ROADMAP.md.
