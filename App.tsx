import React from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useThemeMode } from "./src/theme";
import { LanguageProvider } from "./src/i18n";
import RootNavigator from "./src/navigation/RootNavigator";

function AppContent() {
	const { mode } = useThemeMode();
	return (
		<>
			<StatusBar style={mode === "dark" ? "light" : "dark"} />
			<LanguageProvider>
				<RootNavigator />
			</LanguageProvider>
		</>
	);
}

export default function App() {
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	);
}
