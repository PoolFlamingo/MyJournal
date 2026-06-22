import { type ReactNode, useMemo, useRef, useState } from "react";
import { type Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { platform } from "@tauri-apps/plugin-os";
import { EmojiPicker } from "./EmojiPicker";
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Scissors,
	Copy,
	ClipboardPaste,
	TextSelect,
	Smile,
	SpellCheck,
	BookPlus,
} from "lucide-react";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSpellcheck } from "@/components/spellcheck-provider";
import { useSpell } from "@/components/spell-provider";
import { openEmojiPicker } from "@/services/systemApi";
import { cn } from "@/lib/utils";

interface EditorContextMenuProps {
	editor: Editor;
	children: ReactNode;
}

interface StyleButtonProps {
	active: boolean;
	label: string;
	onToggle: () => void;
	children: ReactNode;
}

/** Botón cuadrado de estilo dentro del menú contextual. */
function StyleButton({ active, label, onToggle, children }: StyleButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={active}
			data-tooltip={label}
			onClick={onToggle}
			className={cn(
				"flex size-8 items-center justify-center rounded-md border transition-colors",
				active
					? "border-primary bg-primary/15 text-primary"
					: "border-border/60 text-foreground hover:bg-accent hover:text-accent-foreground"
			)}
		>
			{children}
		</button>
	);
}

