import { useMemo } from "react";
import { useThemeMode } from "../../../theme";

const lightColors = {
	period: "#FF6B8A",
	fertile: "#7ED4AD",
	ovulation: "#5AC8FA",
	regular: "#E5E5EA",
	background: "#F2F2F7",
	cardBackground: "#FFFFFF",
	textPrimary: "#1C1C1E",
	textSecondary: "#8E8E93",
	tabActive: "#FF6B8A",
	tabInactive: "#8E8E93",
	white: "#FFFFFF",
	border: "#C6C6C8",
	shadow: "#000000",
};

const darkColors = {
	period: "#F92672",
	fertile: "#A6E22E",
	ovulation: "#66D9EF",
	regular: "#49483E",
	background: "#272822",
	cardBackground: "#3E3D32",
	textPrimary: "#F8F8F2",
	textSecondary: "#75715E",
	tabActive: "#F92672",
	tabInactive: "#75715E",
	white: "#FFFFFF",
	border: "#49483E",
	shadow: "#000000",
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
