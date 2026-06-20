import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Flag } from "@/components/flag";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_META } from "@/i18n/resources";
import { useLanguage } from "./language-provider";

export function LanguageSwitch() {
	const { t } = useTranslation("common");
	const { language, setLanguage, supportedLanguages } = useLanguage();
	const active = LANGUAGE_META[language];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" title={t("language.label", "Idioma")}>
					<span className="sr-only">{t("language.label", "Idioma")}</span>
					<Flag code={active.region} className="text-base" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
				{supportedLanguages.map((item) => (
					<DropdownMenuItem
						key={item.code}
						onClick={() => void setLanguage(item.code)}
						className="gap-2.5"
					>
						<Flag code={item.region} className="text-base" />
						<span className="flex-1">{item.label}</span>
						{item.code === language && (
							<Check className="size-4 text-primary" aria-hidden="true" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
