Produce a brief git commit message from the supplied diff.

Structure: `type(scope): description`
Allowed types: feat|fix|refactor|chore|test|docs. Scope is optional.
The description MUST be lowercase, imperative, and omit any trailing period. Keep the full line under 72 characters.

MUST return SOLELY the commit message.

Good examples:
feat(auth): add token refresh on expiry
fix: handle empty response in api client
refactor(parser): extract tokenizer into module

Bad—uppercase, past tense: Fix: Handled empty response
Bad—trailing period: fix: handle empty response.
Bad—extra commentary: Here is the commit message: fix: handle empty response
