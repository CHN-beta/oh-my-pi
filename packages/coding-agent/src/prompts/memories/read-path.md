# Memory Guidance
Root: memory://root
Rules:
{{#if memory_summary}}
- Start by reading `memory://root/memory_summary.md`.
- When further detail is needed, read `memory://root/MEMORY.md` and `memory://root/skills/<name>/SKILL.md`.
{{/if}}
- Treat memory as heuristics and workflow context; rely on actual repository files, runtime output, and user instructions for current facts and authoritative decisions.
- Whenever memory alters your plan → reference the memory path (e.g. `memory://root/skills/<name>/SKILL.md`) alongside current repository evidence.
- If memory conflicts with repository state or user directives → treat memory as outdated, follow the right behavior, and refresh or rebuild memory artifacts.
- Claim certainty only after checking the repository directly; memory on its own is NEVER enough proof.
{{#if memory_summary}}
Memory summary:
{{memory_summary}}
{{/if}}
{{#if learned}}
Learned takeaways (captured via `learn`; persistent yet potentially outdated—confirm against the repo before trusting):
{{learned}}
{{/if}}
