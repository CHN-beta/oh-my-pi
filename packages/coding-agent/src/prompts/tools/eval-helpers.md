<setup>
Shared setup: place code in a file and execute `%load <path>` inside a standalone `code` cell.
- Supports quoted paths and `local://`; script source is not echoed back.
- Loaded definitions stay in memory; re-run `%load` after modifying the file.
{{#if py}}
Install missing Python packages via `%pip install <distribution>` (for example, `PIL` is provided by `pillow`).
{{/if}}
{{#if js}}
Install missing JS packages via `%bun add <pkg>` into a managed per-project environment; `%environment project` switches to project dependencies.
{{#unless autoProvision}}
Auto-provisioning is off: use an existing environment or `%environment project`.
{{/unless}}
{{/if}}
Percent magics require standalone cells. Package installation keeps existing kernel state; re-run only the step that failed.
</setup>
```
budget →
{{#if py}}
  budget.total, budget.spent(), budget.remaining()
{{/if}}
{{#if js}}
  {{#if py}}JS: {{/if}}await budget.total(), await budget.spent(), await budget.remaining()
{{/if}}
  Soft limit +Nk advisory; +Nk! hard cap.
{{#if evalTools}}
{{#if py}}
@tool / tool(fn, name=None, description=None)
{{/if}}
{{#if js}}
{{#if py}}JS: {{/if}}tool(fn, { name?, description?, parameters? })
{{/if}}
  → tool hosted in the kernel{{#if py}} (schema derived from type annotations){{/if}}.
  Reference its name in task `tools`{{#if spawns}}, `agent(tools=…)`, or `workpool(tools=…)`{{/if}}; manage with `tool.defined()` and `tool.undefine(name)`.
{{/if}}
```
