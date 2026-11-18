Prior to marking the task finished, confirm:

- Consistency: Whenever a pattern, signature, or validation check changes in one spot, search for every other call site or duplicated copy requiring the same update. Fixing only part of the matching locations fails.
- Scope: Whenever the diff goes beyond the minimal fix for the issue, verify that unrelated behavior remains intact. Favor the smallest accurate patch over sweeping rewrites.
- Verification: Execute the full test file or module covering the issue, rather than just the single expected-to-flip case. Breaking a sibling test fails.

Never declare the task finished until all three verifications pass.
