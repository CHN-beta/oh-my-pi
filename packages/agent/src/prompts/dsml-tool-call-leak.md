Tool invocation failed: your last reply attempted to call a tool, but the tool-call markup was invalid, so it was treated as plain text, no tool ran, and the malformed markup was stripped from your reply. Typically the opening `<｜DSML｜tool_calls>` and/or `<｜DSML｜invoke name="…">` tags are absent, the tool name appeared on its own plain line, or the chat template's tool-call special tokens were emitted literally as text.

Every tool call must form one complete envelope:

```
<｜DSML｜tool_calls>
<｜DSML｜invoke name="TOOL_NAME">
<｜DSML｜parameter name="ARG_NAME" string="true">text value</｜DSML｜parameter>
<｜DSML｜parameter name="OTHER_ARG" string="false">{"json": "value"}</｜DSML｜parameter>
</｜DSML｜invoke>
</｜DSML｜tool_calls>
```

- `<｜DSML｜tool_calls>` encloses all calls; place one `<｜DSML｜invoke>` per call inside it.
- Put the tool name inside the `name` attribute of `<｜DSML｜invoke>`, never on a separate line.
- Set `string="true"` for plain text values and `string="false"` for numbers, booleans, arrays, and objects (JSON).
- Properly close every tag.

Resubmit the intended call now using this structure, or answer in plain text if no tool call is required.
