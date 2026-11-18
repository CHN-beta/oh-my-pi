Note: as of the end of this run {{#if screenLocked}}the screen is locked{{#if displayAsleep}} and {{/if}}{{/if}}{{#if displayAsleep}}the session's display is asleep{{/if}}.{{#if windows}} Windows reports a locked or disconnected session, or an inaccessible input desktop (such as the UAC secure desktop). Neither screenshots nor input can confirm application state until the session is unlocked/reconnected or the secure desktop is dismissed.{{else}}
{{#if displayAsleep}}
- Elements on that display cannot be captured or clicked until it wakes up.
- This refers to the display specified by `computer.display`, or all displays when set to `active` or `all`.
{{else}}
- Display captures show the lock screen and window captures show the window's previous frame behind it, so neither verifies the outcome of this run.
- Background clicks still reach applications behind the lock screen.
{{/if}}
{{#if screenLocked}}
- While locked, apps expose no accessibility windows, causing keystrokes, takeover actions, and accessibility calls to fail.
- The screen remains locked until a user unlocks the Mac.
{{/if}}{{/if}}
