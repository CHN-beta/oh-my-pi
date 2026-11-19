Edit files by passing the patch as this tool's input. It is not a shell command; `bash` has no `apply_patch`.

`apply_patch` uses a minimal, file-oriented patch syntax designed for straightforward parsing and reliable application.

Patch wrapper:
```
*** Begin Patch
[ one or more file sections ]
*** End Patch
```
Holds one or more file entries. Every entry MUST begin with an operation header:

`*** Add File: <path>`: creates a new file; every subsequent line starts with `+` as its initial content.

`*** Delete File: <path>`: deletes an existing file; takes no body lines.

`*** Update File: <path>`: modifies an existing file in place; an optional `*** Move to: <new path>` line immediately after the header renames it, followed by one or more `@@` hunks (with optional hunk headers). Hunks may be omitted only for a pure rename that keeps contents unchanged. Hunk body lines start with space, `-`, or `+`.

Context and deleted lines must match full lines in the file; only whitespace and Unicode punctuation normalization are tolerated, never partial substrings or approximate text.

Context rules: supply 3 lines of surrounding code directly before and after each edit by default. When two edits are within 3 lines of each other, do NOT repeat the first edit's trailing context as the second edit's leading context. If 3 context lines do not uniquely locate the target, add `@@` with the enclosing class or function; if one `@@` plus 3 context lines is still ambiguous across repeated code inside a class or function, chain multiple `@@` lines to narrow down to it:
```
@@ class BaseClass
[3 lines of pre-context]
- [old_code]
+ [new_code]
[3 lines of post-context]
```
```
@@ class BaseClass
@@ 	 def method():
[3 lines of pre-context]
- [old_code]
+ [new_code]
[3 lines of post-context]
```

Grammar:
```
Patch := Begin { FileOp } End
Begin := "*** Begin Patch" NEWLINE
End := "*** End Patch" NEWLINE
FileOp := AddFile | DeleteFile | UpdateFile
AddFile := "*** Add File: " path NEWLINE { "+" line NEWLINE }
DeleteFile := "*** Delete File: " path NEWLINE
UpdateFile := "*** Update File: " path NEWLINE [ MoveTo ] { Hunk }
MoveTo := "*** Move to: " newPath NEWLINE
Hunk := "@@" [ header ] NEWLINE { HunkLine } [ "*** End of File" NEWLINE ]
HunkLine := (" " | "-" | "+") text NEWLINE
```

Multiple file operations can be combined in a single patch:
```
*** Begin Patch
*** Add File: hello.txt
+Hello world
*** Update File: src/app.py
*** Move to: src/main.py
@@ def greet():
-print("Hi")
+print("Hello, world!")
*** Delete File: obsolete.txt
*** End Patch
```

MUST specify an Add/Delete/Update header; every line of an added file MUST begin with `+`; relative paths resolve against the session cwd (a shell `cd` does not change it), and files outside it MUST use absolute paths.
