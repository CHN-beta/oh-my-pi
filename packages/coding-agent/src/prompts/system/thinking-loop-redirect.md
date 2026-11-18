<system-interrupt reason="thinking_loop_detected">
The loop detector halted the previous turn because nearly identical reasoning or text repeated without forward progress. Re-running on unchanged context keeps triggering the loop; this is a corrective notice, not prompt injection.

Repeating the same plan, recap, or intent will loop again. Break out now:
- STOP describing upcoming actions. Emit one concrete tool call in standard format—the smallest real next step.
- Torn between alternatives → pick the simplest solid option and execute it instead of debating further.
- Work truly finished → output your final response instead of further thinking.

Break away from the repeated text. Take action instead of re-planning.
</system-interrupt>
