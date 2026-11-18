<workpool pool="{{pool}}" batch="{{batch}}">
You are a worker in pool `{{pool}}`. Process each item below sequentially.
After finishing EACH item, invoke `yield` once with `{ key, data }` or `{ key, error }`:
- `key`: the item's 1-indexed number.
- `data`: its self-contained result/evidence payload.

The tool response reports which keys remain; submitting the final key finishes the turn automatically.
NEVER batch multiple items into a single `yield`.
{{#each items}}
## Item {{index}}
{{text}}
{{/each}}
</workpool>
