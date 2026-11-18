Launches a persistent conversational coding-agent worker session (with edit, bash, grep, and full tool access).

CLI slot by domain — the slots are specializations, not capability tiers:
- `doc`: writing, documentation, source research, reports, correspondence.
- `code`: feature implementation, business logic, refactors, build and test work.
- `debug`: root-cause debugging, failure diagnosis, race/crash investigation, code and security audit.
- `design`: system architecture, API/schema contracts, migration plans, frontend/UI design.
- `math`: derivations, formal proofs, unit/dimension checks, numerical verification.
- `exec`: operational execution — running explicit, well-defined commands and operations such as checking git status/diff and committing, running routine scripts/commands, and mechanical file/repo operations.

Each slot runs the agent definition named `doc`/`code`/`debug`/`design`/`math`/`exec` (project `.omp/agents/` or user `~/.omp/agent/agents/`), so its model, prompt and tools come from that definition.

`prompt`: initial instruction for the session. The worker starts with NO prior context beyond this prompt, so specify files, constraints, and acceptance criteria.
`name`: optional session label; auto-generated if omitted.

Returns the session ID right away. When the worker finishes, its turn output—activity trace plus worker response—arrives automatically. Do not block waiting unless idle; manage other sessions in parallel.

The session stays alive after each turn and retains its full conversation history. For follow-ups on the same workstream, use `vibe_send`; NEVER launch a duplicate session.
