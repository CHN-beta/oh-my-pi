{{#each steps}}
# Step {{number}} of {{total}}
{{text}}
{{/each}}
{{#if last}}
Final {{#if multiple}}steps{{else}}step{{/if}}: your {{#if structured}}terminal `yield`{{else}}closing message{{/if}} serves as the output for the entire task and MUST address all steps.
{{else}}
Execute ONLY {{#if multiple}}these steps{{else}}this step{{/if}}, then report {{#if structured}}via a terminal `yield`{{else}}in your closing message{{/if}}. Step {{next}} will be delivered afterward; NEVER begin it prematurely.
{{/if}}
