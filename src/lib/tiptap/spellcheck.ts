import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

const spellcheckKey = new PluginKey("mjSpellcheck");

// Palabra: empieza por letra y continúa con letras/marcas/apóstrofo/guion.
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*/gu;

type Checker = (word: string) => boolean;

function computeDecorations(doc: PMNode, check: Checker): DecorationSet {
	const decorations: Decoration[] = [];
	doc.descendants((node, pos) => {
		if (!node.isText || !node.text) return;
		const text = node.text;
		WORD_RE.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = WORD_RE.exec(text)) !== null) {
			const word = match[0];
			if (word.length < 2) continue;
			if (check(word)) continue;
			const from = pos + match.index;
			decorations.push(
				Decoration.inline(from, from + word.length, { class: "mj-spell-error" })
			);
		}
	});
	return DecorationSet.create(doc, decorations);
}

export interface SpellcheckOptions {
	checker: Checker | null;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		mjSpellcheck: {
			/** Define (o limpia con `null`) el corrector que subraya las palabras. */
			setSpellChecker: (checker: Checker | null) => ReturnType;
		};
	}
}

/**
 * Subraya las palabras mal escritas con decoraciones de ProseMirror, usando un
 * `checker` externo (nuestro motor nspell). Sustituye al corrector nativo del
 * webview en el cuerpo del editor para que sugerencias y "añadir palabra" sean
 * consistentes con el subrayado.
 */
export const Spellcheck = Extension.create<SpellcheckOptions>({
	name: "mjSpellcheck",

	addOptions() {
		return { checker: null };
	},

	addProseMirrorPlugins() {
		const getChecker = (): Checker | null => this.options.checker;
		return [
			new Plugin({
				key: spellcheckKey,
				state: {
					init: () => DecorationSet.empty,
					apply(tr, old) {
						const checker = getChecker();
						if (!checker) return DecorationSet.empty;
						const refresh = tr.getMeta(spellcheckKey);
						if (tr.docChanged || refresh) {
							return computeDecorations(tr.doc, checker);
						}
						return old.map(tr.mapping, tr.doc);
					},
				},
				props: {
					decorations(state) {
						return spellcheckKey.getState(state);
					},
				},
			}),
		];
	},

	addCommands() {
		return {
			setSpellChecker:
				(checker: Checker | null) =>
				({ editor }) => {
					this.options.checker = checker;
					editor.view.dispatch(editor.state.tr.setMeta(spellcheckKey, { refresh: true }));
					return true;
				},
		};
	},
});
