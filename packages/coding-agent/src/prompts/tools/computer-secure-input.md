Note: when this run ended macOS secure input was active{{#if secureInputApp}}, held by `{{secureInputApp}}`{{/if}} (a password field has keyboard focus, or terminal secure keyboard entry is enabled).
- While active, macOS blocks key events from reaching the agent, so pressing Escape will not stop takeover input and typing will not trigger `UserIntervened`.
- Outbound input still works; `capabilities()` reports `secureInput` and `globalEscape: false` until secure input is released.
