Execute the fixed security plan below.

Repository: {{repositoryRoot}}
Target kind: {{targetKind}}
Revision: {{revision}}
Base revision: {{baseRevision}}
Head revision: {{headRevision}}
Include paths: {{includePaths}}
Exclude paths: {{excludePaths}}
Knowledge bases: {{knowledgeBases}}
Plan fingerprint: {{planFingerprint}}
{{#if diffText}}

Base-to-head diff requested:

```diff
{{diffText}}
```
{{/if}}

Start by cataloging the exact target scope. Assign non-overlapping review slices to `security-reviewer` via `task`. Consolidate all worker results, examine any supporting code needed to clear up doubts, and then invoke `security_publish` once with verified findings, accurate coverage, and the final report.
