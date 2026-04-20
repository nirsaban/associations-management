# Documentation Index

Start here. All product, architecture, and feature documentation lives under `/docs`.

For AI-assisted work, `CLAUDE.md` at the repo root is the primary context file loaded by Claude Code at every session.

---

## Living documents (always current — edit in place)

| Doc | Purpose |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Repo-root context file. Auto-loaded by Claude Code on every session. Highest-leverage doc. |
| [`GLOSSARY.md`](./GLOSSARY.md) | Single source of truth for terminology. Hebrew ↔ English. Entities, roles, states, banned words. |
| [`ROLES.md`](./ROLES.md) | Who can do what. Permission matrix per role, plus data isolation rules. |

## Feature folders (frozen per-feature history — never edit old reports)

Each feature folder contains numbered files in execution order:
`01-current-state.md` → `02-plan.md` → `03-done.md` → `04-*-done.md` → …

A `README.md` inside each folder indexes that feature's files.

| Feature | Folder | Status |
|---|---|---|
| Multi-tenant foundation + Super Admin | [`multi-tenant-foundation/`](./multi-tenant-foundation/) | In progress |

---

## Conventions

- **Living doc** → edit in place, keep current.
- **Frozen doc** (`NN-*.md`) → never rewrite. If reality changed, write a new numbered file.
- **New feature** → new folder under `/docs`, with its own `README.md` index.
- **New concept** → add to `GLOSSARY.md` **before** using it in code or UI.
- **New capability** → add to `ROLES.md` table **before** implementing the endpoint.
- **No docs outside `/docs`** (except repo-root `README.md`, `CLAUDE.md`, and license).