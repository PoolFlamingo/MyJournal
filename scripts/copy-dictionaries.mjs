// Copia los diccionarios hunspell (de los paquetes npm `dictionary-*`) a
// `public/dictionaries/` para que el corrector propio (nspell) los cargue en
// runtime vía fetch, offline y sin depender del backend del SO.
//
// Se ejecuta en `predev` y `prebuild`. Los archivos copiados están en
// .gitignore (se regeneran desde las dependencias).
import { mkdir, copyFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "dictionaries");

// Idiomas soportados con diccionario hunspell disponible.
// (zh y ja no tienen diccionario hunspell de calidad y se omiten.)
// Si quieres reducir el tamaño del bundle, elimina idiomas de esta lista.
const LANGS = ["en", "es", "fr", "de", "it", "pt", "ru", "ro", "nl", "pl", "ko"];

await mkdir(out, { recursive: true });

let copied = 0;
for (const lang of LANGS) {
	for (const ext of ["aff", "dic"]) {
		const src = join(root, "node_modules", `dictionary-${lang}`, `index.${ext}`);
		const dst = join(out, `${lang}.${ext}`);
		try {
			await access(src);
			await copyFile(src, dst);
			copied++;
		} catch {
			console.warn(`[dictionaries] no encontrado: ${src} (¿falta 'npm install'?)`);
		}
	}
}

console.log(`[dictionaries] ${copied} archivos copiados a public/dictionaries`);
