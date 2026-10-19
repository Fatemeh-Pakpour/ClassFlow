# Shared guidance for coding agents

## Structure

Root `AGENTS.md` contains short shared working rules and documentation routing.
Root `CLAUDE.md` imports it using Claude Code's `@AGENTS.md` syntax and directs
Claude to scoped files. Scoped `AGENTS.md` files add web, API and database rules.
The root `docs/` directory covers the whole repository and is shared by humans,
Codex and Claude; it is not frontend-only.

## Maintaining useful context

Keep instructions concrete: real paths, actual commands, architectural boundaries
and relevant failure cases. Put detailed explanations in topic documents, not in
every agent entry point. Avoid copying rules between Codex and Claude files.

Update docs in the same change as behavior. Separate implemented behavior, known
gaps and proposals. When docs and code disagree, inspect the implementation and
task requirements, resolve the discrepancy and update the affected reference.
Do not silently treat a historical description as permission to break a contract.

When requesting work, provide the intended user behavior, acceptance criteria and
constraints. For larger features, use a task description containing:

```md
Outcome:
Affected users and access rules:
Acceptance criteria:
Relevant existing code:
Constraints and out of scope:
Verification expected:
```

## When to add skills

Topic documents describe the system. Skills describe repeatable workflows with
clear triggers, steps, checks and outputs. Add a skill after a procedure is useful
often enough to justify maintenance, such as adding a protected API feature or
reviewing a schema migration. Reference these documents instead of duplicating them.

Keep workflow content portable: repository-relative paths, ordinary CLI scripts,
no dependency on a particular assistant's private tools. Configure skill discovery
for each assistant separately and verify it in both tools; an arbitrary shared
folder is not automatically discovered by every agent. This foundation does not
install skills or change personal assistant settings.

## Decision records

Use `docs/decisions/template.md` for decisions with lasting cross-cutting impact.
Keep the record short and explain the problem, chosen approach and consequences.
Do not create records for routine implementation details.
