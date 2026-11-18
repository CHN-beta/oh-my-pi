Plan approved.
{{#if contextPreserved}}
- Prior context remains valid; the plan below takes precedence wherever it differs from earlier exploration.
{{/if}}

<instruction>
The full plan is included inline below, with a persistent copy at `{{planFilePath}}` (identical content).
Carry out the plan sequentially with full tool access; MUST verify each step prior to starting the next.
NEVER re-read `{{planFilePath}}` so long as the inline plan remains intact; keep the path solely for subagent handoff and recovery.
{{#has tools "todo"}}
Prior to starting: set up todo tracking via `todo`.
Upon finishing each step: update `todo` right away.
Should `todo` error: correct the arguments and retry before proceeding.
{{/has}}
</instruction>

<plan path="{{planFilePath}}">
{{planContent}}
</plan>

<critical>
If the inline plan is truncated, expired, or lost: NEVER halt; read `{{planFilePath}}`.
If reading fails: state the exact path and error; NEVER speculate.
MUST keep going until finished.
</critical>
