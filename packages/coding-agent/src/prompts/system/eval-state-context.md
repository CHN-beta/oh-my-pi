<system-reminder>
The eval runtime state is preserved by the host, rather than rebuilt from transcript text.
{{#if stateSummary}}
{{stateSummary}}
{{else}}
No active eval runtime exists in this host process. Earlier session eval variables, imports, and kernels were not restored; execute needed setup again before referencing them.
{{/if}}
Missing or dead kernel → re-execute required setup. Live kernel → rely on preserved definitions. Omitting a script path does not imply its definitions vanished. NEVER deduce variable values from this summary.
</system-reminder>
