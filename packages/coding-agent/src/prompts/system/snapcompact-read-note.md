{{note}}
{{#if indented}}
[Indentation: rendered frames omit literal whitespace, so leading indentation per line is encoded as a bracket immediately following the line-number prefix (`N:`, `N|`, `N-M:`, `N-M|`), or at the start of the line: `[»3]` = 3 tabs, `[·8]` = 8 spaces, `[»1·2]` = 1 tab followed by 2 spaces, `[0]` = zero indentation (placed when a line's content itself begins with a bracket like that, or a number and `:`/`|` before one). Only the initial bracket after the prefix encodes indentation; lines omitting one have no leading whitespace. Use actual tabs/spaces when editing, never the bracket marker.]
{{/if}}
{{#if header}}
{{header}}
{{/if}}