const WORD_CHAR = /[\p{L}\p{M}'’-]/u;

/** Rango y texto de la palabra bajo unas coordenadas de pantalla, o null. */
function wordRangeAtCoords(editor: Editor, clientX: number, clientY: number) {
	const view = editor.view;
	const coords = view.posAtCoords({ left: clientX, top: clientY });
	if (!coords) return null;
	const $pos = view.state.doc.resolve(coords.pos);
	if (!$pos.parent.isTextblock) return null;
	const text = $pos.parent.textContent;
	const offset = $pos.parentOffset;
	let start = offset;
	let end = offset;
	while (start > 0 && WORD_CHAR.test(text[start - 1])) start--;
	while (end < text.length && WORD_CHAR.test(text[end])) end++;
	if (start >= end) return null;
	const base = $pos.start();
	return { from: base + start, to: base + end, word: text.slice(start, end) };
}

interface Misspelled {
	word: string;
	from: number;
	to: number;
	suggestions: string[];
}

export function EditorContextMenu({ editor, children }: EditorContextMenuProps) {
	const { t } = useTranslation("journal");
	const { enabled: spellcheckEnabled, toggle: toggleSpellcheck } = useSpellcheck();
	const { check, suggest, addWord } = useSpell();
	const [emojiOpen, setEmojiOpen] = useState(false);
	const coordsRef = useRef<{ x: number; y: number } | null>(null);
	const [misspelled, setMisspelled] = useState<Misspelled | null>(null);

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setMisspelled(null);
			return;
		}
		const coords = coordsRef.current;
		if (!coords) {
			setMisspelled(null);
			return;
		}
		const range = wordRangeAtCoords(editor, coords.x, coords.y);
		if (!range || range.word.length < 2 || check(range.word)) {
			setMisspelled(null);
			return;
		}
		setMisspelled({ ...range, suggestions: suggest(range.word) });
	};

	const replaceMisspelled = (replacement: string) => {
		if (!misspelled) return;
		editor
			.chain()
			.focus()
			.insertContentAt({ from: misspelled.from, to: misspelled.to }, replacement)
			.run();
	};

	const addMisspelledToDictionary = () => {
		if (!misspelled) return;
		void addWord(misspelled.word);
	};

	// El selector nativo del SO es fiable en Windows/macOS. En Linux el atajo
	// (Ctrl+.) choca con el toggle del sidebar y no es fiable, así que usamos el
	// picker propio (emoji-mart, local). Si la detección falla, también usamos el
	// picker propio por seguridad.
	const useNativeEmoji = useMemo(() => {
		try {
			const p = platform();
			return p === "windows" || p === "macos";
		} catch {
			return false;
		}
	}, []);

	const hasSelection = !editor.state.selection.empty;

	// Re-enfoca el editor para que la selección se conserve y siga visible al
	// aplicar el estilo (el menú se cierra, como un menú nativo).
	const toggleMark = (run: (chain: ReturnType<Editor["chain"]>) => void) => {
		const chain = editor.chain().focus();
		run(chain);
	};

	const copy = () => {
		editor.chain().focus().run();
		document.execCommand("copy");
	};

	const cut = () => {
		editor.chain().focus().run();
		document.execCommand("cut");
	};

	const paste = async () => {
		editor.chain().focus().run();
		try {
			const text = await navigator.clipboard.readText();
			if (text) editor.chain().focus().insertContent(text).run();
		} catch {
			document.execCommand("paste");
		}
	};

	const selectAll = () => {
		editor.chain().focus().selectAll().run();
	};

	const insertEmoji = () => {
		if (useNativeEmoji) {
			editor.chain().focus().run();
			window.setTimeout(() => {
				void openEmojiPicker();
			}, 80);
		} else {
			setEmojiOpen(true);
		}
	};

	const onPickEmoji = (native: string) => {
		editor.chain().focus().insertContent(native).run();
		setEmojiOpen(false);
	};

	return (
		<>
			<ContextMenu onOpenChange={handleOpenChange}>
				<ContextMenuTrigger asChild>
					<div
						data-context-zone
						className="flex flex-1 flex-col"
						onContextMenu={(e) => {
							coordsRef.current = { x: e.clientX, y: e.clientY };
						}}
					>
						{children}
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-56">
					{/* Ortografía: sugerencias + añadir al diccionario (si la palabra
					    bajo el cursor está mal escrita) */}
					{misspelled && (
						<>
							{misspelled.suggestions.length > 0 ? (
								misspelled.suggestions.map((s) => (
									<ContextMenuItem
										key={s}
										onSelect={() => replaceMisspelled(s)}
										className="font-medium"
									>
										{s}
									</ContextMenuItem>
								))
							) : (
								<ContextMenuItem disabled>
									{t("context.noSuggestions", "Sin sugerencias")}
								</ContextMenuItem>
							)}
							<ContextMenuItem onSelect={() => addMisspelledToDictionary()}>
								<BookPlus />
								{t("context.addToDictionary", "Añadir al diccionario")}
							</ContextMenuItem>
							<ContextMenuSeparator />
						</>
					)}

					{/* Sección superior: estilos de letra básicos (botones cuadrados) */}
					<div className="flex items-center gap-1 p-1">
						<StyleButton
							active={editor.isActive("bold")}
							label={t("context.bold", "Negrita")}
							onToggle={() => toggleMark((c) => c.toggleBold().run())}
						>
							<Bold className="size-4" />
						</StyleButton>
						<StyleButton
							active={editor.isActive("italic")}
							label={t("context.italic", "Cursiva")}
							onToggle={() => toggleMark((c) => c.toggleItalic().run())}
						>
							<Italic className="size-4" />
						</StyleButton>
						<StyleButton
							active={editor.isActive("underline")}
							label={t("context.underline", "Subrayado")}
							onToggle={() => toggleMark((c) => c.toggleUnderline().run())}
						>
							<Underline className="size-4" />
						</StyleButton>
						<StyleButton
							active={editor.isActive("strike")}
							label={t("context.strike", "Tachado")}
							onToggle={() => toggleMark((c) => c.toggleStrike().run())}
						>
							<Strikethrough className="size-4" />
						</StyleButton>
					</div>

					<ContextMenuSeparator />

					<ContextMenuItem onSelect={() => cut()} disabled={!hasSelection}>
						<Scissors />
						{t("context.cut", "Cortar")}
						<ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem onSelect={() => copy()} disabled={!hasSelection}>
						<Copy />
						{t("context.copy", "Copiar")}
						<ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem onSelect={() => void paste()}>
						<ClipboardPaste />
						{t("context.paste", "Pegar")}
						<ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem onSelect={() => selectAll()}>
						<TextSelect />
						{t("context.selectAll", "Seleccionar todo")}
						<ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
					</ContextMenuItem>

					<ContextMenuSeparator />

					<ContextMenuItem onSelect={() => insertEmoji()}>
						<Smile />
						{t("context.emoji", "Insertar emoji…")}
					</ContextMenuItem>
					<ContextMenuCheckboxItem
						checked={spellcheckEnabled}
						onCheckedChange={() => toggleSpellcheck()}
					>
						<SpellCheck />
						{t("context.spellcheck", "Corrector ortográfico")}
					</ContextMenuCheckboxItem>
				</ContextMenuContent>
			</ContextMenu>

			{/* Picker emoji propio (fallback / Linux) */}
			<Dialog open={emojiOpen} onOpenChange={setEmojiOpen}>
				<DialogContent
					showCloseButton={false}
					className="w-fit border-0 bg-transparent p-0 shadow-none"
				>
					<DialogTitle className="sr-only">
						{t("context.emoji", "Insertar emoji…")}
					</DialogTitle>
					<EmojiPicker onSelect={onPickEmoji} />
				</DialogContent>
			</Dialog>
		</>
	);
}
