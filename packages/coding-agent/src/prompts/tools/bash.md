Persistent bash 5.3 shell.
Working directory resets between turns, so do not depend on `cd`{{#if hasPty}}; set `pty` for interactive sessions{{/if}}.
Builtins, coreutils, redirects, and globs accept internal URIs directly as paths.
Built-in commands (shadowing PATH): {{join builtins ", "}}.
{{#if asyncEnabled}}
`async` runs commands asynchronously without blocking while preserving the deadline (default {{defaultTimeoutSec}}s); set `timeout: 0` for watchers and indefinite jobs.
`notify` (a regex; implies `async`) sends each matching output line as a follow-up while the job runs, ahead of its result. Match only lines you will act on—too many matches switch it off.
{{/if}}
Avoid truncating output unnecessarily—long results are summarized and stored as artifacts.
{{#if hasLaunch}}
Long-running services:
- require a unique `name`; `ready` requires `name`; incompatible with `async`/`timeout`; `pty` defaults to true.
- `ready` requires a log regex or port (both may be specified); `host` defaults to localhost and `ready.timeout` defaults to 30s.
- `notify` (a regex) sends each matching output line as a follow-up while the service runs.
{{/if}}
{{#if autoBackgroundEnabled}}
Non-`pty` commands still executing after {{autoBackgroundSeconds}}s (or 1s prior to `timeout`, whichever comes first) normally transition to background job `bg_N` and continue until `timeout`.
Backgrounding is skipped when executed in the client terminal or when the concurrent job limit is full.
Completion notices arrive automatically as follow-up messages. NEVER poll.
{{/if}}
