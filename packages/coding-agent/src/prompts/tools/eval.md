One cell per call; top-level state persists, including across compaction.{{#if spawns}} Subagents have separate kernels.{{/if}}
A cell without `timeout` stops after {{timeoutDefault}}s{{#if timeoutRaisable}}; pass a larger `timeout` for slow subprocesses, network calls or large scans{{/if}}.
{{#if spawns}}
{{#if eagerDelegation}}
When processing 2+ independent items, prefer a named `workpool()`; results deliver automatically.
{{#if waitTool}}
If blocked, exit `eval` and call `wait`.
{{/if}}
{{/if}}
{{/if}}
{{#if py}}
Python: standard Python subprocess rather than IPython (no `get_ipython()`, `obj?`, or `%matplotlib`).
Magics such as `%pip`, `%load`, `%time`, and `!cmd` are translated to Python.
Top-level `await` is supported; calling `asyncio.run(…)` fails.
{{/if}}
{{#if js}}JS: Bun runtime (`Bun.file`, `Bun.write`, `Bun.$`); top-level `await` and `return` are supported.{{/if}}
If a step fails, re-run only that step; earlier statements may already have executed.
Printing an image{{#if py}} or figure{{/if}} attaches it to the response.

<prelude>
{{#ifAll py js}}
Python helpers accept keyword arguments; JS helpers accept identical parameters (camelCase) either positionally or in ONE trailing options object.
Async helpers are marked with `await`; others run synchronously.
```
print(value, ...)  log(message)  phase(title)  env(key?, value?)
read(path, offset?, limit?)  write(path, content)  output(*ids, format?, query?, offset?, limit?); JS: await read(…)  await write(…)  await output(…)
wait(handles, timeout?=None, raise_errors?=True); JS: await wait(…) — barrier for agents/completions returning ordered results; raise_errors=False preserves failures
await tool.<name>(args) — invoke a session tool with its parameter object `args`
sh(command, cwd?, timeout?); JS: await sh(…) or await sh`cmd ${arg}` — embedded bash engine; runs synchronously to completion (never backgrounded)
  returns stdout+stderr; non-zero exit raises ShellError (.exit_code/.exitCode, .output)
  JS template interpolations are shell-escaped; defaults to session cwd unless cwd is specified
```
{{else}}
Async helpers are marked with `await`; others run synchronously.
{{#if py}}
Python (keyword arguments):
```py
print(value, ...)  log(message)  phase(title)  env(key?, value?)
read(path, offset?, limit?)  write(path, content)  output(*ids, format?, query?, offset?, limit?)
wait(handles, timeout?=None, raise_errors?=True) — barrier for agents/completions returning ordered results; `raise_errors=False` preserves failures.
await tool.<name>(args) — invoke a session tool with its parameter object `args`
sh(command, cwd?, timeout?) — embedded bash engine; runs synchronously to completion (never backgrounded)
  returns stdout+stderr; non-zero exit raises ShellError (`.exit_code`, `.output`); defaults to session cwd unless `cwd` is specified
```
{{/if}}
{{#if js}}
JS (positional arguments or ONE trailing options object):
```js
print(value, ...)  log(message)  phase(title)  env(key?, value?)
await read(path, offset?, limit?)  await write(path, content)  await output(...ids, { format?, query?, offset?, limit? })
await wait(handles, { timeout?, raiseErrors? }) — barrier for agents/completions returning ordered results; `raiseErrors: false` preserves failures.
await tool.<name>(args) — invoke a session tool with its parameter object `args`
await sh(command, { cwd?, timeout? })  await sh`cmd ${arg}` — embedded bash engine; runs synchronously to completion (never backgrounded)
  resolves to stdout+stderr; non-zero exit throws ShellError (`.exitCode`, `.output`)
  template interpolations are shell-escaped; defaults to session cwd unless `cwd` is specified
```
{{/if}}
{{/ifAll}}
{{#if toolNames}}Available session tools: {{#each toolNames}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
</prelude>

{{#if inlineTopics}}
{{{inlineTopics}}}
{{else}}
<namespaces>
More globals; `read` the linked docs before first use:
- `judge`, `{{#if py}}judge_batch{{else}}judgeBatch{{/if}}`, `completion`: classification, bulk judgment, model calls → help://eval/judge
- `%load`{{#if py}}, `%pip`{{/if}}{{#if js}}, `%bun add`{{/if}}, `budget`{{#if evalTools}}, `@tool`/`tool(fn)`{{/if}}: setup, installs, utilities → help://eval/helpers
{{#if spawns}}
- `agent`, `workpool`: background subagents, DAG waves → help://eval/agents
{{/if}}
{{#each preludes}}
- `{{name}}`{{#if summary}}: {{summary}}{{/if}} → help://eval/{{name}}
{{/each}}
{{#if firstCallPreludes}}
No `read` needed before first use; the guide follows the first call's result (full reference linked):
{{#each firstCallPreludes}}
- `{{name}}`{{#if summary}}: {{summary}}{{/if}} → `help://eval/{{name}}`
{{/each}}
{{/if}}
</namespaces>
{{#each inlinePreludes}}

<{{name}}>
Global `{{name}}` (full docs inline, no `read` required):
{{{documentation}}}
</{{name}}>
{{/each}}
{{/if}}

<critical>
NEVER re-run setup that already succeeded. A kernel-loss notice means you must reload setup.
</critical>

{{#if autoBackgroundEnabled}}
Long-running cells may move to background and deliver results later while keeping the kernel busy.
`timeout: 0` removes the cell deadline, not the foreground wait threshold.
{{/if}}
