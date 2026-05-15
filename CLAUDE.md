# CLAUDE.md

Notas para trabajar en My Journal. Mantén este archivo conciso: estado real del código, no aspiraciones.

## Qué es

Aplicación de escritorio de diario personal: múltiples diarios, una entrada por día, editor enriquecido, diarios públicos y privados. Empaquetado con **Tauri v2**, UI en **React 19 + TypeScript + Vite 7**, persistencia local en **SQLite + archivos `.myj`**. Bilingüe (es/en). Idioma por defecto del producto: español; identificadores de código en inglés.

## Arquitectura real (importante)

El README y los archivos `.github/copilot-instructions.md` mencionan un "Bun sidecar" como capa de persistencia. **Eso es histórico.** El binario sidecar ya no se invoca: `src-tauri/src/lib.rs` no registra `tauri_plugin_shell` ni lanza ningún proceso hijo. Todo el dominio corre dentro del host Rust:

```
React UI
  └─ invoke() de @tauri-apps/api/core
      └─ comandos Tauri en src-tauri/src/commands/{journals,entries}.rs
          ├─ tauri-plugin-sql (sqlx + sqlite) → my-journal.db en appDataDir
          └─ std::fs → <appDataDir>/journals/<uuid>/entries/<YYYY-MM-DD>.myj
```

Capas:

- [src/](src/) — React, hooks, providers, i18n, servicios tipados (`src/services/journalApi.ts` envuelve `invoke()`).
- [src-tauri/](src-tauri/) — host Rust. Comandos, migraciones SQL, plugins.
- [sidecar/](sidecar/) y [sidecar-drizzle/](sidecar-drizzle/) — código Bun/Drizzle **no usado en runtime**. Se conserva como referencia del esquema y porque algunas tablas (incluido `todos`) se reproducen en `src-tauri/src/db.rs`. No agregues lógica nueva ahí salvo que el cambio sea explícitamente "volver al sidecar".

Si una tarea pide tocar persistencia o dominio, edita los comandos Rust y el `src/services/journalApi.ts` correspondiente, no el sidecar.

## Estructura clave para navegar

| Tema | Archivo |
|---|---|
| Bootstrap UI / vistas (loading/welcome/unlock/workspace) | [src/App.tsx](src/App.tsx), [src/hooks/useJournal.ts](src/hooks/useJournal.ts) |
| Servicio frontend que llama a `invoke()` | [src/services/journalApi.ts](src/services/journalApi.ts) |
| Tipos compartidos del dominio (frontend) | [src/types/journal.ts](src/types/journal.ts) |
| Comandos Tauri de diarios | [src-tauri/src/commands/journals.rs](src-tauri/src/commands/journals.rs) |
| Comandos Tauri de entradas | [src-tauri/src/commands/entries.rs](src-tauri/src/commands/entries.rs) |
| DTOs Rust (camelCase serde) | [src-tauri/src/types.rs](src-tauri/src/types.rs) |
| Migraciones SQL (idempotentes, `IF NOT EXISTS`) | [src-tauri/src/db.rs](src-tauri/src/db.rs) |
| Set en memoria de diarios desbloqueados | [src-tauri/src/state.rs](src-tauri/src/state.rs) |
| Editor Tiptap (guarda JSON serializado) | [src/components/journal/EntryEditor.tsx](src/components/journal/EntryEditor.tsx) |
| Layout principal + menú | [src/components/journal/JournalWorkspace.tsx](src/components/journal/JournalWorkspace.tsx) |
| Auto-update (GitHub releases + minisign) | [src/components/update-provider.tsx](src/components/update-provider.tsx), [.github/workflows/release.yml](.github/workflows/release.yml) |
| i18n (es/en, namespaces common/journal/todo) | [src/i18n/i18n.ts](src/i18n/i18n.ts), [src/i18n/locales/](src/i18n/locales/) |
| Theme presets (OKLCH, shadcn-compatible) | [src/assets/themes/](src/assets/themes/), [src/hooks/useThemePreset.ts](src/hooks/useThemePreset.ts) |
| Permisos del runtime Tauri | [src-tauri/capabilities/default.json](src-tauri/capabilities/default.json) |
| Script de release (bumpea 3 ficheros + tag) | [scripts/release.mjs](scripts/release.mjs) |

## Modelo de datos

SQLite en `<appDataDir>/my-journal.db`. Tablas: `journals`, `entries`, `tags`, `entry_tags`, `app_settings`, y `todos` (legacy, preservada por seguridad de migración pero sin comandos Rust que la usen).

- Una entrada por día y diario: índice único `idx_entries_journal_date` sobre `(journal_id, date)`.
- `date` es `YYYY-MM-DD` (texto).
- `entries.file_path` guarda la ruta relativa (`entries/<date>.myj`); el contenido real vive en disco.
- `entries.content_hash` es SHA-256 del contenido — está pensado para verificaciones de integridad futuras (no se verifica todavía).
- Diarios privados: `password_hash` **guarda la contraseña en plaintext** hoy. Hay `TODO: Phase 4 — Argon2id + key wrapping` en `journals.rs`. No reescribas este flujo sin acordarlo: cambiar el formato sin migración deja diarios huérfanos.
- Diarios desbloqueados viven solo en memoria (`UnlockedJournals` en `state.rs`). Reiniciar la app vuelve a bloquearlos. Eso es intencional.
- El último diario abierto se persiste en `app_settings` con clave `lastJournalId`.

