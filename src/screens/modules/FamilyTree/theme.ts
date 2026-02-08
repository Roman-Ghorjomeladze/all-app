import { useMemo } from "react";
import { useThemeMode } from "../../../theme";

const lightColors = {
	male: "#4A90D9",
	female: "#E87CA0",
	other: "#8E8E93",
	parentChild: "#5C6B7A",
	spouse: "#D4A057",
	nodeBackground: "#FFFFFF",
	nodeBorder: "#D1D5DB",
	nodeSelected: "#6B8E23",
	background: "#F2F2F7",
	cardBackground: "#FFFFFF",
	textPrimary: "#1C1C1E",
	textSecondary: "#8E8E93",
	accent: "#6B8E23",
	accentLight: "#8DB82E",
	danger: "#E94B3C",
	white: "#FFFFFF",
	border: "#C6C6C8",
	shadow: "#000000",
	canvasBackground: "#F8F9FA",
	fabBackground: "#6B8E23",
};

const darkColors = {
	male: "#8BE9FD", // soft cyan
	female: "#FF79C6", // pink-magenta
	other: "#6C6F93", // muted lavender-gray
	parentChild: "#BD93F9", // purple accent
	spouse: "#FFB86C", // soft orange
	nodeBackground: "#2A273F",
	nodeBorder: "#3A375C",
	nodeSelected: "#BD93F9",
	background: "#1E1E2E",
	cardBackground: "#2A273F",
	textPrimary: "#D9E0EE",
	textSecondary: "#6C6F93",
	accent: "#BD93F9",
	accentLight: "#C7A4FF",
	danger: "#FF79C6",
	white: "#FFFFFF",
	border: "#3A375C",
	shadow: "#000000",
	canvasBackground: "#1E1E2E",
	fabBackground: "#BD93F9",
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

export const nodeLayout = {
	NODE_WIDTH: 130,
	NODE_HEIGHT: 80,
	H_GAP: 40,
	V_GAP: 100,
	SPOUSE_GAP: 20,
	CANVAS_PADDING: 50,
	ADD_CHILD_SIZE: 24,
};
