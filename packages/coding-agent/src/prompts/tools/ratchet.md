Construct a reliable evaluation for a single LLM workflow, then iteratively optimize it one change per round via global `ratchet(flow)`, retaining only changes that also improve held-out test cases.

Derived from the claude-api skill's build-eval, eval-audit, and hillclimb guides (Apache-2.0, github.com/anthropics/skills).

# Contract
- The host is authoritative for truth: content-hashed approvals, the frozen train/test split, completeness checks, held-out isolation, and keep/revert verdicts.
  NEVER edit `_state.json` directly; follow gate verdicts literally.
- What counts is the test-split improvement over baseline; train-split gains are merely intermediate signal.
- You inspect scores only. Train transcripts are reviewed by an isolated analyzer; test transcripts are never generated.
- Test one hypothesis per round. Describe failure patterns, NEVER paste case content into the tuned artifact.
- Message the user only at the required gates below and with a one-line status update per round; everything else executes autonomously.

# API (Python; JS identical with camelCase options: `offLimits`, `testFraction`)
`r = ratchet("inbox-routing")` opens or binds a flow stored at `.omp/ratchet/<flow>/`. All methods are async and return plain data structures.
- `await r.init(cases=[…], harness=[…], change=[…], off_limits=[…], command=None)` — paths relative to repository root.
  - `cases`: case inputs and reference answers.
  - `harness`: runner, grader, and supporting eval scripts.
  - `change`: the tunable surface you are allowed to modify (must be disjoint from `cases`/`harness`/`off_limits`).
- `await r.plan(…)` — configure any subset of fields:
  ```python
  await r.plan(goal={"target": "pass", "direction": "higher", "hold": ["cost_usd"], "directions": {}},
      reps=2, stop={"plateau": 3, "rounds": 8},
      command="bun eval/run.ts --variant {variant} --out {flow_dir}/{variant}",
      prices={"model-id": {"in": 3, "out": 15}})
  ```
  - Target: a `grade` metric (`score` for scalar outputs), `cost_usd`, `latency_s`, or any numeric row field.
  - Guardrails assume higher-is-better by default, except `cost_usd` and `latency_s`.
  - Costs are computed from the model catalog using each row's served `model` × `usage` (plus `judge_model` × `judge_usage`).
    Provide `prices` (USD per MTok) for models missing from the catalog.
- `await r.split({case_id: primary_tag, …}, test_fraction=0.4, seed=None)` — randomized split stratified by tag, locked once the baseline gate runs.
- `await r.approve(stage, question=…, preview=…)` — `stage` ∈ `inputs | grader | plan`.
  - Prompts via host dialog; returns `{approved}` or `{approved: False, aborted, feedback}`.
  - Each approval hashes current files/plan; modifying them invalidates it. Up-to-date approvals return immediately without prompting.
- `await r.check(variant)` — preflight verification: checks approvals are current and `variant` follows sequence (`baseline`, `v1`, `v2`, …).
  Returns resolved `command`, `expected_rows`, and `out_dir`.
- `await r.gate(variant, change="one line")` — checks completeness and held-out isolation, calculates paired per-case deltas against the current best round,
  logs the round, and updates `status.md`.
  - Returns `decision` (`baseline | keep | revert | rerun`), `reasons`, `warnings`, `deltas`, `plateau`, `done`, and `table`.
  - Rejects (recording nothing) if:
    - a `(case, rep)` slot has duplicate result rows
    - a guardrail has under 2 measured cases per split (e.g., unpriced models when holding `cost_usd`)

    Repair the data or supply `prices`, then re-run `gate`.
  - Rounds where slots only produced errors force `rerun` and can never result in `keep`.
- `await r.train(variant)` — builds analyzer inputs: train rows, train trace paths, and per-case target history across rounds.
- `await r.status()` — returns approval states (`missing | stale | current`) and the round summary table.

# Runner contract
The runner should match the project's language/idioms and invoke the application's genuine entry point rather than a mocked model call.
Artifacts written to `{flow_dir}/{variant}/`:
- `results.jsonl`: one JSON line per `(case, rep)`, flushed as each completes:
  - `prompt_id`, `rep`, `prompt`, `tags` (`tags[0]` defines the split stratum)
  - `grade` (boolean, number, or `{metric: number}`), `explanation?`, `status` (`ok | truncated`)
  - `model` captured from the API response, `usage`, `latency_s`, plus optional `judge_model`/`judge_usage`
