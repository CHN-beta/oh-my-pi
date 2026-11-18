<critical>
- NEVER modify project files — perform read-and-verify discovery only.
- MUST execute each candidate command once.
- Final output: a single JSON object conforming to the schema below, with no prose or code fences.
</critical>

# Checker Discovery

User invoked `omp cleanse` to find and fix: **{{request}}**

Determine the exact project command(s) that report these diagnostics for orchestrator execution, output parsing, and repair-agent assignment.

<workflow>
1. Check manifests, configuration files, lockfiles, and scripts for applicable tooling.
2. Identify the exact command and working directory, favoring project-local executables (`node_modules/.bin`, `.venv/bin`, wrappers such as `gradlew`) over system-wide tools.
3. Favor structured output supported by a known parser below; otherwise fall back to gcc-style `file:line:col: severity: message` lines with parser `generic`.
4. Run each command once to confirm execution succeeds and output conforms to the selected parser. A non-zero exit with parseable diagnostics is expected; crashes or CLI usage errors are not.
5. When multiple commands cover the request, include one entry per command.
</workflow>

## Known parsers

|id|expected output|
|---|---|
|`rust`|`cargo … --message-format=json`|
|`rust-test`|`cargo test … --message-format=json`|
|`go`|`go vet -json`|
|`go-test`|`go test -json`|
|`staticcheck`|`staticcheck -f json`|
|`golangci`|golangci-lint default text output|
|`ruff`|`ruff check --output-format=json`|
|`pyright`|`pyright`/`basedpyright` `--outputjson`|
|`mypy`|mypy default text output|
|`pylint`|`pylint --output-format=json`|
|`flake8`|flake8 default text output|
|`ty`|`ty check --output-format concise`|
|`eslint`|`eslint --format=json`|
|`biome`|`biome check --reporter=json`|
|`oxlint`|unix-format lines `file:line:col: message [Error/rule]` (`--format=unix`)|
|`deno-lint`|`deno lint --json`|
|`stylelint`|`stylelint --formatter json`|
|`rubocop`|`rubocop --format json`|
|`phpstan`|`phpstan analyse --error-format=json`|
|`psalm`|`psalm --output-format=json`|
|`swiftlint`|`swiftlint lint --reporter json`|
|`dart`|`dart analyze --format machine`|
|`credo`|`mix credo --format=json`|
|`shellcheck`|`shellcheck --format=json1`|
|`hlint`|`hlint --json`|
|`terraform`|`terraform validate -json`|
|`tflint`|`tflint --format=json`|
|`actionlint`|actionlint with its JSON `-format` template|
|`generic`|gcc-style `file:line:col: severity: message` lines (tsc/tsgo `--pretty false`, mypy, clang, zig, MSVC-style)|

## Output schema

```json
{
	"checkers": [
		{
			"label": "tsc (packages/app)",
			"language": "TypeScript",
			"cwd": "packages/app",
			"command": ["tsc", "--noEmit", "--pretty", "false"],
			"parser": "generic"
		}
	]
}
```

- `command`: argv array whose first item is a binary name or project-relative path. NEVER wrap in a shell.
- `cwd`: project-relative working directory; leave out for the project root.
- `parser`: known parser id; leave out for `generic`.
- Output `"checkers": []` solely when nothing in this project emits the requested diagnostics.
