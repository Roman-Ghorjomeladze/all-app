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
	background: "#1E1E2E",
	cardBackground: "#2A273F",
	textPrimary: "#D9E0EE",
	textSecondary: "#6C6F93",
	accent: "#BD93F9",
	accentLight: "#C7A4FF",
	correct: "#A6E22E",
	incorrect: "#FF79C6",
	chipBackground: "#3A375C",
	chipActive: "#BD93F9",
	chipActiveText: "#1E1E2E",
	border: "#3A375C",
	white: "#FFFFFF",
	shadow: "#000000",
	tabActive: "#BD93F9",
	tabInactive: "#6C6F93",
	overlay: "rgba(0,0,0,0.7)",
	gold: "#FFB86C",
	silver: "#6C6F93",
	bronze: "#FFB86C",
	danger: "#FF79C6",
	progressBackground: "#3A375C",
	progressFill: "#BD93F9",
	mastery1: "#FF79C6",
	mastery2: "#FFB86C",
	mastery3: "#F8F8F2",
	mastery4: "#A6E22E",
	mastery5: "#A6E22E",
	knowIt: "#A6E22E",
	stillLearning: "#FF79C6",
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
