---
name: init
description: Create an AGENTS.md file for the current repository
thinking-level: medium
---

Run parallel `task` research agents across core source files, tests, build/config files, and scripts/docs, then consolidate the findings into a single AGENTS.md.

<structure>
- **Project Overview**: overall purpose
- **Architecture & Data Flow**: high-level design, core modules, and data movement
- **Key Directories**: primary source folders and their roles
- **Development Commands**: how to build, test, lint, and run
- **Code Conventions & Common Patterns**: code formatting, naming rules, error handling, async idioms, dependency injection, and state management
- **Important Files**: entrypoints, configuration files, and central modules
- **Runtime/Tooling Preferences**: expected runtime (e.g., Bun vs Node), package manager, and toolchain constraints
- **Testing & QA**: test framework, execution commands, and coverage standards
</structure>

<directives>
- MUST use "Repository Guidelines" as the document title
- MUST organize sections with Markdown headings
- MUST keep content brief and actionable
- MUST emphasize repository details useful to an AI coding assistant
- SHOULD add concrete examples for commands, file paths, and naming conventions
- SHOULD cite key file paths
- MUST clearly document architectural structure and coding conventions
- SHOULD skip details already self-evident from the directory layout
</directives>

<output>
Once exploration finishes: MUST write AGENTS.md at the root of the project.
</output>
