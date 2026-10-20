Starts persistent conversational coding-agent worker session (edit, bash, grep, everything).

CLI slot by domain — the slots are specializations, not capability tiers:
- `doc`: writing, documentation, source research, reports, correspondence.
- `code`: implementation, refactors, debugging, build and test work.
- `math`: derivations, formal proofs, unit/dimension checks, numerical verification.

Each slot runs the agent definition named `doc`/`code`/`math` (project `.omp/agents/` or user `~/.omp/agent/agents/`), so its model, prompt and tools come from that definition.

`prompt`: first session instruction. Worker starts with NO context beyond it; include files, constraints, acceptance criteria.
`name`: optional session label; otherwise generated.

Returns session id immediately. On worker completion, turn result—activity trace + worker response—delivered automatically. Do not wait unless blocked; direct other sessions.

Session persists after turn; remembers whole conversation. Same-workstream follow-up: `vibe_send`; NEVER spawn second session.
