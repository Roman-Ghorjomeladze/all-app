import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./en";
import ka from "./ka";

type Language = "en" | "ka";

type LanguageContextType = {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string, options?: Record<string, any>) => string;
};

const i18n = new I18n({
	en,
	ka,
});

i18n.enableFallback = true;
i18n.defaultLocale = "en";

const LANGUAGE_KEY = "@app_language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>("en");
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		loadLanguage();
	}, []);

	const loadLanguage = async () => {
		try {
			const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
			if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ka")) {
				i18n.locale = savedLanguage;
				setLanguageState(savedLanguage);
			} else {
				// Use device locale as default
				const deviceLocale = Localization.getLocales()[0]?.languageCode || "en";
				const defaultLang: Language = deviceLocale === "ka" ? "ka" : "en";
				i18n.locale = defaultLang;
				setLanguageState(defaultLang);
			}
		} catch (error) {
			console.error("Error loading language:", error);
		} finally {
			setIsLoaded(true);
		}
	};

	const setLanguage = async (lang: Language) => {
		try {
			await AsyncStorage.setItem(LANGUAGE_KEY, lang);
			i18n.locale = lang;
			setLanguageState(lang);
		} catch (error) {
			console.error("Error saving language:", error);
		}
	};

	const t = (key: string, options?: Record<string, any>) => {
		return i18n.t(key, options);
	};

	if (!isLoaded) {
		return null;
	}

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}

// Export i18n instance for components that can't use hooks
export { i18n };
