import { useMemo } from "react";
import { useThemeMode } from "../../../theme";

const lightColors = {
	background: "#F2F2F7",
	cardBackground: "#FFFFFF",
	textPrimary: "#1C1C1E",
	textSecondary: "#8E8E93",
	accent: "#FF5722",
	tabActive: "#FF5722",
	tabInactive: "#8E8E93",
	border: "#C6C6C8",
	danger: "#FF3B30",
	white: "#FFFFFF",
	chipBackground: "#F0F0F0",
	inputBackground: "#F2F2F7",
	overlay: "rgba(0,0,0,0.5)",
	shadow: "#000000",
	// FitLog-specific
	timerRing: "#FF5722",
	timerBackground: "#FFF3E0",
	exerciseColor: "#4CAF50",
	restColor: "#2196F3",
	warningColor: "#FFC107",
	completedColor: "#8BC34A",
};

const darkColors = {
	background: "#1E1E2E",
	cardBackground: "#2A273F",
	textPrimary: "#D9E0EE",
	textSecondary: "#6C6F93",
	accent: "#FF8A65",
	tabActive: "#FF8A65",
	tabInactive: "#6C6F93",
	border: "#3A375C",
	danger: "#FF5555",
	white: "#FFFFFF",
	chipBackground: "#3A375C",
	inputBackground: "#1E1E2E",
	overlay: "rgba(0,0,0,0.7)",
	shadow: "#000000",
	// FitLog-specific
	timerRing: "#FF8A65",
	timerBackground: "#2A273F",
	exerciseColor: "#81C784",
	restColor: "#64B5F6",
	warningColor: "#FFD54F",
	completedColor: "#AED581",
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
	timer: { fontSize: 72, fontWeight: "300" as const },
};

export const EXERCISE_EMOJIS = [
	"🏋️", "🏃", "🧘", "💪", "🤸", "🚴",
	"🏊", "⏱️", "🔥", "🎯", "🥊", "🧗",
	"🤾", "🏄", "⚡", "🦵",
];

export const WORKOUT_EMOJIS = [
	"💪", "🔥", "⚡", "🏋️", "🤸", "🧘",
	"🏃", "🚴", "🎯", "🥊", "💥", "⭐",
];
