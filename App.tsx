import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ThemeProvider>
				<AppContent />
			</ThemeProvider>
		</GestureHandlerRootView>
	);
}
