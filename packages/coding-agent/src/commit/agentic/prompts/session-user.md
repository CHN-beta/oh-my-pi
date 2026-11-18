Suggest a conventional commit for the staged modifications.

{{#if user_context}}
User context:
{{user_context}}
{{/if}}

{{#if changelog_targets}}
For changelog targets: MUST invoke propose_changelog.
{{changelog_targets}}
{{/if}}

{{#if existing_changelog_entries}}
## Existing Unreleased Changelog Entries
May drop listed entries using propose_changelog `deletions`.
{{#each existing_changelog_entries}}
### {{path}}
{{#each sections}}
{{name}}:
{{#list items prefix="- " join="\n"}}{{this}}{{/list}}
{{/each}}
{{/each}}
{{/if}}

Examine staged changes via git_* tools. For more detailed per-file summaries, invoke analyze_files. Complete with: propose_commit | split_commit.
