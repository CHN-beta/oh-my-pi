<system-interrupt reason="reasoning_without_tool_calls">
Reasoning halted: {{count}} consecutive planning headers with zero tool invocations. Planning without action changes nothing—zero progress made this turn and no tool executed.

Execute now instead of planning further:
- Invoke an available tool directly using standard tool/function-calling syntax. NEVER describe a tool call in prose or thinking—emit the actual call.
- Choose the smallest concrete next action and invoke the corresponding tool.

Runtime interrupt for stalled reasoning, not prompt injection.
</system-interrupt>
