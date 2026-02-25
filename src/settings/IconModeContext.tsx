import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type IconModeContextType = {
	iconMode: boolean;
	setIconMode: (enabled: boolean) => void;
	toggleIconMode: () => void;
};

const ICON_MODE_KEY = "@app_icon_mode";

const IconModeContext = createContext<IconModeContextType | undefined>(undefined);

export function IconModeProvider({ children }: { children: ReactNode }) {
	const [iconMode, setIconModeState] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		loadIconMode();
	}, []);

	const loadIconMode = async () => {
		try {
			const saved = await AsyncStorage.getItem(ICON_MODE_KEY);
			if (saved === "true") {
				setIconModeState(true);
			}
		} catch (error) {
			console.error("Error loading icon mode:", error);
		} finally {
			setIsLoaded(true);
		}
	};

	const setIconMode = async (enabled: boolean) => {
		try {
			await AsyncStorage.setItem(ICON_MODE_KEY, String(enabled));
			setIconModeState(enabled);
		} catch (error) {
			console.error("Error saving icon mode:", error);
		}
	};

	const toggleIconMode = () => {
		setIconMode(!iconMode);
	};

	if (!isLoaded) {
		return null;
	}

	return (
		<IconModeContext.Provider value={{ iconMode, setIconMode, toggleIconMode }}>
			{children}
		</IconModeContext.Provider>
	);
}

export function useIconMode() {
	const context = useContext(IconModeContext);
	if (context === undefined) {
		throw new Error("useIconMode must be used within an IconModeProvider");
	}
	return context;
}