Estado en frontend (preferencias UI, no dominio) se persiste con `tauri-plugin-store` en `settings.json` (idioma, modo de update, última comprobación), o `localStorage` (tema, preset, inicio de semana).

## Convenciones

- **Indentación**: tabs. Ancho 2 para `tsx/json/css/html`; ancho 4 por defecto para el resto. Configurado en `.editorconfig`.
- **Prettier**: comillas dobles, `;` siempre, `printWidth: 90`, `trailingComma: "es5"`, `endOfLine: lf`. No reformatees archivos enteros: respeta el estilo existente.
- **ESLint** ignora `dist`, `src-tauri`, `sidecar`, `sidecar-drizzle`, `scripts`. Lintar fuera de `src/` no aplica.
- **TypeScript**: strict, `noUnusedLocals` y `noUnusedParameters` activos. Usa el alias `@/` para imports dentro de `src/`.
- **Componentes React**: funcionales con hooks. Los componentes deben llamar a `src/services/*` o hooks, no a `invoke()` ni a plugins de Tauri directamente (salvo providers/wrappers de plataforma como `update-provider.tsx`, `language-provider.tsx`).
- **i18n**: **toda cadena visible** pasa por `t()` de `useTranslation`. Antes de escribir el componente, añade la clave a `src/i18n/locales/es/*.json` y `src/i18n/locales/en/*.json`. Agrupa por namespace existente (`common`, `journal`, etc.). Esto incluye `placeholder`, `title`, `aria-label`, badges, errores, fallback.
- **Tipos Rust ↔ TS**: los DTOs Rust usan `#[serde(rename_all = "camelCase")]`. Los argumentos de `invoke()` van en camelCase (ej. `journalId`, `titleRequired`). Si añades un comando, mantén ese contrato.
- **El crate Rust se llama `tauract_lib`** (nombre histórico de cuando el repo era el template Tauract). No lo renombres; rompe `main.rs` y el binding.
- **No reformatees `Cargo.lock` ni `package-lock.json`** salvo como efecto natural de añadir dependencias.

## Comandos

```bash
npm install                    # deps frontend
npm run dev                    # solo Vite (sin Tauri)
npm run tauri:dev              # app de escritorio en modo dev
npm run build                  # tsc + vite build (frontend)
npm run tauri build            # bundle de producción
npm run lint                   # ESLint sobre src/
npm run format                 # Prettier write sobre src/
npm run format:check           # Prettier check
npx tsc --noEmit               # type-check del frontend
npm run build:migrations       # regenerar SQL con drizzle-kit (referencia, no runtime)
node scripts/release.mjs patch # bump versión + commit + tag + push (dispara GH Actions)
```

`scripts/release.mjs` actualiza la versión en `package.json`, `src-tauri/tauri.conf.json` y `src-tauri/Cargo.toml` a la vez. Tres ficheros, una sola fuente de verdad. Si bumpeas a mano, actualiza los tres.

## Flujo de release

Push de un tag `v*` ⇒ `.github/workflows/release.yml` construye en Windows/macOS/Linux, firma con minisign (claves en `keys/` y secrets de GitHub), publica los bundles y genera `latest.json` que el plugin `tauri-plugin-updater` consume desde la URL configurada en `tauri.conf.json` (`PoolFlamingo/MyJournal`).

## Cosas que romper sin querer

- **No reintroduzcas el sidecar al runtime** (registrar `tauri_plugin_shell` y spawn del binario) sin entender que duplicaría la persistencia: tanto el sidecar como `tauri-plugin-sql` se conectan a `my-journal.db` y se pisarían.
- **No subas `dist/`, `node_modules/`, `src-tauri/target/`, `*.db`, `private/`, `keys/`.** Ya están en `.gitignore`.
- El archivo `src-tauri/UsersNitropc...my-journal.db` en el root del crate es basura dejada por una corrida vieja en Windows; no es el path real. Ignóralo o bórralo, no escribas contra él.
- La carpeta `src-tauri/binaries/` contiene un binario sidecar viejo de Windows. No lo enlaces; ya no se bundlea.
- **`tsconfig.json` no contiene `ignoreDeprecations`** pese a lo que diga `.github/copilot-instructions.md`. Si una tarea pide preservarlo, verifica primero.
- Las migraciones en `src-tauri/src/db.rs` son idempotentes (`CREATE TABLE IF NOT EXISTS`). Si añades una columna, hazlo aditivo o con `ALTER TABLE ... ADD COLUMN` envuelto en try/catch como ya se hace para `title_required`.
- El contenido del editor se guarda como **JSON serializado de Tiptap** (`editor.getJSON()` ⇒ `JSON.stringify`). La función `parseContent` en `EntryEditor.tsx` tiene fallback a texto plano para entradas legacy; mantenlo si tocas el formato.

## Estado del roadmap (al día de hoy)

Implementado: CRUD de diarios, lock/unlock por sesión, entradas por fecha en `.myj`, hash SHA-256, presets de tema, i18n es/en, auto-update.

Pendiente (no asumas que existe): cifrado real de `.myj`, Argon2id para contraseñas, rotación de contraseña, import/export `.zip`, flujos completos de tags, verificación de integridad por hash.
