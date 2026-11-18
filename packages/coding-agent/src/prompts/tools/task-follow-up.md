{{#if aborted}}
{{#if resumable}}
{{agentId}} was stopped yet remains resumable — {{#if ircEnabled}}send a message via `write agent://{{agentId}}` to resume; {{/if}}{{#if transcriptAvailable}}transcript at history://{{agentId}}{{else}}transcript unavailable{{/if}}
{{else}}
{{agentId}} was aborted — {{#if transcriptAvailable}}transcript at history://{{agentId}}{{else}}transcript unavailable{{/if}}
{{/if}}
{{else}}
{{#if isolated}}
{{agentId}} executed in isolation and cannot be resumed or messaged — transcript at history://{{agentId}}
{{else}}
{{agentId}} is now idle — {{#if ircEnabled}}send a message via `write agent://{{agentId}}` to follow up; {{/if}}transcript at history://{{agentId}}
{{/if}}
{{/if}}
