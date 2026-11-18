## Existing Plan

The approved plan is included inline below, with a persistent copy at `{{planFilePath}}` (identical content).

<plan path="{{planFilePath}}">
{{planContent}}
</plan>

<instruction>
Applies to the current task and remains unfinished → MUST keep executing it.
Outdated or unrelated → MUST disregard it.
NEVER re-read `{{planFilePath}}` while the inline copy stays intact.
If the inline copy is truncated, expired, or lost → NEVER halt; read `{{planFilePath}}`.
</instruction>
