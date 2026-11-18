<context>
Changelog: {{ changelog_path }}
{{#if is_package_changelog}}Scope: Package-level changelog. Leave out the package name prefix from entries.{{/if}}
</context>
{{#if existing_entries}}
<existing-entries>
Already covered—skip these:
{{ existing_entries }}
</existing-entries>
{{/if}}

<diff-summary>
{{ stat }}
</diff-summary>

<diff>
{{ diff }}
</diff>
