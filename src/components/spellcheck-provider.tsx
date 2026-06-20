import { createContext, useCallback, useContext, useState } from "react";

/**
 * Preferencia global del corrector ortográfico del editor (título + cuerpo).
 * Se persiste en `localStorage` (preferencia de UI, no dominio) y el idioma del
 * diccionario lo decide `<html lang>` / el atributo `lang` que fija el editor a
 * partir del idioma activo de la app.
 */
const STORAGE_KEY = "my-journal-spellcheck";

interface SpellcheckContextValue {
	enabled: boolean;
	setEnabled: (value: boolean) => void;
	toggle: () => void;
}

const SpellcheckContext = createContext<SpellcheckContextValue | undefined>(undefined);

function readInitial(): boolean {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return true; // activado por defecto
		return raw === "true";
	} catch {
		return true;
	}
}

function persist(value: boolean): void {
	try {
		localStorage.setItem(STORAGE_KEY, String(value));
	} catch {
		// localStorage no disponible; se ignora.
	}
}

export function SpellcheckProvider({ children }: { children: React.ReactNode }) {
	const [enabled, setEnabledState] = useState<boolean>(readInitial);

	const setEnabled = useCallback((value: boolean) => {
		setEnabledState(value);
		persist(value);
	}, []);

	const toggle = useCallback(() => {
		setEnabledState((prev) => {
			const next = !prev;
			persist(next);
			return next;
		});
	}, []);

	return (
		<SpellcheckContext.Provider value={{ enabled, setEnabled, toggle }}>
			{children}
		</SpellcheckContext.Provider>
	);
}

export function useSpellcheck() {
	const context = useContext(SpellcheckContext);
	if (!context) {
		throw new Error("useSpellcheck must be used within a SpellcheckProvider");
	}
	return context;
}
