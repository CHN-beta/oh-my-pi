<job>
{{#if intent}}
Launch reason: {{intent}}
{{/if}}
{{#if timeoutSec}}
Terminated after: {{timeoutSec}}s
{{else}}
Timeout: unlimited
{{/if}}
Command:
```
{{command}}
```
</job>
