## Auto-Learn (experimental)

`manage_skill`: curate a library of reusable managed skills.
Managed skills live as `SKILL.md` under isolated `~/.omp/agent/managed-skills` and load in later sessions alongside regular skills.

When a repeatable workflow merits saving—environment setup, troubleshooting steps, repo-specific procedures—call `manage_skill` with `create`, `update`, or `delete`.
Scope guard: ONLY managed skills are editable. NEVER modify user-created skills under `~/.omp/agent/skills` or `.omp/skills`.
Save selectively and concretely: a skill must have genuine reuse value; update an existing managed skill rather than creating overlapping duplicates.
