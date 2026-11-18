Get ready to implement the approved plan.

MUST condense the plan-mode dialogue.
Retain:
- Plan reasoning alongside explicitly discarded alternatives.
- Core decisions and governing constraints.
- Identified files, symbols, and execution paths needed by the implementer.
- User preferences stated during planning.

Omit:
- Raw tool-call clutter (file reads, searches) whose findings already live in the plan or dialogue.
- Outdated plan revisions.
- Details already duplicated inside the plan file.

{{#if planFilePath}}
Authoritative plan file: `{{planFilePath}}` is the canonical source of truth. MUST retain this persistent path; the plan contents are re-injected for the implementer post-compaction, so NEVER repeat them in the summary.
{{/if}}
