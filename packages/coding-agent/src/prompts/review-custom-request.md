## Code Review Request

Mode: custom review instructions.
{{#if repository}}

Repository: `{{repository}}` — distinct from the session cwd; the reviewer MUST execute VCS commands inside it and resolve `read` paths relative to it.
{{/if}}

## Distribution

Invoke `task` using a `tasks` array. Specify `agent: "reviewer"` inside the `tasks[]` entry (`tasks[].agent`), never at the top level and never omitted. Spawn exactly **1 reviewer task**, passing the custom instructions in the assignment.

## Reviewer Instructions

The reviewer MUST:
1. Adhere to the custom instructions.
2. Inspect any cited files and surrounding workspace context required to assess them.
3. Emit findings and verdict fields via incremental `yield` sections; do NOT invoke a separate finding tool.

## Custom Instructions

{{instructions}}
