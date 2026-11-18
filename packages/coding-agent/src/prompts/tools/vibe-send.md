Deliver a message to a worker session using its ID from `vibe_spawn`/`vibe_list`. The session preserves its full conversation history, so write naturally ("now apply the same fix to the other module").

Returns immediately with an acknowledgment status:
- `turn`: worker is idle → starts a new turn; output delivers automatically upon completion.
- `steered`: worker is mid-turn → injects the message into the running turn as live steering.
- `queued`: worker is mid-turn and cannot currently be steered → runs automatically as the next turn.

Use for follow-up tasks, corrections, scope updates, or review requests. NEVER repeat earlier context; the session retains it already.
