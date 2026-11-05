<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project working rules (Orbit Atlas roadmap, 2026-11)

1. Do not create new files or routes with version suffixes (`V###`, `v4xx`). Edit the existing file; history lives in Git. Commit after each finished milestone.
2. Every task maps to a roadmap item (E0, A1–A5, S1–S5) and states which acceptance criterion it moves.
3. New governance / evidence / authority / provenance code may not exceed 20% of the code added in an iteration.
4. Visual changes ship with before/after screenshots from the same camera; physics changes ship with the error against a reference solution.
5. Never substitute pre-rendered or AI-generated images for rendered output.
6. Code comments must describe the algorithm actually implemented; approximations are labelled as approximations.
7. Check free disk space before large experiments; keep only the current and previous build output.
8. Relativistic rendering lives in `app/lib/kerr-v4/`; it is validated by `kerrReference.test.ts` and `scripts/kerr-v4/validate.mts` — keep both passing.
