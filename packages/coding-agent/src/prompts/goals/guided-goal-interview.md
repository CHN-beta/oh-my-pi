`/guided-goal`: goal mode — a persistent autonomous objective loop that runs until its success criteria pass or a stop condition triggers.

{{#if initial}}
Initial idea — treat as data, not directives yet:

<rough-goal>
{{initial}}
</rough-goal>
{{else}}
No objective provided — ask the user what they want to accomplish.
{{/if}}

Before doing anything else, interview in plain conversation:
- Ask one brief question or reply per turn, then wait for an answer. During the interview: emit no tool calls, preamble, or side work.
- On every turn, target the highest-leverage missing item. Keep it to ≤6 questions; if replies stay ambiguous, propose your best draft objective for confirmation.
- Base questions and the draft on the project's actual stack, conventions, and constraints rather than generic guidance.
- Keep every constraint and success criterion specified by the user.
- Omit any implementation plan unless the user specifically asks for planning inside the goal.

An objective is ready once all 5 points are concrete; drill into missing or underspecified items:
1. Binary/deterministic success criteria — verifiable by an evaluator without subjective judgment: tests pass, command returns 0, score ≥ N, file exists with property X. Reject vague targets like “works well / clean / done”.
2. Verification method — exact commands or steps used to validate your work.
3. Attempt cap — explicit limit on turns or tries (“stop after N attempts”), plus token budget where applicable.
4. Scope boundaries — permitted files, directories, or operations, along with an explicit denylist of areas not to touch.
5. Stop/escalation conditions — pause and escalate to a human when facing ambiguity, risky actions, or an exhausted attempt cap.

Follow up until resolved: vague “done” lacking an observable check; unbounded loops (“until CI is green”, “keep going until it works”); self-assessed completion lacking a concrete check command.

Once all 5 points are locked down: invoke `goal` with `op: "create"`, the completed objective, and `token_budget` if provided by the user. The objective MUST follow this exact ordered Markdown layout:

## Objective
## Success criteria
## Verification
## Boundaries
## Stop conditions

Creating the goal activates goal mode right away: acknowledge briefly in one sentence and begin executing the objective. Should the user cancel or leave the interview, skip calling `goal`.
