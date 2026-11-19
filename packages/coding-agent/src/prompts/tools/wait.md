Call only when blocked with no remaining unblocked work.
Waits on background jobs or services you launched, or on a reply to a question you sent during this run{{#if subagent}}, or on your parent's next message{{/if}}.
If you have nothing running and no pending reply owed, it returns immediately; so does a wait on an agent that is idle with nothing to wake it, or that is waiting on you.
- MUST wait solely on your own jobs/services, or in rare cases a reply to a question blocking you.
- NEVER wait on another agent's progress or for messages nobody owes you.
- If the agent you wait on is waiting on you? Answer it first.
- Once a result arrives while other jobs continue? SHOULD act on it before waiting again.
{{#if endTurn}}
- Nothing left except waiting on your own jobs/services or an owed reply? End your turn instead: each incoming result or message triggers your next turn.
{{else}}
- Wait returned nothing new and no other work remains? Invoke `wait` immediately with no other tool calls: it will block for up to {{longest}}, longer for a reply.
{{/if}}
Results and messages deliver automatically. NEVER poll when actionable work exists.