- `errors.jsonl`: trials failing to yield a scorable response (exhausted API retries, timeout, grader exception, model mismatch)
  with a failure category. NEVER record a zero score in `results.jsonl`.
- `traces/<id>_rep<k>.json`: complete transcript formatted as `[{role, content, thinking?, name?}]` with `role` ∈ `system | user | assistant | tool_call | tool_result`.
  **Train IDs only**; the gate rejects runs containing any test trace.
- Must support idempotent resume by `(case, rep)`, enforce strict per-case wall-clock timeouts, use jittered backoff recording retry counts,
  apply strict grading (passing only on retry counts as a fail unless the user specifies otherwise), cap concurrency near rate limits, and isolate state across trials.
- Ground truth must remain accessible solely to the grader—never exposed in the app's prompts, tools, sandbox, or anywhere visible to the evaluated model.

# Phase 1 — Grill (one `ask` form)
Inspect the codebase first, then collect all requirements in a single `ask` form with recommended defaults preselected:
- Target flow and entry point, plus what each input case provides (files, profile, conversation prefix).
- Source of eval cases, in descending order of preference:
  1. production transcripts (verify retention/PII policies before copying; if unstoreable, store IDs and fetch dynamically)
  2. bug reports and support tickets
  3. 5–10 user-authored cases
  4. synthetic cases grounded in 3–5 real examples and known failure modes.
- Optimization goal: improve the primary quality metric, reduce cost/latency at equal quality, or migrate models while preserving quality.
- Mutable surface (system prompt, skills/instructions, tool descriptions, model/effort/params, harness code) versus off-limits files.
- Stopping criterion: plateau (default), fixed N rounds, or interactive step-by-step.
If an eval already exists → reuse its cases, grader, and runner, adding only a lightweight adapter to match the contract above.

# Phase 2 — Build
1. Cases: target 15–100 items.
   - Include both positive and negative cases (should-trigger and should-not-trigger).
   - Select difficult cases based on human-identifiable complexity, never because the current model happens to fail them.
   - Document provenance of reference answers; never treat a compared model's output as ground truth.
2. Run `r.init(…)`, then `r.approve("inputs", question=…, preview=<compact table of all cases>)`. Iterate until approved.
3. Choose the cheapest accurate grader for the property:
   deterministic check (label, schema, exact/normalized match, tests, final environment state for agents)
   → blind pairwise judge (randomized A/B order, ties permitted, outputs treated as untrusted data)
   → pointwise rubric of verifiable criteria (avoid vague 1–5 scales)
   → human audit.
   Keep judge model distinct from the model under test. Track distinct properties via separate metrics and report confusion-matrix metrics for classification.
4. Implement the runner per contract. Run a 3–5 case pilot and inspect one full row: verify `model`, `usage`, trace, and `grade` are populated and sensible.
   Any zeroed or constant column points to a runner bug.
5. Sanity-check the grader and runner:
   - an oracle (gold answers) scores ~100% while a null baseline (empty/constant) scores ~0%
   - the judge rejects empty outputs, "I don't know", and confident off-topic replies
   - grading an identical output twice yields consistent verdicts
   - simulated API failures are logged to `errors.jsonl`.
6. Run `r.approve("grader", question=…, preview=<5 graded pilot cases showing input, output, grade, and judge rationale>)`.
   Disagreements with how the user would grade indicate the grader needs refinement.

# Phase 3 — Plan and baseline
1. Call `r.split({id: tag})` and `r.plan(goal=…, reps=…, stop=…, command=…)`.
2. Estimate pass-rate noise floor as ≈ `1/sqrt(n_test · reps)` (25 cases × 2 reps ≈ ±14 pts).
   If noise exceeds the minimum meaningful improvement, increase reps or case count before seeking approval.
3. Run `r.approve("plan", question=…, preview=<mutable vs off-limits table, goal, cases × reps × model, scaled wall-clock estimate from pilot, stop condition>)`.
   This is the final human gate.
