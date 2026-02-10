import { useMemo } from "react";
import { useThemeMode } from "../../../theme";

const lightColors = {
	background: "#F2F2F7",
	cardBackground: "#FFFFFF",
	textPrimary: "#1C1C1E",
	textSecondary: "#8E8E93",
	accent: "#FF8C00",
	tabActive: "#FF8C00",
	tabInactive: "#8E8E93",
	border: "#C6C6C8",
	danger: "#FF3B30",
	white: "#FFFFFF",
	chipBackground: "#F0F0F0",
	inputBackground: "#F2F2F7",
	overlay: "rgba(0,0,0,0.5)",
	priorityHigh: "#F44336",
	priorityMedium: "#FF9800",
	priorityLow: "#4CAF50",
	priorityNone: "#8E8E93",
	completed: "#8E8E93",
	overdue: "#F44336",
	today: "#2196F3",
	checkboxBorder: "#C6C6C8",
	checkboxFilled: "#FF8C00",
};

const darkColors = {
	background: "#1E1E2E",
	cardBackground: "#2A273F",
	textPrimary: "#D9E0EE",
	textSecondary: "#6C6F93",
	accent: "#FFB86C",
	tabActive: "#FFB86C",
	tabInactive: "#6C6F93",
	border: "#3A375C",
	danger: "#FF5555",
	white: "#FFFFFF",
	chipBackground: "#3A375C",
	inputBackground: "#1E1E2E",
	overlay: "rgba(0,0,0,0.7)",
	priorityHigh: "#FF5555",
	priorityMedium: "#FFB86C",
	priorityLow: "#50FA7B",
	priorityNone: "#6C6F93",
	completed: "#6C6F93",
	overdue: "#FF5555",
	today: "#8BE9FD",
	checkboxBorder: "#6C6F93",
	checkboxFilled: "#FFB86C",
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
	caption2: { fontSize: 11, fontWeight: "400" as const },
};

export const CATEGORY_COLORS = [
	"#FF8C00", "#F44336", "#E91E63", "#9C27B0",
	"#673AB7", "#3F51B5", "#2196F3", "#03A9F4",
	"#00BCD4", "#009688", "#4CAF50", "#8BC34A",
	"#CDDC39", "#FFC107", "#FF9800", "#795548",
];

export const CATEGORY_ICONS = [
	"\u{1F4C1}", "\u{1F4BC}", "\u{1F3E0}", "\u{2764}\u{FE0F}",
	"\u{2B50}", "\u{1F4DA}", "\u{1F6D2}", "\u{1F4AA}",
	"\u{1F3AF}", "\u{1F393}", "\u{2708}\u{FE0F}", "\u{1F3B5}",
	"\u{1F37D}\u{FE0F}", "\u{1F4B0}", "\u{1F3C3}", "\u{1F527}",
	"\u{1F48A}", "\u{1F4BB}", "\u{1F381}", "\u{1F4F1}",
];
