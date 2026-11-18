Submit a compressed version of the source draft along with every omission.

- `text`: complete, verbatim, final-form compressed text; NEVER send a diff, summary, or change log.
- `losses`: one item for every dropped claim, qualifier, default, bound, example, or exact literal; quote or identify it and explain why dropping it stays accurate. Pass an empty array if nothing was lost.

Each call triggers a review turn → respond with the draft, measured size, and declared losses, and ask for a verdict. Calling `rewrite` supersedes the draft; `approve` finalizes it.

<critical>
- Report losses candidly: declared losses can be audited, whereas undeclared losses cause silent regressions.
- `text` MUST be self-contained so a reader lacking the source can follow it directly.
- Submitting a new draft invalidates any previous approval.
</critical>
