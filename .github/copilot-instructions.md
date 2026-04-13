# Copilot Instructions — My Journal

## Project Overview

My Journal is a Tauri v2 desktop application for personal journaling. The repository started from the Tauract template, but the current product direction is no longer a generic TODO app.

The codebase already includes the foundations that future work should build on:

- React 19 + TypeScript frontend
- Bun sidecar for SQLite access and domain workflows
- Tauri v2 Rust host for native shell integrations
- i18n support for Spanish and English
- Theme presets stored as JSON tokens

The existing TODO flow is scaffolding. Unless a prompt is explicitly about the TODO example, new features should align with the journal roadmap in `MY_JOURNAL_ROADMAP.md`.

## Architecture

```
src/            ← React frontend, hooks, providers, services, i18n, UI
sidecar/        ← Bun sidecar, Drizzle schema, migrations, IPC handlers
src-tauri/      ← Rust host, plugins, shell integration, window lifecycle
```

- **Persistence and domain logic**: Prefer the sidecar for SQLite access, file indexing, import/export flows, and journal business logic.
- **Frontend boundaries**: Components should go through hooks and `src/services/`, not raw IPC or SQLite details.
- **Rust boundaries**: Keep Rust focused on Tauri host concerns, plugin wiring, and native capabilities that do not belong in the sidecar.
- **Cross-layer changes**: When adding a new domain feature, update IPC methods, DTOs, service wrappers, and UI contracts together.

## Product Direction

The roadmap describes a journal-first application with:

- multiple journals, with one active journal at a time
- calendar-based navigation in the left sidebar
- a rich-text editor for entries
- journal privacy settings, including private journals
- entry content stored as `.myj` or text-based files, with SQLite used as an index/metadata layer
- import/export and integrity validation

If current scaffold code and roadmap differ, preserve working behavior but steer new implementations toward the journal model instead of expanding the TODO example by inertia.

## Key Commands

| Action | Command |
|---|---|
| Frontend dev server | `npm run dev` |
| Full desktop dev flow | `npm run tauri:dev` |
| Build sidecar binary | `npm run build:sidecar` |
| Generate migrations | `npm run build:migrations` |
| Type-check frontend | `npx tsc --noEmit` |
| Lint frontend | `npm run lint` |
| Check formatting | `npm run format:check` |
| Production build | `npm run tauri build` |

## Conventions

- Follow `.editorconfig`: the project uses tabs, with width 2 for `tsx`, `json`, `css`, and `html`.
- Use functional React components and hooks. Do not introduce class components.
- Prefer the `@/` alias inside `src/` when practical.
- **Every user-facing string must go through the `t()` function from `useTranslation`.** Never write raw text literals inside JSX elements (`<p>`, `<span>`, `<h1>`, `<Button>`, `<Label>`, `<DialogDescription>`, etc.) or as string props (`placeholder`, `title`, `aria-label`). This includes labels, descriptions, tooltips, button copy, error messages, status badges, and fallback states. Add the key to both `src/i18n/locales/es/*.json` and `src/i18n/locales/en/*.json` before wiring it in the component. When in doubt, group the key under the closest existing namespace section (e.g. `welcome`, `journal`, `sidebar`, `menu`, `unlock`, `entry`).
- Keep theme work aligned with `src/assets/themes/*.json` and the existing token format.
- Maintain strict TypeScript compatibility and avoid unused symbols.
- The Rust library crate name `tauract_lib` must remain unchanged.
- **Never remove `"ignoreDeprecations": "6.0"` from `tsconfig.json`.** This option is intentional and required for compatibility. Do not treat it as an error or dead config.

## Implementation Guidance

- Prefer `domain.action` IPC names such as `journal.list`, `entry.save`, or `journal.unlock`.
- Keep TODO-specific code isolated unless the task explicitly targets it.
- Model new journal features in the sidecar and typed services before wiring the UI.
- Treat roadmap items that are not yet implemented as target architecture, not as permission to break current behavior.
