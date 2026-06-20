/**
 * Quita el menú contextual nativo del webview en TODA la app. Las zonas que
 * quieran su propio menú (el editor de texto) se marcan con
 * `[data-context-zone]`; ahí dejamos pasar el evento para que el ContextMenu
 * propio (Radix) tome el control.
 *
 * Es un import con efecto secundario (`import "@/lib/disable-native-context-menu"`)
 * que registra el listener una sola vez.
 */
if (typeof document !== "undefined") {
	document.addEventListener("contextmenu", (event) => {
		const target = event.target as Element | null;
		if (target?.closest?.("[data-context-zone]")) return;
		event.preventDefault();
	});
}

export {};
