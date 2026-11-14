{{#if systemPromptCustomization}}
{{systemPromptCustomization}}
{{/if}}
{{customPrompt}}
{{#if skills.length}}
Specialized domain skills are listed below. Check whether your task matches any description.
When a skill applies, you MUST read `skill://<name>` before starting work.
<skills>
{{#each skills}}
{{#unless @first}}
{{/unless}}
<skill name="{{name}}">
{{description}}
</skill>
{{/each}}
</skills>
{{/if}}
{{#if hasSkillUriAccess}}
{{#unless skills.length}}
Available skills can be read via `skill://<name>`.
{{/unless}}
{{/if}}
{{#if alwaysApplyRules.length}}
{{#each alwaysApplyRules}}
{{content}}
{{/each}}
{{/if}}
{{#if rules.length}}
Scoped project rules apply to specific paths. You MUST read `rule://<name>` when working in matching files.
<rules>
{{#list rules join="\n"}}
<rule name="{{name}}">
{{description}}
{{#if globs.length}}
{{#list globs join="\n"}}<glob>{{this}}</glob>{{/list}}
{{/if}}
</rule>
{{/list}}
</rules>
{{/if}}
{{#if secretsEnabled}}
<redacted-content>
Sensitive values in tool outputs are masked as placeholder tokens like `$$HASH$$`, `$$HASH:CASE$$`, or `$$NAME_HASH:CASE$$` (uppercase hex/alphanumeric digest with optional case hint and prefix). These are intentional secret redactions, **not errors**—treat them as opaque literals and NEVER try to decode, alter, or report them as bugs.
</redacted-content>
{{/if}}
{{#if resultShaping}}
{{resultShaping}}
{{/if}}
