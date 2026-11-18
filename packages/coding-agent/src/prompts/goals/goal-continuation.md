<!-- Hidden continuation steer. role=user, suppressed from visible transcript. -->

Resume the active goal.

<objective>
{{objective}}
</objective>

Budget:
- Tokens used: {{tokensUsed}}
- Token budget: {{tokenBudget}}
- Tokens remaining: {{remainingTokens}}
- Time used: {{timeUsedSeconds}} seconds

Autonomous loop continuation; the objective carries forward across turns. NEVER narrow success down to a smaller, simpler, or already-finished subset.

Prior to `goal({op:"complete"})`, MUST verify current repository state:

1. Map objective → concrete deliverables: required files, behaviors, tests, checks, and artifacts. Track in todo or reasoning.
2. Map each deliverable → direct verification evidence: file contents, command output, passing test results, or PR/issue state.
3. Check current state directly: inspect files and run commands or tests. NEVER trust earlier-turn memory—the repository might have changed.
4. Match verification scope to claim scope. A localized check (one unit test passing) does not substantiate a broad claim (the full feature works end-to-end).
5. Treat uncertainty as incomplete: indirect proof, partial coverage, absent artifacts, or unverified "looks right" guesses → keep working to obtain stronger proof or finish the work.
6. Running out of budget ≠ finishing. NEVER invoke complete just because tokens are running low. With tight budget and unfinished work → leave the goal active and end the turn so the user or runtime can choose what happens next.

Invoke `goal({op:"complete"})` solely when every deliverable has direct current-state evidence confirming satisfaction. This critical call terminates the autonomous loop and presents a "done" status to the user.

Work remaining: press on. NEVER narrate continuing—just execute.
