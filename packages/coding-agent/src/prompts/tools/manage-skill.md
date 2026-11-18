Managed skill: `SKILL.md` stored separately in `~/.omp/agent/managed-skills` and exposed as a standard skill in subsequent sessions.

Intended for repeatable procedures worth saving — setup steps, debugging workflows, or repo-specific routines.
User-authored skills remain separate; this tool NEVER modifies them.

- `action: "create"` — errors if the skill already exists.
- `action: "update"` — replaces the body; errors if the skill does not exist.
- `action: "delete"` — errors if the skill does not exist.

`name`: kebab-case (lowercase letters, digits, hyphens).
`description`: concrete and clear; controls skill matching.
Omit frontmatter from `body`; it is synthesized from `name` and `description`.
