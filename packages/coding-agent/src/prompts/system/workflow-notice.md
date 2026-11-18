<system-notice>
User prompt contains **workflowz** → structured multi-subagent workflow. Prefer `workpool()` for 2+ independent items; reserve individual `agent()` handles for dependency-linked or schema-returning invocations.

<when>
Appropriate for broad exploration, reviews, migrations, adversarial checks, and open-ended item lists. Quick lookups or single edits: handle directly without agents. {{#if scoutAvailable}}Scout inline FIRST{{else}}Explore inline FIRST{{/if}} — pin down target files, call sites, and interfaces prior to spinning up the pool.

Pool-first stages:
- **Understand**: enqueue subsystem readers → gather outputs → synthesize
- **Review**: enqueue one entry per lens/file → gather outputs → confirm survivors
- **Migrate**: locate all sites → enqueue file-disjoint edits → verify once
- **Research**: enqueue sources/modalities → deep-read hits → synthesize
- **Design**: enqueue independent proposals/judges → select and merge
</when>

<helpers>
State persists across `eval` invocations. Each cell exposes:

- {{#if py}}`workpool(agent=None, *, name=None, context=None{{#if evalTools}}, tools=None{{/if}}{{#if perCallModel}}, model=None{{/if}})`{{else}}`await workpool(agent?, { name?, context?{{#if evalTools}}, tools?{{/if}}{{#if perCallModel}}, model?{{/if}} })`{{/if}}: {{#if freshAgents}}pool of one-shot agents capped at live `task.maxConcurrency` concurrent runners (0 = unlimited). Queued items launch in FIFO push order: each spawns a fresh agent while below the limit, or waits in a shared FIFO queue until an active agent finishes. Each agent exits after completing its single item and never handles another, so items share zero conversation history, while pool context and tools pass through to every agent.{{else}}pool of persistent keep-alive workers capped at live `task.maxConcurrency` concurrent runners (0 = unlimited). Queued items dispatch in push order: first to the idle worker with the smallest context usage, next to a newly spawned worker if below the limit, otherwise round-robin onto a busy worker's queue. Each worker keeps its conversation across items, so later items see prior work handled by that worker; items queued on a busy worker arrive together as one batch when it becomes free. Reuse kicks in only once queued items exceed the concurrency cap or an item is pushed while a worker sits idle.{{/if}} {{#if py}}`.push(*items)`{{else}}`.push(…items)`{{/if}} returns item IDs; `.status()` reports worker/queue counts; `.peek()` yields a non-consuming snapshot; `.close()` cancels queued items.{{#if js}}{{#if py}} JS: `await workpool(agent, { name, context{{#if evalTools}}, tools{{/if}}{{#if perCallModel}}, model{{/if}} })`; every{{else}} Every{{/if}} pool method is async (`await pool.push(…items)`).{{/if}}
  - The pool's `name` serves as both its background job ID and display label. Enqueue all known items while active; its initial full drain settles and closes that pool job. Subsequent phases or waves after drain → instantiate a new named pool.
  - Outputs deliver automatically. Fully blocked? Exit `eval` and invoke the `wait` tool (not kernel `wait()`); NEVER poll.
- {{#if py}}`agent(prompt, *, agent=None, label=None, schema=None, schema_mode=None, isolated=None, apply=None, merge=None{{#if evalTools}}, tools=None{{/if}}{{#if perCallModel}}, model=None{{/if}})`{{else}}`await agent(prompt, { agent?, label?, schema?, schemaMode?, isolated?, apply?, merge?{{#if evalTools}}, tools?{{/if}}{{#if perCallModel}}, model?{{/if}} })`{{/if}}: immediate `AgentHandle`; reserve for small fixed dependency DAGs or when the caller needs validated `schema` output. `.wait()` resolves to text/data; `.handle` equals `agent://<id>`. Unawaited outputs deliver automatically.{{#if js}}{{#if py}} JS: `await agent(prompt, { agent, label, schema, schemaMode, isolated, apply, merge{{#if evalTools}}, tools{{/if}}{{#if perCallModel}}, model{{/if}} })`; without `await`,{{else}} Without `await agent(…)`,{{/if}} `.id` and `.handle` are undefined; handle methods are async (`await h.wait()`).{{/if}}
- {{#if py}}`completion(prompt, *, model="default", system=None, schema=None)`{{else}}`await completion(prompt, { model?, system?, schema? })`{{/if}}: immediate `CompletionHandle` for a single tool-free call. Tiers: `"smol"`, `"default"`, `"slow"`.{{#if js}}{{#if py}} JS: `await completion(prompt, { model, system, schema })`; handle{{else}} Handle{{/if}} methods are async (`await h.wait()`).{{/if}}
- `await judge(state, questions)`: structured `choice`/`bool`/`score` questions over a single state → `{id: answer}` with probabilities. Lower-cost alternative to `completion()` for classification.
- {{#if py}}`judge_batch(states, questions, *, concurrency=32, retries=1, min_ok=1, intent=None)`{{else}}`await judgeBatch(states, questions, { concurrency?, retries?, minOk?, intent? })`{{/if}}: evaluates the same questions across a batch of states, managed by the host so the run outlives individual cells. Provide a non-empty `intent` for its job/progress label (defaults to `"Judging"`). Immediately returns a `JudgmentBatch`; in each cell, consume a bounded slice via {{#if py}}`await b.drain(timeout)` (or `async for k, item in b.drain_iter(timeout)`){{else}}`await b.drain({ timeout })` (or `for await (const [k, item] of b.drainIter({ timeout }))`){{/if}}, inspect `b.status()`/`b.results()`/`b.failed()`, and call `b.close()` once finished. Per-item failures land in `item.error` without raising; `b.id` is a background job ID (results auto-deliver). Never call `judge()` in a loop over items.{{#if js}}{{#if py}} JS: `await judgeBatch(states, questions, { concurrency, retries, minOk, intent })`; `await b.drain({ timeout })` / `for await (const [k, item] of b.drainIter({ timeout }))`; every{{else}} Every{{/if}} batch method except `drainIter` is async.{{/if}}
- {{#if py}}`wait(handles, timeout=None, *, raise_errors=True)`{{else}}`await wait(handles, { timeout?, raiseErrors? })`{{/if}}: ordered barrier strictly for agent/completion handles; {{#if py}}`raise_errors=False`{{else}}`raiseErrors: false`{{/if}} retains failures inline in their slot.{{#ifAll py js}} JS: `await wait(handles, { timeout, raiseErrors })`.{{/ifAll}}
{{#if evalTools}}- {{#if py}}`@tool`{{else}}`tool(fn, { name?, description?, parameters? })`{{/if}}: kernel-local tool exposed via `tools`. Ideal for shared caches, deduplication sets, scoring, or structured aggregation across pool workers; invocations run inside YOUR kernel, and raised exceptions return to the caller without crashing it.{{#ifAll py js}} JS: `tool(fn, { name, description, parameters })`.{{/ifAll}}
{{/if}}- `log(message)`: emit a progress line. `phase(title)`: label a status-tree phase.
- `budget`: {{#if py}}`budget.total` / `budget.spent()` / `budget.remaining()`{{else}}`await budget.total()` / `await budget.spent()` / `await budget.remaining()`{{/if}}. User `+Nk` = advisory; `+Nk!` = hard.{{#ifAll py js}} JS: `await budget.total()` / `await budget.spent()` / `await budget.remaining()`.{{/ifAll}}
</helpers>

<pool-workflow>
1. Map out the complete independent worklist prior to spawning.
2. Instantiate ONE explicitly named pool per phase.
3. Enqueue all known items within a single cell; newly discovered items MAY be pushed while the pool job remains active.
4. Proceed with productive local work; results auto-deliver.
5. Fully blocked? Exit `eval` and invoke the `wait` tool (not kernel `wait()`); never poll.
6. Inspect every batch output; YOU verify and integrate results.

{{#if py}}
{{#if js}}
**Python:**
{{/if}}
```python
phase("Review")
review = workpool({{#if scoutAvailable}}"scout", {{/if}}name="review", context="Return evidence with exact paths; do not edit.")
review.push(*[
    "Review authentication correctness",
    "Review authorization boundaries",
    "Review cancellation and cleanup",
    "Review performance regressions",
])
print(review.name)   # background job id; results auto-deliver
```
{{/if}}
{{#if js}}
{{#if py}}
**JavaScript:**
{{/if}}
```js
phase("Review");
const review = await workpool({{#if scoutAvailable}}"scout", {{/if}}{
    name: "review",
    context: "Return evidence with exact paths; do not edit.",
});
await review.push(
    "Review authentication correctness",
    "Review authorization boundaries",
    "Review cancellation and cleanup",
    "Review performance regressions",
);
print(review.name); // background job id; results auto-deliver
```
{{/if}}
Want a snapshot without consuming or delivering results? `{{#unless py}}await {{/unless}}review.peek()`. Want worker/queue counts? `{{#unless py}}await {{/unless}}review.status()`.{{#ifAll py js}} JS: `await` both.{{/ifAll}}
</pool-workflow>

<dependencies>
Reserve handles strictly for when task B depends on task A's exact output before B can be formulated:

{{#if py}}
```python
spec = agent("Extract the protocol", {{#if scoutAvailable}}agent="scout", {{/if}}schema=SPEC).wait()
impl = agent(f"Implement this protocol: {spec}")
result = impl.wait()
```
{{/if}}
{{#if js}}
```js
const specHandle = await agent("Extract the protocol", { {{#if scoutAvailable}}agent: "scout", {{/if}}schema: SPEC });
const spec = await specHandle.wait();
const impl = await agent(`Implement this protocol: ${JSON.stringify(spec)}`);
const result = await impl.wait();
```
{{/if}}
Fixed independent handles are fine when each output must return straight into the kernel as structured data; in all other cases, use a pool.
</dependencies>

<patterns>
- **Adversarial verify**: enqueue one REFUTE task per claim/lens; keep solely evidence-backed survivors.
- **Perspective-diverse review**: distinct correctness, security, performance, and reproduction items; NEVER duplicate one generic prompt.
- **Judge panel**: enqueue proposals in one pool, then score them in a second named pool once the first drains.
- **Loop-until-dry**: enqueue newly found items while the pool stays active; deduplicate against all SEEN items.
- **Multi-modal sweep**: enqueue items partitioned by container, content, entity, and time.
- **Completeness critic**: add a closing pool item checking which modality, file, or claim remains unverified.
- **No silent caps**: whenever sampling or top-N drops items, call `log()` noting what was skipped.

Scale accordingly: `"find any bugs"` → small pool. `"thoroughly audit"` → broad pool paired with an independent adversarial verification pool.
</patterns>

<execution>
- Multi-phase effort: track phases in `todo`.
- Give each pool item a self-contained target, read/edit scope, and acceptance criteria.
- Concurrent edits to one file? Assign one worker to own it; serialize shared boundaries.
- Treat pool outputs as evidence rather than truth. Inspect artifacts, filter findings, and execute final verification yourself.
- Keep advancing until done; draining a pool marks a phase boundary, not task completion.
</execution>
</system-notice>
