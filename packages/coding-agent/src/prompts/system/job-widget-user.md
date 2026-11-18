<job>
{{#if command}}
Background bash process. Command:
```
{{command}}
```
{{/if}}
{{#if task}}
Background subagent. Excerpt of its task:
```
{{task}}
```
{{/if}}
{{#if intent}}
Launch reason: {{intent}}
{{/if}}
{{#if watch}}
Metric or output the subagent says to track: {{watch}}
{{/if}}
{{#if stage}}
Active stage: {{stage}}
{{/if}}
</job>

<sources>
{{#each sources}}
## `{{id}}` — {{label}}
{{lines}} lines recorded so far ({{size}}).{{#if omitted}} {{omitted}} omitted: the middle section, plus repeated lines differing solely in numbers.{{/if}}
```
{{#each head}}
{{this}}
{{/each}}
{{#if tail.length}}
{{#if omitted}}
[…]
{{/if}}
{{#each tail}}
{{this}}
{{/each}}
{{/if}}
```
{{/each}}
</sources>
{{#if previous}}

An existing spec is active, yet {{previous.reason}}. Provide an updated spec that matches the sample lines above:
```json
{{previous.spec}}
```
{{/if}}
{{#if rejected}}

Your prior submission was rejected:
```json
{{rejected.answer}}
```
Issues:
{{#each rejected.errors}}
- {{this}}
{{/each}}
Resolve all issues and invoke `respond` again.
{{/if}}
