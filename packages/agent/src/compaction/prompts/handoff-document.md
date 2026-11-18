<critical>
Author a handoff document for a subsequent instance of yourself.
The handoff MUST be complete enough for smooth continuation with no access to this conversation.
Emit ONLY the handoff document. No opening remarks, no commentary, no surrounding text.
</critical>

<instruction>
Record concrete technical state rather than high-level summaries.
- File paths, symbol names, executed commands
- Test outcomes, encountered failures
- Decisions taken
- In-flight work impacting the next action
Voice: address the next instance directly in imperative mood ("Fix X", "Run Y") — never first person ("I need to…", "my attempt…").
The handoff process itself stays invisible in the document: NEVER mention authoring, producing, or sending a handoff/summary/context document under Progress or Next Steps. Progress and Next Steps pertain strictly to the user's task.
</instruction>

<output>
Follow this exact layout:

## Goal
[What the user aims to achieve]

## Constraints & Preferences
- [Mentioned constraints, preferences, or requirements]

## Progress
### Done
- [x] [Finished tasks with concrete details]

### In Progress
- [ ] [Ongoing work, if applicable]

### Pending
- [ ] [Mentioned tasks not yet begun]

## Key Decisions
- **[Decision]**: [Reasoning]

## Critical Context
- Code snippets, file paths, function/type names, error messages, and data required to resume
- Repository status when pertinent

## Next Steps
1. [Immediate next action]
</output>

{{#if additionalFocus}}
<instruction>
Extra focus: {{additionalFocus}}
</instruction>
{{/if}}
