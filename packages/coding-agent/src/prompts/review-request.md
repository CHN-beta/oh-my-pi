## Code Review Request

### Mode

{{mode}}
{{#if repository}}

### Repository

`{{repository}}` — distinct from the session cwd. Listed file paths are relative to it; reviewers MUST execute VCS commands inside it and resolve `read` paths relative to it.
{{/if}}

### Changed Files ({{len files}} files, +{{totalAdded}}/-{{totalRemoved}} lines)

{{#if files.length}}
{{#if prDiffUrl}}
Index denotes the file's 1-based offset in the complete PR diff; omitted files leave gaps. Pair every file with its exact Diff URL listed below.

{{#table files headers="Index|File|+/-|Type|Diff URL"}}
{{diffIndex}} | {{path}} | +{{linesAdded}}/-{{linesRemoved}} | {{ext}} | `{{diffUrl}}`
{{/table}}
{{else}}
{{#table files headers="File|+/-|Type"}}
{{path}} | +{{linesAdded}}/-{{linesRemoved}} | {{ext}}
{{/table}}
{{/if}}
{{else}}
_No files to review._
{{/if}}

{{#if excluded.length}}
### Excluded Files ({{len excluded}})

{{#list excluded prefix="- " join="\n"}}
`{{path}}` (+{{linesAdded}}/-{{linesRemoved}}) — {{reason}}
{{/list}}
{{/if}}

### Distribution Guidelines

Invoke `task` using a `tasks` array. Specify `agent: "reviewer"` inside each `tasks[]` entry (`tasks[].agent`), never at the top level and never omitted.
{{#when agentCount "==" 1}}Spawn exactly **1 reviewer task**.{{else}}Launch **{{agentCount}} reviewer agents** concurrently.{{/when}}
{{#if multiAgent}}
Partition files by locality, for instance:
- Same directory or module → same agent
- Related features → same agent
- Tests alongside their corresponding implementation files → same agent
{{/if}}

### Reviewer Instructions

Each reviewer MUST:
1. Review ONLY its assigned files
2. {{#if skipDiff}}{{#if prDiffUrl}}MUST inspect assigned PR file diffs via the exact Diff URL in the Changed Files table or `{{prDiffUrl}}/all{{prDiffQuery}}`; NEVER run local `git diff`/`git show` for PR diff content{{else}}{{#if diffInstruction}}{{diffInstruction}}{{else}}MUST execute `git diff`/`git show` on its assigned files{{/if}}{{/if}}{{else}}MUST rely on the diff hunks provided below (NEVER re-run git diff){{/if}}
3. {{#if suppliedPatch}}NEVER read local checkout files for context; the provided diff may differ from the working tree{{else}}{{#if prDiffUrl}}NEVER read local checkout files for PR context; rely strictly on the fetched PR diff, the exact Diff URL in the Changed Files table, or `{{prDiffUrl}}/all{{prDiffQuery}}`{{else}}{{#if contextInstruction}}{{contextInstruction}}{{else}}MAY inspect full file context as needed with `read`{{/if}}{{/if}}{{/if}}
4. Emit findings and verdict fields via incremental `yield` sections; do NOT invoke a separate finding tool

{{#if skipDiff}}
### Diff Previews

_Complete diff exceeds size limit ({{len files}} files). Displaying the first ~{{linesPerFile}} lines per file._

{{#list files join="\n\n"}}
#### {{path}}

{{#codeblock lang="diff"}}
{{hunksPreview}}
{{/codeblock}}
{{/list}}
{{else}}

### Diff

<diff>
{{rawDiff}}
</diff>
{{/if}}

{{#if additionalInstructions}}
### Additional Instructions

{{additionalInstructions}}
{{/if}}
