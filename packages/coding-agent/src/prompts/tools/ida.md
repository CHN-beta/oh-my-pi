IDA Pro (idalib) database operations: lifecycle control, structured annotations, and Python `exec` inside the database.

<instruction>
- Each opened DB runs inside an `omp.ida.<id>` daemon visible in `omp ps`, shared across all agents, subagents, and processes in the project.
- Open DBs persist across compaction. Use `list` to enumerate them.
- Up to `ida.maxOpen` (default 4) remain open concurrently:
  - opening another saves and closes the least recently used idle DB
  - DBs idle beyond `ida.idleCloseSec` (default 15 min) auto-save and close
  - reopening is quick, though it clears the `exec` namespace
- `db` takes a binary or `.i64`/`.idb` path (`<bin>:@<arch>` for a universal Mach-O slice), an active db id, or its daemon name.
- `db` MAY be left out when a single DB is open.
- `read <binary>` opens or initializes the DB and prints its overview; `open` performs the same without rendering a view.
- Plain binaries store their IDB under `~/.omp/agent/idbs/<sha16>-<name>/` (leaving the binary untouched); `.i64`/`.idb` files open directly in place.
- Inspect via `read` selectors: `<bin>:<func|0xaddr>` for pseudocode, `:<func>:asm`, `:imports`, `:exports`, `:strings`, `:xrefs:<func|0xaddr>`.
- Modify via `ida` (`rename`, `comment`, `set_type`, `make_function`) or via `exec`.
- `target` accepts a symbol name or `0x` address; `_`-prefixed Mach-O symbols match without the leading underscore.
- `exec` evaluates Python inside the DB worker process.
- Pre-imported in `exec`: `db` (ida_domain Database), `ida_domain`, `ida_*` modules, `idautils`, plus helpers accepting a symbol name, `0x` string, or integer ea:
  - `resolve(t)`, `func(t)`, `name_of(ea)`
  - `pseudocode(t)`, `asm(t)` → str
  - `xrefs_to(t)`, `xrefs_from(t)` → dicts; `callers(t)`, `callees(t)` → names
  - `functions(pattern)`, `strings(pattern)`, `imports(pattern)` → tuples (optional case-insensitive regex)
  - `hexdump(t, size=64)`, `read_bytes(t, size)`
  - `rename(t, name)`, `comment(t, text, repeatable=False)`, `set_type(t, decl)`, `make_function(t)`
  - `help_ida()` prints all available helpers
- Each DB maintains a persistent `exec` namespace shared by all agents; the final expression's `repr` is returned after `=>`.
- `exec` defaults to a 120 s timeout: sends SIGINT first, then terminates the worker.
</instruction>

<examples>
```
ida(action: "rename", db: "./bin/server", target: "sub_401000", name: "parse_header")
ida(action: "set_type", target: "parse_header", decl: "int __fastcall parse_header(const uint8_t *buf, size_t len)")
ida(action: "exec", code: "[(hex(ea), n) for ea, n in functions('crypt|aes')]")
```
</examples>

<critical>
- Modified DBs auto-save ~10 s after worker idle; `save` flushes immediately.
- Killing a worker (timeout ignoring SIGINT, crash, or `omp ps kill`) discards only edits made after the previous save.
</critical>
