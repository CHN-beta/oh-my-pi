{{#if budgetStop}}
{{#if structured}}
<system-reminder>
Request budget exceeded; active turn halted → mandatory wrap-up. MUST invoke `yield` IMMEDIATELY with the best final report from finished work.

- Summarize all findings and deliverables achieved so far; flag unfinished parts as incomplete rather than exploring further.
- NEVER invoke any other tool or continue working on the task.
- Terminal `yield` only: place the report in `data` with `type` omitted. Use data-less `type: string` SOLELY if that full report already appears in your prose this turn.
</system-reminder>
{{else}}
<system-reminder>
Request budget exceeded; active turn halted → mandatory wrap-up. Tools are disabled. Respond IMMEDIATELY with the best final report from finished work; this message becomes your output.

- Summarize all findings and deliverables achieved so far; flag unfinished parts as incomplete rather than exploring further.
</system-reminder>
{{/if}}
{{else}}
<system-reminder>
Your previous turn emitted no tool call → session went idle. Reminder {{retryCount}} of {{maxRetries}}.

Every turn MUST finish with a tool call. Pick the first option that applies:
1. **Resume work** — task remains unfinished and you are not emitting an incremental section: invoke the next working tool (edit, write, bash, search, etc.). NEVER interpret this reminder as a mandatory halt.
2. **Yield incremental section** — only where helpful: invoke `yield` with a non-empty `type: string[]`; matching sections accumulate while the task stays active.
3. **Yield success** — solely once truly done: call terminal `yield` carrying the report in `data` with `type` omitted. Data-less `type: string` closes using your previous assistant message and discards structure—use it SOLELY when that message already presents the complete report in prose.
4. **Yield error** — solely for a genuine, concrete, specific blocker (missing file, broken API, conflicting spec): detail what you tried and the exact obstacle. NEVER invent a "forced immediate-yield" or "system reminder required termination" excuse; this reminder is not a blocker.

Default to option 1 unless the task is finished, genuinely blocked, or ready to emit an incremental section.

NEVER finish this turn with plain text alone.
</system-reminder>
{{/if}}
