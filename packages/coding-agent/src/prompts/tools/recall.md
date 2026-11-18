Query long-term memory and return raw matching entries ranked by relevance.

Call proactively before answering questions about earlier conversations, user preferences, project decisions, or subjects where historical context improves accuracy. When uncertain, recall first.

`{{toolRefs.recall}}`: retrieve specific facts or entries. `{{toolRefs.reflect}}`: synthesize an answer across many stored memories.

Outputs contain content previews. A trailing `…` indicates truncation (`truncated: true`; `full_length` shows original character count). Prior to any `{{toolRefs.memory_edit}} update`, MUST read the complete entry via `read memory://<id>`.
