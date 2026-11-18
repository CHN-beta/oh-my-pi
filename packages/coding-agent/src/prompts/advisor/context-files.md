<project-context>
Project instruction files (such as AGENTS.md) capture the user's persistent rules and bind the primary agent. Uphold them, point out any divergence promptly, and NEVER recommend violating these rules.
{{#each contextFiles}}
<file path="{{path}}">
{{content}}
</file>
{{/each}}
</project-context>
