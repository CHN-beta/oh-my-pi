{{#if asyncEnabled}}
{{#if batchEnabled}}
Launch `tasks[]` in parallel; IDs return immediately.
{{else}}
Launch a single agent; its ID returns immediately.
{{/if}}
{{#if hasBlockingAgents}}
BLOCKING agents return their output inline.
{{/if}}
{{else}}
{{#if batchEnabled}}
Execute `tasks[]` synchronously.
{{else}}
Execute a single agent synchronously.
{{/if}}
{{/if}}
{{#if asyncEnabled}}
{{#ifAny structured hasStructuredAgents}}

# Results
{{#if structured}}`outputSchema`{{else}}STRUCTURED agents'{{/if}} parsed JSON payload (even when invalid): `agent://<id>` (field `/<field>`, nested `/reports/0/data`); invalid payload preview appears inline.
{{/ifAny}}

{{asyncGuidance}}
{{/if}}

# Inputs
- `agent`: pick the most specific agent{{#if batchEnabled}}, set inside each `tasks[]` entry and NEVER at the top level{{/if}}.
  - Leave unset only for the default (`{{defaultAgent}}`); NEVER specify its name explicitly.
{{#if scoutAvailable}}
  - Read-only exploration MUST select `scout`, and only when target files are unknown.
{{/if}}
  - Favor assigning one agent to both investigate and edit.
{{#if batchEnabled}}
- `context`: shared background (`# Goal`, `# Contract` interfaces); NEVER duplicate across tasks.
{{/if}}
{{#if steps}}
- `steps`: sequential phases for a single agent; each phase is dispatched only after the prior phase completes. Earlier phases deliver progress notices; the final phase yields the result.
  - First step specifies `# Target` files and non-goals{{#if batchEnabled}} not already in `context`{{/if}}.
  - Each step defines one `# Change` phase.
  - Final step includes `# Acceptance` observable verification criteria.
  - Subagents start with blank context;{{#if ircEnabled}} parent IRC messages steer immediately;{{/if}} pass large payloads via `local://<path>`, NEVER inline.
  - Unrelated work → split into independent tasks.
{{else}}
- `task`: self-contained prompt (`# Target` files/non-goals, `# Change` steps/APIs, `# Acceptance` observable outcome).
  - Subagents start with blank context;{{#if ircEnabled}} parent IRC messages steer immediately;{{/if}} pass large payloads via `local://<path>`, NEVER inline.
{{/if}}
- `name`: CamelCase identifier ≤32 chars, auto-assigned if omitted; used to address the agent.{{#if structured}} `outputSchema` overrides agent/session schemas.{{/if}}
- `solutionSpace`: describes how open-ended the subagent's task is: whether the fix/design is fixed or which causes/designs remain open.
  - Sheer work size does not widen it; NEVER mention sibling agents or coordination.
  - Examples: `one fix: rename, names given`; `one fix: slice end in paginate`; `single-flight cache load; races easy to miss`;
    `several retry API shapes; error classes to choose`; `deadlock cause open, no repro`
{{#if evalToolsEnabled}}
- `tools`: custom eval-defined tools executed in your kernel.
{{/if}}
{{#if effortEnabled}}
- `effort`: `"lo"`|`"med"`|`"hi"` matching how open-ended the problem is.
{{/if}}
- `model`: optional model for this spawn{{#if batchEnabled}}; set per `tasks[]` entry{{/if}}. Accepts any selector: `provider/model-id`, a bare model id, a role alias, or `model-id:level`, with an optional `@upstream` pin for aggregators (`provider/model-id@upstream:level`). It overrides the agent definition and any `task.agentModelOverrides` entry.
- `thinkingLevel`: optional `"off"`|`"minimal"`|`"low"`|`"medium"`|`"high"`|`"xhigh"`|`"max"` for this spawn{{#if batchEnabled}}; set per `tasks[]` entry{{/if}}. It overrides the agent's level, a `:level` suffix on `model`, and `task.maxEffort`.
  - If the requested model cannot be resolved → stop and report it; NEVER substitute another silently.
{{#if structured}}
- `schemaMode`: permissive (default) warns after retries; strict fails immediately.
{{/if}}
{{#if isolationEnabled}}
{{#if applyIsolatedChanges}}
- `isolated`: runs in a git worktree; successful changes merge back into the parent.
{{else}}
- `isolated`: runs in a git worktree; changes are preserved without applying to parent.
{{/if}}
{{/if}}

Shared-file edits require a single integration owner; assign distinct files{{#unless batchEnabled}} and interfaces{{/unless}} per task.
All tasks MUST skip build/lint/test/formatter runs mid-flight; execute verification once afterward.

# Available Agents
{{#if spawningDisabled}}Agent spawning is currently disabled.
{{else}}{{#if hasModelMentions}}`m<N>` = user-tagged model (`<model agent="m<N>" name="…"/>`), not a specialist; spawn only when explicitly named by the user.
{{/if}}{{#list agents join=""}}- `{{name}}`{{#if readOnly}} (read-only, no edits){{/if}}{{#if blocking}} (BLOCKING; inline result){{/if}}{{#if structured}} (STRUCTURED; schema result){{/if}}: {{description}}
{{/list}}{{/if}}
