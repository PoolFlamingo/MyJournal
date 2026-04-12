# My Journal

Spanish version: [README.es.md](README.es.md)

My Journal is a desktop journaling application designed for writing, organizing, and protecting personal entries in a local, privacy-focused environment. The project uses Tauri v2 for desktop packaging, React 19 for the interface, and a Bun sidecar to manage SQLite and domain workflows.

This repository is no longer a generic TODO example. The real product is centered on journals, date-based entries, privacy, visual customization, and an architecture prepared to evolve toward real encryption, import/export, and file integrity workflows.

## What My Journal Offers

- Multiple journals, with only one active journal at a time.
- Calendar-based navigation for writing or revisiting entries on any day.
- A rich Tiptap editor with formatting, lists, tasks, links, images, tables, code blocks, and highlighting.
- Public and private journals, with an unlock flow for private ones.
- Local persistence: metadata is indexed in SQLite while each entry body is stored as a `.myj` file.
- Bilingual interface in Spanish and English.
- Theme support with light, dark, or system mode plus curated presets.
- Configurable first day of the week in the calendar.

## User Experience

The app starts by trying to reopen the last journal used. If no journal exists yet, it shows a welcome screen where the user can create the first one. From there, the user can:

1. Create a public or private journal.
2. Pick a date from the left sidebar calendar.
3. Write a rich-text entry in the central editor.
4. Save, edit, or delete the entry for that date.
5. Change language, theme, and visual preferences from settings.

The current interface already includes a calendar sidebar, journal list, desktop-style top menu, unlock screen for private journals, and an editor ready for daily writing.

## Current Project Status

My Journal is in an early functional stage: the product foundation already exists and can be used to create journals, write entries, and manage them by date, but part of the roadmap is still in progress.

### Implemented Today

- Welcome flow and reopening of the last used journal.
- Journal creation with name, description, privacy, and required-title rule.
- Lock and unlock flow for private journals during the current session.
- Entry storage by date in `.myj` files.
- SQLite index for journals, entries, app settings, and the base schema for tags.
- SHA-256 hash of each entry body to support future integrity checks.
- Theme presets, language selector, and calendar preference support.

### Planned Or Still Evolving

- Final encryption model for private journals and `.myj` files.
- Secure password hashing and password rotation without risking access to content.
- `.zip` import/export with integrity verification.
- Complete tag workflow and more advanced organization features.
- Sharing and more advanced privacy-related capabilities.

### Important Privacy Note

The base private-journal flow is already implemented, but the final encryption model described in [MY_JOURNAL_ROADMAP.md](MY_JOURNAL_ROADMAP.md) is not complete yet. Right now the project provides application-level access control and locking, not the final cryptographic model planned in the roadmap.

## How Data Is Stored

My Journal separates content from indexing so the app stays lightweight and can grow without turning SQLite into a large content store:

- SQLite stores journal metadata, entry metadata, and global settings.
- Each entry is stored as a `.myj` file inside the selected journal directory.
- The database keeps the date, title, relative file path, and a content hash.

In practice, SQLite acts as the index while the actual writing lives in user files, matching the architecture described in the roadmap.

## Architecture

```text
React UI
     -> typed hooks and services
     -> SidecarService (@tauri-apps/plugin-shell)
     -> JSON Lines over stdin/stdout
     -> compiled Bun sidecar
     -> SQLite for indexes and metadata
     -> .myj files for entry content

Tauri (Rust)
     -> desktop packaging
     -> native plugins (shell, store, os, opener)
```

### Layer Responsibilities

| Layer | Main responsibility |
|---|---|
| `src/` | Interface, hooks, i18n, themes, and frontend services |
| `sidecar/` | Persistence, IPC routing, SQLite, journal files, and domain logic |
| `src-tauri/` | Native Tauri host, plugins, and desktop packaging |

## Repository Structure

```text
my-journal/
|- src/                    React frontend and product UI
|- sidecar/                Bun sidecar with SQLite, handlers, and IPC types
|- src-tauri/              Rust Tauri host and desktop configuration
|- sidecar-drizzle/        Generated SQL migrations
|- scripts/                Sidecar build scripts
|- public/                 Static assets
|- MY_JOURNAL_ROADMAP.md   Product direction and functional vision
```

## Technology Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript + Vite 7 |
| Editor | Tiptap |
| Desktop host | Tauri v2 |
| Persistence | SQLite via Bun sidecar |
| ORM | Drizzle ORM (`bun:sqlite`) |
| IPC | JSON Lines over stdin/stdout |
| Internationalization | i18next |
| Themes | next-themes + JSON presets |
| Code quality | ESLint 9 + Prettier + TypeScript |

## Prerequisites

- Node.js 18 or newer.
- Rust and cargo.
- Bun 1.2 or newer to compile the sidecar.
- The usual Tauri system dependencies for your operating system.

On Windows, Bun can be installed with:

```powershell
powershell -ExecutionPolicy ByPass -c "irm bun.sh/install.ps1 | iex"
```

## Main Commands

```bash
# Install dependencies
npm install

# Start only the web UI in development
npm run dev

# Compile the sidecar manually
npm run build:sidecar

# Run the full desktop app in development
npm run tauri:dev

# Frontend type-check
npx tsc --noEmit

# Lint
npm run lint

# Check formatting
npm run format:check

# Production desktop build
npm run tauri build
```

## Main IPC Methods

The frontend communicates with the sidecar through JSON Lines requests. These are the most relevant methods in the current journal domain:

| Method | Description |
|---|---|
| `app.bootstrap` | Loads available journals and the last used journal |
| `journal.list` | Lists all journals |
| `journal.create` | Creates a new journal |
| `journal.open` | Opens the active journal |
| `journal.unlock` | Unlocks a private journal |
| `journal.lock` | Locks a private journal for the current session |
| `entry.getByDate` | Gets the entry for a specific date |
| `entry.save` | Saves or updates an entry |
| `entry.delete` | Deletes an entry |
| `entry.listMonth` | Marks which calendar days have an entry |

## Product Direction

The functional reference for the project is [MY_JOURNAL_ROADMAP.md](MY_JOURNAL_ROADMAP.md). If you find leftover TODO-example code, treat it as transition scaffolding rather than the product target. The real direction of My Journal is:

- journal-first, not task-first;
- file-based entry content instead of large SQLite blobs;
- strong privacy for private journals;
- import, export, and integrity validation;
- a desktop writing experience designed for continuity and reflection.

## Development Notes

If you are extending the app, these are the most relevant entry points:

- `src/hooks/useJournal.ts`: main application-state orchestration.
- `src/services/journalApi.ts`: typed frontend API for the sidecar.
- `sidecar/handlers/journals.ts`: journal operations and bootstrap.
- `sidecar/handlers/entries.ts`: entry storage and `.myj` file access.
- `sidecar/db/schema.ts`: SQLite domain schema.

The repository still keeps the legacy TODO module for migration safety, but it should not drive new product decisions.
