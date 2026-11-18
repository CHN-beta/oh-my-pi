[IMPORTANT: The user triggered the "{{name}}" skill; follow all instructions below. Full skill contents follow.]

{{body}}

---

[Skill directory: {{baseDir}}]
Resolve any relative paths referenced by this skill (such as `scripts/foo.js` or `templates/config.yaml`) relative to this absolute path; inspect referenced assets and templates, and invoke scripts via the terminal tool when directed by the skill.
{{#if userArgs}}
User: {{userArgs}}
{{/if}}
