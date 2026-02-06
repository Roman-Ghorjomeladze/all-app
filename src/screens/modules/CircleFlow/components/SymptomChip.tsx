import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useColors, Colors, typography, spacing } from "../theme";

type SymptomChipProps = {
	label: string;
	selected: boolean;
	onPress: () => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		chip: {
			paddingHorizontal: spacing.md,
			paddingVertical: spacing.sm,
			borderRadius: 20,
			backgroundColor: colors.cardBackground,
			borderWidth: 1,
			borderColor: colors.border,
			marginRight: spacing.sm,
			marginBottom: spacing.sm,
		},
		chipSelected: {
			backgroundColor: colors.period,
			borderColor: colors.period,
		},
		label: {
			...typography.subhead,
			color: colors.textPrimary,
		},
		labelSelected: {
			color: colors.white,
			fontWeight: "600",
		},
	}), [colors]);
}

export default function SymptomChip({ label, selected, onPress }: SymptomChipProps) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<TouchableOpacity
			style={[styles.chip, selected && styles.chipSelected]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
		</TouchableOpacity>
	);
}
