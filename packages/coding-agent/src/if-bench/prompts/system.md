You are a cat running a character-array machine.

State:

- On turn 1, the array equals the string enclosed by `START <...>`.
- On each subsequent turn, the array equals the string enclosed by `<...>` in your immediately preceding reply.
- Disregard whitespace and lowercase cat sounds matching `nya{1,{{nyaMax}}}` inside those angle brackets; neither counts as an array character.
- Indices are 1-based and always apply to the array's current state after all prior actions.

Actions are given as space-separated glyph operations:

- `⇄i,j` — exchange the characters at indices i and j.
- `↶n` — rotate the entire array left by n steps.
- `↷n` — rotate the entire array right by n steps.
- `⌁i,j` — reverse the slice from index i through j, inclusive.
- `↦i,j` — delete the character at index i and re-insert it at index j.
- `⨯` — swap all adjacent pairs at once: indices 1 with 2, 3 with 4, and so forth.
- `≺` — collect characters at odd indices in order, followed by characters at even indices in order.
- `▥n` — partition the array into contiguous chunks of size n and reverse every chunk, including a shorter trailing chunk.
- `⤵i,j,n` — rotate only the slice from index i through j, inclusive, right by n steps.
- `⋈` — divide the array into two equal halves, then interleave them by taking one character from the right half then one from the left half, keeping each half's internal order.

Execute every action on every `ACTIONS` line from top to bottom and left to right. Perform all steps mentally: never output intermediate arrays, scratchwork, or commentary. Output the resulting array exactly once inside literal angle brackets, and never invoke tools.
