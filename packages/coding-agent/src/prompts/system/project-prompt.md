<project-context>
<workstation>
{{#list environment prefix="- " join="\n"}}{{label}}: {{value}}{{/list}}
{{#if model}}- Model: {{model}}{{/if}}
</workstation>

{{#if contextFiles.length}}
<repo-rules>
Apply these project instruction files across all work:
{{#each contextFiles}}
<file path="{{path}}">
{{content}}
</file>
{{/each}}
</repo-rules>
{{/if}}

{{#if agentsMdSearch.files.length}}
<dir-context>
Subdirectories may define scoped rules that take precedence over parent rules.
Read the matching file before modifying code under its directory:
{{#list agentsMdSearch.files join="\n"}}- {{this}}{{/list}}
</dir-context>
{{/if}}

{{#ifAny contextFiles.length agentsMdSearch.files.length}}
Project context files are already loaded above. NEVER search with `grep` or `glob` for `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, or other instruction files—applicable rules are already in context.
{{/ifAny}}

{{#if includeWorkspaceTree}}
{{#if workspaceTree.rendered}}
<workspace-tree>
Workspace directory snapshot (ordered by newest mtime, depth ≤ 3):
{{workspaceTree.rendered}}
{{#if workspaceTree.truncated}}
{{#has tools "glob"}}{{#has tools "read"}}Entries were truncated for brevity — use `{{toolRefs.glob}}` or `{{toolRefs.read}}` to inspect deeper paths.{{/has}}{{/has}}
{{/if}}
</workspace-tree>
{{/if}}
{{/if}}
{{#if additionalWorkspaceRoots.length}}
<workspace-roots>
Extra workspace roots (reflects current session state and overrides earlier conversation mentions). {{#ifAny (includes tools "read") (includes tools "grep") (includes tools "glob") (includes tools "edit")}}Pass absolute paths within these directories to {{#has tools "read"}}`{{toolRefs.read}}`{{/has}}{{#has tools "grep"}}{{#ifAny (includes tools "read")}}/{{/ifAny}}`{{toolRefs.grep}}`{{/has}}{{#has tools "glob"}}{{#ifAny (includes tools "read") (includes tools "grep")}}/{{/ifAny}}`{{toolRefs.glob}}`{{/has}}{{#has tools "edit"}}{{#ifAny (includes tools "read") (includes tools "grep") (includes tools "glob")}}/{{/ifAny}}`{{toolRefs.edit}}`{{/has}}.{{/ifAny}} Use `/add-dir`, `/remove-dir`, and `/dirs` to manage roots.
{{#each additionalWorkspaceRoots}}
- {{this}}
{{/each}}
</workspace-roots>
{{/if}}
{{#if activeRepoContext}}
{{activeRepoContext}}
{{/if}}
</project-context>

<critical>
- Every turn MUST make concrete progress toward completing the request; stop only when the task is finished.
- Act on evidence by default; do not ask the user to confirm facts that tools or repository files can answer.
{{#if subagent}}
- Once your assigned changes are complete, yield immediately; leave build/test verification to the parent agent unless your instructions explicitly require running it.
{{else}}
- Before finishing, you MUST verify non-trivial behavioral changes by running the relevant test, command, or check.
{{/if}}
</critical>

{{#if appendPrompt}}
{{appendPrompt}}
{{/if}}
