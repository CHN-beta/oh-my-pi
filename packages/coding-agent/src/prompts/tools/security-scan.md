Repository security scans: plan, start, inspect, cancel, and validate.
`preflight`: creates an immutable scan plan pinned to the repository snapshot, model, and OAuth credential.
`start`: launches the planned scan as a background job.
`status`, `cancel`: query or stop by operation ID.
`cloud_scans`: lists Codex Security cloud configurations for the selected ChatGPT OAuth account.
`cloud_start`: creates or enables a cloud configuration with `repository_id`, `repository_url`, and `environment_id` (uses the account's Codex Security cloud quota; NEVER falls back to a local scan).
`cloud_status`: checks cloud scan progress.
`cloud_pull`: imports cloud findings into the local security store under `security://`.
Cloud actions require `cloud_configuration_id`; `credential_id` MAY pin the account.
Requires security features to be enabled in settings.
