<task-result id="{{id}}" agent="{{agentName}}" status="{{status}}" duration="{{duration}}">
{{#if truncated}}{{#if meta}}<meta lines="{{meta.lineCount}}" size="{{meta.charSize}}" />{{/if}}{{/if}}
{{#if abortReason}}
<abort-reason>{{abortReason}}{{#if resumable}} — this agent remains active with its full context; message it via `write agent://{{id}}` to resume rather than restarting from scratch.{{/if}}</abort-reason>
{{/if}}
{{#if error}}
<error>{{error}}</error>
{{/if}}
{{#if truncated}}
<preview full-output="agent://{{id}}">
{{preview}}
</preview>
{{else}}
<output>
{{preview}}
</output>
{{/if}}
{{#if mergeSummary}}
<merge-summary>
{{mergeSummary}}
</merge-summary>
{{/if}}
</task-result>
