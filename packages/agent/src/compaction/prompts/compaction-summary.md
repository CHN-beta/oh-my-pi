You MUST distill the conversation above into a structured handoff summary so another LLM can continue the task.

IMPORTANT: Should the conversation conclude with an unanswered question or a request waiting for user input (e.g., "Please run command and paste output"), you MUST retain that exact question/request.

You MUST adhere to this structure (omit sections that do not apply):

## Goal
[User objectives; enumerate multiple if the session spans distinct tasks.]

## Constraints & Preferences
- [Stated constraints or requirements]

## Progress

### Done
- [x] [Finished tasks/edits]

### In Progress
- [ ] [Ongoing work]

### Blocked
- [Issues impeding progress]

## Key Decisions
- **[Decision]**: [Short reasoning]

## Next Steps
1. [Sequenced list of follow-up actions]

## Critical Context
- [Key data, open questions, references]

## Additional Notes
[Any other relevant details not captured above]

You MUST emit only the structured summary; NEVER add extraneous text.

Sections MUST stay brief. You MUST keep exact file paths, function names, error messages, and pertinent tool outputs or command outputs. You MUST record repository state modifications (branch, uncommitted changes) if stated.
