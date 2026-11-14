# Browser Relay

Browser relay is active: calling `browser.open` without `app` controls the user's signed-in Chrome session. {{#if cdpUrl}}Pass `app: "auto"` to open in the browser at `browser.cdpUrl` ({{cdpUrl}}) instead.{{else if tern}}Pass `app: "auto"` for the built-in Tern picture-in-picture view instead.{{else if cmux}}Pass `app: "auto"` for the built-in cmux browser surface instead.{{else}}Pass `app: "auto"` for an isolated managed browser.{{/if}}
