import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "./resources";

/**
 * Carga perezosa-pero-empaquetada de TODOS los JSON de `./locales`. Cada archivo
 * `locales/<lng>/<ns>.json` se incluye en el bundle (offline) y se agrupa por
 * idioma/namespace. Añadir un idioma nuevo = crear su carpeta; no hay que tocar
 * este archivo.
 */
const localeModules = import.meta.glob("./locales/*/*.json", {
	eager: true,
}) as Record<string, { default: Record<string, unknown> }>;

type Resources = Record<string, Record<string, Record<string, unknown>>>;

const resources: Resources = {};
for (const path in localeModules) {
	const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
	if (!match) continue;
	const [, lng, ns] = match;
	if (!resources[lng]) resources[lng] = {};
	resources[lng][ns] = localeModules[path].default;
}

i18n.use(initReactI18next).init({
	resources,
	lng: "en",
	fallbackLng: ["en"],
	supportedLngs: [...SUPPORTED_LANGUAGES],
	ns: ["common", "todo", "journal"],
	defaultNS: "common",
	interpolation: {
		escapeValue: false,
	},
	react: {
		useSuspense: false,
	},
});

export default i18n;
