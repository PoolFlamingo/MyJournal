import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { type Editor } from "@tiptap/react";
import { Minus, Plus, ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEFAULT_SIZE = 16;
const MIN_SIZE = 8;
const MAX_SIZE = 200;
const PRESET_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

interface FontSizeControlProps {
	editor: Editor;
}

/**
 * Merged `[−][field/select][+]` control that sets the inline font size of the
 * current selection (or text typed from the cursor) via the FontSize mark.
 */
export function FontSizeControl({ editor }: FontSizeControlProps) {
	const { t } = useTranslation("journal");
	const inputRef = useRef<HTMLInputElement>(null);

	const attr = editor.getAttributes("textStyle").fontSize as string | undefined;
	const current = attr ? parseInt(attr, 10) || DEFAULT_SIZE : DEFAULT_SIZE;

	const applySize = (size: number) => {
		const clamped = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(size)));
		editor.chain().focus().setFontSize(`${clamped}px`).run();
	};

	// Read the (possibly uncommitted) value shown in the field.
	const readDraft = () => {
		const n = parseInt(inputRef.current?.value ?? "", 10);
		return isNaN(n) ? current : n;
	};

	const stopFocusLoss = (e: React.MouseEvent) => e.preventDefault();

	return (
		<div className="inline-flex h-7 shrink-0 items-stretch overflow-hidden rounded-md border border-input">
			<button
				type="button"
				title={t("fontSize.decrease", "Reducir tamaño")}
				aria-label={t("fontSize.decrease", "Reducir tamaño")}
				onMouseDown={stopFocusLoss}
				onClick={() => applySize(readDraft() - 1)}
				className="grid w-6 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				<Minus className="size-3" />
			</button>
			{/* `key` resets the uncontrolled field whenever the selection's size changes. */}
			<input
				key={current}
				ref={inputRef}
				defaultValue={String(current)}
				inputMode="numeric"
				aria-label={t("fontSize.label", "Tamaño del texto")}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						applySize(readDraft());
						e.currentTarget.blur();
					}
				}}
				onBlur={() => applySize(readDraft())}
				className="w-8 border-x border-input bg-transparent text-center text-xs tabular-nums outline-none"
			/>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						title={t("fontSize.presets", "Tamaños")}
						aria-label={t("fontSize.presets", "Tamaños")}
						onMouseDown={stopFocusLoss}
						className="grid w-5 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<ChevronDown className="size-3" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-[4rem]">
					{PRESET_SIZES.map((size) => (
						<DropdownMenuItem
							key={size}
							onClick={() => applySize(size)}
							className="justify-center text-xs tabular-nums"
						>
							{size}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			<button
				type="button"
				title={t("fontSize.increase", "Aumentar tamaño")}
				aria-label={t("fontSize.increase", "Aumentar tamaño")}
				onMouseDown={stopFocusLoss}
				onClick={() => applySize(readDraft() + 1)}
				className="grid w-6 place-items-center border-l border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				<Plus className="size-3" />
			</button>
		</div>
	);
}
