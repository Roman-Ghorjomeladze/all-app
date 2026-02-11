import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type HomeLayout = "bubbles" | "orbit" | "constellation";

type HomeLayoutContextType = {
	layout: HomeLayout;
	setLayout: (layout: HomeLayout) => void;
};

const LAYOUT_KEY = "@app_home_layout";

const HomeLayoutContext = createContext<HomeLayoutContextType | undefined>(undefined);

export function HomeLayoutProvider({ children }: { children: ReactNode }) {
	const [layout, setLayoutState] = useState<HomeLayout>("bubbles");
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		loadLayout();
	}, []);

	const loadLayout = async () => {
		try {
			const saved = await AsyncStorage.getItem(LAYOUT_KEY);
			if (saved === "bubbles" || saved === "orbit" || saved === "constellation") {
				setLayoutState(saved);
			}
		} catch (error) {
			console.error("Error loading layout:", error);
		} finally {
			setIsLoaded(true);
		}
	};

	const setLayout = async (newLayout: HomeLayout) => {
		try {
			await AsyncStorage.setItem(LAYOUT_KEY, newLayout);
			setLayoutState(newLayout);
		} catch (error) {
			console.error("Error saving layout:", error);
		}
	};

	if (!isLoaded) {
		return null;
	}

	return (
		<HomeLayoutContext.Provider value={{ layout, setLayout }}>
			{children}
		</HomeLayoutContext.Provider>
	);
}

export function useHomeLayout() {
	const context = useContext(HomeLayoutContext);
	if (context === undefined) {
		throw new Error("useHomeLayout must be used within a HomeLayoutProvider");
	}
	return context;
}
