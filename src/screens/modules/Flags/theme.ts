import { useMemo } from "react";
import { useThemeMode } from "../../../theme";

const lightColors = {
	background: "#F2F2F7",
	cardBackground: "#FFFFFF",
	textPrimary: "#1C1C1E",
	textSecondary: "#8E8E93",
	accent: "#1A5276",
	accentLight: "#2E86C1",
	correct: "#27AE60",
	incorrect: "#E74C3C",
	chipBackground: "#E8EEF2",
	chipActive: "#1A5276",
	chipActiveText: "#FFFFFF",
	border: "#C6C6C8",
	white: "#FFFFFF",
	shadow: "#000000",
	tabActive: "#1A5276",
	tabInactive: "#8E8E93",
	overlay: "rgba(0,0,0,0.5)",
	gold: "#F1C40F",
	silver: "#95A5A6",
	bronze: "#E67E22",
	progressBackground: "#E0E0E0",
	progressFill: "#1A5276",
};

const darkColors = {
	background: "#1E1E2E",
	cardBackground: "#2A273F",
	textPrimary: "#D9E0EE",
	textSecondary: "#6C6F93",
	accent: "#8BE9FD",
	accentLight: "#8BE9FD",
	correct: "#A6E22E",
	incorrect: "#FF79C6",
	chipBackground: "#3A375C",
	chipActive: "#8BE9FD",
	chipActiveText: "#1E1E2E",
	border: "#3A375C",
	white: "#FFFFFF",
	shadow: "#000000",
	tabActive: "#8BE9FD",
	tabInactive: "#6C6F93",
	overlay: "rgba(0,0,0,0.7)",
	gold: "#FFB86C",
	silver: "#6C6F93",
	bronze: "#FFB86C",
	progressBackground: "#3A375C",
	progressFill: "#8BE9FD",
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
