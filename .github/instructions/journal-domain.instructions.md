---
description: "Use when implementing journal features, diary models, entry storage, privacy flows, import/export, or roadmap-driven architecture in My Journal. Covers the target product behavior from MY_JOURNAL_ROADMAP.md."
name: "My Journal Domain"
---

# My Journal Domain Guidelines

- Treat the current TODO module as starter scaffolding, not the final product model.
- The core domain is journals and entries. Support multiple journals, but only one journal should be considered active or open at a time unless a task explicitly changes that rule.
- Journal metadata, indexes, tags, and settings belong in SQLite. Entry bodies should remain file-based when following the roadmap, using `.myj` or another explicit text-based journal format instead of pushing large rich-text payloads into SQLite by default.
- Private journals require explicit unlock and password-management flows. Do not propose designs that can orphan encrypted content after a password change.
- Import and export should be designed around `.zip` packages, integrity checks, and password handling for private journals.
- Calendar navigation, entry editing, and journal switching are primary user flows. Feature proposals in this product should be judged against those flows, not against generic CRUD dashboards.
- When roadmap details are still open, keep implementations modular and call out any irreversible architectural assumption.