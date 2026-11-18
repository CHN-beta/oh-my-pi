{{#if forReviewer}}

## Operator-Supplied Review Focus

You MUST check every annotation against the diff and surrounding code. NEVER echo an operator note without verifying it independently.
{{else}}

## Code Review Annotations

Treat these annotations as review context; they have not been independently verified as findings.
{{/if}}

{{#list annotations join="\n\n"}}

{{#if isLine}}

### {{pathLabel}} — {{lineLabel}}

{{else}}

### {{pathLabel}} — file
{{/if}}

Path: `{{path}}`
{{#if oldPath}}
Old path: `{{oldPath}}`
{{/if}}
{{#if newPath}}
New path: `{{newPath}}`
{{/if}}
Occurrence: `{{occurrence}}`

{{#if isLine}}
Hunk: `{{hunkHeader}}`

{{#codeblock lang="diff"}}
{{rawLine}}
{{/codeblock}}
{{/if}}

{{note}}
{{/list}}
{{#if supplementalInstructions}}

## Supplemental Review Focus

{{supplementalInstructions}}
{{/if}}
