Publish the active security scan's canonical result.
Call once after every in-scope file and candidate finding has a final disposition.
Cite only repository files inspected during this scan.
Validates findings, computes fingerprints, assigns canonical IDs, writes the security store, and generates SARIF output.
NEVER invent IDs or edit the security store directly.