4. Execute `r.check("baseline")` → run its `command` asynchronously via `bash` → once finished, call `r.gate("baseline")`. Act on any warnings:
   - baseline already near ceiling → re-target toward cost or latency
   - train/test distribution skew → notify the user
   - infrastructure errors → repair the runner first.

# Phase 4 — Climb (unattended)
In each round `vN`:
1. **Analyze** — `view = await r.train(prev)`; launch a fresh analyzer: `agent(prompt, schema=CHANGE)`
   passing the view, current tuned files, mutable scope, off-limits paths, target metric, and guardrails. Request:
   - lowest-scoring train cases alongside a few passing ones for comparison
   - the primary behavior hurting the target metric
   - verbatim quoted evidence referencing trace paths
   - ONE unified diff
   - predicted regression cases.

   `CHANGE = {"behavior": str, "evidence": [{"trace": str, "quote": str}], "diff": str, "expected_regressions": [str]}`.
   Initial rounds may test structural levers (tool descriptions, effort) rather than prose tweaks.
2. **Apply** — trim bloat first (remove filler platitudes, restated defaults, "be careful" admonitions). Modify only `change` paths;
   save `vN/change.md` (first line: one-line summary, followed by rationale) and `vN/change.patch`. For config changes, test one case before running the full suite.
3. **Run** — call `r.check("vN")`, then execute the returned command via `bash` async. Remain idle or reply to the user while results auto-deliver.
4. **Gate** — call `r.gate("vN", change=<one line>)` and follow its decision:
   - `keep` → continue from this state
   - `revert` → `git apply -R vN/change.patch`
   - `rerun` → retry failed slots, or add reps to both `vN` and the best round before gating `vN` again.

   Emit one status line: decision, test score ± noise, and best score so far.
5. Any judge-scored jump larger than the edit plausibly explains should be treated as a grader bug and spot-checked.
6. `plateau: True` → diagnose failure categories before attempting another content edit (below). `done: True` → proceed to report.

# Stall — categorize, don't grind
Lock the rubric first, then run `judge_batch` across all remaining train failures (state = case row + trace excerpt):
```json
{"cause": {"type": "choice", "instructions": "Why did this eval case fail?", "criteria": {
  "artifact_gap": "The model lacked a fact or instruction the tuned surface should provide.",
  "grader": "The output looks correct but the grader or expected answer marks it wrong, or task and rubric ask for different things.",
  "harness": "Infra, timeout, empty, or environment failure rather than a model answer.",
  "structural": "The needed content exists but the model did not reach or apply it.",
  "variance": "Identical inputs flip between pass and fail across reps."}}}
```
Inspect low-confidence classifications manually. Act by category:
- `artifact_gap` → continue hillclimbing
- `grader` → repair grader, re-approve `"grader"`, re-score all saved variants, and reset from baseline if variant ranking changes
- `harness` → repair runner and re-approve
- `structural` → restructure (merge, surface earlier, improve routing) rather than appending more text
- `variance` → present best-so-far or increase reps.

Multiple independent small gaps → address together in a single breadth round.
Modifying the grader, reps, or price overrides mid-loop automatically invalidates approvals; obtain fresh approval via dialog.
Editing cases after the baseline run cannot be re-approved in the same flow: initialize a new flow instead.

# Phase 5 — Report
Ensure the tuned surface matches the winning round (marked ★ in `status()`). Update `narrative.md` with the status table, followed by:
- Recommended change
- Comparison vs baseline (test delta with confidence intervals; if within noise, state that clearly and advise against merging)
- Confidence/validation evidence
- Alternatives explored

Label every kept edit `[REQUIRED]` (fixes an actual defect) or `[TUNE]` (preference/tuning choice).
Provide 2–3 before/after train transcript pairs, a breakdown of failures if zeros stem from mixed causes, and unexplored levers.
Finally, ask once whether to commit the eval artifacts (runner, cases, grader, flow directory excluding `traces/`).

# Headless
Without `ask`, never create or approve a flow.
Resume only a flow whose `status()` reports all approvals as `current`; otherwise halt and explain that an interactive session is needed.
