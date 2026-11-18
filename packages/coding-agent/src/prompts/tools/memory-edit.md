Modify Mnemopi long-term memory entries by ID, using only IDs obtained from `{{toolRefs.recall}}`.

Supported operations:
- `update`: working memory; overwrite content and/or importance.
- `forget`: permanently erase working memory.
- `invalidate`: soft-retire working or episodic memory, with optional `replacement_id`.

Fact IDs — `{{toolRefs.recall}}` entries tagged `[facts]` — are read-only. View them via `read memory://<id>`; attempting any edit returns `not_editable`.

Use `invalidate` for outdated memories worth keeping in history; reserve `forget` for entries requiring permanent removal.

MUST fetch the complete memory prior to `update`. Recall snippets are truncated: a trailing `…` indicates truncation and `full_length` reports the full length. Because `update` replaces content entirely, updating from a snippet drops the unshown tail. Always `read memory://<id>` first, then submit the combined text in `content`.
