Match files and directories by glob: `;`-separated paths or internal URLs (`local://*.md`); defaults to workspace root.
`gitignore` and `hidden` default to true; set `gitignore: false` to include ignored dotfiles. Sorted newest-first within each directory; directories carry a trailing `/`.
{{#ifAny eagerDelegation hasFind}}
{{#if hasFind}}Behavioral search → `find`.{{/if}}
{{#if eagerDelegation}}Multi-step exploration → {{#if scoutAvailable}}Task + scout{{else}}Task{{/if}}.{{/if}}
{{/ifAny}}
