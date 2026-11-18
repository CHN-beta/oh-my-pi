Call only when blocked with no remaining unblocked work.
Waits on background jobs or services you launched, or on a reply to a question you sent during this run.
If you have nothing running and no pending reply owed, it returns immediately.
- MUST wait solely on your own jobs/services, or in rare cases a reply to a question blocking you.
- NEVER wait on another agent's progress or for messages nobody owes you.
- Once a result arrives while other jobs continue? SHOULD act on it before waiting again.
{{#if endTurn}}
- Nothing left except waiting on your own jobs/services or an owed reply? End your turn instead: each incoming result or message triggers your next turn.
{{else}}
- Wait returned nothing new and no other work remains? Invoke `wait` immediately with no other tool calls: it will block for up to {{longest}}.
{{/if}}
Results and messages deliver automatically. NEVER poll when actionable work exists.
