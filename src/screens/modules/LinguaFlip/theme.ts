import { useMemo } from "react";
import { useThemeMode } from "../../../theme";

const lightColors = {
	background: "#F2F2F7",
	cardBackground: "#FFFFFF",
	textPrimary: "#1C1C1E",
	textSecondary: "#8E8E93",
	accent: "#008B8B",
	accentLight: "#20B2AA",
	correct: "#27AE60",
	incorrect: "#E74C3C",
	chipBackground: "#E0F0F0",
	chipActive: "#008B8B",
	chipActiveText: "#FFFFFF",
	border: "#C6C6C8",
	white: "#FFFFFF",
	shadow: "#000000",
	tabActive: "#008B8B",
	tabInactive: "#8E8E93",
	overlay: "rgba(0,0,0,0.5)",
	gold: "#F1C40F",
	silver: "#95A5A6",
	bronze: "#E67E22",
	danger: "#E74C3C",
	progressBackground: "#E0E0E0",
	progressFill: "#008B8B",
	mastery1: "#E74C3C",
	mastery2: "#E67E22",
	mastery3: "#F1C40F",
	mastery4: "#2ECC71",
	mastery5: "#27AE60",
	knowIt: "#27AE60",
	stillLearning: "#E74C3C",
};

const darkColors = {
	background: "#272822",
	cardBackground: "#3E3D32",
	textPrimary: "#F8F8F2",
	textSecondary: "#75715E",
	accent: "#AE81FF",
	accentLight: "#AE81FF",
	correct: "#A6E22E",
	incorrect: "#F92672",
	chipBackground: "#49483E",
	chipActive: "#AE81FF",
	chipActiveText: "#272822",
	border: "#49483E",
	white: "#FFFFFF",
	shadow: "#000000",
	tabActive: "#AE81FF",
	tabInactive: "#75715E",
	overlay: "rgba(0,0,0,0.7)",
	gold: "#FD971F",
	silver: "#75715E",
	bronze: "#FD971F",
	danger: "#F92672",
	progressBackground: "#49483E",
	progressFill: "#AE81FF",
	mastery1: "#F92672",
	mastery2: "#FD971F",
	mastery3: "#E6DB74",
	mastery4: "#A6E22E",
	mastery5: "#A6E22E",
	knowIt: "#A6E22E",
	stillLearning: "#F92672",
};

export type Colors = typeof lightColors;

export function getColors(mode: "light" | "dark") {
	return mode === "dark" ? darkColors : lightColors;
}

export function useColors() {
	const { mode } = useThemeMode();
	return useMemo(() => getColors(mode), [mode]);
}

export const spacing = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
};

export const typography = {
	largeTitle: { fontSize: 34, fontWeight: "700" as const },
	title1: { fontSize: 28, fontWeight: "700" as const },
	title2: { fontSize: 22, fontWeight: "700" as const },
	title3: { fontSize: 20, fontWeight: "600" as const },
	headline: { fontSize: 17, fontWeight: "600" as const },
	body: { fontSize: 17, fontWeight: "400" as const },
	callout: { fontSize: 16, fontWeight: "400" as const },
	subhead: { fontSize: 15, fontWeight: "400" as const },
	footnote: { fontSize: 13, fontWeight: "400" as const },
	caption1: { fontSize: 12, fontWeight: "400" as const },
};
