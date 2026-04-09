---
description: "Use when building or editing React UI, hooks, providers, themes, or translations for My Journal. Covers journal-focused frontend patterns, i18n rules, theme presets, and service boundaries."
name: "My Journal Frontend"
applyTo: "src/**/*.{ts,tsx,css}"
---

# My Journal Frontend Guidelines

- Keep components presentation-focused when possible. Put async data loading, sidecar lifecycle, filtering, and mutation orchestration in hooks or services.
- Components should call hooks or modules in `src/services/`. Do not call raw IPC methods or Tauri plugins directly from leaf UI components unless the task is specifically about a provider or platform wrapper.
- All user-facing copy must go through `src/i18n/`. Add keys for both `es` and `en`, and keep namespaces grouped by domain such as `common`, `journal`, `settings`, or `importExport`.
- Default product language and documentation context are Spanish, but code identifiers should remain clear and consistent in English.
- Reuse existing providers and UI primitives before adding parallel state systems or bespoke controls.
- Respect React Strict Mode. In hooks that perform async work, guard against state updates after unmount, following the existing pattern in `useTodos`.
- New domain DTOs should live in `src/types/`, and service method signatures should stay explicit and typed.
- Theme additions belong in `src/assets/themes/*.json` using the existing shadcn-compatible schema and OKLCH token style. Register new presets through the theme flow instead of hardcoding palette values in components.
- For roadmap work, optimize the UI toward journal workflows such as calendar navigation, journal switching, entry editing, privacy, and settings. Do not keep extending the TODO demo unless the prompt explicitly asks for it.