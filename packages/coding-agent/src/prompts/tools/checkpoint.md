Context checkpoint: start prior to exploratory investigation; later call `rewind` to keep only a concise summary report.

Intended for deep investigations involving many intermediate tool calls (`read`/`grep`/`glob`/`lsp`/etc.) to reduce downstream context usage.

Constraints:
- MUST call `rewind` before yielding once a checkpoint has been opened.
- NEVER open a new `checkpoint` while one is already active.
- Subagents: off by default. To enable, include `checkpoint` or `rewind` in the agent definition's `tools:` frontmatter (the paired tool is added automatically); also requires `checkpoint.enabled` in settings.

Standard sequence:
1. `checkpoint(goal: …)`
2. Exploratory research
3. `rewind(report: …)` with summarized findings

Calling `rewind` drops intermediate checkpoint messages from active context and substitutes the report.
