---
description: "Use when editing sidecar handlers, Drizzle schema, migrations, IPC types, or frontend service wrappers for My Journal. Covers JSON Lines IPC, SQLite conventions, service boundaries, and journal data evolution."
name: "My Journal Sidecar Data"
applyTo:
  - "sidecar/**/*.ts"
  - "src/services/*.ts"
---

# My Journal Sidecar And Data Guidelines

- The sidecar is the preferred home for persistence, filesystem orchestration, indexing, import/export workflows, and journal business logic.
- Preserve the JSON Lines IPC contract: requests use `{ id, method, params? }`, and responses use either `{ id, result }` or `{ id, error }`.
- Use `domain.action` method names and extend the IPC method union when adding new operations.
- Keep `params` transport-friendly with `Record<string, unknown>` at the boundary, then validate and narrow inside handlers.
- When changing stored data, update the schema, startup migrations, handler logic, IPC types, and corresponding frontend services as one coherent change.
- Commit generated SQL migrations under `sidecar-drizzle/` after schema updates.
- Frontend code should reach sidecar features through typed wrappers in `src/services/`, typically via `sidecar.request<T>()`. Avoid scattering raw method strings through components.
- Preserve the sidecar readiness handshake and process lifecycle expectations already used by the frontend.
- Prefer additive, forward-safe data changes when possible, especially as the model evolves from TODOs toward journals, entries, tags, privacy settings, and import/export metadata.
- For private journal features, avoid logging secrets or storing plaintext sensitive values in SQLite unless the design explicitly requires it and the tradeoff is documented.