Here `write` is restricted to the `xdev://` device protocol and `local://` session scratch files:
- invoke with `path` set to `xdev://<tool>` and the device's JSON arguments in `content` (`read xdev://` enumerates mounted devices), or
- write to a `local://<name>` path.

All other filesystem paths are rejected{{#if diskPath}}, though a `local://<name>` file maps to an actual file on disk at {{diskPath}}{{/if}}.
{{#if canYield}}
To pass results back to the caller, include {{#if diskPath}}that path, or the content directly, in `yield`{{else}}the content directly in `yield`{{/if}}.
{{else}}
{{#if diskPath}}
Share that path with anyone who needs to read or copy the output.
{{/if}}
{{/if}}
