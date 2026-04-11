import React from "react";
import ReactDOM from "react-dom/client";
import "@/i18n/i18n";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemePresetProvider } from "@/components/theme-preset-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<LanguageProvider>
			<ThemeProvider defaultTheme="system" storageKey="tauract-ui-theme">
				<ThemePresetProvider>
					<TooltipProvider>
						<App />
					</TooltipProvider>
				</ThemePresetProvider>
			</ThemeProvider>
		</LanguageProvider>
	</React.StrictMode>,
);
