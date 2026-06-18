import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "motion/react";
import "@/i18n/i18n";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemePresetProvider } from "@/components/theme-preset-provider";
import { EditorFontProvider } from "@/components/editor-font-provider";
import { UpdateProvider } from "@/components/update-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<MotionConfig reducedMotion="user">
			<LanguageProvider>
				<ThemeProvider defaultTheme="system" storageKey="tauract-ui-theme">
					<ThemePresetProvider>
						<EditorFontProvider>
							<UpdateProvider>
								<TooltipProvider>
									<App />
									<Toaster />
								</TooltipProvider>
							</UpdateProvider>
						</EditorFontProvider>
					</ThemePresetProvider>
				</ThemeProvider>
			</LanguageProvider>
		</MotionConfig>
	</React.StrictMode>
);
