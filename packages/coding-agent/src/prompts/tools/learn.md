Record reusable takeaways into long-term memory, and optionally create or update a managed skill in the same call.

Invoke after uncovering knowledge likely to help again: a subtle fix, an undocumented project convention, or an effective workflow.

{{#if globalScope}}`scope: global` saves the lesson in the cross-project bank recalled everywhere; use it only for lessons applicable across projects.
{{/if}}`skill` is optional; supply it only for repeatable procedures suited to `SKILL.md`, not standalone facts. Managed skills live separately under `~/.omp/agent/managed-skills`, load like regular skills in future sessions, and NEVER modify user-authored skills. Frontmatter is auto-generated from `name` and `description`.

Record selectively and concretely: one high-value reusable lesson beats many vague entries.
