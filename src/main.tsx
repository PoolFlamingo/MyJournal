import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "motion/react";
import "@fontsource/noto-color-emoji";
import "flag-icons/css/flag-icons.min.css";
import "@/i18n/i18n";
import "@/lib/disable-native-context-menu";
import { LanguageProvider } from "@/components/language-provider";
import { SpellcheckProvider } from "@/components/spellcheck-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemePresetProvider } from "@/components/theme-preset-provider";
import { EditorFontProvider } from "@/components/editor-font-provider";
import { UpdateProvider } from "@/components/update-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalTooltips } from "@/components/global-tooltips";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<MotionConfig reducedMotion="user">
			<LanguageProvider>
				<SpellcheckProvider>
					<ThemeProvider defaultTheme="system" storageKey="tauract-ui-theme">
						<ThemePresetProvider>
							<EditorFontProvider>
								<UpdateProvider>
									<TooltipProvider>
										<App />
										<GlobalTooltips />
										<Toaster />
									</TooltipProvider>
								</UpdateProvider>
							</EditorFontProvider>
						</ThemePresetProvider>
					</ThemeProvider>
				</SpellcheckProvider>
			</LanguageProvider>
		</MotionConfig>
	</React.StrictMode>
);
