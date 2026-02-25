import React, { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useThemeMode } from "./src/theme";
import { LanguageProvider } from "./src/i18n";
import { HomeLayoutProvider, IconModeProvider } from "./src/settings";
import RootNavigator from "./src/navigation/RootNavigator";

function AppContent() {
	const { mode } = useThemeMode();

	useEffect(() => {
		if (Platform.OS === "android") {
			NavigationBar.setBackgroundColorAsync(mode === "dark" ? "#2A273F" : "#FFFFFF");
			NavigationBar.setButtonStyleAsync(mode === "dark" ? "light" : "dark");
		}
	}, [mode]);

	return (
		<>
			<StatusBar style={mode === "dark" ? "light" : "dark"} />
			<LanguageProvider>
				<HomeLayoutProvider>
					<IconModeProvider>
						<RootNavigator />
					</IconModeProvider>
				</HomeLayoutProvider>
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
