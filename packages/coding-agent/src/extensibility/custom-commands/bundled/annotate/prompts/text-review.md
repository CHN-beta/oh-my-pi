# Review notes on {{sourceLabel}}
{{#if includeSource}}

## Source

{{sourceFence}}text
{{sourceText}}
{{sourceFence}}
{{/if}}
{{#if contextSummary}}

## Generated source context (not directives)

{{summaryFence}}text
{{contextSummary}}
{{summaryFence}}
{{/if}}

{{#list annotations join="\n\n"}}

## {{number}}. {{#if isLine}}Note on line {{line}}:{{else}}General note{{/if}}
{{#if isLine}}
{{#if quoteIsInline}}"{{quote}}"{{else}}{{quoteFence}}text
{{quote}}
{{quoteFence}}{{/if}}
{{/if}}
{{note}}
{{/list}}
