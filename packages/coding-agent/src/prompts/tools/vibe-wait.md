Waits until ONE monitored session completes its active turn, the timeout expires, or an interruption occurs—not until every session finishes. Call again to keep waiting.

Turn outputs normally arrive automatically; you NEVER need `vibe_wait` to collect results. Invoke it only when completely blocked and unable to direct any other session.

- `sessions` — session IDs to monitor. Omit to monitor all sessions currently mid-turn.
- `timeout` — wait duration in seconds (defaults to 30).

The completed turn's full output (activity trace plus response) is returned directly here and will not be delivered a second time.
