import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useColors, Colors, spacing } from "../theme";

type OptionState = "default" | "correct" | "incorrect";

type Props = {
	label: string;
	state: OptionState;
	disabled: boolean;
	onPress: () => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		button: {
			width: "100%",
			paddingVertical: 16,
			paddingHorizontal: spacing.lg,
			borderRadius: 14,
			borderWidth: 1.5,
			marginBottom: spacing.sm,
			alignItems: "center",
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.06,
			shadowRadius: 4,
			elevation: 2,
		},
		label: {
			fontSize: 17,
			fontWeight: "600",
			textAlign: "center",
		},
	}), [colors]);
}

export default function QuizOption({ label, state, disabled, onPress }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const bgColor =
		state === "correct"
			? colors.correct
			: state === "incorrect"
				? colors.incorrect
				: colors.cardBackground;

	const textColor = state === "default" ? colors.textPrimary : colors.white;

	const borderColor = state === "default" ? colors.border : bgColor;

	return (
		<TouchableOpacity
			style={[styles.button, { backgroundColor: bgColor, borderColor }]}
			onPress={onPress}
			disabled={disabled}
			activeOpacity={0.7}
		>
			<Text style={[styles.label, { color: textColor }]} numberOfLines={2}>
				{label}
			</Text>
		</TouchableOpacity>
	);
}
