<system-reminder>
Task delegation is active for this request; default to using subagents.

FIRST define the plan: overall scope, top-level breakdown, and cross-slice interfaces. That part is yours; NEVER delegate the overall design—slice-level details stay with each executor. Once defined, MUST distribute the work to `{{toolRefs.task}}` subagents instead of coding it yourself.{{#if taskBatch}} Combine independent slices into ONE parallel `{{toolRefs.task}}` invocation; NEVER run parallelizable work sequentially.{{/if}}

Handle directly yourself only when: editing a single file under ~30 lines | giving a direct answer with no code edits | running a command the user specifically asked you to execute | only ONE executable slice exists—a lone subagent creates a lossy handoff without parallelism.
</system-reminder>
