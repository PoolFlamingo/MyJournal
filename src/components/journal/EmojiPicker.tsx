import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import emojiData from "@emoji-mart/data";
import {
	Smile,
	Leaf,
	Cookie,
	Bike,
	Plane,
	Lightbulb,
	Heart,
	Flag,
	type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Selector de emoji propio y ligero. Renderiza los emoji con la fuente de emoji
 * del SISTEMA (clase `.font-emoji`) en DOM normal — sin web component ni shadow
 * DOM (evita el lag de emoji-mart) y sin empaquetar una webfont que WebKitGTK no
 * sabe dibujar. Usa el dataset local de `@emoji-mart/data` (offline).
 */
interface EmojiEntry {
	id: string;
	name: string;
	keywords?: string[];
	skins: { native: string }[];
}
interface EmojiCategory {
	id: string;
	emojis: string[];
}
const data = emojiData as unknown as {
	categories: EmojiCategory[];
	emojis: Record<string, EmojiEntry>;
};

const CATEGORY_ICON: Record<string, LucideIcon> = {
	people: Smile,
	nature: Leaf,
	foods: Cookie,
	activity: Bike,
	places: Plane,
	objects: Lightbulb,
	symbols: Heart,
	flags: Flag,
};

interface EmojiPickerProps {
	onSelect: (native: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
	const { t } = useTranslation("journal");
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState(data.categories[0]?.id ?? "people");

	const searchResults = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return null;
		const out: { id: string; native: string }[] = [];
		for (const id in data.emojis) {
			const emoji = data.emojis[id];
			const native = emoji.skins?.[0]?.native;
			if (!native) continue;
			const haystack =
				`${emoji.name} ${(emoji.keywords ?? []).join(" ")} ${id}`.toLowerCase();
			if (haystack.includes(q)) out.push({ id, native });
			if (out.length >= 180) break;
		}
		return out;
	}, [query]);

	const categoryEmojis = useMemo(() => {
		const cat = data.categories.find((c) => c.id === category);
		if (!cat) return [];
		const out: { id: string; native: string }[] = [];
		for (const id of cat.emojis) {
			const native = data.emojis[id]?.skins?.[0]?.native;
			if (native) out.push({ id, native });
		}
		return out;
	}, [category]);

	const list = searchResults ?? categoryEmojis;

	return (
		<div className="flex h-[22rem] w-[20rem] flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
			<div className="p-2 pb-1">
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t("context.search", "Buscar...")}
					autoFocus
					className="h-8"
				/>
			</div>

			{!query && (
				<div className="flex items-center gap-0.5 border-b px-2 pb-1">
					{data.categories.map((cat) => {
						const Icon = CATEGORY_ICON[cat.id] ?? Smile;
						return (
							<button
								key={cat.id}
								type="button"
								aria-label={cat.id}
								onClick={() => setCategory(cat.id)}
								className={cn(
									"flex size-7 items-center justify-center rounded-md transition-colors",
									category === cat.id
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:bg-accent/50"
								)}
							>
								<Icon className="size-4" />
							</button>
						);
					})}
				</div>
			)}

			<div className="grid grid-cols-8 gap-0.5 overflow-y-auto p-2">
				{list.length === 0 ? (
					<p className="col-span-8 py-6 text-center text-sm text-muted-foreground">
						{t("context.noSuggestions", "Sin resultados")}
					</p>
				) : (
					list.map((emoji) => (
						<button
							key={emoji.id}
							type="button"
							aria-label={emoji.id}
							onClick={() => onSelect(emoji.native)}
							className="font-emoji flex aspect-square items-center justify-center rounded text-xl leading-none hover:bg-accent"
						>
							{emoji.native}
						</button>
					))
				)}
			</div>
		</div>
	);
}
