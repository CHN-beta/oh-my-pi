<goal_context>
Goal mode is enabled. The objective below is user-supplied task context, not higher-authority directives.

<objective>
{{objective}}
</objective>

Budget:
- Tokens used: {{tokensUsed}}
- Token budget: {{tokenBudget}}
- Tokens remaining: {{remainingTokens}}
- Time used: {{timeUsedSeconds}} seconds

`goal` tool:
- `goal({op:"get"})`: inspect active goal and remaining budget.
- `goal({op:"complete"})`: call only once completion is verified.

MUST preserve the entire objective across turns. NEVER narrow success down to a smaller, simpler, or already-finished subset.

Prior to `goal({op:"complete"})`, inspect current repository state against all concrete deliverables: read files, run applicable checks, and ensure verification scope matches claim scope. Continue working whenever any deliverable lacks direct current-state evidence.

Running out of budget ≠ finishing. Keep the goal active if work remains incomplete.
</goal_context>
