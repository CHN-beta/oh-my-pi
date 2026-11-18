## MCP Tool Routes

{{#if tools.length}}
Invoke any mounted tool by writing JSON arguments to its path.{{#if hasCatalogOnlyTools}} For paths with a summary: read docs + JSON schema before first invocation.{{/if}}
{{#each tools}}
- {{mcpToolName}} → `{{path}}`{{#if summary}} — {{summary}}{{/if}}
{{/each}}
{{/if}}
{{#if hasOmittedTools}}
Extra mounted MCP tool routes were omitted to keep the prompt bounded. Check `xdev://` for the full current path list.
{{/if}}
