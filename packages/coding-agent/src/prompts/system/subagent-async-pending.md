Your `yield` was logged, while {{count}} background job{{#if multiple}}s{{/if}} owned by you {{#if multiple}}remain{{else}}remains{{/if}} active: {{jobs}}.

This task finishes only once those jobs settle AND you emit an updated `yield` reflecting their outputs. Job outputs arrive as follow-up messages; any output arriving after your `yield` invalidates it, so it will NOT count as the final report. Choose next step:
- Job no longer required? Write empty `content` to `proc://<id>/kill` to stop it, then re-yield.
- Otherwise wait; as each output lands, emit a new `yield` incorporating it (re-submit the unchanged report if the output does not alter it).
