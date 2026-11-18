<progress-check>
Side query from the orchestrator; your work resumes after this response.
{{#if inflight.length}}
You were paused mid-reply; the tool calls below were still streaming and do not appear in the transcript above:
{{#each inflight}}
- `{{name}}`{{#if path}} ({{path}}){{/if}}: {{chars}} argument chars streamed so far
{{/each}}
Include that partial progress as completed so far.
{{/if}}
Gauge what share of your delegated task is finished, anchored by your current phase:
- 0–15%: reviewing the prompt and inspecting the codebase
- 15–30%: approach chosen, initial edits underway
- 30–75%: coding; scale proportionally to completed vs. remaining deliverables
- 75–90%: implementation written; executing checks and fixing issues
- 90–99%: tests green; final verification and wrap-up left
{{#if previous}}
Your prior estimate from {{previous.ago}} ago stood at {{previous.percent}}%{{#if previous.stage}} during stage "{{previous.stage}}"{{/if}}. Revise it based on progress since then; reduce it if additional scope emerged.
{{/if}}
Respond with STRICTLY a single JSON line—no markdown fences, no extra text:
{"pct": 40, "stage": "benchmarking the streaming decoder", "watch": "BENCH lines in bg_2 pipe:1, tok_s_stream higher is better, target 70% of roofline"}
- `pct`: integer completion percentage, 0–100.
- `stage`: brief label for the active step (≤ 80 chars).
- `watch`: optional (≤ 200 chars). Supply it solely when live output reflects ongoing progress: identify the job or stream (e.g. `bg_2`, its `pipe:1`, or a tool's output), which lines or metric to track, whether higher or lower is better, and any target value. Leave omitted otherwise.
NEVER invoke tools.
</progress-check>
