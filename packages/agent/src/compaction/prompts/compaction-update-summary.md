Revise the existing handoff summary inside <previous-summary> tags using new messages above so another LLM can continue.

MUST:
- retain all prior previous-summary details; incorporate new progress, decisions, and context.
- Progress: shift finished "In Progress" items into "Done".
- refresh "Next Steps" to reflect completed items.
- keep exact file paths, function names, and error messages.
- MAY drop obsolete content.
- If newer messages end with an unanswered user question or request: record it under Critical Context; overwrite any earlier pending question once answered.
- emit only the structured summary; NEVER include extra text.
- keep every section brief.
- retain pertinent tool outputs and command results.
- record mentioned repository state changes (branch, uncommitted changes).

Layout (skip inapplicable sections):

## Goal
[Keep current goals; append new ones if scope grew]

## Constraints & Preferences
- [Keep current items; append newly identified ones]

## Progress

### Done
- [x] [List previously finished and newly completed items]

### In Progress
- [ ] [Ongoing work—refresh based on progress]

### Blocked
- [Active blockers—drop once cleared]

## Key Decisions
- **[Decision]**: [Short reasoning] (keep all prior items, append new)

## Next Steps
1. [Refresh according to latest state]

## Critical Context
- [Keep vital context; append new details if needed]

## Additional Notes
[Other pertinent details not covered above]
