import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";

type ThemeContextType = {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	toggleMode: () => void;
};

const THEME_KEY = "@app_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>("light");
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		loadTheme();
	}, []);

	const loadTheme = async () => {
		try {
			const saved = await AsyncStorage.getItem(THEME_KEY);
			if (saved === "light" || saved === "dark") {
				setModeState(saved);
			}
		} catch (error) {
			console.error("Error loading theme:", error);
		} finally {
			setIsLoaded(true);
		}
	};

	const setMode = async (newMode: ThemeMode) => {
		try {
			await AsyncStorage.setItem(THEME_KEY, newMode);
			setModeState(newMode);
		} catch (error) {
			console.error("Error saving theme:", error);
		}
	};

	const toggleMode = () => {
		setMode(mode === "light" ? "dark" : "light");
	};

	if (!isLoaded) {
		return null;
	}

	return (
		<ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useThemeMode() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useThemeMode must be used within a ThemeProvider");
	}
	return context;
}
