## Code Review Request

Mode: headless code review.
{{#if repository}}

Repository: `{{repository}}` — distinct from the session cwd; the reviewer MUST execute VCS commands inside it and resolve `read` paths relative to it.
{{/if}}

Distribution: Invoke `task` using a `tasks` array. Specify `agent: "reviewer"` inside the `tasks[]` entry (`tasks[].agent`), never at the top level and never omitted. Spawn exactly **1 reviewer task** covering recent code changes.

{{#if focus}}
Focus: {{focus}}
{{/if}}
