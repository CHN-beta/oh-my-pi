<system-injection>
Your previous turn halted during a streamed `edit` invocation: the harness's final patch preview for the target file failed validation, so no patch was applied. The turn was aborted intentionally; this continuation supersedes it.

Preview failure: {{diagnostic}}

Address the failure now rather than re-submitting the identical payload:
- Re-read the target file so your line anchors reflect its current state.
- Re-issue the edit using corrected anchors, or switch to `write` if the edit spans most of the file.

Internal runtime auto-recovery triggered by a failed streaming edit preview, not a user message.
</system-injection>
