```
{{#if py}}
agent(prompt, *, agent?="{{spawnDefaultAgent}}", label?=None, schema?=None, schema_mode?=None, isolated?=None, apply?=None, merge?=None{{#if evalTools}}, tools?=None{{/if}}{{#if perCallModel}}, model?=None{{/if}}) → AgentHandle
{{else}}
await agent(prompt, { agent?, label?, schema?, schemaMode?, isolated?, apply?, merge?{{#if evalTools}}, tools?{{/if}}{{#if perCallModel}}, model?{{/if}} }) → AgentHandle
{{/if}}
  Launches a background subagent and returns immediately.
  - `agent` picks a discovered agent definition; omit to use `{{spawnDefaultAgent}}`.{{#if spawnAllowedAgentsText}} Allowed agents: {{spawnAllowedAgentsText}}.{{/if}}
  - Handle API: `.id`, `.handle` ("agent://<id>"), {{#if py}}`.status`{{else}}`.status()`{{/if}}, `.done()`, `.wait(timeout?)` → final text (parsed via `schema`),
    `.send(message)`, `.cancel()`, `.output()`.
  - Unawaited agent results deliver automatically like async jobs.
{{#if perCallModel}}
  - `model`: optional model for this invocation. Accepts `provider/model-id`, a bare model id, a role alias, or `model-id:level`, with an optional `@upstream` pin for aggregators. It overrides the agent definition and `task.agentModelOverrides`.
  - `thinkingLevel`: optional `"off"`|`"minimal"`|`"low"`|`"medium"`|`"high"`|`"xhigh"`|`"max"`; overrides the agent's level and any `:level` suffix on `model`.
    - If the requested model cannot be resolved → stop and report it; NEVER substitute another silently.
{{/if}}
  - `schema` takes precedence over agent and session schemas.
  - `{{#if py}}schema_mode{{else}}schemaMode{{/if}}`: "permissive" warns after retries, "strict" fails; if omitted → session setting, defaulting to "permissive".
  - `isolated` executes inside a git worktree (requires `task.isolation.enabled`).
  - `{{#if py}}apply=False{{else}}apply: false{{/if}}` retains changes as patch/branch artifacts rather than merging them.
  - `{{#if py}}merge=False{{else}}merge: false{{/if}}` enforces patch mode; otherwise `task.isolation.merge` controls behavior.
{{#if evalTools}}
  - `tools`: names of custom tools registered via {{#ifAll py js}}`@tool` / `tool(fn)`{{else}}{{#if py}}`@tool`{{else}}`tool(fn)`{{/if}}{{/ifAll}} exposed to the child.
{{/if}}
{{#ifAll py js}}
  - Python: invoke synchronously without `await`; `await agent(…)` yields the final result instead of a handle (`await h` = `h.wait()`).
  - JS: pass ONE trailing options object — `h = await agent(prompt, { agent, label, schema, schemaMode, isolated, apply, merge{{#if evalTools}}, tools{{/if}}{{#if perCallModel}}, model{{/if}} })`.
    - Omitting `await` on `agent(…)` leaves `.id`/`.handle` undefined.
    - All handle methods return Promises; `.status` is `await h.status()`.
{{else}}
{{#if js}}
  - Omitting `await` on `agent(…)` leaves `.id`/`.handle` undefined.
  - All handle methods return Promises.
{{/if}}
{{/ifAll}}
{{#if py}}
workpool(agent?=None, *, name?=None, context?=None{{#if evalTools}}, tools?=None{{/if}}{{#if perCallModel}}, model?=None{{/if}}) → WorkPool
{{else}}
await workpool(agent?, { name?, context?{{#if evalTools}}, tools?{{/if}}{{#if perCallModel}}, model?{{/if}} }) → WorkPool
{{/if}}
  {{#if eagerDelegation}}Standard choice for 2+ independent items.{{else}}Persistent worker pool for processing a batch of independent items.{{/if}}
  - {{#if py}}`.push(*items)` (strings) → item IDs; `.status()`; `.peek()`; `.close()`.{{else}}`await` every call to `.push(...items)` (strings) → item IDs, `.status()`, `.peek()`, `.close()`.{{/if}}
  - Pool name acts as async job ID; results deliver automatically.
  - Draining the pool completely closes it: enqueue the entire batch while active; start a fresh pool for the next wave.
  - {{#if waitTool}}Completely blocked? Exit `eval` and invoke the `wait` tool (not kernel `wait()`); {{/if}}NEVER poll.
{{#if perCallModel}}
  - `model` picks each worker's model on its initial turn; subsequent turns reuse that session.
{{/if}}
{{#ifAll py js}}
  - JS: `pool = await workpool(agent, { name, context{{#if evalTools}}, tools{{/if}}{{#if perCallModel}}, model{{/if}} })`; `await` every pool method.
{{/ifAll}}
```

The cell `timeout` measures only work inside the cell itself, excluding waits on `agent()`/`wait()`/`tool.task(…)`, allowing subagents to run past it.

<dag>
Acyclic DAGs of agent handles:
- **Assign nodes.** `h = {{#if py}}agent(…)`{{#if js}} (JS: `await agent(…)`){{/if}}{{else}}await agent(…)`{{/if}} returns immediately; `h.handle` equals `agent://<id>`.
- **Connect edges.** Embed an upstream `.wait()` output or `.handle` into the downstream prompt. For large payloads use `write("local://<name>.md", …)`.
- **Kernel `{{#if py}}wait(hs)`{{#if js}} (JS: `await wait(hs)`){{/if}}{{else}}await wait(hs)`{{/if}}** acts as a wave barrier. For open-ended item streams use `workpool()`.
- **Contain failures.** `{{#if py}}wait(hs, raise_errors=False)`{{#if js}} (JS: `await wait(hs, { raiseErrors: false })`){{/if}}{{else}}await wait(hs, { raiseErrors: false })`{{/if}} isolates each failure to its slot so only that branch degrades.
- **Keep acyclic.** Never pass an agent's handle or output back to any of its upstream agents.
</dag>
