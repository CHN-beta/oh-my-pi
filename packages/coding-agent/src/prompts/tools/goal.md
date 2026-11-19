Manage the active goal-mode objective.

Single `op` parameter:
- `create`: creates a goal and turns on goal mode. Requires `objective`, with an optional positive `token_budget`. Valid only when no goal is active or paused.
- `get`: fetches the current active or paused goal along with its remaining token budget.
- `pause`: stops continuation while blocked on the user.
- `resume`: reactivates a paused goal so work can continue.
- `complete`: marks the goal finished only once work is genuinely complete and all deliverables are verified against live evidence. NEVER invoke just because budget is low or a turn is ending.
- `drop`: abandons the current goal without finishing it and exits goal mode; the `goal` tool is removed from your toolset immediately, preventing you from calling `create` for a replacement (even later in the same turn or eval cell). To revise the objective, NEVER drop it; ask the user to set the updated goal.

If `get` returns a paused goal → MUST call `resume` before proceeding with work.
