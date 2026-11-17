Executes a mounted `xdev://` tool device: `path` is `xdev://<tool>` and `content` is the device's JSON arguments object. `read xdev://` lists the mounted devices; `read xdev://<tool>` shows a device's full docs.

It also writes `local://` session scratch files (reports, drafts, notes). Every other path—working tree, other internal URLs—is rejected.
