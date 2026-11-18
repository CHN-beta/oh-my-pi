```
{{#if py}}
completion(prompt, *, model?="default"|"smol"|"slow", system?=None, schema?=None) → handle
{{else}}
await completion(prompt, { model?: "default"|"smol"|"slow", system?, schema? }) → handle
{{/if}}
    Returns immediately; `.wait()` yields text (parsed via `schema`). Stateless with no tools or conversation history.
{{#ifAll py js}}
    JS: ONE trailing options object — `h = await completion(prompt, { model, system, schema })`; without `await`, `.id` is undefined. `.wait()` returns a Promise.
{{else}}
{{#if js}}
    Without `await` on `completion(…)`, `.id` is undefined. `.wait()` returns a Promise.
{{/if}}
{{/ifAll}}
{{#if py}}
await judge(state, questions, *, images?=[path | ImageContent, …]) → `{id: answer}`
{{else}}
await judge(state, questions, { images?: [path | ImageContent, …] }) → `{id: answer}`
{{/if}}
    Structured judgment on a single `state` (non-empty {{#if py}}str{{else}}string{{/if}} | JSON object | JSON array).
    - Each question evaluates the same `state` independently: group independent questions into a single call.
    - Fast and inexpensive (uses TypeSafe if credentialed, otherwise the tiny/smol chat model); prefer over `completion()` for classification, yes/no checks, and ranking.
    - For two or more states use `{{#if py}}judge_batch{{else}}judgeBatch{{/if}}`, never a loop of `judge()`.
    `questions`: `{id: q}` where each `q` is:
      `{type: "choice", instructions, criteria: {label: rubric | {{#if py}}None{{else}}null{{/if}}, …}}` → `{choice, probabilities: {label: p}, confidence}` (≥2 labels)
      `{type: "bool", instructions, criteria?: {true?: {{#if py}}str{{else}}string{{/if}}, false?: {{#if py}}str{{else}}string{{/if}}}}` → `{bool: P(yes)}`
      `{type: "score", instructions, criteria: [lowest, …, highest]}` → `{score, probabilities: {"0": p, …}, confidence}`
        (≥2 levels; score equals the probability-weighted level index)
{{#ifAll py js}}
    JS: ONE trailing object — `await judge(state, questions, { images })`.
{{/ifAll}}
{{#if py}}
judge_batch(states, questions, *, concurrency?=32, retries?=1, min_ok?=1, intent?=None, images?={key: [path | ImageContent, …]}) → JudgmentBatch
{{else}}
await judgeBatch(states, questions, { intent?, concurrency?, retries?, minOk?, images?: {key: [path | ImageContent, …]} }) → JudgmentBatch
{{/if}}
    Images take local paths or embedded `ImageContent`; batch attachments map each state key to its image list (list inputs use zero-based indices as keys).
    Requests containing images skip models lacking vision support, never silently discard images, and fail if no vision-capable judge exists.
    Evaluates identical `questions` across all states (`{key: state}` or an index-keyed list), executed and managed by the host outside the cell's lifetime.
    - `concurrency` maxes out at 32.
    - `intent` sets an optional non-empty job/progress label (defaults to `"Judging"`).
    Returns immediately; retrieve completed items in bounded chunks across cells:
    - `await b.drain(timeout?)` (seconds; if omitted, blocks for the next item) → {{#if py}}`[(key, item)]`{{else}}`[[key, item]]`{{/if}} completed since the previous drain
      (`[]` on timeout or completion; `item.ok` → `item.answers`, otherwise `item.error`; per-item errors do not raise)
    - `{{#if py}}async for k, item in b.drain_iter(timeout){{else}}for await (const [k, item] of b.drainIter({ timeout })){{/if}}` iterates until timeout or finish
    - `{{#unless py}}await {{/unless}}b.status()` → `{id, intent, done, total, failed, cost, running, model?, elapsedS, error?}`
    - `{{#unless py}}await {{/unless}}b.results()` → `{key: answers}` collected so far
    - `{{#unless py}}await {{/unless}}b.failed()` → `{key: error}`
    - `{{#unless py}}await {{/unless}}b.cancel()`
    - `{{#unless py}}await {{/unless}}b.close()` aborts if active and frees resources.
    `drain()` raises only on whole-batch failure (no judge available, fewer than `{{#if py}}min_ok{{else}}minOk{{/if}}` completed, or cancelled).
    `b.id` serves as an async job ID:
    - completion delivers a summary automatically
{{#if waitTool}}
    - call the `wait` tool (not kernel `wait()`) to block when nothing else remains
{{/if}}
    - `{{#if py}}judge_batch.attach(id){{else}}await judgeBatch.attach(id){{/if}}` reattaches after a kernel reset.
{{#ifAll py js}}
    JS: ONE trailing options object — `b = await judgeBatch(states, questions, { intent, concurrency, retries, minOk, images })`.
    - `await` all `b` methods except `drainIter`, consumed via `for await (const [k, item] of b.drainIter({ timeout }))`.
    - `drain` returns `[key, item]` pairs.
    - `await judgeBatch.attach(id)`.
{{/ifAll}}
```
