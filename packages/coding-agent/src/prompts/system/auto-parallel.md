<system-reminder>
A classifier partitioned this request into {{len subtasks}} subtasks suited for parallel execution: entries inside one subtask are interdependent, whereas distinct subtasks modify disjoint code.
{{#each subtasks}}

Subtask {{add @index 1}}:
{{#each this}}
- {{this}}
{{/each}}
{{/each}}
{{#if context}}

Shared context required by all subtasks:
{{#each context}}
- {{this}}
{{/each}}
{{/if}}
{{#if wrapup}}

Once every subtask completes, handle yourself:
{{#each wrapup}}
- {{this}}
{{/each}}
{{/if}}

Agree on cross-subtask interfaces upfront, then dispatch the subtasks together in ONE parallel `{{taskTool}}` call, embedding the shared context in each brief. Treat this grouping as advisory: combine subtasks that turn out to be coupled, and NEVER subdivide a subtask any further.
</system-reminder>
